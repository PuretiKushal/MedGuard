from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from database import get_db, Medicine, Facility, PatientNotification, ExpiryStatus
from pydantic import BaseModel
import math
import pytesseract
from PIL import Image
import io

router = APIRouter()

GENERIC_MAP = {
    "crocin": "paracetamol", "dolo": "paracetamol", "calpol": "paracetamol",
    "augmentin": "amoxicillin clavulanate", "mox": "amoxicillin",
    "ciplox": "ciprofloxacin", "zithromax": "azithromycin",
    "taxim": "cefixime", "pan": "pantoprazole", "omez": "omeprazole",
    "metpure": "metoprolol", "telma": "telmisartan",
    "glycomet": "metformin", "januvia": "sitagliptin",
    "allegra": "fexofenadine", "cetiriz": "cetirizine",
    "combiflam": "ibuprofen paracetamol",
}

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def stock_health_score(med: Medicine, distance_km: float) -> float:
    days = med.days_remaining or 0
    qty_score = min(med.quantity / 500, 1.0) * 30
    days_score = min(days / 365, 1.0) * 40
    distance_score = max(0, (20 - distance_km) / 20) * 30
    return qty_score + days_score + distance_score

@router.get("/search")
def search_medicine(
    name: str = Query(...),
    lat: float = Query(...),
    lng: float = Query(...),
    radius_km: float = Query(default=10),
    govt_only: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    generic_name = GENERIC_MAP.get(name.lower().split()[0], name.lower())
    facilities = db.query(Facility).all()
    results = []

    for facility in facilities:
        if govt_only and facility.facility_type not in ["government_hospital", "phc"]:
            continue
        distance = haversine(lat, lng, facility.latitude, facility.longitude)
        if distance > radius_km:
            continue
        medicines = db.query(Medicine).filter(
            Medicine.facility_id == facility.id,
            Medicine.is_active == True,
            Medicine.quantity > 0,
            Medicine.expiry_status != ExpiryStatus.expired,
            or_(
                Medicine.name.ilike(f"%{name}%"),
                Medicine.generic_name.ilike(f"%{name}%"),
                Medicine.generic_name.ilike(f"%{generic_name}%"),
            )
        ).order_by(Medicine.expiry_date.asc()).all()

        if medicines:
            best = medicines[0]
            score = stock_health_score(best, distance)
            results.append({
                "facility_id": facility.id,
                "facility_name": facility.name,
                "facility_type": facility.facility_type,
                "address": facility.address,
                "latitude": facility.latitude,
                "longitude": facility.longitude,
                "distance_km": round(distance, 2),
                "is_free": facility.is_free_medicines,
                "medicine_name": best.name,
                "generic_name": best.generic_name,
                "quantity": best.quantity,
                "mrp": best.mrp,
                "expiry_date": str(best.expiry_date),
                "days_remaining": best.days_remaining,
                "expiry_status": best.expiry_status,
                "stock_score": round(score, 1),
                "phone": facility.phone,
            })

    results.sort(key=lambda x: x["stock_score"], reverse=True)

    if not results:
        substitutes = get_substitutes(name, generic_name, lat, lng, radius_km, db)
        return {"found": False, "results": [], "substitutes": substitutes}

    return {"found": True, "results": results, "substitutes": []}

def get_substitutes(name, generic_name, lat, lng, radius_km, db):
    facilities = db.query(Facility).all()
    subs = []
    for facility in facilities:
        distance = haversine(lat, lng, facility.latitude, facility.longitude)
        if distance > radius_km:
            continue
        meds = db.query(Medicine).filter(
            Medicine.facility_id == facility.id,
            Medicine.is_active == True,
            Medicine.quantity > 0,
            Medicine.expiry_status != ExpiryStatus.expired,
            Medicine.generic_name.ilike(f"%{generic_name}%")
        ).all()
        for m in meds:
            subs.append({
                "medicine_name": m.name,
                "generic_name": m.generic_name,
                "facility_name": facility.name,
                "distance_km": round(distance, 2),
                "quantity": m.quantity,
                "mrp": m.mrp,
                "is_free": facility.is_free_medicines,
            })
    return subs[:5]

@router.post("/prescription-scan")
async def scan_prescription(
    lat: float = Query(...),
    lng: float = Query(...),
    file: UploadFile = File(...)
):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    text = pytesseract.image_to_string(image)
    lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 3]
    medicine_keywords = ["tab", "cap", "syp", "inj", "mg", "ml", "tablet", "capsule"]
    medicines_found = []
    for line in lines:
        lower = line.lower()
        if any(kw in lower for kw in medicine_keywords):
            words = line.split()
            if words:
                medicines_found.append(words[0])
    return {
        "raw_text": text,
        "detected_medicines": medicines_found[:10],
        "search_lat": lat,
        "search_lng": lng,
        "message": "Use the search endpoint for each detected medicine"
    }

class NotificationRequest(BaseModel):
    medicine_name: str
    whatsapp_number: str

@router.post("/notify-me")
def register_notification(req: NotificationRequest, db: Session = Depends(get_db)):
    notif = PatientNotification(
        medicine_name=req.medicine_name,
        whatsapp_number=req.whatsapp_number
    )
    db.add(notif)
    db.commit()
    return {"message": f"You'll be notified on WhatsApp when {req.medicine_name} is available nearby"}
