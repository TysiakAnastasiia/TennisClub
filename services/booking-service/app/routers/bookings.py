import httpx, os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate, BookingOut
from app.services.booking_service import booking_service
from app.services.jwt_dep import get_current_user, require_staff_or_admin

NOTIFICATION_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8006")
router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.get("", response_model=list[BookingOut])
async def list_my_bookings(db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    user_id = int(user["sub"])
    if user.get("role") in ("admin", "staff"):
        result = await db.execute(select(Booking).order_by(Booking.created_at.desc()))
    else:
        result = await db.execute(
            select(Booking).where(Booking.user_id == user_id).order_by(Booking.created_at.desc())
        )
    return result.scalars().all()


@router.post("", response_model=BookingOut, status_code=201)
async def create_booking(body: BookingCreate, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    try:
        booking = await booking_service.create_booking(
            user_id=int(user["sub"]),
            user_email=user["email"],
            data=body.model_dump(),
            db=db,
        )
        return booking
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.delete("/{booking_id}", status_code=204)
async def cancel_booking(booking_id: int, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")
    user_id = int(user["sub"])
    if booking.user_id != user_id and user.get("role") not in ("admin", "staff"):
        raise HTTPException(403, "Not your booking")
    
    was_paid = booking.is_paid
    booking.status = BookingStatus.cancelled
    await db.commit()

    # Send refund email if was paid
    if was_paid:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(f"{NOTIFICATION_URL}/notifications/booking-refunded", json={
                    "email": user["email"],
                    "booking_id": booking_id,
                    "total_price": booking.total_price,
                })
        except Exception:
            pass


@router.post("/{booking_id}/pay", response_model=BookingOut)
async def pay_booking(booking_id: int, db: AsyncSession = Depends(get_db), user: dict = Depends(get_current_user)):
    """Mock payment endpoint."""
    booking = await db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.user_id != int(user["sub"]) and user.get("role") not in ("admin", "staff"):
        raise HTTPException(403, "Not your booking")
    if booking.is_paid:
        raise HTTPException(400, "Already paid")
    booking.is_paid = True
    await db.commit()
    await db.refresh(booking)

    # Send payment confirmation email
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(f"{NOTIFICATION_URL}/notifications/booking-paid", json={
                "email": user["email"],
                "booking_id": booking_id,
                "total_price": booking.total_price,
            })
    except Exception:
        pass

    return booking


@router.get("/court/{court_id}", response_model=list[BookingOut])
async def court_bookings(court_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Booking).where(Booking.court_id == court_id, Booking.status != BookingStatus.cancelled)
    )
    return result.scalars().all()
