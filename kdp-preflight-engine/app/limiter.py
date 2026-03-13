"""Shared rate limiter for FastAPI (slowapi). Used by main and upload router."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    exempt_when=lambda request: request.method == "OPTIONS",
)
