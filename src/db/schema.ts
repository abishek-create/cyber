import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  fullName: text('full_name'),
  email: text('email').notNull(),
  phone: text('phone'),
  role: text('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  complaintNumber: text('complaint_number').notNull().unique(),
  userId: text('user_id'),
  category: text('category').notNull(),
  incidentDate: text('incident_date').notNull(),
  incidentTime: text('incident_time'),
  description: text('description').notNull(),
  amountLost: text('amount_lost'),
  currency: text('currency').default('INR'),
  platformUsed: text('platform_used'),
  suspectUrl: text('suspect_url'),
  suspectPhone: text('suspect_phone'),
  suspectEmail: text('suspect_email'),
  transactionId: text('transaction_id'),
  reporterName: text('reporter_name').notNull(),
  reporterEmail: text('reporter_email').notNull(),
  reporterPhone: text('reporter_phone').notNull(),
  preferredContact: text('preferred_contact').default('Email'),
  status: text('status').default('Submitted').notNull(),
  priority: text('priority').default('Medium').notNull(),
  assignedOfficer: text('assigned_officer'),
  internalNotes: text('internal_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const complaintEvidence = pgTable('complaint_evidence', {
  id: serial('id').primaryKey(),
  complaintNumber: text('complaint_number').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  fileSize: integer('file_size').notNull(),
  fileData: text('file_data').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

export const complaintUpdates = pgTable('complaint_updates', {
  id: serial('id').primaryKey(),
  complaintNumber: text('complaint_number').notNull(),
  status: text('status').notNull(),
  message: text('message').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const threatChecks = pgTable('threat_checks', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  checkType: text('check_type').notNull(),
  inputPreview: text('input_preview').notNull(),
  riskLevel: text('risk_level').notNull(),
  riskScore: integer('risk_score').notNull(),
  indicators: text('indicators').notNull(),
  reasons: text('reasons').notNull(),
  recommendation: text('recommendation').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const threatDatabase = pgTable('threat_database', {
  id: serial('id').primaryKey(),
  patternType: text('pattern_type').notNull(),
  pattern: text('pattern').notNull(),
  severity: text('severity').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const awarenessArticles = pgTable('awareness_articles', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  readTime: text('read_time').notNull(),
  summary: text('summary').notNull(),
  content: text('content').notNull(),
  warningSigns: text('warning_signs').notNull(),
  whatToDo: text('what_to_do').notNull(),
  whatNotToDo: text('what_not_to_do').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('system').notNull(),
  complaintNumber: text('complaint_number'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});
