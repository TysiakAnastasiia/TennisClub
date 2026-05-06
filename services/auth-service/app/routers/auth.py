from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserOut
from app.services.auth_service import auth_facade
from app.models.user import User
from sqlalchemy import select

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        user = await auth_facade.register(body.email, body.password, body.role, db)
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
    await auth_facade.activate(user_id, db)
    return {"message": "User activated"}


@router.get("/users", response_model=list[UserOut])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    return result.scalars().all()
