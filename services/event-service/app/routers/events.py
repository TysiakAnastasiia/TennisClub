import httpx, os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.database import get_db
from app.models.event import Event, EventRegistration
from app.schemas.event import EventCreate, EventOut, RegistrationOut
from app.services.jwt_dep import get_current_user, require_staff_or_admin
from datetime import datetime, timezone

NOTIFICATION_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8006")
router = APIRouter(prefix="/events", tags=["events"])


@router.get("/my-registrations", response_model=list[RegistrationOut])
async def my_registrations(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(
        select(EventRegistration).where(EventRegistration.user_id == int(user["sub"]))
    )
    return result.scalars().all()


@router.get("", response_model=list[EventOut])
async def list_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event).where(Event.is_active == True)
        .options(selectinload(Event.registrations))
        .order_by(Event.start_time)
    )
    events = result.scalars().all()
    out = []
    for e in events:
        d = EventOut.model_validate(e)
        d.participant_count = len(e.registrations)
        out.append(d)
    return out


@router.get("/{event_id}", response_model=EventOut)
async def get_event(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Event).where(Event.id == event_id).options(selectinload(Event.registrations))
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(404, "Event not found")
    d = EventOut.model_validate(event)
    d.participant_count = len(event.registrations)
    return d


@router.post("", response_model=EventOut, status_code=201)
async def create_event(body: EventCreate, db: AsyncSession = Depends(get_db), user: dict = Depends(require_staff_or_admin)):
    # Validate: start must be in future
    now = datetime.now(timezone.utc)
    start = body.start_time
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    if start <= now:
        raise HTTPException(400, "Дата початку події має бути у майбутньому")
    if body.end_time <= body.start_time:
        raise HTTPException(400, "Дата закінчення має бути після початку")

    event = Event(**body.model_dump(), created_by=int(user["sub"]))
    db.add(event)
    await db.commit()
    await db.refresh(event)
    d = EventOut.model_validate(event)
    d.participant_count = 0
    return d


@router.delete("/{event_id}", status_code=204)
async def deactivate_event(event_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_staff_or_admin)):
    event = await db.get(Event, event_id)
    if event:
        event.is_active = False
        await db.commit()


@router.post("/{event_id}/register", response_model=RegistrationOut, status_code=201)
async def register_for_event(event_id: int, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    result = await db.execute(
        select(Event).where(Event.id == event_id).options(selectinload(Event.registrations))
    )
    event = result.scalar_one_or_none()
    if not event or not event.is_active:
        raise HTTPException(404, "Event not found")

    if event.max_participants and len(event.registrations) >= event.max_participants:
        raise HTTPException(400, "Event is full")

    user_id = int(user["sub"])
    existing = await db.scalar(
        select(EventRegistration).where(EventRegistration.event_id == event_id, EventRegistration.user_id == user_id)
    )
    if existing:
        raise HTTPException(400, "Already registered")

    reg = EventRegistration(event_id=event_id, user_id=user_id, user_email=user["email"])
    db.add(reg)
    await db.commit()
    await db.refresh(reg)

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(f"{NOTIFICATION_URL}/notifications/event-registered", json={
                "email": user["email"],
                "event_title": event.title,
                "start_time": event.start_time.isoformat(),
            })
    except Exception:
        pass

    return reg


@router.delete("/{event_id}/register", status_code=204)
async def unregister_from_event(event_id: int, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    reg = await db.scalar(
        select(EventRegistration).where(EventRegistration.event_id == event_id, EventRegistration.user_id == int(user["sub"]))
    )
    if not reg:
        raise HTTPException(404, "Registration not found")
    await db.delete(reg)
    await db.commit()


@router.get("/{event_id}/participants", response_model=list[RegistrationOut])
async def event_participants(event_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_staff_or_admin)):
    result = await db.execute(select(EventRegistration).where(EventRegistration.event_id == event_id))
    return result.scalars().all()
