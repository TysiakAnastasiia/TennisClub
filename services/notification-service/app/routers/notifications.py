from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.email_service import email_sender
import logging
import traceback

router = APIRouter(prefix="/notifications", tags=["notifications"])
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ConfirmationPayload(BaseModel):
    email: str
    user_id: int
    cancel_token: str

class BookingPayload(BaseModel):
    email: str
    booking_id: int
    court_name: Optional[str] = ""
    start_time: Optional[str] = ""
    end_time: Optional[str] = ""
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
        logger.error(f"Email error: {e}\n{traceback.format_exc()}")
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
        logger.error(f"Email error: {e}\n{traceback.format_exc()}")
        return {"sent": False, "error": str(e)}


@router.post("/booking-paid")
async def booking_paid(body: BookingPayload):
    try:
        await email_sender.send_booking_paid(body.email, body.booking_id, body.total_price)
        return {"sent": True}
    except Exception as e:
        logger.error(f"Email error: {e}\n{traceback.format_exc()}")
        return {"sent": False, "error": str(e)}


@router.post("/booking-refunded")
async def booking_refunded(body: BookingPayload):
    try:
        await email_sender.send_booking_refunded(body.email, body.booking_id, body.total_price)
        return {"sent": True}
    except Exception as e:
        logger.error(f"Email error: {e}\n{traceback.format_exc()}")
        return {"sent": False, "error": str(e)}


@router.post("/event-registered")
async def event_registered(body: EventPayload):
    try:
        await email_sender.send_event_registration(body.email, body.event_title, body.start_time)
        return {"sent": True}
    except Exception as e:
        logger.error(f"Email error: {e}\n{traceback.format_exc()}")
        return {"sent": False, "error": str(e)}
