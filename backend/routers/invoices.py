from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db, Invoice, Medicine
from scheduler import calculate_expiry_status
from ai_services import normalize_medicine_name
import re
from datetime import datetime, date
from typing import List


router = APIRouter()

GENERIC_MAP = {
    "crocin": "paracetamol", "dolo": "paracetamol", "calpol": "paracetamol",
    "augmentin": "amoxicillin clavulanate", "mox": "amoxicillin",
    "ciplox": "ciprofloxacin", "zithromax": "azithromycin",
    "taxim": "cefixime", "pan": "pantoprazole", "omez": "omeprazole",
}

def parse_date(date_str: str) -> date | None:
    date_str = date_str.strip()
    formats = ["%d/%m/%Y", "%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%m-%Y", "%b-%Y", "%B-%Y"]
    for fmt in formats:
        try:
            parsed = datetime.strptime(date_str, fmt)
            if fmt in ["%m/%Y", "%m-%Y", "%b-%Y", "%B-%Y"]:
                import calendar
                last_day = calendar.monthrange(parsed.year, parsed.month)[1]
                return date(parsed.year, parsed.month, last_day)
            return parsed.date()
        except:
            continue
    return None



def parse_invoice_text(text: str) -> List[dict]:
    medicines = []
    lines = text.strip().split("\n")
    date_pattern = re.compile(r"\b(\d{2}[/-]\d{2}[/-]\d{4}|\d{2}[/-]\d{4}|\d{4}-\d{2}-\d{2})\b")
    qty_pattern = re.compile(r"\b(\d{1,5})\s*(tabs?|caps?|ml|mg|tablets?|capsules?|units?)?\b", re.IGNORECASE)

    for line in lines:
        line = line.strip()
        if len(line) < 5:
            continue
        dates = date_pattern.findall(line)
        if len(dates) >= 1:
            parts = line.split()
            name_parts = []
            for p in parts:
                if re.match(r"^\d", p):
                    break
                name_parts.append(p)
            raw_name = " ".join(name_parts).strip()
            if len(raw_name) < 3:
                continue
            qty_match = qty_pattern.search(line)
            quantity = int(qty_match.group(1)) if qty_match else 100
            expiry_date = parse_date(dates[-1]) if dates else None
            mfg_date = parse_date(dates[0]) if len(dates) >= 2 else None
            if expiry_date:
                # AI-assisted name cleanup — defensive, falls back to raw name if it fails
                normalized = normalize_medicine_name(raw_name, GENERIC_MAP)
                medicines.append({
                    "name": normalized["cleaned_name"],
                    "raw_ocr_name": raw_name,
                    "ai_suggested_generic": normalized["suggested_generic"],
                    "quantity": quantity,
                    "expiry_date": str(expiry_date),
                    "manufacturing_date": str(mfg_date) if mfg_date else None,
                    "batch_number": "",
                    "supplier": "",
                })
    return medicines

@router.post("/upload")
async def upload_invoice(
    facility_id: int = Form(...), invoice_type: str = Form("incoming"),
    supplier_name: str = Form(""), raw_text: str = Form(...)
):
    extracted = parse_invoice_text(raw_text)
    return {
        "raw_text": raw_text, "extracted_medicines": extracted,
        "facility_id": facility_id, "invoice_type": invoice_type,
        "supplier": supplier_name, "count": len(extracted)
    }

from pydantic import BaseModel

class ConfirmInvoiceRequest(BaseModel):
    facility_id: int
    invoice_type: str
    supplier_name: str
    medicines_data: List[dict]

@router.post("/confirm")
def confirm_invoice(req: ConfirmInvoiceRequest, db: Session = Depends(get_db)):
    facility_id = req.facility_id
    invoice_type = req.invoice_type
    supplier_name = req.supplier_name
    medicines_data = req.medicines_data
    invoice = Invoice(facility_id=facility_id, invoice_type=invoice_type, supplier_name=supplier_name, invoice_date=date.today(), processed=True)
    db.add(invoice)
    db.flush()

    saved = []
    for med in medicines_data:
        try:
            exp_date = date.fromisoformat(med["expiry_date"])
            status, days = calculate_expiry_status(exp_date)
            mfg = date.fromisoformat(med["manufacturing_date"]) if med.get("manufacturing_date") else None

            if invoice_type == "incoming":
                existing = db.query(Medicine).filter(
                    Medicine.facility_id == facility_id, Medicine.name == med["name"],
                    Medicine.batch_number == med.get("batch_number", ""), Medicine.is_active == True
                ).first()
                if existing:
                    existing.quantity += med.get("quantity", 0)
                else:
                    disposal = "pending_disposal" if status == "expired" else "active"
                    new_med = Medicine(
                        facility_id=facility_id, name=med["name"],
                        generic_name=med.get("ai_suggested_generic") or med.get("generic_name"),
                        batch_number=med.get("batch_number", ""), supplier=supplier_name or med.get("supplier", ""),
                        quantity=med.get("quantity", 0), expiry_date=exp_date, manufacturing_date=mfg,
                        expiry_status=status, days_remaining=days, disposal_status=disposal
                    )
                    db.add(new_med)
            else:
                existing = db.query(Medicine).filter(
                    Medicine.facility_id == facility_id, Medicine.name == med["name"], Medicine.is_active == True
                ).order_by(Medicine.expiry_date.asc()).first()
                if existing:
                    existing.quantity = max(0, existing.quantity - med.get("quantity", 0))
            saved.append(med["name"])
        except Exception as e:
            print(f"Error saving {med.get('name')}: {e}")
            continue

    db.commit()
    return {"message": f"{len(saved)} medicines processed", "medicines": saved}
