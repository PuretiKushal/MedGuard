from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Facility

router = APIRouter()

@router.get("/")
def get_all_facilities(db: Session = Depends(get_db)):
    facilities = db.query(Facility).all()
    return [
        {
            "id": f.id,
            "name": f.name,
            "facility_type": f.facility_type,
            "address": f.address,
            "area": f.area,
            "city": f.city,
            "latitude": f.latitude,
            "longitude": f.longitude,
            "phone": f.phone,
            "is_free_medicines": f.is_free_medicines,
        }
        for f in facilities
    ]

@router.get("/{facility_id}")
def get_facility(facility_id: int, db: Session = Depends(get_db)):
    f = db.query(Facility).filter(Facility.id == facility_id).first()
    if not f:
        return {"error": "Facility not found"}
    return {
        "id": f.id,
        "name": f.name,
        "facility_type": f.facility_type,
        "address": f.address,
        "area": f.area,
        "latitude": f.latitude,
        "longitude": f.longitude,
        "is_free_medicines": f.is_free_medicines,
    }

@router.get("/{facility_id}/stats")
def get_facility_stats(facility_id: int, db: Session = Depends(get_db)):
    from database import Medicine, ExpiryStatus
    meds = db.query(Medicine).filter(
        Medicine.facility_id == facility_id,
        Medicine.is_active == True
    ).all()
    return {
        "total": len(meds),
        "safe": sum(1 for m in meds if m.expiry_status == ExpiryStatus.safe),
        "warning": sum(1 for m in meds if m.expiry_status == ExpiryStatus.warning),
        "critical": sum(1 for m in meds if m.expiry_status == ExpiryStatus.critical),
        "expired": sum(1 for m in meds if m.expiry_status == ExpiryStatus.expired),
    }
