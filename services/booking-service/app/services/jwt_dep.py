import os, jwt
from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer = HTTPBearer(auto_error=False)
SECRET = os.getenv("JWT_SECRET", "my-super-secret-jwt-key-1234567890-abcdefghijklmnopqrstuvwxyz")

def get_current_user(creds: HTTPAuthorizationCredentials = Security(bearer)) -> dict:
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        return jwt.decode(creds.credentials, SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid token")

def require_staff_or_admin(user: dict = Depends(get_current_user)):
    if user.get("role") not in ("admin", "staff"):
        raise HTTPException(403, "Staff or admin only")
    return user
