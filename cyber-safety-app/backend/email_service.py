import os
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587


def send_complaint_email(complaint_data: dict) -> tuple[bool, str]:
    """
    Sends a formatted notification email to ADMIN_EMAIL via Gmail SMTP (TLS 587).
    Returns (success: bool, message: str).
    """
    mail_username = os.getenv('MAIL_USERNAME', '').strip()
    mail_password = os.getenv('MAIL_PASSWORD', '').strip()
    admin_email = os.getenv('ADMIN_EMAIL', 'abishekks9207@gmail.com').strip()

    if not mail_username or not mail_password:
        return False, "SMTP credentials (MAIL_USERNAME/MAIL_PASSWORD) not configured in .env."

    complaint_id = complaint_data.get('complaint_id', 'CS-UNKNOWN')
    now = datetime.now()
    submitted_date = now.strftime('%d-%m-%Y')
    submitted_time = now.strftime('%H:%M')

    subject = f"New Cyber Safety Complaint - [{complaint_id}]"

    body_text = f"""CYBER SAFETY COMPLAINT

Complaint ID: {complaint_id}
Submitted Date: {submitted_date}
Submitted Time: {submitted_time}

Name: {complaint_data.get('name', 'N/A')}
Email: {complaint_data.get('email', 'N/A')}
Phone: {complaint_data.get('phone', 'N/A')}

Issue Category: {complaint_data.get('category', 'N/A')}
Subject: {complaint_data.get('subject', 'N/A')}

Incident Date: {complaint_data.get('incident_date', 'N/A')}

Description:
--------------------------------
{complaint_data.get('description', 'N/A')}

Evidence:
--------------------------------
{complaint_data.get('evidence', 'None provided')}

This complaint was submitted through the Cyber Safety Reporting Portal.
"""

    try:
        msg = MIMEMultipart()
        msg['From'] = mail_username
        msg['To'] = admin_email
        msg['Subject'] = subject

        msg.attach(MIMEText(body_text, 'plain'))

        # Connect to Gmail SMTP server
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=15)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(mail_username, mail_password)
        server.sendmail(mail_username, admin_email, msg.as_string())
        server.quit()

        return True, "Email notification delivered successfully."
    except Exception as e:
        # Sanitize exception message to avoid credential leaks
        return False, f"SMTP delivery failure: {str(e)}"


def send_complaint_email_async(complaint_data: dict, callback=None):
    """Dispatches email sending in a background thread to prevent blocking client requests."""
    def worker():
        success, message = send_complaint_email(complaint_data)
        if callback:
            callback(success, message)

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
