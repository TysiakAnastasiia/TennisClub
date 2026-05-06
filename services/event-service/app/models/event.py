from sqlalchemy import Column, Integer, String, DateTime, Text, Enum as PgEnum, Float, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class EventType(str, enum.Enum):
    tournament = "tournament"
    training   = "training"
    open_play  = "open_play"
    other      = "other"

class Event(Base):
    __tablename__ = "events"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    event_type  = Column(PgEnum(EventType), nullable=False)
    club_id     = Column(Integer, nullable=False)
    court_id    = Column(Integer, nullable=True)
    start_time  = Column(DateTime(timezone=True), nullable=False)
    end_time    = Column(DateTime(timezone=True), nullable=False)
    max_participants = Column(Integer, nullable=True)
    price       = Column(Float, default=0)
    is_active   = Column(Boolean, default=True)
    created_by  = Column(Integer, nullable=False)  # user_id
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    image_url   = Column(String(500), nullable=True)

    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete")

class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id         = Column(Integer, primary_key=True, index=True)
    event_id   = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(Integer, nullable=False)
    user_email = Column(String(200), nullable=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())

    event = relationship("Event", back_populates="registrations")
