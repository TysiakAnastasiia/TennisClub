# 🎾 Tennis Club — Мікросервісна Платформа

Смарагдово-білий дизайн · React + Vite · FastAPI · PostgreSQL · Docker

---

## Архітектура

### Тип розбиття: **Technical (Layered Microservices)**

| Характеристика | Оцінка | Пояснення |
|----------------|--------|-----------|
| Deployability  | ⭐⭐⭐⭐⭐ | Кожен сервіс у Docker-контейнері, незалежний деплой |
| Elasticity     | ⭐⭐⭐⭐  | Кожен сервіс масштабується горизонтально |
| Evolutionary   | ⭐⭐⭐⭐  | Сервіси можна змінювати незалежно |
| Fault tolerance| ⭐⭐⭐⭐  | Падіння одного сервісу не валить систему |
| Modularity     | ⭐⭐⭐⭐⭐ | Чіткий поділ відповідальностей |
| Overall cost   | ⭐⭐⭐   | Більше інфраструктури ніж моноліт |
| Performance    | ⭐⭐⭐⭐  | HTTP між сервісами, але async скрізь |
| Reliability    | ⭐⭐⭐⭐  | БД ізольовані, немає shared state |
| Scalability    | ⭐⭐⭐⭐⭐ | Незалежне масштабування |
| Simplicity     | ⭐⭐⭐   | Складніше ніж моноліт |
| Testability    | ⭐⭐⭐⭐⭐ | Кожен сервіс тестується окремо |

**Number of quanta: 6** (auth, user, club, booking, event, notification)

---

## Мікросервіси

| Сервіс | Порт | БД | Відповідальність |
|--------|------|----|-----------------|
| **gateway** | 8000 | — | API Gateway, проксі-роутинг |
| **auth-service** | 8001 | auth_db | Реєстрація, JWT, ролі |
| **user-service** | 8002 | user_db | Профілі користувачів |
| **club-service** | 8003 | club_db | Клуби та корти |
| **booking-service** | 8004 | booking_db | Бронювання кортів |
| **event-service** | 8005 | event_db | Події та реєстрації |
| **notification-service** | 8006 | notification_db | Email-нотифікації |

---

## Патерни проектування

| Патерн | Де використовується |
|--------|---------------------|
| **Singleton** | `JWTManager` в auth-service — один екземпляр на весь сервіс |
| **Singleton** | `EmailSender` в notification-service |
| **Facade** | `AuthFacade` — приховує складність реєстрації/логіну |
| **Facade** | API Gateway — єдина точка входу для всіх сервісів |
| **Builder** | `BookingBuilder` — покрокова побудова об'єкту бронювання |
| **Repository** | SQLAlchemy sessions через `get_db()` dependency |

---

## Ролі

| Роль | Можливості |
|------|-----------|
| **admin** | Все: активація користувачів, управління клубами/кортами/подіями |
| **staff** | Управління клубами, кортами, подіями; перегляд всіх бронювань |
| **client** | Перегляд клубів/подій, бронювання кортів, реєстрація на події |

---

## Email-нотифікації

- **Реєстрація** → підтвердження з кнопкою «Це не я — скасувати реєстрацію»
- **Бронювання** → підтвердження з деталями (корт, час, ціна)
- **Подія** → підтвердження реєстрації на подію

---

## Тестові акаунти (після `docker compose up`)

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@tennis.com | Admin123! |
| Staff | staff@tennis.com | Staff123! |
| Client | client@tennis.com | Client123! |

---

## Запуск

```bash
# Клонуй та запусти
docker compose up --build

# Frontend
http://localhost:5173

# API Gateway
http://localhost:8000/docs  (кожен сервіс також має /docs)
```

## Структура проекту

```
tennis-club/
├── docker-compose.yml
├── gateway/                    # API Gateway (Facade)
├── frontend/                   # React + Vite
│   └── src/
│       ├── pages/              # Home, Login, Register, Clubs, Events...
│       ├── components/         # Navbar
│       ├── api/                # Axios клієнт
│       └── store/              # Zustand (auth state)
└── services/
    ├── auth-service/           # JWT, реєстрація, cancel token
    ├── user-service/           # Профілі
    ├── club-service/           # Клуби + корти
    ├── booking-service/        # Бронювання (Builder pattern)
    ├── event-service/          # Події, турніри
    └── notification-service/   # Gmail SMTP emails
```
