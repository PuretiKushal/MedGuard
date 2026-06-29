from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Facility, User
from ai_services import screen_facility_registration
import hashlib
import os
import shutil

router = APIRouter()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.get("/")
def get_all_facilities(db: Session = Depends(get_db)):
    facilities = db.query(Facility).all()
    return [
        {
            "id": f.id, "name": f.name, "facility_type": f.facility_type,
            "address": f.address, "area": f.area, "city": f.city,
            "latitude": f.latitude, "longitude": f.longitude, "phone": f.phone,
            "is_free_medicines": f.is_free_medicines,
            "verification_status": f.verification_status,
        }
        for f in facilities
    ]

@router.get("/{facility_id}")
def get_facility(facility_id: int, db: Session = Depends(get_db)):
    f = db.query(Facility).filter(Facility.id == facility_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Facility not found")
    return {
        "id": f.id, "name": f.name, "facility_type": f.facility_type,
        "address": f.address, "area": f.area, "latitude": f.latitude,
        "longitude": f.longitude, "phone": f.phone, "email": f.email,
        "is_free_medicines": f.is_free_medicines,
        "verification_status": f.verification_status,
        "verification_reason": f.verification_reason,
    }

@router.get("/{facility_id}/stats")
def get_facility_stats(facility_id: int, db: Session = Depends(get_db)):
    from database import Medicine, ExpiryStatus
    meds = db.query(Medicine).filter(
        Medicine.facility_id == facility_id, Medicine.is_active == True
    ).all()
    expired_meds = [m for m in meds if m.expiry_status == ExpiryStatus.expired]
    return {
        "total": len(meds),
        "safe": sum(1 for m in meds if m.expiry_status == ExpiryStatus.safe),
        "warning": sum(1 for m in meds if m.expiry_status == ExpiryStatus.warning),
        "critical": sum(1 for m in meds if m.expiry_status == ExpiryStatus.critical),
        "expired": len(expired_meds),
        "pending_disposal": sum(1 for m in expired_meds if m.disposal_status == "pending_disposal"),
        "disposed": sum(1 for m in expired_meds if m.disposal_status == "disposed"),
    }

class RegisterFacilityRequest(BaseModel):
    name: str
    facility_type: str
    address: str
    area: str
    latitude: float
    longitude: float
    phone: str
    email: str
    admin_whatsapp: str
    is_free_medicines: bool = False
    admin_name: str
    admin_email: str
    admin_password: str

@router.post("/register")
def register_facility(req: RegisterFacilityRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == req.admin_email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This admin email is already registered.")

    existing_names = [f.name for f in db.query(Facility.name).all()]

    screening = screen_facility_registration(
        name=req.name, address=req.address, area=req.area,
        phone=req.phone, email=req.email,
        latitude=req.latitude, longitude=req.longitude,
        existing_facility_names=existing_names
    )

    facility = Facility(
        name=req.name, facility_type=req.facility_type, address=req.address,
        area=req.area, latitude=req.latitude, longitude=req.longitude,
        phone=req.phone, email=req.email, admin_whatsapp=req.admin_whatsapp,
        is_free_medicines=req.is_free_medicines,
        verification_status=screening["status"],
        verification_reason=screening["reason"],
    )
    db.add(facility)
    db.flush()

    user = User(
        facility_id=facility.id, name=req.admin_name,
        email=req.admin_email, hashed_password=hash_password(req.admin_password)
    )
    db.add(user)
    db.commit()

    return {
        "message": "Facility registered successfully",
        "facility_id": facility.id,
        "verification_status": facility.verification_status,
        "verification_reason": facility.verification_reason,
    }

@router.post("/{facility_id}/upload-proof")
async def upload_proof_document(facility_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    os.makedirs("uploads/proofs", exist_ok=True)
    file_path = f"uploads/proofs/facility_{facility_id}_{file.filename}"
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    facility.proof_document_path = file_path
    db.commit()
    return {"message": "Proof document uploaded. Awaiting manual review."}

# ===== Admin-only endpoints =====
ADMIN_KEY = os.getenv("ADMIN_SECRET_KEY", "medguard_admin_2026")

@router.get("/admin/pending-review")
def get_pending_facilities(admin_key: str, db: Session = Depends(get_db)):
    if admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    facilities = db.query(Facility).filter(Facility.verification_status == "pending_review").all()
    return [
        {
            "id": f.id, "name": f.name, "address": f.address,
            "verification_reason": f.verification_reason,
            "proof_document_path": f.proof_document_path,
            "created_at": str(f.created_at),
        }
        for f in facilities
    ]

@router.post("/admin/{facility_id}/verify")
def verify_facility(facility_id: int, admin_key: str, db: Session = Depends(get_db)):
    if admin_key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")
    facility.verification_status = "verified"
    facility.verification_reason = None
    db.commit()
    return {"message": f"{facility.name} is now verified"}
