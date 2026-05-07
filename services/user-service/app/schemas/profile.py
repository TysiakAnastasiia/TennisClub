from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileOut(BaseModel):
    id: int
    user_id: int
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    bio: Optional[str]
    avatar_url: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True

class MembershipOut(BaseModel):
    id: int
    user_id: int
    club_id: int
    club_name: str
    joined_at: datetime

    class Config:
        from_attributes = True
