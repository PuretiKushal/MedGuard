from database import SessionLocal, Medicine, Alert, Facility, ExpiryStatus, PatientNotification
from datetime import date, datetime
from sqlalchemy.orm import Session
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from twilio.rest import Client
import os
from dotenv import load_dotenv

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

            if status in [ExpiryStatus.critical, ExpiryStatus.expired]:
                if med.facility_id not in critical_by_facility:
                    critical_by_facility[med.facility_id] = []
                critical_by_facility[med.facility_id].append(med)
            elif status == ExpiryStatus.warning:
                if med.facility_id not in warning_by_facility:
                    warning_by_facility[med.facility_id] = []
                warning_by_facility[med.facility_id].append(med)

        db.commit()

        for facility_id, meds in critical_by_facility.items():
            facility = db.query(Facility).filter(Facility.id == facility_id).first()
            if facility:
                send_whatsapp_alert(facility, meds, "critical")
                send_email_alert(facility, meds, "critical")

        for facility_id, meds in warning_by_facility.items():
            facility = db.query(Facility).filter(Facility.id == facility_id).first()
            if facility and facility_id not in critical_by_facility:
                send_email_alert(facility, meds, "warning")

    finally:
        db.close()

def send_whatsapp_alert(facility, medicines, alert_type):
    try:
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_WHATSAPP_FROM")
        if not all([account_sid, auth_token, facility.admin_whatsapp]):
            return
        client = Client(account_sid, auth_token)
        med_list = "\n".join([
            f"• {m.name} — {m.days_remaining}d left — Qty: {m.quantity}"
            for m in medicines[:10]
        ])
        message = f"🏥 *MedGuard Alert — {facility.name}*\n\n"
        if alert_type == "critical":
            message += f"⚠️ *{len(medicines)} medicine(s) expiring within 30 days or already expired:*\n\n"
        else:
            message += f"📋 *{len(medicines)} medicine(s) expiring within 60 days:*\n\n"
        message += med_list
        message += f"\n\nGenerated: {datetime.now().strftime('%d %b %Y, %I:%M %p')}"
        client.messages.create(
            body=message,
            from_=from_number,
            to=f"whatsapp:{facility.admin_whatsapp}"
        )
    except Exception as e:
        print(f"WhatsApp error: {e}")

def send_email_alert(facility, medicines, alert_type):
    try:
        gmail_user = os.getenv("GMAIL_USER")
        gmail_password = os.getenv("GMAIL_APP_PASSWORD")
        if not all([gmail_user, gmail_password, facility.email]):
            return
        subject = f"MedGuard {'CRITICAL' if alert_type == 'critical' else 'WARNING'} Alert — {facility.name}"
        rows = "".join([
            f"<tr><td>{m.name}</td><td>{m.generic_name or '-'}</td><td>{m.quantity}</td>"
            f"<td>{m.expiry_date}</td><td>{m.days_remaining}</td>"
            f"<td style='color:{'red' if m.expiry_status in ['critical','expired'] else 'orange'}'>"
            f"{m.expiry_status.upper()}</td></tr>"
            for m in medicines
        ])
        html = f"""
        <html><body>
        <h2 style='color:#1A2640'>MedGuard Daily Alert</h2>
        <p><strong>Facility:</strong> {facility.name}</p>
        <p><strong>Date:</strong> {datetime.now().strftime('%d %B %Y')}</p>
        <table border='1' cellpadding='8' cellspacing='0' style='border-collapse:collapse;width:100%'>
          <thead style='background:#1A2640;color:white'>
            <tr><th>Medicine</th><th>Generic</th><th>Qty</th><th>Expiry</th><th>Days Left</th><th>Status</th></tr>
          </thead>
          <tbody>{rows}</tbody>
        </table>
        <p style='margin-top:20px;color:#888;font-size:12px'>MedGuard — Medicine Expiry & Waste Alert System</p>
        </body></html>
        """
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = gmail_user
        msg["To"] = facility.email
        msg.attach(MIMEText(html, "html"))
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(gmail_user, gmail_password)
            server.sendmail(gmail_user, facility.email, msg.as_string())
    except Exception as e:
        print(f"Email error: {e}")

def trigger_restock_notifications(medicine_name: str, facility_id: int):
    db: Session = SessionLocal()
    try:
        notifications = db.query(PatientNotification).filter(
            PatientNotification.medicine_name.ilike(f"%{medicine_name}%"),
            PatientNotification.notified == False
        ).all()
        for notif in notifications:
            try:
                account_sid = os.getenv("TWILIO_ACCOUNT_SID")
                auth_token = os.getenv("TWILIO_AUTH_TOKEN")
                from_number = os.getenv("TWILIO_WHATSAPP_FROM")
                client = Client(account_sid, auth_token)
                client.messages.create(
                    body=f"✅ *MedGuard Restock Alert*\n\n{medicine_name} is now available nearby.\nCheck MedGuard for details.",
                    from_=from_number,
                    to=f"whatsapp:{notif.whatsapp_number}"
                )
                notif.notified = True
            except Exception as e:
                print(f"Restock notification error: {e}")
        db.commit()
    finally:
        db.close()
