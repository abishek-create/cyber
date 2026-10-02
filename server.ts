import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import {
  complaints, complaintEvidence, complaintUpdates,
  threatChecks, threatDatabase, awarenessArticles,
  notifications, auditLogs, users
} from './src/db/schema.ts';
import { eq, desc, sql, and, or } from 'drizzle-orm';
import { analyzeUrl, analyzeMessage, analyzeEmail } from './src/threat_engine/index.ts';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import nodemailer from 'nodemailer';

dotenv.config();

/**
 * Automated Gmail SMTP Email Dispatcher for Complaints
 * Dispatches to abishekks9207@gmail.com
 */
async function sendComplaintEmailNotification(complaintData: {
  complaintNumber: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  subject?: string;
  incidentDate: string;
  description: string;
  evidence?: string;
}) {
  const mailUser = process.env.MAIL_USERNAME?.trim();
  const mailPass = process.env.MAIL_PASSWORD?.trim();
  const adminEmail = process.env.ADMIN_EMAIL?.trim() || 'abishekks9207@gmail.com';

  if (!mailUser || !mailPass) {
    console.log(`[SMTP Notice] MAIL_USERNAME / MAIL_PASSWORD not configured. Skipping SMTP dispatch for ${complaintData.complaintNumber}.`);
    return;
  }

  const now = new Date();
  const submittedDate = now.toLocaleDateString('en-GB'); // DD-MM-YYYY
  const submittedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // HH:MM

  const bodyText = `CYBER SAFETY COMPLAINT

Complaint ID: ${complaintData.complaintNumber}
Submitted Date: ${submittedDate}
Submitted Time: ${submittedTime}

Name: ${complaintData.name}
Email: ${complaintData.email}
Phone: ${complaintData.phone}

Issue Category: ${complaintData.category}
Subject: ${complaintData.subject || complaintData.category}

Incident Date: ${complaintData.incidentDate}

Description:
--------------------------------
${complaintData.description}

Evidence:
--------------------------------
${complaintData.evidence || 'None provided'}

This complaint was submitted through the Cyber Safety Reporting Portal.`;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS
      auth: {
        user: mailUser,
        pass: mailPass,
      },
    });

    await transporter.sendMail({
      from: mailUser,
      to: adminEmail,
      subject: `New Cyber Safety Complaint - [${complaintData.complaintNumber}]`,
      text: bodyText,
    });
    console.log(`[SMTP] Successfully delivered notification email for ${complaintData.complaintNumber} to ${adminEmail}`);
  } catch (err: any) {
    console.warn(`[SMTP Warning] Failed to deliver notification email:`, err.message);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Body parsers with safe upload limit for evidence screenshots/documents
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// WebSocket Server for live push notifications and complaint status sync
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'connected', message: 'CyberShield Real-Time SOC Stream Connected' }));

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
    clients.delete(ws);
  });
});

export function broadcast(eventType: string, data: any) {
  const message = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('Failed to broadcast to client:', err);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 1. SYSTEM HEALTH / REAL-TIME STATUS (DYNAMIC, NOT HARDCODED)
// ---------------------------------------------------------------------------
app.get('/api/system/status', async (_req, res) => {
  try {
    let dbStatus = 'disconnected';
    try {
      const result = await db.select({ count: sql`1` }).from(threatDatabase).limit(1);
      if (result) dbStatus = 'connected';
    } catch (e) {
      console.warn('DB health check warning:', e);
      dbStatus = 'degraded';
    }

    res.json({
      backend: 'online',
      database: dbStatus,
      threat_engine: 'online',
      notification_service: clients.size > 0 ? 'active' : 'ready',
      active_ws_connections: clients.size,
      timestamp: new Date().toISOString(),
      engine_version: 'CyberShield 2.4-Enterprise',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'System health query error' });
  }
});

// ---------------------------------------------------------------------------
// 2. USER AUTHENTICATION & PROFILE
// ---------------------------------------------------------------------------
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;
    const { fullName, phone } = req.body;
    const dbUser = await getOrCreateUser(user.uid, user.email || '', fullName || user.name, phone);

    // Audit log
    await db.insert(auditLogs).values({
      actor: user.email || user.uid,
      action: 'USER_SYNC_LOGIN',
      entityType: 'users',
      entityId: user.uid,
      details: 'User authenticated and session synchronized with PostgreSQL',
    });

    res.json({ user: dbUser });
  } catch (error: any) {
    console.error('Auth sync failed:', error);
    res.status(500).json({ error: error.message || 'Authentication synchronization failed' });
  }
});

