from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, AsyncSessionLocal
from app.routers.clubs import router
from app.models.club import Club, Court, CourtSurface
from sqlalchemy import select

app = FastAPI(title="Club Service", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(Club))
        if not existing:
            club1 = Club(
                name="Смарагдовий Корт",
                description="Елітний тенісний клуб в центрі міста з 6 кортами різних покриттів",
                address="вул. Зелена, 12, Львів",
                phone="+380 32 123-45-67",
                email="emerald@tennis.lviv.ua",
                image_url="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800",
            )
            club2 = Club(
                name="Академія Тенісу Захід",
                description="Сучасний клуб з критими кортами та школою тенісу для всіх вікових груп",
                address="вул. Наукова, 45, Львів",
                phone="+380 32 987-65-43",
                email="west@tennis.lviv.ua",
                image_url="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800",
            )
            club3 = Club(
                name="Парковий Тенісний Клуб",
                description="Клуб серед природи, 4 відкриті корти та затишна атмосфера",
                address="парк Сихів, Львів",
                phone="+380 32 555-12-34",
                email="park@tennis.lviv.ua",
                image_url="https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800",
            )
            db.add_all([club1, club2, club3])
            await db.flush()

            courts = [
                Court(club_id=club1.id, name="Корт A1", surface=CourtSurface.clay,   is_indoor=False, price_per_hour=300),
                Court(club_id=club1.id, name="Корт A2", surface=CourtSurface.hard,   is_indoor=False, price_per_hour=250),
                Court(club_id=club1.id, name="Корт A3", surface=CourtSurface.indoor, is_indoor=True,  price_per_hour=400),
                Court(club_id=club2.id, name="Корт B1", surface=CourtSurface.indoor, is_indoor=True,  price_per_hour=450),
                Court(club_id=club2.id, name="Корт B2", surface=CourtSurface.hard,   is_indoor=False, price_per_hour=280),
                Court(club_id=club3.id, name="Корт C1", surface=CourtSurface.clay,   is_indoor=False, price_per_hour=200),
                Court(club_id=club3.id, name="Корт C2", surface=CourtSurface.grass,  is_indoor=False, price_per_hour=350),
            ]
            db.add_all(courts)
            await db.commit()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "club"}
