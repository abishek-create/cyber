# Cyber Safety Incident Reporting Portal & Real-Time Backend

A full-stack cyber safety reporting application built with a Python Flask REST API backend, SQLAlchemy database persistence (SQLite / PostgreSQL), automated Gmail SMTP notifications, and a responsive frontend (HTML, CSS, JavaScript).

---

## 1. Project Directory Structure

```text
cyber-safety-app/
│
├── frontend/
│   ├── index.html        # Clean, accessible incident reporting & tracking UI
│   ├── style.css         # Enterprise cybersecurity design system
│   └── script.js         # REST API fetch client & real-time UI controller
│
├── backend/
│   ├── app.py            # Flask REST API endpoints & rate-limiting
│   ├── database.py       # SQLAlchemy session & database engine
│   ├── models.py         # Complaint database schema
│   ├── email_service.py  # Gmail SMTP notification dispatcher
│   ├── requirements.txt  # Python package dependencies
│   └── .env              # Environment credentials & configuration
│
└── README.md             # Setup and deployment documentation
```

---

## 2. Prerequisites

* **Python 3.9+** installed (`python --version` or `python3 --version`).
* **pip** package manager.
* A Google Gmail account with 2-Step Verification enabled to generate an **App Password**.

---

## 3. Installation & Setup

### Step A: Navigate to Backend & Create Virtual Environment

```bash
cd cyber-safety-app/backend

# Create virtual environment
python3 -m venv venv

# Activate on Linux/macOS:
source venv/bin/activate

# Or activate on Windows:
# venv\Scripts\activate

# Install required Python dependencies
pip install -r requirements.txt
```

---

## 4. Gmail App Password Configuration

Google accounts require a dedicated 16-character **App Password** for SMTP authentication instead of your regular password:

1. Open your **[Google Account Security Settings](https://myaccount.google.com/security)**.
2. Ensure **2-Step Verification** is turned **ON**.
3. Under *2-Step Verification*, scroll to the bottom and select **App Passwords** (or search "App passwords" in the search bar).
4. Enter an app name (e.g. `CyberSafetyApp`) and click **Create**.
5. Copy the generated 16-character password (e.g., `abcd efgh ijkl mnop`).

---

## 5. Environment Variables (`.env`)

In `cyber-safety-app/backend/.env`, configure your settings:

```env
# Flask Server Configuration
FLASK_APP=app.py
FLASK_ENV=development
FLASK_PORT=5000

# Gmail SMTP Email Notification Credentials
MAIL_USERNAME=your_gmail_address@gmail.com
MAIL_PASSWORD=your_16_char_gmail_app_password
ADMIN_EMAIL=abishekks9207@gmail.com

# Database Connection (Default: SQLite local database; or PostgreSQL)
DATABASE_URL=sqlite:///cyber_safety.db

# Admin API Key for Accessing SOC Endpoints
ADMIN_API_KEY=admin_secret_key_12345
```

---

## 6. Running the Application

### Option 1: Start the Backend (Flask serves Frontend directly)

```bash
cd cyber-safety-app/backend
python app.py
```

The server will automatically initialize `cyber_safety.db` and start at:
* **Web UI**: [http://localhost:5000](http://localhost:5000)
* **REST API**: [http://localhost:5000/api/complaints](http://localhost:5000/api/complaints)
* **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Option 2: Run Frontend via Live Server / Static Web Server

If running the frontend independently:
```bash
cd cyber-safety-app/frontend
# Using Python built-in HTTP server:
python -m http.server 8080
```
Open `http://localhost:8080` in your web browser. (CORS is enabled by default in Flask).

---

## 7. Supported Cyber Issue Categories

* Banking scams
* UPI/payment fraud
* Phishing
* Suspicious links
* Email scams
* WhatsApp/messaging scams
* Social media scams
* Fake websites
* Online shopping fraud
* OTP fraud
* Fake customer-care scams
* Identity theft
* Account hacking
* Investment/crypto scams
* Other cyber crimes

---

## 8. API Testing with cURL

### 1. Submit a New Complaint

```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aarav Mehta",
    "email": "aarav.mehta@example.com",
    "phone": "+919811223344",
    "category": "UPI/payment fraud",
    "subject": "Fraudulent QR code debit on OLX",
    "description": "Buyer claiming to be army officer sent QR code stating advance payment of ₹15,000. Upon scanning, funds were debited to fraud VPA.",
    "incident_date": "2026-10-02",
    "evidence": "Suspect VPA: armyadvance99@okaxis; Txn ID: UPI/427189021481"
  }'
```

**Expected JSON Response:**
```json
{
  "success": true,
  "message": "Complaint submitted successfully.",
  "complaint_id": "CS-123456"
}
```

### 2. Automated Email Delivered to `abishekks9207@gmail.com`

**Subject:** `New Cyber Safety Complaint - [CS-123456]`
```text
CYBER SAFETY COMPLAINT

Complaint ID: CS-123456
Submitted Date: 02-10-2026
Submitted Time: 14:30

Name: Aarav Mehta
Email: aarav.mehta@example.com
Phone: +919811223344

Issue Category: UPI/payment fraud
Subject: Fraudulent QR code debit on OLX

Incident Date: 2026-10-02

Description:
--------------------------------
Buyer claiming to be army officer sent QR code stating advance payment of ₹15,000. Upon scanning, funds were debited to fraud VPA.

Evidence:
--------------------------------
Suspect VPA: armyadvance99@okaxis; Txn ID: UPI/427189021481

This complaint was submitted through the Cyber Safety Reporting Portal.
```

### 3. Track a Complaint

```bash
curl -X POST http://localhost:5000/api/complaints/track \
  -H "Content-Type: application/json" \
  -d '{
    "complaint_id": "CS-123456",
    "verification_key": "aarav.mehta@example.com"
  }'
```

### 4. Admin List Complaints (Protected)

```bash
curl -X GET "http://localhost:5000/api/complaints?status=all" \
  -H "Authorization: Bearer admin_secret_key_12345"
```

### 5. Admin Update Complaint Status

```bash
curl -X PATCH http://localhost:5000/api/complaints/CS-123456/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_secret_key_12345" \
  -d '{
    "status": "Under Review"
  }'
```

---

## 9. Security & Resilience Features

* **Zero Data Loss on SMTP Outage**: If Gmail SMTP fails or credentials are incomplete, the complaint is still securely saved in the database, and the API returns a graceful notice.
* **Rate Limiting**: Protects `POST /api/complaints` against automated spam (10 submissions per minute per client IP).
* **Safe Parameterization**: All SQL queries execute via SQLAlchemy ORM with parameter binding, eliminating SQL injection.
* **Credential Isolation**: All passwords and API keys reside in `.env` and are never sent to the browser.
