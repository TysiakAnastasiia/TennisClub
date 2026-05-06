from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, AsyncSessionLocal
from app.routers.auth import router
from app.models.user import User, Role
from passlib.context import CryptContext
from sqlalchemy import select

app = FastAPI(title="Auth Service", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router)

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Seed admin if not exists
        admin = await db.scalar(select(User).where(User.email == "admin@tennis.com"))
        if not admin:
            users_seed = [
                User(email="admin@tennis.com",   hashed_password=pwd_ctx.hash("Admin123!"[:72]),   role=Role.admin,  is_active=True),
                User(email="staff@tennis.com",   hashed_password=pwd_ctx.hash("Staff123!"[:72]),   role=Role.staff,  is_active=True),
                User(email="client@tennis.com",  hashed_password=pwd_ctx.hash("Client123!"[:72]),  role=Role.client, is_active=True),
                User(email="client2@tennis.com", hashed_password=pwd_ctx.hash("Client123!"[:72]),  role=Role.client, is_active=True),
            ]
            db.add_all(users_seed)
            await db.commit()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "auth"}
