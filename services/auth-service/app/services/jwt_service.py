import os, jwt
from datetime import datetime, timedelta, timezone

class JWTManager:
    """Singleton: one shared JWT manager across the app."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.secret = os.getenv(
                "JWT_SECRET",
                "my-super-secret-jwt-key-1234567890-abcdefghijklmnopqrstuvwxyz"
            )
            cls._instance.algorithm = "HS256"
            cls._instance.expire_minutes = 60 * 24  # 24h
        return cls._instance

    def create_token(self, payload: dict) -> str:
        data = payload.copy()
        data["exp"] = datetime.now(timezone.utc) + timedelta(minutes=self.expire_minutes)
        return jwt.encode(data, self.secret, algorithm=self.algorithm)

    def decode_token(self, token: str) -> dict:
        return jwt.decode(token, self.secret, algorithms=[self.algorithm])

jwt_manager = JWTManager()
