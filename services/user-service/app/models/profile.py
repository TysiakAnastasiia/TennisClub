from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.db.database import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, unique=True, nullable=False, index=True)
    first_name = Column(String(80), nullable=True)
    last_name  = Column(String(80), nullable=True)
    phone      = Column(String(30), nullable=True)
    bio        = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
