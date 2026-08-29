"""
Shared Rate Limiter for FreshGuard Backend.

All routers import the limiter from this module to ensure
a single rate limiter instance is used across the application.

Usage in routers:
    from rate_limit import limiter

    @router.get("/my-endpoint")
    @limiter.limit("100/minute")
    async def my_endpoint(request: Request):
        ...
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
)
