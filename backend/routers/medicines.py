from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from database import get_db, Medicine, ExpiryStatus
from scheduler import calculate_expiry_status
from datetime import date, datetime
from typing import Optional

router = APIRouter()

class MedicineCreate(BaseModel):
    facility_id: int
    name: str
    generic_name: Optional[str] = None
    category: Optional[str] = None
    batch_number: Optional[str] = None
    supplier: Optional[str] = None
    quantity: int
    unit: Optional[str] = "tablets"
    mrp: Optional[float] = None
    manufacturing_date: Optional[date] = None
    expiry_date: date
    is_cold_chain: Optional[bool] = False

def med_to_dict(m):
    return {
        "id": m.id, "facility_id": m.facility_id, "name": m.name,
        "generic_name": m.generic_name, "category": m.category,
        "batch_number": m.batch_number, "supplier": m.supplier,
        "quantity": m.quantity, "unit": m.unit, "mrp": m.mrp,
        "expiry_date": str(m.expiry_date),
        "manufacturing_date": str(m.manufacturing_date) if m.manufacturing_date else None,
        "expiry_status": m.expiry_status, "days_remaining": m.days_remaining,
        "is_cold_chain": m.is_cold_chain,
        "disposal_status": m.disposal_status,
        "disposed_date": str(m.disposed_date) if m.disposed_date else None,
        "disposed_by": m.disposed_by,
        "created_at": str(m.created_at),
    }

@router.get("/facility/{facility_id}")
def get_medicines_by_facility(facility_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Medicine).filter(Medicine.facility_id == facility_id, Medicine.is_active == True)
    if status and status != "all":
        query = query.filter(Medicine.expiry_status == status)
    medicines = query.order_by(Medicine.expiry_date.asc()).all()
    return [med_to_dict(m) for m in medicines]

@router.post("/")
def add_medicine(med: MedicineCreate, db: Session = Depends(get_db)):
    status, days = calculate_expiry_status(med.expiry_date)
    disposal = "pending_disposal" if status == ExpiryStatus.expired else "active"
    new_med = Medicine(**med.model_dump(), expiry_status=status, days_remaining=days, disposal_status=disposal)
    db.add(new_med)
    db.commit()
    db.refresh(new_med)
    return med_to_dict(new_med)

@router.put("/{medicine_id}/quantity")
def update_quantity(medicine_id: int, quantity: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    med.quantity = quantity
    db.commit()
    return {"message": "Updated", "quantity": quantity}

class DeductRequest(BaseModel):
    deduct_quantity: int

@router.put("/{medicine_id}/deduct")
def deduct_stock(medicine_id: int, req: DeductRequest, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    if req.deduct_quantity > med.quantity:
        raise HTTPException(status_code=400, detail=f"Cannot deduct {req.deduct_quantity} — only {med.quantity} in stock")
    if req.deduct_quantity <= 0:
        raise HTTPException(status_code=400, detail="Deduct quantity must be greater than zero")
    med.quantity -= req.deduct_quantity
    db.commit()
    return {"message": f"Deducted {req.deduct_quantity} units", "remaining_quantity": med.quantity}

class DisposeRequest(BaseModel):
    disposed_by: str

@router.put("/{medicine_id}/dispose")
def mark_disposed(medicine_id: int, req: DisposeRequest, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    if med.expiry_status != ExpiryStatus.expired:
        raise HTTPException(status_code=400, detail="Only expired medicines can be marked as disposed")
    med.disposal_status = "disposed"
    med.disposed_date = datetime.utcnow()
    med.disposed_by = req.disposed_by
    db.commit()
    return {"message": f"{med.name} marked as disposed"}

@router.delete("/{medicine_id}")
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if med:
        med.is_active = False
        db.commit()
    return {"message": "Removed from inventory"}

@router.get("/redistribution/suggestions")
def get_redistribution_suggestions(db: Session = Depends(get_db)):
    critical_meds = db.query(Medicine).filter(
        Medicine.expiry_status == ExpiryStatus.critical, Medicine.quantity > 50, Medicine.is_active == True
    ).all()
    suggestions = []
    for med in critical_meds:
        shortage = db.query(Medicine).filter(
            Medicine.name == med.name, Medicine.facility_id != med.facility_id,
            Medicine.quantity < 20, Medicine.is_active == True
        ).first()
        if shortage:
            from database import Facility
            src = db.query(Facility).filter(Facility.id == med.facility_id).first()
            dst = db.query(Facility).filter(Facility.id == shortage.facility_id).first()
            suggestions.append({
                "medicine": med.name,
                "from_facility": src.name if src else "Unknown",
                "to_facility": dst.name if dst else "Unknown",
                "available_qty": med.quantity, "days_remaining": med.days_remaining,
            })
    return suggestions

@router.get("/stockout/predictions")
def get_stockout_predictions(db: Session = Depends(get_db)):
    predictions = []
    medicines = db.query(Medicine).filter(Medicine.is_active == True, Medicine.quantity > 0).all()
    for med in medicines:
        if med.quantity < 30:
            predictions.append({
                "medicine": med.name, "facility_id": med.facility_id,
                "current_quantity": med.quantity,
                "estimated_days_until_stockout": med.quantity // 3 if med.quantity > 0 else 0,
            })
    return predictions

@router.get("/supplier/scores")
def get_supplier_scores(db: Session = Depends(get_db)):
    from sqlalchemy import func as sqlfunc
    results = db.query(
        Medicine.supplier, sqlfunc.avg(Medicine.days_remaining).label("avg_days"),
        sqlfunc.count(Medicine.id).label("total_batches")
    ).filter(Medicine.supplier != None, Medicine.is_active == True).group_by(Medicine.supplier).all()
    scores = []
    for r in results:
        flag = r.avg_days < 120
        scores.append({
            "supplier": r.supplier, "avg_shelf_life_days": round(r.avg_days or 0),
            "total_batches": r.total_batches, "flagged": flag,
            "reason": "Consistently low shelf life at delivery" if flag else "Good"
        })
    return scores
