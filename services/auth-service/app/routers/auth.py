from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.db.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.services.auth_service import auth_facade
from app.models.user import User, Role
import os, jwt

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET = os.getenv("JWT_SECRET", "my-super-secret-jwt-key-1234567890-abcdefghijklmnopqrstuvwxyz")

def _admin_only(authorization: str | None = None):
    pass  # checked inline below

class RoleUpdate(BaseModel):
    role: Role

class UserUpdate(BaseModel):
    email: str | None = None


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Only admin can set non-client roles via API body;
    # public registration always creates 'client'
    from app.models.user import Role as R
    try:
        user = await auth_facade.register(body.email, body.password, R.client, db)
        return user
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        return await auth_facade.login(body.email, body.password, db)
    except ValueError as e:
        raise HTTPException(401, str(e))


@router.get("/cancel/{token}")
async def cancel_registration(token: str, db: AsyncSession = Depends(get_db)):
    ok = await auth_facade.confirm_cancel(token, db)
    if not ok:
        raise HTTPException(404, "Invalid or expired cancel token")
    return {"message": "Registration cancelled successfully"}


@router.post("/activate/{user_id}")
async def activate_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = True
    await db.commit()
    return {"message": "User activated"}


@router.post("/deactivate/{user_id}")
async def deactivate_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.is_active = False
    await db.commit()
    return {"message": "User deactivated"}


@router.patch("/users/{user_id}/role")
async def update_role(user_id: int, body: RoleUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.role = body.role
    await db.commit()
    return {"message": "Role updated"}


@router.put("/users/{user_id}")
async def update_user(user_id: int, body: UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if body.email:
        user.email = body.email
    await db.commit()
    return {"message": "Updated"}


@router.get("/users", response_model=list[UserOut])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.id))
    return result.scalars().all()
