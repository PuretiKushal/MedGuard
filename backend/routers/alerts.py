from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Medicine, Facility, ExpiryStatus
from scheduler import run_daily_expiry_check, send_whatsapp_alert, send_email_alert
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from fastapi.responses import StreamingResponse
import io
from datetime import datetime

router = APIRouter()

@router.post("/trigger")
def trigger_alerts():
    run_daily_expiry_check()
    return {"message": "Daily expiry check triggered successfully"}

@router.get("/facility/{facility_id}")
def get_alerts_for_facility(facility_id: int, db: Session = Depends(get_db)):
    critical = db.query(Medicine).filter(
        Medicine.facility_id == facility_id,
        Medicine.expiry_status == ExpiryStatus.critical,
        Medicine.is_active == True
    ).order_by(Medicine.expiry_date.asc()).all()

    warning = db.query(Medicine).filter(
        Medicine.facility_id == facility_id,
        Medicine.expiry_status == ExpiryStatus.warning,
        Medicine.is_active == True
    ).order_by(Medicine.expiry_date.asc()).all()

    expired = db.query(Medicine).filter(
        Medicine.facility_id == facility_id,
        Medicine.expiry_status == ExpiryStatus.expired,
        Medicine.is_active == True
    ).all()

    def fmt(m):
        return {
            "id": m.id, "name": m.name, "quantity": m.quantity,
            "expiry_date": str(m.expiry_date), "days_remaining": m.days_remaining,
            "batch_number": m.batch_number, "supplier": m.supplier,
            "expiry_status": m.expiry_status
        }

    return {
        "critical": [fmt(m) for m in critical],
        "warning": [fmt(m) for m in warning],
        "expired": [fmt(m) for m in expired],
        "total_at_risk": len(critical) + len(expired)
    }

@router.get("/facility/{facility_id}/compliance-report")
def generate_compliance_report(facility_id: int, db: Session = Depends(get_db)):
    facility = db.query(Facility).filter(Facility.id == facility_id).first()
    expired_meds = db.query(Medicine).filter(
        Medicine.facility_id == facility_id,
        Medicine.expiry_status == ExpiryStatus.expired,
        Medicine.is_active == True
    ).all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("PHARMACEUTICAL WASTE DISPOSAL COMPLIANCE REPORT", styles["Title"]))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(f"Facility: {facility.name if facility else 'Unknown'}", styles["Normal"]))
    elements.append(Paragraph(f"Date Generated: {datetime.now().strftime('%d %B %Y')}", styles["Normal"]))
    elements.append(Paragraph(f"District: Visakhapatnam | State: Andhra Pradesh", styles["Normal"]))
    elements.append(Spacer(1, 20))

    table_data = [["Medicine Name", "Batch No.", "Qty", "Expiry Date", "Reason", "Disposal Auth."]]
    for m in expired_meds:
        table_data.append([
            m.name, m.batch_number or "-", str(m.quantity),
            str(m.expiry_date), "Expired", "Pharmacy Incharge"
        ])

    if len(table_data) == 1:
        table_data.append(["No expired medicines", "-", "-", "-", "-", "-"])

    table = Table(table_data, colWidths=[150, 80, 40, 80, 70, 90])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A2640")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F8FA")]),
        ("ALIGN", (2, 0), (2, -1), "CENTER"),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Authorised Signatory: ____________________", styles["Normal"]))
    elements.append(Paragraph("Designation: Pharmacy Incharge", styles["Normal"]))

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=compliance_report_{facility_id}.pdf"}
    )
