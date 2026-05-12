from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os

app = FastAPI(title="Tennis Club Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SERVICES = {
    "auth":         os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001"),
    "users":        os.getenv("USER_SERVICE_URL", "http://user-service:8002"),
    "clubs":        os.getenv("CLUB_SERVICE_URL", "http://club-service:8003"),
    "bookings":     os.getenv("BOOKING_SERVICE_URL", "http://booking-service:8004"),
    "events":       os.getenv("EVENT_SERVICE_URL", "http://event-service:8005"),
    "notifications":os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8006"),
}

def resolve_service(path: str) -> tuple[str, str]:
    """
    API Gateway (Facade): Єдина точка входу для мікросервісної архітектури.
    Проксіює запити до відповідних сервісів, приховуючи топологію мережі 
    та складність внутрішньої інфраструктури від клієнта.
    """
    segment = path.strip("/").split("/")[0]
    if segment in SERVICES:
        return SERVICES[segment], path
    raise HTTPException(status_code=404, detail=f"No service for /{segment}")

@app.api_route("/{full_path:path}", methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"])
async def proxy(full_path: str, request: Request):
    base_url, path = resolve_service(full_path)
    url = f"{base_url}/{path}"

    headers = dict(request.headers)
    headers.pop("host", None)

    body = await request.body()

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.request(
            method=request.method,
            url=url,
            headers=headers,
            content=body,
            params=dict(request.query_params),
        )

    from fastapi.responses import Response
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        headers=dict(resp.headers),
        media_type=resp.headers.get("content-type"),
    )
