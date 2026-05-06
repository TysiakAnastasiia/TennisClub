from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base, AsyncSessionLocal
from app.routers.events import router
from app.models.event import Event, EventType
from sqlalchemy import select
from datetime import datetime, timedelta, timezone

app = FastAPI(title="Event Service", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
app.include_router(router)

now = datetime.now(timezone.utc)


@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        existing = await db.scalar(select(Event))
        if not existing:
            events = [
                Event(
                    title="Літній турнір Смарагдового корту",
                    description="Відкритий турнір для всіх рівнів гравців. Одиночний розряд, кругова система.",
                    event_type=EventType.tournament,
                    club_id=1,
                    start_time=now + timedelta(days=14),
                    end_time=now + timedelta(days=14, hours=8),
                    max_participants=32,
                    price=350,
                    created_by=1,
                    image_url="https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=800",
                ),
                Event(
                    title="Майстер-клас з подачі",
                    description="Інтенсивне тренування техніки подачі з досвідченим тренером Олексієм Мельником.",
                    event_type=EventType.training,
                    club_id=2,
                    start_time=now + timedelta(days=7),
                    end_time=now + timedelta(days=7, hours=2),
                    max_participants=8,
                    price=500,
                    created_by=2,
                    image_url="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800",
                ),
                Event(
                    title="Відкриті корти — вільна гра",
                    description="Щосуботня вільна гра для всіх охочих. Приходь і знайди партнера!",
                    event_type=EventType.open_play,
                    club_id=3,
                    start_time=now + timedelta(days=3),
                    end_time=now + timedelta(days=3, hours=4),
                    max_participants=20,
                    price=0,
                    created_by=2,
                    image_url="https://images.unsplash.com/photo-1529619768328-e37af76c6fe5?w=800",
                ),
                Event(
                    title="Парний чемпіонат клубу",
                    description="Парний турнір серед членів клубу. Реєструйтесь з партнером!",
                    event_type=EventType.tournament,
                    club_id=1,
                    start_time=now + timedelta(days=21),
                    end_time=now + timedelta(days=21, hours=6),
                    max_participants=16,
                    price=200,
                    created_by=1,
                    image_url="https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800",
                ),
            ]
            db.add_all(events)
            await db.commit()


@app.get("/health")
async def health():
    return {"status": "ok", "service": "event"}
