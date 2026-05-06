from sqlalchemy import Column, Integer, String, DateTime, Float, Enum as PgEnum, ForeignKey
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class BookingStatus(str, enum.Enum):
    pending   = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"

class Booking(Base):
    __tablename__ = "bookings"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, nullable=False, index=True)
    court_id   = Column(Integer, nullable=False, index=True)
    club_id    = Column(Integer, nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time   = Column(DateTime(timezone=True), nullable=False)
    status     = Column(PgEnum(BookingStatus), default=BookingStatus.confirmed)
    total_price= Column(Float, nullable=False, default=0)
    notes      = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
