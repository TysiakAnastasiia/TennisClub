from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.profile import UserProfile
from app.schemas.profile import ProfileUpdate, ProfileOut
from app.services.jwt_dep import get_current_user, require_admin

router = APIRouter(prefix="/users", tags=["users"])


async def _get_or_create(user_id: int, db: AsyncSession) -> UserProfile:
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    if not profile:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


@router.get("/me", response_model=ProfileOut)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return await _get_or_create(int(user["sub"]), db)


@router.put("/me", response_model=ProfileOut)
async def update_my_profile(
    body: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    profile = await _get_or_create(int(user["sub"]), db)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(profile, k, v)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/{user_id}", response_model=ProfileOut)
async def get_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    profile = await db.scalar(select(UserProfile).where(UserProfile.user_id == user_id))
    if not profile:
        raise HTTPException(404, "Profile not found")
    return profile


@router.get("", response_model=list[ProfileOut])
async def list_profiles(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    result = await db.execute(select(UserProfile))
    return result.scalars().all()
