# CyberShield – Real-Time Cyber Safety, Threat Detection & Incident Operations

CyberShield is an enterprise-grade cyber safety, threat detection, and incident complaint management web application. It combines real-time heuristic threat detection (for URLs, messages, and phishing emails), interactive cyber defense dossiers, formal complaint lifecycle tracking, and a Security Operations Center (SOC) console powered by Cloud SQL PostgreSQL and real-time WebSocket event streams.

---

## Key Capabilities

1. **Real-Time Threat Detection Engine (`src/threat_engine/`)**:
   - **URL Analyzer**: Checks transport security (HTTP vs HTTPS), IP address hosts, excessive subdomains, high-risk TLDs (.top, .xyz, .biz), brand impersonation/typosquatting, sensitive lure keywords, and custom port detection.
   - **Message Analyzer**: Flags urgency coercion tactics, sensitive credential/OTP harvesting, advance-fee lottery fraud, Telegram task scams, and embedded malicious links.
   - **Email Phishing Scanner**: Analyzes free webmail impersonating institutions, high-urgency subject lines, dangerous executable attachment extensions (.apk, .scr, .exe, .zip), and credential theft prompts.
   - **Modular Risk Engine**: Normalizes weighted signals into a 0–100 probability index across 5 risk tiers (LOW RISK, MEDIUM RISK, HIGH RISK, CRITICAL RISK, UNKNOWN).
   - **Pre-Fill Handoff**: Transfers scan signals directly into formal incident complaints with a single click.

2. **Formal Cyber Incident Complaint Portal (`/complaints`)**:
   - 4-stage guided flow: **Incident Details → Evidence Upload → Review → Unique Reference ID Generation**.
   - Generates unique complaint IDs (e.g., `CS-2026-000184`).
   - Secure complaint tracking (`/complaints/track`) with identity verification via registered email or phone.
   - Live 7-stage resolution progress timeline: `Submitted → Acknowledged → Under Review → Assigned → Investigation → Resolved → Closed`.
   - Real-time status sync via WebSocket push notifications.

3. **Security Operations Center (SOC) Console (`/admin`)**:
   - High-density KPI counters (Total complaints, pending cases, active investigations, scans run, resolution rate).
   - Filterable & searchable complaint triage grid.
   - Incident Inspector modal: view evidence, reassign duty officers, log confidential internal notes, and broadcast live status updates to citizens.
   - Threat Rules Database Manager: add or remove heuristic keyword patterns, malicious domains, and fraudulent VPAs/phone numbers.
   - Immutable PostgreSQL Audit Log viewer recording all administrative and authentication events.

4. **Threat Intelligence Library & Cyber Awareness**:
   - 7 in-depth defense dossiers: Banking & Financial Fraud, Messaging Scams, Email Threats, Suspicious Links, Social Media Scams, Job & Internship Scams, and Malware & Device Threats.
   - Actionable checklists: Warning Signs, Attacker Tactics, What to Do, and What NOT to Do.
   - Emergency 1930 Cyber Fraud Helpline and Golden Hour recovery guidelines.

---

## Technical Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons, Motion.
- **Backend**: Node.js & Express (`server.ts`) with mounted Vite middleware.
- **Database**: Cloud SQL PostgreSQL with Drizzle ORM (`src/db/schema.ts`, `src/db/index.ts`).
- **Authentication**: Firebase Authentication with Google Sign-In & quick SOC Officer demo switch.
- **Real-Time Communications**: WebSocket server (`ws://.../ws`) delivering live push notifications for status updates and incoming incidents.
- **Visual Design**: Enterprise cybersecurity palette (Deep Navy `#0B1F3A`, Deep Blue `#123B66`, Professional Blue `#1769AA`, Cyan Accent `#20A4D8`, Clean Canvas `#F5F8FC`).

---

## REST API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/system/status` | Dynamic system health and active database status |
| `POST` | `/api/threat/url` | Inspects suspicious URLs and saves check to PostgreSQL |
| `POST` | `/api/threat/message` | Analyzes SMS, WhatsApp, and Telegram messages |
| `POST` | `/api/threat/email` | Evaluates email headers, bodies, and attachments |
| `GET` | `/api/threat/history` | Retrieves recent threat scans |
| `POST` | `/api/complaints` | Registers a cyber incident complaint & generates unique ID |
| `POST` | `/api/complaints/track` | Retrieves incident timeline with email/phone verification |
| `GET` | `/api/admin/complaints` | Retrieves complaint triage queue for SOC officers |
| `PATCH` | `/api/admin/complaints/:id/status` | Updates incident status and broadcasts WebSocket event |
| `GET` | `/api/admin/analytics` | Computes case breakdown, resolution rates, and threat metrics |
| `GET` | `/api/admin/threat-patterns` | Lists active threat database rules |
| `POST` | `/api/admin/threat-patterns` | Adds a new heuristic threat rule |
| `GET` | `/api/admin/audit-logs` | Immutable audit log trail |
| `GET` | `/api/awareness` | Retrieves cyber awareness guides |
| `GET` | `/api/config/official-help` | Emergency helplines (1930) and Golden Hour guidance |
