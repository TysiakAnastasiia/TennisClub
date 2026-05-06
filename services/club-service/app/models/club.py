from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, Enum as PgEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class CourtSurface(str, enum.Enum):
    clay = "clay"
    hard = "hard"
    grass = "grass"
    indoor = "indoor"

class Club(Base):
    __tablename__ = "clubs"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(120), nullable=False)
    description = Column(Text, nullable=True)
    address     = Column(String(255), nullable=False)
    phone       = Column(String(30), nullable=True)
    email       = Column(String(120), nullable=True)
    image_url   = Column(String(500), nullable=True)
    is_active   = Column(Boolean, default=True)

    courts = relationship("Court", back_populates="club", cascade="all, delete")

class Court(Base):
    __tablename__ = "courts"

    id          = Column(Integer, primary_key=True, index=True)
    club_id     = Column(Integer, ForeignKey("clubs.id", ondelete="CASCADE"), nullable=False)
    name        = Column(String(80), nullable=False)
    surface     = Column(PgEnum(CourtSurface), nullable=False)
    is_indoor   = Column(Boolean, default=False)
    price_per_hour = Column(Float, nullable=False, default=200.0)
    is_active   = Column(Boolean, default=True)

    club = relationship("Club", back_populates="courts")
