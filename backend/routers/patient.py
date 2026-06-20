from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, desc
from database import get_db, Medicine, Facility, PatientNotification, ExpiryStatus, SearchLog
from pydantic import BaseModel
import math
import pytesseract
import pytesseract
pytesseract.pytesseract.tesseract_cmd = "/run/current-system/sw/bin/tesseract"
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
    name: str = Query(...), lat: float = Query(...), lng: float = Query(...),
    radius_km: float = Query(default=10), govt_only: bool = Query(default=False),
    db: Session = Depends(get_db)
):
    # Log search for "most searched" feature
    db.add(SearchLog(query=name))
    db.commit()

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
            Medicine.facility_id == facility.id, Medicine.is_active == True, Medicine.quantity > 0,
            Medicine.expiry_status != ExpiryStatus.expired,
            or_(Medicine.name.ilike(f"%{name}%"), Medicine.generic_name.ilike(f"%{name}%"), Medicine.generic_name.ilike(f"%{generic_name}%"))
        ).order_by(Medicine.expiry_date.asc()).all()

        if medicines:
            best = medicines[0]
            score = stock_health_score(best, distance)
            results.append({
                "facility_id": facility.id, "facility_name": facility.name,
                "facility_type": facility.facility_type, "address": facility.address,
                "latitude": facility.latitude, "longitude": facility.longitude,
                "distance_km": round(distance, 2), "is_free": facility.is_free_medicines,
                "verification_status": facility.verification_status,
                "medicine_name": best.name, "generic_name": best.generic_name,
                "quantity": best.quantity, "mrp": best.mrp,
                "expiry_date": str(best.expiry_date), "days_remaining": best.days_remaining,
                "expiry_status": best.expiry_status, "stock_score": round(score, 1),
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
            Medicine.facility_id == facility.id, Medicine.is_active == True, Medicine.quantity > 0,
            Medicine.expiry_status != ExpiryStatus.expired, Medicine.generic_name.ilike(f"%{generic_name}%")
        ).all()
        for m in meds:
            subs.append({"medicine_name": m.name, "generic_name": m.generic_name, "facility_name": facility.name, "distance_km": round(distance, 2), "quantity": m.quantity, "mrp": m.mrp, "is_free": facility.is_free_medicines})
    return subs[:5]

@router.post("/prescription-scan")
async def scan_prescription(lat: float = Query(...), lng: float = Query(...), file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents))
    text = pytesseract.image_to_string(image)
    lines = [l.strip() for l in text.split("\n") if len(l.strip()) > 3]
    medicine_keywords = ["tab", "cap", "syp", "inj", "mg", "ml", "tablet", "capsule"]
    medicines_found = []
    for line in lines:
        if any(kw in line.lower() for kw in medicine_keywords):
            words = line.split()
            if words:
                medicines_found.append(words[0])
    return {"raw_text": text, "detected_medicines": medicines_found[:10], "search_lat": lat, "search_lng": lng}

class NotificationRequest(BaseModel):
    medicine_name: str
    whatsapp_number: str

@router.post("/notify-me")
def register_notification(req: NotificationRequest, db: Session = Depends(get_db)):
    notif = PatientNotification(medicine_name=req.medicine_name, whatsapp_number=req.whatsapp_number)
    db.add(notif)
    db.commit()
    return {"message": f"You'll be notified on WhatsApp when {req.medicine_name} is available nearby"}

@router.get("/my-notifications")
def get_my_notifications(whatsapp_number: str = Query(...), db: Session = Depends(get_db)):
    notifs = db.query(PatientNotification).filter(
        PatientNotification.whatsapp_number == whatsapp_number
    ).order_by(PatientNotification.created_at.desc()).all()
    return [
        {"medicine_name": n.medicine_name, "notified": n.notified, "created_at": str(n.created_at)}
        for n in notifs
    ]

@router.get("/top-searches")
def get_top_searches(db: Session = Depends(get_db)):
    results = db.query(
        SearchLog.query, func.count(SearchLog.id).label("count")
    ).group_by(SearchLog.query).order_by(desc("count")).limit(5).all()
    return [{"query": r.query, "count": r.count} for r in results]
