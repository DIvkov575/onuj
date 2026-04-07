from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    openai_api_key: str | None = None   # optional — only needed for embedding

    # Comma-separated allowed origins for CORS
    cors_origins: str = "http://localhost:3000"

    # Plan limits
    free_tier_monthly_limit: int = 10_000

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
