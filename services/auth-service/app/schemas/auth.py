from pydantic import BaseModel, EmailStr
from app.models.user import Role

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: Role = Role.client

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Role

class UserOut(BaseModel):
    id: int
    email: str
    role: Role
    is_active: bool

    class Config:
        from_attributes = True
