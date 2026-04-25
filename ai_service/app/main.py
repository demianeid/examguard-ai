from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai_service.app.api.routes import router

app = FastAPI(title="ExamGuard AI Service")

# ── CORS: allow React dev server ─────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
