from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.booking import BookingStatus

class BookingCreate(BaseModel):
    court_id: int
    club_id: int
    start_time: datetime
    end_time: datetime
    notes: Optional[str] = None

class BookingOut(BaseModel):
    id: int
    user_id: int
    court_id: int
    club_id: int
    start_time: datetime
    end_time: datetime
    status: BookingStatus
    total_price: float
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