app.get('/api/auth/me', optionalAuth, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  try {
    const dbUsers = await db.select().from(users).where(eq(users.uid, req.user.uid)).limit(1);
    if (dbUsers.length > 0) {
      return res.json({ user: dbUsers[0] });
    }
    const newUser = await getOrCreateUser(req.user.uid, req.user.email || '', req.user.name);
    res.json({ user: newUser });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// ---------------------------------------------------------------------------
// 3. THREAT DETECTION APIS (URL, MESSAGE, EMAIL)
// ---------------------------------------------------------------------------
app.post('/api/threat/url', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.trim()) {
      return res.status(400).json({ error: 'Please enter a valid URL to analyze.' });
    }

    // Fetch active threat patterns from DB
    const patterns = await db.select().from(threatDatabase);
    const result = analyzeUrl(url, patterns);

    // Save check history
    await db.insert(threatChecks).values({
      userId: req.user?.uid || 'guest-session',
      checkType: 'url',
      inputPreview: result.inputPreview,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      indicators: JSON.stringify(result.indicators),
      reasons: JSON.stringify(result.reasons),
      recommendation: result.recommendation,
    });

    // Notify connected admin monitoring dashboard
    broadcast('threat_scanned', {
      type: 'url',
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      target: result.inputPreview,
    });

    res.json(result);
  } catch (error: any) {
    console.error('URL threat analysis error:', error);
    res.status(500).json({ error: 'Threat analysis service encountered an error. Please try again.' });
  }
});

app.post('/api/threat/message', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Please provide message content to analyze.' });
    }

    const patterns = await db.select().from(threatDatabase);
    const result = analyzeMessage(message, patterns);

    await db.insert(threatChecks).values({
      userId: req.user?.uid || 'guest-session',
      checkType: 'message',
      inputPreview: result.inputPreview,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      indicators: JSON.stringify(result.indicators),
      reasons: JSON.stringify(result.reasons),
      recommendation: result.recommendation,
    });

    broadcast('threat_scanned', {
      type: 'message',
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      target: result.inputPreview,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Message threat analysis error:', error);
    res.status(500).json({ error: 'Threat analysis service encountered an error. Please try again.' });
  }
});

app.post('/api/threat/email', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { sender, subject, body, attachmentName } = req.body;
    if (!sender && !body) {
      return res.status(400).json({ error: 'Please provide either sender email or email body text.' });
    }

    const patterns = await db.select().from(threatDatabase);
    const result = analyzeEmail(sender || 'unspecified@domain.com', subject || 'No Subject', body || '', attachmentName, patterns);

    await db.insert(threatChecks).values({
      userId: req.user?.uid || 'guest-session',
      checkType: 'email',
      inputPreview: result.inputPreview,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      indicators: JSON.stringify(result.indicators),
      reasons: JSON.stringify(result.reasons),
      recommendation: result.recommendation,
    });

    broadcast('threat_scanned', {
      type: 'email',
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      target: result.inputPreview,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Email threat analysis error:', error);
    res.status(500).json({ error: 'Threat analysis service encountered an error. Please try again.' });
  }
});

