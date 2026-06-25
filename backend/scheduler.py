from database import SessionLocal, Medicine, Alert, Facility, ExpiryStatus, PatientNotification
from datetime import date, datetime
from sqlalchemy.orm import Session
from twilio.rest import Client
import os
from dotenv import load_dotenv
from ai_services import generate_alert_summary

load_dotenv()

def calculate_expiry_status(expiry_date: date) -> tuple:
    today = date.today()
    delta = (expiry_date - today).days
    if delta < 0:
        return ExpiryStatus.expired, delta
    elif delta <= 30:
        return ExpiryStatus.critical, delta
    elif delta <= 60:
        return ExpiryStatus.warning, delta
    else:
        return ExpiryStatus.safe, delta

def run_daily_expiry_check():
    db: Session = SessionLocal()
    try:
        medicines = db.query(Medicine).filter(Medicine.is_active == True).all()
        critical_by_facility = {}
        warning_by_facility = {}

        for med in medicines:
            status, days = calculate_expiry_status(med.expiry_date)
            med.expiry_status = status
            med.days_remaining = days
            if status == ExpiryStatus.expired and med.disposal_status == "active":
                med.disposal_status = "pending_disposal"

            if status in [ExpiryStatus.critical, ExpiryStatus.expired]:
                critical_by_facility.setdefault(med.facility_id, []).append(med)
            elif status == ExpiryStatus.warning:
                warning_by_facility.setdefault(med.facility_id, []).append(med)

        db.commit()

        for facility_id, meds in critical_by_facility.items():
            facility = db.query(Facility).filter(Facility.id == facility_id).first()
            if facility:
                summary = generate_alert_summary(facility.name, meds, warning_by_facility.get(facility_id, []))
                send_whatsapp_alert(facility, meds, "critical", summary)
                send_email_alert(facility, meds, "critical", summary)

        for facility_id, meds in warning_by_facility.items():
            facility = db.query(Facility).filter(Facility.id == facility_id).first()
            if facility and facility_id not in critical_by_facility:
                summary = generate_alert_summary(facility.name, meds, [])
                send_email_alert(facility, meds, "warning", summary)

    finally:
        db.close()

def send_whatsapp_alert(facility, medicines, alert_type, summary=None):
    try:
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_WHATSAPP_FROM")
        if not all([account_sid, auth_token, facility.admin_whatsapp]):
            print(f"WhatsApp skipped for {facility.name} — missing Twilio config or admin_whatsapp")
            return
        client = Client(account_sid, auth_token)
        med_list = "\n".join([f"• {m.name} — {m.days_remaining}d left — Qty: {m.quantity}" for m in medicines[:10]])
        message = f"🏥 *MedGuard Alert — {facility.name}*\n\n"
        if summary:
            message += f"_{summary}_\n\n"
        if alert_type == "critical":
            message += f"⚠️ *{len(medicines)} medicine(s) expiring within 30 days or already expired:*\n\n"
        else:
            message += f"📋 *{len(medicines)} medicine(s) expiring within 60 days:*\n\n"
        message += med_list
        message += f"\n\nGenerated: {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
        phone = facility.admin_whatsapp.strip().replace(" ", "").replace("-", "")
        if not phone.startswith("+"):
            phone = "+91" + phone.lstrip("0")
        client.messages.create(body=message, from_=from_number, to=f"whatsapp:{phone}")
        print(f"WhatsApp alert sent to {facility.name}")
    except Exception as e:
        print(f"WhatsApp error for {facility.name}: {e}")

def send_email_alert(facility, medicines, alert_type, summary=None):
    try:
        sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        sender_email = os.getenv("SENDGRID_SENDER_EMAIL")
        if not all([sendgrid_api_key, sender_email, facility.email]):
            print(f"Email skipped for {facility.name} — missing SendGrid config or facility.email")
            return
        subject = f"MedGuard {'CRITICAL' if alert_type == 'critical' else 'WARNING'} Alert — {facility.name}"
        rows = "".join([
            f"<tr><td>{m.name}</td><td>{m.generic_name or '-'}</td><td>{m.quantity}</td><td>{m.expiry_date}</td><td>{m.days_remaining}</td>"
            f"<td style='color:{'#B23A3A' if m.expiry_status in ['critical','expired'] else '#C98A2E'}'>{m.expiry_status.upper()}</td></tr>"
            for m in medicines
        ])
        summary_html = f"<p style='background:#F8EFDF;padding:12px;border-radius:6px;font-style:italic'>{summary}</p>" if summary else ""
        html = f"""
        <html><body style="font-family:sans-serif">
        <h2 style='color:#1C2620'>MedGuard Daily Alert</h2>
        <p><strong>Facility:</strong> {facility.name}</p>
        <p><strong>Date:</strong> {datetime.now().strftime('%d %B %Y')}</p>
        {summary_html}
        <table border='1' cellpadding='8' cellspacing='0' style='border-collapse:collapse;width:100%'>
          <thead style='background:#1F6F50;color:white'><tr><th>Medicine</th><th>Generic</th><th>Qty</th><th>Expiry</th><th>Days Left</th><th>Status</th></tr></thead>
          <tbody>{rows}</tbody>
        </table>
        <p style='margin-top:20px;color:#888;font-size:12px'>MedGuard — Medicine Expiry & Waste Alert System</p>
        </body></html>
        """
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        message = Mail(from_email=sender_email, to_emails=facility.email, subject=subject, html_content=html)
        sg = SendGridAPIClient(sendgrid_api_key)
        sg.send(message)
        print(f"Email alert sent to {facility.name}")
    except Exception as e:
        print(f"Email error for {facility.name}: {e}")

def trigger_restock_notifications(medicine_name: str, facility_id: int):
    db: Session = SessionLocal()
    try:
        notifications = db.query(PatientNotification).filter(
            PatientNotification.medicine_name.ilike(f"%{medicine_name}%"), PatientNotification.notified == False
        ).all()
        for notif in notifications:
            try:
                account_sid = os.getenv("TWILIO_ACCOUNT_SID")
                auth_token = os.getenv("TWILIO_AUTH_TOKEN")
                from_number = os.getenv("TWILIO_WHATSAPP_FROM")
                client = Client(account_sid, auth_token)
                client.messages.create(
                    body=f"✅ *MedGuard Restock Alert*\n\n{medicine_name} is now available nearby.\nCheck MedGuard for details.",
                    from_=from_number, to=f"whatsapp:{notif.whatsapp_number}"
                )
                notif.notified = True
            except Exception as e:
                print(f"Restock notification error: {e}")
        db.commit()
    finally:
        db.close()
