from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    OPENAI_API_KEY: str
    OPENAI_API_URL: str
    PASSWORD: str
    ALGO: str
    RESEND_API_KEY: str

settings = Settings()