app.get('/api/threat/history', optionalAuth, async (req: AuthRequest, res) => {
  try {
    let history;
    if (req.user?.uid) {
      history = await db.select().from(threatChecks)
        .where(eq(threatChecks.userId, req.user.uid))
        .orderBy(desc(threatChecks.createdAt))
        .limit(20);
    } else {
      history = await db.select().from(threatChecks)
        .orderBy(desc(threatChecks.createdAt))
        .limit(10);
    }
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve check history' });
  }
});

// ---------------------------------------------------------------------------
// 4. COMPLAINTS & INCIDENT REPORTING
// ---------------------------------------------------------------------------
app.post('/api/complaints', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const {
      category, incidentDate, incidentTime, description,
      amountLost, currency, platformUsed, suspectUrl, suspectPhone,
      suspectEmail, transactionId, reporterName, reporterEmail,
      reporterPhone, preferredContact, evidenceFiles,
      name, email, phone, subject, incident_date, evidence,
    } = req.body;

    const finalName = (reporterName || name || '').trim();
    const finalEmail = (reporterEmail || email || '').trim();
    const finalPhone = (reporterPhone || phone || '').trim();
    const finalCategory = (category || '').trim();
    const finalDate = (incidentDate || incident_date || new Date().toISOString().split('T')[0]).trim();
    const finalDesc = (description || '').trim();
    const finalSubject = (subject || finalCategory || 'Cyber Incident Report').trim();
    const finalEvidence = evidence || [suspectUrl, suspectPhone, transactionId].filter(Boolean).join('; ');

    if (!finalCategory || !finalDate || !finalDesc || !finalName || !finalEmail || !finalPhone) {
      return res.status(400).json({
        success: false,
        error: 'Please fill in all mandatory incident details and contact information.',
        message: 'Please provide all required information.',
      });
    }

    // Generate unique complaint reference: CS-XXXXXX
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const complaintNumber = `CS-${randomDigits}`;

    const newComplaint = await db.insert(complaints).values({
      complaintNumber,
      userId: req.user?.uid || 'public-submission',
      category: finalCategory,
      incidentDate: finalDate,
      incidentTime: incidentTime || '',
      description: finalDesc,
      amountLost: amountLost ? String(amountLost) : null,
      currency: currency || 'INR',
      platformUsed: platformUsed || '',
      suspectUrl: suspectUrl || '',
      suspectPhone: suspectPhone || '',
      suspectEmail: suspectEmail || '',
      transactionId: transactionId || '',
      reporterName: finalName,
      reporterEmail: finalEmail,
      reporterPhone: finalPhone,
      preferredContact: preferredContact || 'Email',
      status: 'Submitted',
      priority: Number(amountLost || 0) > 50000 ? 'High' : 'Medium',
    }).returning();

    // Initial timeline record
    await db.insert(complaintUpdates).values({
      complaintNumber,
      status: 'Submitted',
      message: 'Complaint successfully received and logged into CyberShield Security Operations queue.',
      createdBy: 'System Automated',
    });

    // Evidence attachments if provided
    if (Array.isArray(evidenceFiles) && evidenceFiles.length > 0) {
      for (const file of evidenceFiles) {
        if (file.name && file.data) {
          await db.insert(complaintEvidence).values({
            complaintNumber,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size || file.data.length,
            fileData: file.data, // base64 or preview string
          });
        }
      }
    }

    // Create user notification
    if (req.user?.uid) {
      await db.insert(notifications).values({
        userId: req.user.uid,
        title: `Complaint Submitted (${complaintNumber})`,
        message: `Your report regarding '${finalCategory}' has been assigned Reference ${complaintNumber}.`,
        type: 'complaint_update',
        complaintNumber,
      });
    }

    // Audit log
    await db.insert(auditLogs).values({
      actor: finalEmail,
      action: 'COMPLAINT_CREATED',
      entityType: 'complaints',
      entityId: complaintNumber,
      details: `Created new ${finalCategory} complaint with ID ${complaintNumber}`,
    });

    // Trigger asynchronous Gmail notification to abishekks9207@gmail.com
    sendComplaintEmailNotification({
      complaintNumber,
      name: finalName,
      email: finalEmail,
      phone: finalPhone,
      category: finalCategory,
      subject: finalSubject,
      incidentDate: finalDate,
      description: finalDesc,
      evidence: finalEvidence,
    }).catch((e) => console.warn('Email notification async dispatch caught:', e));

    // Real-time broadcast to all connected dashboards and admins
    broadcast('new_complaint', {
      complaintNumber,
      category: finalCategory,
      reporterName: finalName,
      status: 'Submitted',
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      complaint_id: complaintNumber,
      complaintNumber,
      status: 'Submitted',
      complaint: newComplaint[0],
      message: 'Complaint submitted successfully.',
    });
  } catch (error: any) {
    console.error('Failed to submit complaint:', error);
    res.status(500).json({ error: error.message || 'Complaint registration failed. Please try again.' });
  }
});

