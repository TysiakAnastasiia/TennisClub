import httpx, os
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.booking import Booking, BookingStatus

CLUB_SERVICE_URL      = os.getenv("CLUB_SERVICE_URL", "http://club-service:8003")
NOTIFICATION_URL      = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8006")


class BookingBuilder:
    """
    Патерн Builder: дозволяє покроково конструювати складний об'єкт Booking.
    Відокремлює логіку розрахунку вартості та підготовки даних від самого класу моделі.
    """

    def __init__(self):
        self._data: dict = {}
        self._price_per_hour: float = 0

    def for_user(self, user_id: int):
        self._data["user_id"] = user_id
        return self

    def for_court(self, court_id: int, club_id: int):
        self._data["court_id"] = court_id
        self._data["club_id"] = club_id
        return self

    def at_time(self, start: datetime, end: datetime):
        self._data["start_time"] = start
        self._data["end_time"] = end
        return self

    def with_price(self, price_per_hour: float):
        self._price_per_hour = price_per_hour
        hours = (self._data["end_time"] - self._data["start_time"]).seconds / 3600
        self._data["total_price"] = round(price_per_hour * hours, 2)
        return self

    def with_notes(self, notes: str | None):
        self._data["notes"] = notes
        return self

    def build(self) -> Booking:
        return Booking(**self._data)


class BookingService:
    """
    Патерн Facade: єдина точка входу для роботи з бронюваннями.
    Приховує складну бізнес-логіку: валідацію часу, перевірку конфліктів у БД, 
    запити до зовнішніх мікросервісів та процес створення об'єкта.
    """

    async def get_court_info(self, club_id: int, court_id: int) -> dict:
        # Отримуємо інформацію про корт з club-service
        async with httpx.AsyncClient(timeout=5) as client: #асинхронний запит до іншого сервісу
            resp = await client.get(f"{CLUB_SERVICE_URL}/clubs/{club_id}/courts")
            resp.raise_for_status() #перевірка на помилки
            courts = resp.json()
            for c in courts:
                if c["id"] == court_id: 
                    return c  # Повертаємо знайдений корт
        raise ValueError("Court not found")  # Якщо корт не знайдено

    #Перевіряє конфлікти бронювань для запобігання подвійного бронювання
    async def check_conflict(self, court_id: int, start: datetime, end: datetime, db: AsyncSession) -> bool:
        result = await db.execute(
            select(Booking).where(
                and_(
                    Booking.court_id == court_id,
                    Booking.status != BookingStatus.cancelled,
                    Booking.start_time < end,
                    Booking.end_time > start,
                )
            )
        )
        return result.scalar_one_or_none() is not None

    async def create_booking(self, user_id: int, user_email: str, data: dict, db: AsyncSession) -> Booking:
        from datetime import timezone
        start = data["start_time"]
        end   = data["end_time"]

        # Make timezone-aware for comparison
        now = datetime.now(timezone.utc)
        s = start.replace(tzinfo=timezone.utc) if start.tzinfo is None else start
        e = end.replace(tzinfo=timezone.utc)   if end.tzinfo   is None else end

        if s <= now:
            raise ValueError("Час бронювання має бути у майбутньому")
        if s >= e:
            raise ValueError("Start must be before end")
        if (e - s).seconds < 3600 and (e - s).days == 0:
            raise ValueError("Minimum booking duration is 1 hour")

        court = await self.get_court_info(data["club_id"], data["court_id"])
        if not court["is_active"]:
            raise ValueError("Court is not available")

        conflict = await self.check_conflict(data["court_id"], start, end, db)
        if conflict:
            raise ValueError("Court already booked for this time slot")

        booking = (
            BookingBuilder()
            .for_user(user_id)
            .for_court(data["court_id"], data["club_id"])
            .at_time(start, end)
            .with_price(court["price_per_hour"])
            .with_notes(data.get("notes"))
            .build()
        )

        db.add(booking)
        await db.commit()
        await db.refresh(booking)

        # Notify user
        await self._notify_booking(user_email, booking, court)
        return booking

    async def _notify_booking(self, email: str, booking: Booking, court: dict):
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(f"{NOTIFICATION_URL}/notifications/booking-confirmed", json={
                    "email": email,
                    "booking_id": booking.id,
                    "court_name": court["name"],
                    "start_time": booking.start_time.isoformat(),
                    "end_time": booking.end_time.isoformat(),
                    "total_price": booking.total_price,
                })
        except Exception:
            pass


booking_service = BookingService()
