from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.database import get_db
from app.models.club import Club, Court
from app.schemas.club import ClubCreate, ClubOut, CourtCreate, CourtOut
from app.services.jwt_dep import require_staff_or_admin, get_current_user

router = APIRouter(prefix="/clubs", tags=["clubs"])


@router.get("", response_model=list[ClubOut])
async def list_clubs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Club).where(Club.is_active == True).options(selectinload(Club.courts))
    )
    return result.scalars().all()


@router.get("/{club_id}", response_model=ClubOut)
async def get_club(club_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Club).where(Club.id == club_id).options(selectinload(Club.courts))
    )
    club = result.scalar_one_or_none()
    if not club:
        raise HTTPException(404, "Club not found")
    return club


@router.post("", response_model=ClubOut, status_code=201)
async def create_club(body: ClubCreate, db: AsyncSession = Depends(get_db), _=Depends(require_staff_or_admin)):
    club = Club(**body.model_dump())
    db.add(club)
    await db.commit()
    await db.refresh(club)
    # reload with courts
    result = await db.execute(select(Club).where(Club.id == club.id).options(selectinload(Club.courts)))
    return result.scalar_one()


@router.put("/{club_id}", response_model=ClubOut)
async def update_club(club_id: int, body: ClubCreate, db: AsyncSession = Depends(get_db), _=Depends(require_staff_or_admin)):
    club = await db.get(Club, club_id)
    if not club:
        raise HTTPException(404, "Club not found")
    for k, v in body.model_dump().items():
        setattr(club, k, v)
    await db.commit()
    result = await db.execute(select(Club).where(Club.id == club_id).options(selectinload(Club.courts)))
    return result.scalar_one()


@router.delete("/{club_id}", status_code=204)
async def deactivate_club(club_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_staff_or_admin)):
    club = await db.get(Club, club_id)
    if club:
        club.is_active = False
        await db.commit()


# ─── Courts ───────────────────────────────────────────────────────────

@router.get("/{club_id}/courts", response_model=list[CourtOut])
async def list_courts(club_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Court).where(Court.club_id == club_id, Court.is_active == True)
    )
    return result.scalars().all()


@router.post("/{club_id}/courts", response_model=CourtOut, status_code=201)
async def add_court(club_id: int, body: CourtCreate, db: AsyncSession = Depends(get_db), _=Depends(require_staff_or_admin)):
    court = Court(club_id=club_id, **body.model_dump())
    db.add(court)
    await db.commit()
    await db.refresh(court)
    return court


@router.put("/{club_id}/courts/{court_id}", response_model=CourtOut)
async def update_court(club_id: int, court_id: int, body: CourtCreate, db: AsyncSession = Depends(get_db), _=Depends(require_staff_or_admin)):
    court = await db.get(Court, court_id)
    if not court or court.club_id != club_id:
        raise HTTPException(404, "Court not found")
    for k, v in body.model_dump().items():
        setattr(court, k, v)
    await db.commit()
    await db.refresh(court)
    return court


@router.delete("/{club_id}/courts/{court_id}", status_code=204)
async def delete_court(club_id: int, court_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_staff_or_admin)):
    court = await db.get(Court, court_id)
    if court:
        court.is_active = False
        await db.commit()