// Track complaint securely by ID + email or phone
app.post('/api/complaints/track', async (req, res) => {
  try {
    const { complaintNumber, verificationKey } = req.body;
    if (!complaintNumber || !verificationKey) {
      return res.status(400).json({ error: 'Please provide both the Complaint Reference ID and your registered email or phone.' });
    }

    const cleanId = complaintNumber.trim().toUpperCase();
    const cleanKey = verificationKey.trim().toLowerCase();

    const matches = await db.select().from(complaints)
      .where(
        and(
          eq(complaints.complaintNumber, cleanId),
          or(
            sql`lower(${complaints.reporterEmail}) = ${cleanKey}`,
            sql`${complaints.reporterPhone} = ${cleanKey}`
          )
        )
      )
      .limit(1);

    if (matches.length === 0) {
      return res.status(404).json({
        error: 'No complaint found matching this Reference ID and verification credential. Please verify your details.',
      });
    }

    const complaint = matches[0];
    const updates = await db.select().from(complaintUpdates)
      .where(eq(complaintUpdates.complaintNumber, complaint.complaintNumber))
      .orderBy(desc(complaintUpdates.createdAt));

    const evidence = await db.select({
      id: complaintEvidence.id,
      fileName: complaintEvidence.fileName,
      fileType: complaintEvidence.fileType,
      fileSize: complaintEvidence.fileSize,
      uploadedAt: complaintEvidence.uploadedAt,
    }).from(complaintEvidence)
      .where(eq(complaintEvidence.complaintNumber, complaint.complaintNumber));

    res.json({
      complaint,
      updates,
      evidence,
    });
  } catch (error: any) {
    console.error('Tracking query failed:', error);
    res.status(500).json({ error: 'Unable to track complaint. Please try again later.' });
  }
});

// Get user's complaints
app.get('/api/complaints', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userUid = req.user!.uid;
    const userRole = (req.user as any).role;

    let userComplaints;
    if (userRole === 'admin') {
      userComplaints = await db.select().from(complaints).orderBy(desc(complaints.createdAt));
    } else {
      userComplaints = await db.select().from(complaints)
        .where(
          or(
            eq(complaints.userId, userUid),
            sql`lower(${complaints.reporterEmail}) = ${req.user!.email?.toLowerCase() || ''}`
          )
        )
        .orderBy(desc(complaints.createdAt));
    }

    res.json(userComplaints);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve complaints' });
  }
});

// Get single complaint details
app.get('/api/complaints/:number', async (req, res) => {
  try {
    const complaintNumber = req.params.number.toUpperCase();
    const result = await db.select().from(complaints).where(eq(complaints.complaintNumber, complaintNumber)).limit(1);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const updates = await db.select().from(complaintUpdates)
      .where(eq(complaintUpdates.complaintNumber, complaintNumber))
      .orderBy(desc(complaintUpdates.createdAt));

    const evidence = await db.select({
      id: complaintEvidence.id,
      fileName: complaintEvidence.fileName,
      fileType: complaintEvidence.fileType,
      fileSize: complaintEvidence.fileSize,
      uploadedAt: complaintEvidence.uploadedAt,
    }).from(complaintEvidence)
      .where(eq(complaintEvidence.complaintNumber, complaintNumber));

    res.json({ complaint: result[0], updates, evidence });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch complaint details' });
  }
});

