import os
import re
import html
import random
import time
from datetime import datetime
from collections import defaultdict
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

from database import init_db, SessionLocal
from models import Complaint
from email_service import send_complaint_email

load_dotenv()

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize database tables
init_db()

# Rate limiter cache: { ip_address: [timestamp, ...] }
RATE_LIMIT_CACHE = defaultdict(list)
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 10  # Max 10 submissions per minute per IP

VALID_CATEGORIES = [
    'Banking scams',
    'UPI/payment fraud',
    'Phishing',
    'Suspicious links',
    'Email scams',
    'WhatsApp/messaging scams',
    'Social media scams',
    'Fake websites',
    'Online shopping fraud',
    'OTP fraud',
    'Fake customer-care scams',
    'Identity theft',
    'Account hacking',
    'Investment/crypto scams',
    'Other cyber crimes',
]

VALID_STATUSES = ['Pending', 'Under Review', 'Resolved', 'Rejected']


def check_rate_limit(client_ip: str) -> bool:
    """Returns True if request is allowed, False if rate limit exceeded."""
    now = time.time()
    timestamps = [t for t in RATE_LIMIT_CACHE[client_ip] if now - t < RATE_LIMIT_WINDOW_SECONDS]
    timestamps.append(now)
    RATE_LIMIT_CACHE[client_ip] = timestamps
    return len(timestamps) <= RATE_LIMIT_MAX_REQUESTS


def sanitize_text(val, max_length: int = 5000) -> str:
    """
    Sanitizes string inputs:
    - Removes null bytes
    - Strips leading/trailing whitespace
    - Escapes dangerous HTML entities (<, >, &, ", ') to neutralize XSS
    - Truncates to max length
    """
    if val is None:
        return ''
    cleaned = str(val).replace('\0', '').strip()
    escaped = html.escape(cleaned, quote=True)
    return escaped[:max_length]


def sanitize_email(email_str: str) -> str:
    """
    Sanitizes email address using re module:
    - Strips whitespace
    - Lowercases
    - Strips invalid control characters
    """
    if not email_str:
        return ''
    cleaned = str(email_str).strip().lower()
    cleaned = re.sub(r'[\s\x00-\x1f\x7f]', '', cleaned)
    return cleaned[:150]


def is_valid_email(email: str) -> bool:
    """Validates email format using Python re module."""
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, email)) if email else False


def sanitize_phone(phone_str: str) -> str:
    """
    Sanitizes phone number using re module:
    - Retains leading '+' if present
    - Strips brackets, spaces, dots, and hyphens
    """
    if not phone_str:
        return ''
    raw = str(phone_str).strip()
    has_plus = raw.startswith('+')
    clean_digits = re.sub(r'\D', '', raw)
    return f"+{clean_digits}" if has_plus else clean_digits


def is_valid_phone(phone: str) -> bool:
    """Validates phone number using Python re module (7-15 digits)."""
    clean_digits = re.sub(r'\D', '', phone)
    return 7 <= len(clean_digits) <= 15 and bool(re.match(r'^\+?[0-9]{7,15}$', phone))


def is_valid_date(date_str: str) -> bool:
    """Validates YYYY-MM-DD format."""
    try:
        parsed = datetime.strptime(date_str.strip(), '%Y-%m-%d')
        # Ensure incident date is not set more than 1 day in the future
        return parsed <= datetime.now()
    except (ValueError, TypeError):
        return False


def generate_unique_complaint_id(db_session) -> str:
    """Generates a non-conflicting complaint reference ID: CS-XXXXXX."""
    for _ in range(20):
        random_num = random.randint(100000, 999999)
        candidate_id = f"CS-{random_num}"
        existing = db_session.query(Complaint).filter_by(complaint_id=candidate_id).first()
        if not existing:
            return candidate_id
    # Fallback with timestamp millis
    return f"CS-{int(time.time()) % 1000000:06d}"


# ---------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'Cyber Safety Incident Backend',
        'database': 'connected',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }), 200


