from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.event import EventType

class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    event_type: EventType
    club_id: int
    court_id: Optional[int] = None
    start_time: datetime
    end_time: datetime
    max_participants: Optional[int] = None
    price: float = 0
    image_url: Optional[str] = None

class EventOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    event_type: EventType
    club_id: int
    court_id: Optional[int]
    start_time: datetime
    end_time: datetime
    max_participants: Optional[int]
    price: float
    is_active: bool
    created_by: int
    created_at: datetime
    image_url: Optional[str]
    participant_count: int = 0
    class Config:
        from_attributes = True

class RegistrationOut(BaseModel):
    id: int
    event_id: int
    user_id: int
    user_email: str
    registered_at: datetime
    class Config:
        from_attributes = True