// ---------------------------------------------------------------------------
// 5. ADMIN & SOC OPERATIONS
// ---------------------------------------------------------------------------
app.get('/api/admin/complaints', async (req, res) => {
  try {
    const { status, category, search } = req.query;
    let query = db.select().from(complaints);

    // Fetch all for admin sorting/filtering
    const all = await query.orderBy(desc(complaints.createdAt));
    let filtered = all;

    if (status && status !== 'all') {
      filtered = filtered.filter(c => c.status.toLowerCase() === String(status).toLowerCase());
    }
    if (category && category !== 'all') {
      filtered = filtered.filter(c => c.category === category);
    }
    if (search && String(search).trim()) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(c =>
        c.complaintNumber.toLowerCase().includes(q) ||
        c.reporterName.toLowerCase().includes(q) ||
        c.reporterEmail.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch admin complaints' });
  }
});

app.patch('/api/admin/complaints/:number/status', async (req, res) => {
  try {
    const complaintNumber = req.params.number.toUpperCase();
    const { status, message, updatedBy, assignedOfficer, internalNotes, priority } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'New status is required' });
    }

    const updated = await db.update(complaints)
      .set({
        status,
        ...(assignedOfficer !== undefined ? { assignedOfficer } : {}),
        ...(internalNotes !== undefined ? { internalNotes } : {}),
        ...(priority !== undefined ? { priority } : {}),
        updatedAt: new Date(),
      })
      .where(eq(complaints.complaintNumber, complaintNumber))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    // Record timeline update
    await db.insert(complaintUpdates).values({
      complaintNumber,
      status,
      message: message || `Status updated to ${status} by Cyber Cell Operations.`,
      createdBy: updatedBy || 'Security Operations Center',
    });

    // Create user notification if user_id is linked
    if (updated[0].userId && updated[0].userId !== 'public-submission') {
      await db.insert(notifications).values({
        userId: updated[0].userId,
        title: `Complaint ${complaintNumber} Updated`,
        message: `Your incident status is now: ${status}. ${message || ''}`,
        type: 'complaint_update',
        complaintNumber,
      });
    }

    // Audit log
    await db.insert(auditLogs).values({
      actor: updatedBy || 'Admin SOC',
      action: 'STATUS_UPDATE',
      entityType: 'complaints',
      entityId: complaintNumber,
      details: `Status transitioned to ${status}`,
    });

    // Real-time broadcast to all viewers and user dashboard!
    broadcast('complaint_status_changed', {
      complaintNumber,
      status,
      message: message || `Status updated to ${status}`,
      updatedAt: new Date().toISOString(),
    });

    res.json({ success: true, complaint: updated[0] });
  } catch (error: any) {
    console.error('Failed to update complaint status:', error);
    res.status(500).json({ error: 'Failed to update complaint status' });
  }
});

