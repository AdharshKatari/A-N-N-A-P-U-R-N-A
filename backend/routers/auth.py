"""
User Authentication Endpoints

Provides user registration and login with JWT access tokens.

Endpoints:
  POST /api/v5/auth/register — Create a new user account
  POST /api/v5/auth/login    — Authenticate and receive JWT token
  GET  /api/v5/auth/me       — Get current user info (requires auth)
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, status

from auth import authenticate_user, create_access_token, create_user, get_current_user, verify_recaptcha
from models import TokenResponse, UserCreateRequest, UserLoginRequest

logger = logging.getLogger("FreshGuardAuthRouter")
router = APIRouter(tags=["auth"])


@router.post(
    "/api/v5/auth/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register_user(request: UserCreateRequest):
    """
    Register a new user account.

    Returns a JWT access token that can be used in the Authorization header:
        Authorization: Bearer <token>
    """
    await verify_recaptcha(request.recaptcha_token)
    try:
        user = create_user(request.username, request.password)
        token = create_access_token(data={"sub": user["id"], "username": user["username"]})
        logger.info(f"New user registered: {user['username']}")
        return TokenResponse(
            access_token=token,
            user_id=user["id"],
            username=user["username"],
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.post(
    "/api/v5/auth/login",
    response_model=TokenResponse,
)
async def login_user(request: UserLoginRequest):
    """
    Authenticate with username and password.

    Returns a JWT access token that can be used in the Authorization header:
        Authorization: Bearer <token>
    """
    await verify_recaptcha(request.recaptcha_token)
    user = authenticate_user(request.username, request.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(data={"sub": user["id"], "username": user["username"]})
    logger.info(f"User logged in: {user['username']}")
    return TokenResponse(
        access_token=token,
        user_id=user["id"],
        username=user["username"],
    )


@router.get("/api/v5/auth/me")
async def get_current_user_info(user: dict = Depends(get_current_user)):
    """
    Get the currently authenticated user's information.
    Requires a valid JWT token in the Authorization header.
    """
    return {
        "id": user["id"],
        "username": user["username"],
        "status": "authenticated",
    }
