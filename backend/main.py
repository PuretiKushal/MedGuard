from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
import uvicorn

from database import engine, Base
from routers import facilities, medicines, invoices, alerts, patient, auth
from scheduler import run_daily_expiry_check

scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    scheduler.add_job(run_daily_expiry_check, "cron", hour=8, minute=0)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(
    title="MedGuard API",
    description="Medicine Expiry & Waste Alert System",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(facilities.router, prefix="/api/facilities", tags=["Facilities"])
app.include_router(medicines.router, prefix="/api/medicines", tags=["Medicines"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(patient.router, prefix="/api/patient", tags=["Patient"])

@app.get("/")
def root():
    return {"message": "MedGuard API is running", "version": "1.0.0"}
@app.get("/migrate")
def run_migration():
    from database import engine
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE facilities ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'verified'"))
        conn.execute(text("ALTER TABLE facilities ADD COLUMN IF NOT EXISTS verification_reason TEXT"))
        conn.execute(text("ALTER TABLE facilities ADD COLUMN IF NOT EXISTS proof_document_path VARCHAR(500)"))
        conn.execute(text("ALTER TABLE medicines ADD COLUMN IF NOT EXISTS disposal_status VARCHAR(20) DEFAULT 'active'"))
        conn.execute(text("ALTER TABLE medicines ADD COLUMN IF NOT EXISTS disposed_date TIMESTAMP"))
        conn.execute(text("ALTER TABLE medicines ADD COLUMN IF NOT EXISTS disposed_by VARCHAR(100)"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS search_logs (id SERIAL PRIMARY KEY, query VARCHAR(200) NOT NULL, searched_at TIMESTAMP DEFAULT NOW())"))
        conn.commit()
    return {"message": "Migration complete"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
