from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as PgEnum
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class Role(str, enum.Enum):
    admin = "admin"
    client = "client"
    staff = "staff"

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role          = Column(PgEnum(Role), default=Role.client, nullable=False)
    is_active     = Column(Boolean, default=False)   # becomes True after email confirm
    cancel_token  = Column(String, nullable=True)    # one-time cancel token
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
