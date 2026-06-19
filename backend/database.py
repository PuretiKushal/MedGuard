from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
import enum
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class FacilityType(str, enum.Enum):
    government_hospital = "government_hospital"
    phc = "phc"
    private_pharmacy = "private_pharmacy"
    private_hospital = "private_hospital"

class ExpiryStatus(str, enum.Enum):
    safe = "safe"
    warning = "warning"
    critical = "critical"
    expired = "expired"

class Facility(Base):
    __tablename__ = "facilities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    facility_type = Column(Enum(FacilityType), nullable=False)
    address = Column(Text)
    area = Column(String(100))
    city = Column(String(100), default="Visakhapatnam")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String(20))
    email = Column(String(100))
    admin_whatsapp = Column(String(20))
    is_free_medicines = Column(Boolean, default=False)
    # NEW — verification fields
    verification_status = Column(String(20), default="verified")  # verified | pending_review | unverified
    verification_reason = Column(Text, nullable=True)
    proof_document_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    medicines = relationship("Medicine", back_populates="facility")
    users = relationship("User", back_populates="facility")

class Medicine(Base):
    __tablename__ = "medicines"
    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    name = Column(String(200), nullable=False)
    generic_name = Column(String(200))
    category = Column(String(100))
    batch_number = Column(String(100))
    supplier = Column(String(200))
    quantity = Column(Integer, default=0)
    unit = Column(String(50), default="tablets")
    mrp = Column(Float)
    manufacturing_date = Column(Date)
    expiry_date = Column(Date, nullable=False)
    expiry_status = Column(Enum(ExpiryStatus), default=ExpiryStatus.safe)
    days_remaining = Column(Integer)
    is_cold_chain = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    # NEW — disposal tracking
    disposal_status = Column(String(20), default="active")  # active | pending_disposal | disposed
    disposed_date = Column(DateTime, nullable=True)
    disposed_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    facility = relationship("Facility", back_populates="medicines")

class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    invoice_type = Column(String(20), default="incoming")
    invoice_number = Column(String(100))
    supplier_name = Column(String(200))
    invoice_date = Column(Date)
    file_path = Column(String(500))
    ocr_raw_text = Column(Text)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    alert_type = Column(String(50))
    message = Column(Text)
    sent_whatsapp = Column(Boolean, default=False)
    sent_email = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class PatientNotification(Base):
    __tablename__ = "patient_notifications"
    id = Column(Integer, primary_key=True, index=True)
    medicine_name = Column(String(200), nullable=False)
    whatsapp_number = Column(String(20), nullable=False)
    facility_id = Column(Integer, ForeignKey("facilities.id"))
    notified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    facility = relationship("Facility", back_populates="users")

# NEW — search logging for "most searched this week"
class SearchLog(Base):
    __tablename__ = "search_logs"
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String(200), nullable=False)
    searched_at = Column(DateTime, server_default=func.now())
