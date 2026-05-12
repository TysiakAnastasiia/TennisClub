import secrets
import httpx
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, Role
from app.services.jwt_service import jwt_manager
import os

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
NOTIFICATION_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8006")


class AuthFacade:
    """Патерн Facade: приховує складність реєстрації/логіну та створення токенів."""

    async def register(self, email: str, password: str, role: Role, db: AsyncSession) -> User:
        # Перевіряємо чи email вже зареєстровано
        existing = await db.scalar(select(User).where(User.email == email))
        if existing:
            raise ValueError("Email already registered")

        # Генеруємо токен для скасування реєстрації
        cancel_token = secrets.token_urlsafe(32)
        user = User(
            email=email,
            hashed_password=pwd_ctx.hash(password),  # Хешуємо пароль
            role=role,
            is_active=False,  # Акаунт неактивний до підтвердження
            cancel_token=cancel_token,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Відправляємо email підтвердження через Notification Service
        await self._send_confirmation(user)
        return user

    async def confirm_cancel(self, token: str, db: AsyncSession) -> bool:
        """Скасовує реєстрацію через посилання з email."""
        # Знаходимо користувача по токену скасування
        user = await db.scalar(select(User).where(User.cancel_token == token))
        if not user:
            return False  # Токен не знайдено
        await db.delete(user)  # Видаляємо користувача
        await db.commit()
        return True  # Успішне скасування

    async def login(self, email: str, password: str, db: AsyncSession) -> dict:
        # Знаходимо користувача по email
        user = await db.scalar(select(User).where(User.email == email))
        if not user or not pwd_ctx.verify(password, user.hashed_password):
            raise ValueError("Invalid credentials")  # Невірні дані
        if not user.is_active:
            raise ValueError("Account not confirmed yet. Check your email.")  # Акаунт не активовано

        # Створюємо JWT токен для сесії
        token = jwt_manager.create_token({"sub": str(user.id), "email": user.email, "role": user.role})
        return {"access_token": token, "token_type": "bearer", "role": user.role}

    async def activate(self, user_id: int, db: AsyncSession):
        """Активує акаунт після підтвердження email."""
        user = await db.get(User, user_id)
        if user:
            user.is_active = True  # Активуємо акаунт
            await db.commit()

    async def _send_confirmation(self, user: User):
        try:
            # Відправляємо email через Notification Service
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(f"{NOTIFICATION_URL}/notifications/send-confirmation", json={
                    "email": user.email,
                    "user_id": user.id,
                    "cancel_token": user.cancel_token,
                })
        except Exception:
            pass  # Не зупиняємо реєстрацію, якщо email не відправлено


auth_facade = AuthFacade()