@app.route('/api/complaints', methods=['POST'])
def submit_complaint():
    """
    Submits a new cyber incident complaint.
    1. Validates all mandatory fields are present, properly formatted, and within limits.
    2. Sanitizes text inputs using Python's re and html escaping.
    3. Integrates with SQLAlchemy database session to store the complaint.
    4. Triggers email_service.py to send an automated notification to abishekks9207@gmail.com.
    5. Returns compliant JSON response with generated CS- prefixed ID.
    """
    client_ip = request.remote_addr or '127.0.0.1'
    if not check_rate_limit(client_ip):
        return jsonify({
            'success': False,
            'message': 'Submission rate limit reached. Please wait a minute before submitting again.'
        }), 429

    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return jsonify({
            'success': False,
            'message': 'Please provide all required information in JSON format.'
        }), 400

    # Extract raw inputs
    raw_name = data.get('name')
    raw_email = data.get('email')
    raw_phone = data.get('phone')
    raw_category = data.get('category')
    raw_subject = data.get('subject')
    raw_description = data.get('description')
    raw_date = data.get('incident_date')
    raw_evidence = data.get('evidence', '')

    # 1. Server-Side Presence Validation
    if not all([raw_name, raw_email, raw_phone, raw_category, raw_subject, raw_description, raw_date]):
        return jsonify({
            'success': False,
            'message': 'Please provide all required information.'
        }), 400

    # 2. Input Sanitization using re and html escape
    name = sanitize_text(raw_name, max_length=120)
    email = sanitize_email(raw_email)
    phone = sanitize_phone(raw_phone)
    category_input = str(raw_category).strip()
    subject = sanitize_text(raw_subject, max_length=200)
    description = sanitize_text(raw_description, max_length=10000)
    incident_date = str(raw_date).strip()
    evidence = sanitize_text(raw_evidence, max_length=5000)

    # 3. Format & Constraint Validations
    if len(name) < 2:
        return jsonify({
            'success': False,
            'message': 'Please enter a valid legal name (at least 2 characters).'
        }), 400

    if not is_valid_email(email):
        return jsonify({
            'success': False,
            'message': 'Please enter a valid email address.'
        }), 400

    if not is_valid_phone(phone):
        return jsonify({
            'success': False,
            'message': 'Please enter a valid contact phone number.'
        }), 400

    # Category matching (case-insensitive fallback)
    matched_category = next((c for c in VALID_CATEGORIES if c.lower() == category_input.lower()), None)
    if not matched_category:
        matched_category = 'Other cyber crimes'

    if not is_valid_date(incident_date):
        return jsonify({
            'success': False,
            'message': 'Please enter a valid incident date in YYYY-MM-DD format (cannot be in the future).'
        }), 400

    if len(description) < 15:
        return jsonify({
            'success': False,
            'message': 'Please provide a detailed chronological description of the incident (at least 15 characters).'
        }), 400

    # 4. Integrate Database Connection & Store Complaint
    db = SessionLocal()
    try:
        complaint_id = generate_unique_complaint_id(db)

        new_complaint = Complaint(
            complaint_id=complaint_id,
            name=name,
            email=email,
            phone=phone,
            category=matched_category,
            subject=subject,
            description=description,
            incident_date=incident_date,
            evidence=evidence,
            status='Pending'
        )

        db.add(new_complaint)
        db.commit()
        db.refresh(new_complaint)

        complaint_dict = new_complaint.to_dict()
    except Exception as db_err:
        db.rollback()
        return jsonify({
            'success': False,
            'message': 'Database connection failure. Could not store incident report.'
        }), 500
    finally:
        db.close()

    # 5. Trigger Email Notification via email_service.py
    email_success, email_status_msg = send_complaint_email(complaint_dict)

    if email_success:
        return jsonify({
            'success': True,
            'message': 'Complaint submitted successfully.',
            'complaint_id': complaint_id
        }), 201
    else:
        return jsonify({
            'success': True,
            'message': 'Complaint submitted and stored. Email notification could not be delivered.',
            'complaint_id': complaint_id
        }), 201


