from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db, Invoice, Medicine
from scheduler import calculate_expiry_status
import pytesseract
from PIL import Image
import pdf2image
import io
import re
import os
import tempfile
from datetime import datetime, date
from typing import List

router = APIRouter()

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

def extract_text_from_image(image: Image.Image) -> str:
    return pytesseract.image_to_string(image, config="--psm 6")

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
            med_name = " ".join(name_parts).strip()
            if len(med_name) < 3:
                continue
            qty_match = qty_pattern.search(line)
            quantity = int(qty_match.group(1)) if qty_match else 100
            expiry_date = parse_date(dates[-1]) if dates else None
            mfg_date = parse_date(dates[0]) if len(dates) >= 2 else None
            if expiry_date:
                medicines.append({
                    "name": med_name,
                    "quantity": quantity,
                    "expiry_date": str(expiry_date),
                    "manufacturing_date": str(mfg_date) if mfg_date else None,
                    "batch_number": "",
                    "supplier": "",
                })
    return medicines

@router.post("/upload")
async def upload_invoice(
    facility_id: int = Form(...),
    invoice_type: str = Form("incoming"),
    supplier_name: str = Form(""),
    file: UploadFile = File(...)
):
    contents = await file.read()
    images = []

    if file.filename.lower().endswith(".pdf"):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
        try:
            images = pdf2image.convert_from_path(tmp_path, dpi=200)
        finally:
            os.unlink(tmp_path)
    else:
        images = [Image.open(io.BytesIO(contents))]

    full_text = ""
    for img in images:
        full_text += extract_text_from_image(img) + "\n"

    extracted = parse_invoice_text(full_text)

    return {
        "raw_text": full_text,
        "extracted_medicines": extracted,
        "facility_id": facility_id,
        "invoice_type": invoice_type,
        "supplier": supplier_name,
        "count": len(extracted)
    }

@router.post("/confirm")
def confirm_invoice(
    facility_id: int,
    invoice_type: str,
    supplier_name: str,
    medicines_data: List[dict],
    db: Session = Depends(get_db)
):
    invoice = Invoice(
        facility_id=facility_id,
        invoice_type=invoice_type,
        supplier_name=supplier_name,
        invoice_date=date.today(),
        processed=True
    )
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
                    Medicine.facility_id == facility_id,
                    Medicine.name == med["name"],
                    Medicine.batch_number == med.get("batch_number", ""),
                    Medicine.is_active == True
                ).first()
                if existing:
                    existing.quantity += med.get("quantity", 0)
                else:
                    new_med = Medicine(
                        facility_id=facility_id,
                        name=med["name"],
                        generic_name=med.get("generic_name"),
                        batch_number=med.get("batch_number", ""),
                        supplier=supplier_name or med.get("supplier", ""),
                        quantity=med.get("quantity", 0),
                        expiry_date=exp_date,
                        manufacturing_date=mfg,
                        expiry_status=status,
                        days_remaining=days
                    )
                    db.add(new_med)
            else:
                existing = db.query(Medicine).filter(
                    Medicine.facility_id == facility_id,
                    Medicine.name == med["name"],
                    Medicine.is_active == True
                ).order_by(Medicine.expiry_date.asc()).first()
                if existing:
                    existing.quantity = max(0, existing.quantity - med.get("quantity", 0))
            saved.append(med["name"])
        except Exception as e:
            print(f"Error saving {med.get('name')}: {e}")
            continue

    db.commit()
    return {"message": f"{len(saved)} medicines processed", "medicines": saved}
