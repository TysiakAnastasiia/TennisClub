from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.email_service import email_sender
import logging

router = APIRouter(prefix="/notifications", tags=["notifications"])
logger = logging.getLogger(__name__)


class ConfirmationPayload(BaseModel):
    email: str
    user_id: int
    cancel_token: str

class BookingPayload(BaseModel):
    email: str
    booking_id: int
    court_name: str
    start_time: str
    end_time: str
    total_price: float

class EventPayload(BaseModel):
    email: str
    event_title: str
    start_time: str


@router.post("/send-confirmation")
async def send_confirmation(body: ConfirmationPayload):
    try:
        await email_sender.send_registration_confirmation(body.email, body.user_id, body.cancel_token)
        return {"sent": True}
    except Exception as e:
        logger.error(f"Email error: {e}")
        return {"sent": False, "error": str(e)}


@router.post("/booking-confirmed")
async def booking_confirmed(body: BookingPayload):
    try:
        await email_sender.send_booking_confirmation(
            body.email, body.booking_id, body.court_name,
            body.start_time, body.end_time, body.total_price,
        )
        return {"sent": True}
    except Exception as e:
        logger.error(f"Email error: {e}")
        return {"sent": False, "error": str(e)}


@router.post("/event-registered")
async def event_registered(body: EventPayload):
    try:
        await email_sender.send_event_registration(body.email, body.event_title, body.start_time)
        return {"sent": True}
    except Exception as e:
        logger.error(f"Email error: {e}")
        return {"sent": False, "error": str(e)}