@app.route('/api/complaints/track', methods=['POST'])
def track_complaint():
    """
    Public tracking endpoint for citizens to check complaint status by ID and email/phone.
    """
    data = request.get_json(silent=True) or {}
    complaint_id = data.get('complaint_id', '').strip().upper()
    verification_key = data.get('verification_key', '').strip().lower()

    if not complaint_id or not verification_key:
        return jsonify({
            'success': False,
            'message': 'Please provide both Complaint ID and Verification email/phone.'
        }), 400

    db = SessionLocal()
    try:
        complaint = db.query(Complaint).filter_by(complaint_id=complaint_id).first()
        if not complaint:
            return jsonify({
                'success': False,
                'message': 'No complaint record found matching this Complaint ID.'
            }), 404

        # Verification check
        matches_email = complaint.email.lower() == verification_key
        matches_phone = re.sub(r'\D', '', complaint.phone) == re.sub(r'\D', '', verification_key)

        if not (matches_email or matches_phone):
            return jsonify({
                'success': False,
                'message': 'Verification credential does not match registered reporter details.'
            }), 403

        return jsonify({
            'success': True,
            'complaint': complaint.to_dict()
        }), 200
    finally:
        db.close()


# ---------------------------------------------------------
# ADMIN ENDPOINTS (Protected)
# ---------------------------------------------------------

def is_authorized_admin(req) -> bool:
    """Verifies ADMIN_API_KEY from Authorization or X-Admin-Key header."""
    expected_key = os.getenv('ADMIN_API_KEY', 'admin_secret_key_12345')
    auth_header = req.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
        if token == expected_key:
            return True

    api_key_header = req.headers.get('X-Admin-Key', '')
    if api_key_header and api_key_header == expected_key:
        return True

    return False


@app.route('/api/complaints', methods=['GET'])
def get_complaints():
    """
    Admin list endpoint with search and category/status filtering.
    """
    if not is_authorized_admin(request):
        return jsonify({'success': False, 'message': 'Unauthorized admin access.'}), 401

    category_filter = request.args.get('category', '').strip()
    status_filter = request.args.get('status', '').strip()
    search_query = request.args.get('search', '').strip().lower()

    db = SessionLocal()
    try:
        q = db.query(Complaint)
        if category_filter and category_filter != 'all':
            q = q.filter(Complaint.category == category_filter)
        if status_filter and status_filter != 'all':
            q = q.filter(Complaint.status == status_filter)

        results = q.order_by(Complaint.created_at.desc()).all()

        if search_query:
            results = [
                c for c in results
                if search_query in c.complaint_id.lower()
                or search_query in c.name.lower()
                or search_query in c.email.lower()
                or search_query in c.subject.lower()
                or search_query in c.description.lower()
            ]

        return jsonify({
            'success': True,
            'count': len(results),
            'complaints': [c.to_dict() for c in results]
        }), 200
    finally:
        db.close()


@app.route('/api/complaints/<complaint_id>', methods=['GET'])
def get_single_complaint(complaint_id):
    """Admin view for a single complaint record."""
    if not is_authorized_admin(request):
        return jsonify({'success': False, 'message': 'Unauthorized admin access.'}), 401

    db = SessionLocal()
    try:
        complaint = db.query(Complaint).filter_by(complaint_id=complaint_id.strip().upper()).first()
        if not complaint:
            return jsonify({'success': False, 'message': 'Complaint not found.'}), 404
        return jsonify({'success': True, 'complaint': complaint.to_dict()}), 200
    finally:
        db.close()


@app.route('/api/complaints/<complaint_id>/status', methods=['PATCH'])
def update_complaint_status(complaint_id):
    """Admin endpoint to update complaint status."""
    if not is_authorized_admin(request):
        return jsonify({'success': False, 'message': 'Unauthorized admin access.'}), 401

    data = request.get_json(silent=True) or {}
    new_status = data.get('status', '').strip()

    if new_status not in VALID_STATUSES:
        return jsonify({
            'success': False,
            'message': f"Invalid status. Allowed values: {', '.join(VALID_STATUSES)}"
        }), 400

    db = SessionLocal()
    try:
        complaint = db.query(Complaint).filter_by(complaint_id=complaint_id.strip().upper()).first()
        if not complaint:
            return jsonify({'success': False, 'message': 'Complaint not found.'}), 404

        complaint.status = new_status
        complaint.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(complaint)

        return jsonify({
            'success': True,
            'message': f'Complaint status updated to {new_status}.',
            'complaint': complaint.to_dict()
        }), 200
    finally:
        db.close()


# Serve Frontend root
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug_mode = os.getenv('FLASK_ENV', 'development') == 'development'
    print(f"[*] Starting Cyber Safety Backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
