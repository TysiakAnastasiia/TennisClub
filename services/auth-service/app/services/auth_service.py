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
    """Facade: hides complexity of registration, login, token creation."""

    async def register(self, email: str, password: str, role: Role, db: AsyncSession) -> User:
        existing = await db.scalar(select(User).where(User.email == email))
        if existing:
            raise ValueError("Email already registered")

        cancel_token = secrets.token_urlsafe(32)
        user = User(
            email=email,
            hashed_password=pwd_ctx.hash(password),
            role=role,
            is_active=False,
            cancel_token=cancel_token,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        # Send confirmation email via Notification Service
        await self._send_confirmation(user)
        return user

    async def confirm_cancel(self, token: str, db: AsyncSession) -> bool:
        """Cancel registration via email link."""
        user = await db.scalar(select(User).where(User.cancel_token == token))
        if not user:
            return False
        await db.delete(user)
        await db.commit()
        return True

    async def login(self, email: str, password: str, db: AsyncSession) -> dict:
        user = await db.scalar(select(User).where(User.email == email))
        if not user or not pwd_ctx.verify(password, user.hashed_password):
            raise ValueError("Invalid credentials")
        if not user.is_active:
            raise ValueError("Account not confirmed yet. Check your email.")

        token = jwt_manager.create_token({"sub": str(user.id), "email": user.email, "role": user.role})
        return {"access_token": token, "token_type": "bearer", "role": user.role}

    async def activate(self, user_id: int, db: AsyncSession):
        """Called after email verification (admin action or auto-confirm)."""
        user = await db.get(User, user_id)
        if user:
            user.is_active = True
            await db.commit()

    async def _send_confirmation(self, user: User):
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(f"{NOTIFICATION_URL}/notifications/send-confirmation", json={
                    "email": user.email,
                    "user_id": user.id,
                    "cancel_token": user.cancel_token,
                })
        except Exception:
            pass  # Don't fail registration if email fails


auth_facade = AuthFacade()
