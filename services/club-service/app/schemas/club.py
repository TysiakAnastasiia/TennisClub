from pydantic import BaseModel
from typing import Optional, List
from app.models.club import CourtSurface

class CourtBase(BaseModel):
    name: str
    surface: CourtSurface
    is_indoor: bool = False
    price_per_hour: float = 200.0

class CourtCreate(CourtBase):
    pass

class CourtOut(CourtBase):
    id: int
    club_id: int
    is_active: bool
    class Config:
        from_attributes = True

class ClubBase(BaseModel):
    name: str
    description: Optional[str] = None
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    image_url: Optional[str] = None

class ClubCreate(ClubBase):
    pass

class ClubOut(ClubBase):
    id: int
    is_active: bool
    courts: List[CourtOut] = []
    class Config:
        from_attributes = True
