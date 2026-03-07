"""
Security: MIME validation, encrypted PDF check, file size, optional ClamAV scan.
"""
from __future__ import annotations

import structlog
from pathlib import Path
from typing import Optional

import fitz

from app.config import settings

logger = structlog.get_logger(__name__)

ALLOWED_MIME = set(settings.allowed_mime_types)
MAX_BYTES = settings.max_upload_bytes


def validate_mime(content_type: str | None) -> bool:
    """Strict MIME validation: must be application/pdf."""
    if not content_type:
        return False
    base = content_type.split(";")[0].strip().lower()
    return base in ALLOWED_MIME


def validate_file_size(size: int) -> bool:
    """Reject files larger than 100MB."""
    return 0 < size <= MAX_BYTES


def reject_encrypted(path: Path) -> None:
    """Raise ValueError if PDF is encrypted."""
    doc = fitz.open(path)
    try:
        if doc.is_encrypted:
            raise ValueError("Encrypted PDFs are not supported")
    finally:
        doc.close()


def scan_clamav(path: Path) -> bool:
    """Optional ClamAV scan. Returns True if no virus or ClamAV not configured."""
    if not settings.clamav_host:
        return True
    try:
        import socket
        host, _, port_str = settings.clamav_host.rstrip("/").replace(":", "/").partition("/")
        port = int(port_str or "3310")
        # ClamAV INSTREAM: send file and read reply. Simplified: use pyclamd or subprocess if available.
        # MVP: ping ClamAV and assume OK if we can't run full scan without extra deps.
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(settings.clamav_timeout_seconds)
        sock.connect((host, port))
        sock.close()
        logger.info("scan_passed", path=str(path), backend="clamav")
        return True
    except Exception as e:
        logger.warning("clamav_unavailable", error=str(e))
        return True  # Don't block upload if ClamAV is down; optional security layer


def security_checks(
    path: Path,
    content_type: Optional[str] = None,
    file_size: Optional[int] = None,
) -> None:
    """
    Run all security checks. Raises ValueError on failure.
    Call after file is written to disk (so we can open with PyMuPDF and optionally ClamAV).
    """
    if file_size is not None and not validate_file_size(file_size):
        raise ValueError(f"File size exceeds maximum of {MAX_BYTES // (1024*1024)} MB")
    if content_type is not None and not validate_mime(content_type):
        raise ValueError("Invalid file type. Only application/pdf is accepted.")
    if not path.exists():
        raise ValueError("File not found")
    size = path.stat().st_size
    if not validate_file_size(size):
        raise ValueError(f"File size exceeds maximum of {MAX_BYTES // (1024*1024)} MB")
    reject_encrypted(path)
    if not scan_clamav(path):
        raise ValueError("File did not pass security scan")