app.get('/api/admin/analytics', async (_req, res) => {
  try {
    const allComplaints = await db.select().from(complaints);
    const allChecks = await db.select().from(threatChecks);

    const total = allComplaints.length;
    const newComplaints = allComplaints.filter(c => c.status === 'Submitted').length;
    const underReview = allComplaints.filter(c => c.status === 'Under Review' || c.status === 'Investigation').length;
    const resolved = allComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

    // Categories breakdown
    const categoryCounts: Record<string, number> = {};
    for (const c of allComplaints) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }

    // Risk levels breakdown
    const highRiskChecks = allChecks.filter(c => c.riskLevel === 'HIGH RISK' || c.riskLevel === 'CRITICAL RISK').length;

    res.json({
      totalComplaints: total,
      newComplaints,
      underReview,
      resolved,
      resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
      totalThreatChecks: allChecks.length,
      highRiskChecks,
      categoryDistribution: Object.entries(categoryCounts).map(([name, count]) => ({ name, count })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

app.get('/api/admin/audit-logs', async (_req, res) => {
  try {
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(50);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve audit logs' });
  }
});

app.get('/api/admin/threat-patterns', async (_req, res) => {
  try {
    const patterns = await db.select().from(threatDatabase).orderBy(desc(threatDatabase.createdAt));
    res.json(patterns);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve threat database' });
  }
});

app.post('/api/admin/threat-patterns', async (req, res) => {
  try {
    const { patternType, pattern, severity, description } = req.body;
    if (!patternType || !pattern) {
      return res.status(400).json({ error: 'Pattern and type are required' });
    }
    const inserted = await db.insert(threatDatabase).values({
      patternType,
      pattern,
      severity: severity || 'high',
      description: description || 'Administrator defined security heuristic pattern',
    }).returning();

    await db.insert(auditLogs).values({
      actor: 'Admin SOC',
      action: 'CREATE_THREAT_PATTERN',
      entityType: 'threat_database',
      entityId: String(inserted[0].id),
      details: `Added new pattern '${pattern}' of type '${patternType}'`,
    });

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to add threat pattern' });
  }
});

app.delete('/api/admin/threat-patterns/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(threatDatabase).where(eq(threatDatabase.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete pattern' });
  }
});

// ---------------------------------------------------------------------------
// 6. AWARENESS ARTICLES & EMERGENCY HELP
// ---------------------------------------------------------------------------
app.get('/api/awareness', async (_req, res) => {
  try {
    const articles = await db.select().from(awarenessArticles).orderBy(desc(awarenessArticles.createdAt));
    res.json(articles);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve awareness articles' });
  }
});

app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userNotifications = await db.select().from(notifications)
      .where(eq(notifications.userId, req.user!.uid))
      .orderBy(desc(notifications.createdAt))
      .limit(30);
    res.json(userNotifications);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.patch('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, req.user!.uid)));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Official Help & Emergency Contacts Config
app.get('/api/config/official-help', (_req, res) => {
  res.json({
    nationalHelplines: [
      {
        country: 'India',
        helpline: '1930',
        name: 'National Cyber Crime Reporting Helpline',
        portalUrl: 'https://cybercrime.gov.in',
        description: 'Immediate financial cyber fraud freeze helpline operated by Citizen Financial Cyber Fraud Reporting and Management System.',
      },
      {
        country: 'International / USA',
        helpline: '1-800-CALL-FBI',
        name: 'IC3 - Internet Crime Complaint Center',
        portalUrl: 'https://www.ic3.gov',
        description: 'Federal Bureau of Investigation central hub for reporting internet-facilitated cybercrimes.',
      },
      {
        country: 'United Kingdom',
        helpline: '0300 123 2040',
        name: 'Action Fraud National Reporting Centre',
        portalUrl: 'https://www.actionfraud.police.uk',
        description: 'National reporting centre for fraud and cyber crime in the UK.',
      },
    ],
    immediateSafetyChecklist: [
      'Immediately call your bank or card provider to block affected debit/credit cards and freeze internet banking access.',
      'Report financial fraud within the "Golden Hour" (first 2 hours) on helpline 1930 to maximize chance of freezing funds in transit.',
      'Change passwords for critical accounts (email, online banking, social media) from a clean, secure device.',
      'Take screenshots of fraudulent transaction references, suspect phone numbers, and chat logs before attackers delete them.',
      'Never install remote screen-sharing software (AnyDesk, TeamViewer) at the request of an unverified caller.',
    ],
  });
});

// ---------------------------------------------------------------------------
// VITE INTEGRATION & SERVER START
// ---------------------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`[CyberShield] Server listening on port ${PORT} (${isProd ? 'Production' : 'Development'})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup failure:', err);
});
