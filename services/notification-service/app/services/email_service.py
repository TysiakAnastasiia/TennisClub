import os
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "tysiaknastia@gmail.com")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


class EmailSender:
    """Singleton email sender."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    async def send(self, to: str, subject: str, html: str):
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = SMTP_USER
        msg["To"]      = to
        msg.attach(MIMEText(html, "html"))

        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASS,
            start_tls=True,
            timeout=10,
        )

    def _base_template(self, title: str, content: str) -> str:
        return f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body {{ font-family: 'Georgia', serif; background: #f8fffe; margin: 0; padding: 0; }}
  .container {{ max-width: 600px; margin: 40px auto; background: white; border-radius: 12px;
    border: 1px solid #e0f5ee; overflow: hidden; box-shadow: 0 4px 20px rgba(0,128,96,0.08); }}
  .header {{ background: linear-gradient(135deg, #065f46, #10b981); padding: 40px 32px; text-align: center; }}
  .header h1 {{ color: white; margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 2px; }}
  .header p {{ color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; }}
  .body {{ padding: 40px 32px; color: #1a2e25; line-height: 1.7; }}
  .body h2 {{ color: #065f46; font-size: 20px; margin-bottom: 16px; }}
  .info-box {{ background: #f0fdf8; border-left: 3px solid #10b981; padding: 16px 20px;
    border-radius: 0 8px 8px 0; margin: 20px 0; }}
  .btn {{ display: inline-block; background: #065f46; color: white !important; padding: 14px 32px;
    border-radius: 8px; text-decoration: none; font-size: 14px; letter-spacing: 1px; margin: 20px 0; }}
  .btn-danger {{ background: #dc2626; }}
  .footer {{ background: #f0fdf8; padding: 20px 32px; text-align: center;
    color: #6b9e85; font-size: 12px; border-top: 1px solid #e0f5ee; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🎾 Tennis Club</h1>
    <p>Смарагдовий Корт</p>
  </div>
  <div class="body">
    <h2>{title}</h2>
    {content}
  </div>
  <div class="footer">
    <p>© 2025 Tennis Club · Смарагдовий Корт · Львів</p>
  </div>
</div>
</body>
</html>"""

    async def send_registration_confirmation(self, to: str, user_id: int, cancel_token: str):
        cancel_url = f"{FRONTEND_URL}/cancel-registration/{cancel_token}"
        content = f"""
<p>Дякуємо за реєстрацію на нашому сайті! Ваш акаунт створено і наразі очікує підтвердження адміністратора.</p>
<div class="info-box">
  <strong>Email:</strong> {to}<br>
  <strong>Статус:</strong> Очікує підтвердження
</div>
<p>Якщо це були не ви — скасуйте реєстрацію натиснувши кнопку нижче:</p>
<a href="{cancel_url}" class="btn btn-danger">❌ Це не я — скасувати реєстрацію</a>
<p style="color:#999;font-size:12px;">Або перейдіть за посиланням: {cancel_url}</p>
"""
        await self.send(to, "Реєстрація на Tennis Club", self._base_template("Вітаємо в Tennis Club! 🎾", content))

    async def send_booking_confirmation(self, to: str, booking_id: int, court_name: str,
                                         start_time: str, end_time: str, total_price: float):
        content = f"""
<p>Ваше бронювання підтверджено!</p>
<div class="info-box">
  <strong>Корт:</strong> {court_name}<br>
  <strong>Початок:</strong> {start_time}<br>
  <strong>Кінець:</strong> {end_time}<br>
  <strong>Сума:</strong> {total_price} грн
</div>
<p>Будемо чекати вас на корті! Для підтвердження бронювання не пізніше ніж за 12 годин. Якщо потрібно скасувати — зробіть це в особистому кабінеті.</p>
<a href="{FRONTEND_URL}/bookings" class="btn">Мої бронювання</a>
"""
        await self.send(to, f"Бронювання #{booking_id} підтверджено", self._base_template("Бронювання підтверджено ✅", content))

    async def send_booking_paid(self, to: str, booking_id: int, total_price: float):
        content = f"""
<p>Ваше бронювання успішно оплачено!</p>
<div class="info-box">
  <strong>Бронювання #{booking_id}</strong><br>
  <strong>Сума оплати:</strong> {total_price} грн<br>
  <strong>Статус:</strong> Оплачено ✅
</div>
<p>Дякуємо за оплату! Ми чекаємо вас на корті в зазначений час.</p>
<a href="{FRONTEND_URL}/bookings" class="btn">Мої бронювання</a>
"""
        await self.send(to, f"Бронювання #{booking_id} оплачено", self._base_template("Оплату отримано 💳", content))

    async def send_booking_refunded(self, to: str, booking_id: int, total_price: float):
        content = f"""
<p>Ваше бронювання скасовано, а кошти повернуто.</p>
<div class="info-box">
  <strong>Бронювання #{booking_id}</strong><br>
  <strong>Сума повернення:</strong> {total_price} грн<br>
  <strong>Статус:</strong> Скасовано та повернуто
</div>
<p>Кошти будуть повернуті на вашу картку протягом 3-5 робочих днів.</p>
<a href="{FRONTEND_URL}/bookings" class="btn">Мої бронювання</a>
"""
        await self.send(to, f"Повернення коштів за бронювання #{booking_id}", self._base_template("Повернення коштів 💰", content))

    async def send_event_registration(self, to: str, event_title: str, start_time: str):
        content = f"""
<p>Ви успішно зареєструвалися на подію!</p>
<div class="info-box">
  <strong>Подія:</strong> {event_title}<br>
  <strong>Дата:</strong> {start_time}
</div>
<p>Не забудьте взяти ракетку! 🎾</p>
<a href="{FRONTEND_URL}/events" class="btn">Переглянути події</a>
"""
        await self.send(to, f"Реєстрація на {event_title}", self._base_template("Реєстрацію на подію підтверджено 🏆", content))


email_sender = EmailSender()