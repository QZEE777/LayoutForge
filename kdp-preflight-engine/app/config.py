"""Application configuration."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "KDP Preflight Engine"
    debug: bool = False

    # Security
    # Max upload size for PDFs. Capped at 50 MB to match manu2print Print Ready Check.
    max_upload_bytes: int = 50 * 1024 * 1024  # 50 MB
    allowed_mime_types: tuple[str, ...] = ("application/pdf",)
    clamav_host: str | None = None  # e.g. "clamav:3310" for Docker
    clamav_timeout_seconds: float = 10.0

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str | None = None  # defaults to redis_url
    celery_result_backend: str | None = None  # defaults to redis_url

    # Storage (R2/S3 compatible)
    storage_provider: str = "local"  # "local" | "s3" | "r2"
    s3_endpoint_url: str | None = None  # for R2: https://<account>.r2.cloudflarestorage.com
    s3_region: str = "auto"
    s3_bucket: str = "kdp-preflight-uploads"
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    local_upload_dir: str = "./data/uploads"

    @property
    def broker_url(self) -> str:
        return self.celery_broker_url or self.redis_url

    @property
    def result_backend(self) -> str:
        return self.celery_result_backend or self.redis_url


settings = Settings()
