"""
Cryptographic QR Passport Generator

Compresses crop batch parameters into a secure HMAC-signed token
suitable for high-density industrial QR codes. Downstream buyers
(e.g. Zepto, Blinkit) can scan and verify produce quality history.

Uses SHA-256 HMAC with constant-time comparison to prevent
side-channel timing attacks on token verification.
"""

import hashlib
import hmac
import base64
import datetime
import os
import secrets
from typing import Dict, Any, Optional


class CryptographicPassportEngine:
    """
    Encrypts batch metadata into a compact, tamper-proof QR token.
    Structure: {base64_payload}.{base64_hmac_signature}
    """

    # HMAC secret loaded from environment variable.
    # If not set, generates a random key (valid for the process lifetime).
    @classmethod
    def _get_secret(cls) -> bytes:
        env_key = os.environ.get("PASSPORT_HMAC_SECRET")
        if env_key:
            return env_key.encode("utf-8")
        # Fallback: generate a random key for this process.
        # WARNING: QR tokens signed with this key cannot be verified
        # after the process restarts. Set PASSPORT_HMAC_SECRET in .env
        # for persistent token verification across restarts.
        if not hasattr(cls, "_generated_secret"):
            cls._generated_secret = secrets.token_bytes(64)
            import logging
            logging.getLogger("FreshGuardPassport").warning(
                "PASSPORT_HMAC_SECRET not set. Using random key — "
                "QR tokens will NOT survive process restarts."
            )
        return cls._generated_secret

    @classmethod
    def generate_secure_qr_token(cls, batch_metadata: Dict[str, Any]) -> Dict[str, str]:
        """
        Compresses and seals crop metrics into an immutable text passport token
        suitable for mapping straight into high-density industrial QR codes.

        Required keys in batch_metadata:
            batch_id, crop_type, weight_kg, visual_score, expiry_timestamp
        """
        # 1. Structure the raw data into a condensed string format to reduce QR density footprints
        structured_payload = (
            f"BID:{batch_metadata['batch_id']}|"
            f"CRP:{batch_metadata['crop_type']}|"
            f"WGT:{batch_metadata['weight_kg']}|"
            f"VSC:{batch_metadata['visual_score']}|"
            f"EXP:{batch_metadata['expiry_timestamp']}"
        )

        # 2. Compute a secure SHA-256 HMAC signature to verify data integrity
        signature = hmac.new(
            cls._get_secret(),
            msg=structured_payload.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()

        # 3. Use URL-safe Base64 encoding for mobile barcode scanners
        encoded_payload = base64.urlsafe_b64encode(structured_payload.encode('utf-8')).decode('utf-8')
        encoded_signature = base64.urlsafe_b64encode(signature).decode('utf-8')

        # Combine data payload and security signature with a standardized delimiter
        unified_passport_token = f"{encoded_payload}.{encoded_signature}"

        return {
            "qr_passport_token": unified_passport_token,
            "raw_payload_verify_string": structured_payload
        }

    @classmethod
    def verify_passport_integrity(cls, token: str) -> Optional[Dict[str, str]]:
        """
        Decrypts and authenticates a scanned QR passport.
        Returns None if the token has been tampered with.
        """
        try:
            parts = token.split(".")
            if len(parts) != 2:
                return None

            payload_part, signature_part = parts[0], parts[1]

            # Decode components back to their original binary format
            decoded_payload = base64.urlsafe_b64decode(payload_part.encode('utf-8')).decode('utf-8')
            decoded_signature = base64.urlsafe_b64decode(signature_part.encode('utf-8'))

            # Recompute the signature locally to verify data validity
            expected_signature = hmac.new(
                cls._get_secret(),
                msg=decoded_payload.encode('utf-8'),
                digestmod=hashlib.sha256
            ).digest()

            # Use constant-time comparison to prevent side-channel timing attacks
            if hmac.compare_digest(decoded_signature, expected_signature):
                # Extract structural keys out of decoded passport layout
                kv_pairs = [pair.split(":", 1) for pair in decoded_payload.split("|")]
                return {k: v for k, v in kv_pairs}

            return None
        except Exception:
            return None

    @classmethod
    def generate_batch_expiry(cls, days_from_now: int = 7) -> str:
        """Helper to generate an ISO expiry timestamp N days from now."""
        return (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days_from_now)).isoformat()
