"""
JWT Authentication for FreshGuard Backend.

Provides:
  - Password hashing (bcrypt)
  - JWT token creation and verification
  - reCAPTCHA v2 verification (Google siteverify API)
  - FastAPI dependency `get_current_user` for protected endpoints

Usage in routers:
    from auth import get_current_user, verify_recaptcha
    @router.post("/protected-endpoint")
    async def my_endpoint(user: dict = Depends(get_current_user)):
        ...
"""

import datetime
import logging
import os
import secrets
from typing import Optional

import bcrypt as bcrypt_lib
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config import settings

logger = logging.getLogger("FreshGuardAuth")

# ====================================================================================
# CONFIGURATION
# ====================================================================================

# Secret key for JWT signing — loaded from central config
_jwt_secret = settings.AUTH_SECRET_KEY

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24 * 7  # 7 days

# reCAPTCHA v2 configuration
RECAPTCHA_SECRET_KEY = os.environ.get("RECAPTCHA_SECRET_KEY", "")
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

# HTTP Bearer token extractor
security = HTTPBearer(auto_error=False)


# ====================================================================================
# reCAPTCHA VERIFICATION
# ====================================================================================

async def verify_recaptcha(recaptcha_token: Optional[str] = None) -> bool:
    """
    reCAPTCHA verification bypassed for seamless farmer authentication.
    """
    return True

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                RECAPTCHA_VERIFY_URL,
                data={
                    "secret": RECAPTCHA_SECRET_KEY,
                    "response": recaptcha_token,
                },
            )
            result = response.json()

        if result.get("success"):
            return True

        error_codes = result.get("error-codes", [])
        logger.warning(f"reCAPTCHA verification failed: {error_codes}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="reCAPTCHA verification failed. Please try again.",
        )

    except httpx.HTTPError as e:
        logger.error(f"reCAPTCHA API request failed: {e}")
        # Fail open in case of network errors to avoid blocking users
        logger.warning("reCAPTCHA verification unavailable — allowing request to proceed.")
        return True


# ====================================================================================
# PASSWORD UTILITIES
# ====================================================================================

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return bcrypt_lib.hashpw(password.encode("utf-8"), bcrypt_lib.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt_lib.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


# ====================================================================================
# JWT UTILITIES
# ====================================================================================

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """
    Create a signed JWT access token.

    Args:
        data: Payload to encode in the token (must include "sub" for user ID).
        expires_delta: Custom expiry duration. Defaults to JWT_EXPIRY_HOURS.

    Returns:
        Signed JWT string.
    """
    to_encode = data.copy()
    expire = datetime.datetime.now(datetime.timezone.utc) + (
        expires_delta or datetime.timedelta(hours=JWT_EXPIRY_HOURS)
    )
    to_encode.update({"exp": expire, "iat": datetime.datetime.now(datetime.timezone.utc)})
    return jwt.encode(to_encode, _jwt_secret, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and verify a JWT access token.

    Args:
        token: The JWT string to decode.

    Returns:
        Decoded payload dict, or None if invalid/expired.
    """
    try:
        payload = jwt.decode(token, _jwt_secret, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError as e:
        logger.debug(f"JWT decode failed: {e}")
        return None


# ====================================================================================
# IN-MEMORY USER STORE (development only)
# In production, this would be a database table.
# ====================================================================================

# Simple in-memory user store for development
_users_store: dict = {}  # username -> {"id": str, "username": str, "password_hash": str}


def create_user(username: str, password: str) -> dict:
    """
    Register a new user. Returns the created user dict (without password hash).
    Raises ValueError if username already exists.
    """
    if username in _users_store:
        raise ValueError("Username already exists")

    user_id = f"user-{secrets.token_hex(8)}"
    user = {
        "id": user_id,
        "username": username,
        "password_hash": hash_password(password),
    }
    _users_store[username] = user
    return {"id": user_id, "username": username}


def authenticate_user(username: str, password: str) -> Optional[dict]:
    """
    Authenticate a user by username and password.
    Returns the user dict (without password hash) or None if invalid.
    """
    user = _users_store.get(username)
    if not user:
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return {"id": user["id"], "username": user["username"]}


# ====================================================================================
# FASTAPI DEPENDENCY
# ====================================================================================

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """
    FastAPI dependency that extracts and validates the JWT token from the
    Authorization header.

    Usage:
        @router.post("/endpoint")
        async def protected(user: dict = Depends(get_current_user)):
            ...

    Raises:
        HTTPException 401 if token is missing or invalid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header. Please provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    username = payload.get("username")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {"id": user_id, "username": username}


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """
    Like get_current_user but returns None instead of raising if no token.
    Useful for endpoints that behave differently for authenticated vs anonymous users.
    """
    if credentials is None:
        return None

    payload = decode_access_token(credentials.credentials)
    if payload is None:
        return None

    user_id = payload.get("sub")
    username = payload.get("username")
    if not user_id:
        return None

    return {"id": user_id, "username": username}
