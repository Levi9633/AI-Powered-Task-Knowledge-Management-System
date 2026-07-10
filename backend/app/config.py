from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "ai_task_db"
    DB_USER: str = "root"
    DB_PASSWORD: str = ""

    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 720
    
    GEMINI_API_KEY: str = ""
    OPENROUTER_API_KEY: str = ""

    UPLOAD_DIR: str = "uploads"
    FAISS_INDEX_PATH: str = "faiss_store/index.faiss"
    FAISS_META_PATH: str = "faiss_store/metadata.pkl"

    class Config:
        env_file = ".env"

    @property
    def DATABASE_URL(self) -> str:
        import urllib.parse
        encoded_password = urllib.parse.quote_plus(self.DB_PASSWORD)
        return (
            f"mysql+pymysql://{self.DB_USER}:{encoded_password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
