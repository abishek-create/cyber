/**
 * CyberShield Firestore-to-PostgreSQL Data Synchronization Utility
 * 
 * This script demonstrates how to read documents from an existing Google Cloud Firestore
 * database and replicate / migrate them into this Cloud SQL PostgreSQL instance using Drizzle ORM.
 * 
 * Usage:
 *   npx tsx scripts/sync-firestore-to-postgres.ts
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { db } from '../src/db/index.ts';
import { complaints, users, threatChecks } from '../src/db/schema.ts';
import firebaseConfig from '../firebase-applet-config.json';
import dotenv from 'dotenv';

dotenv.config();

// 1. Initialize Firebase Admin SDK for Firestore
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

const firestore = getFirestore();

export async function syncComplaints() {
  console.log('[Sync] Reading complaints collection from Firestore...');
  try {
    const snapshot = await firestore.collection('complaints').get();
    console.log(`[Sync] Found ${snapshot.size} documents in Firestore 'complaints'.`);

    let syncedCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const complaintNumber = data.complaintNumber || doc.id;

      // Upsert into Cloud SQL PostgreSQL
      await db.insert(complaints).values({
        complaintNumber,
        userId: data.userId || 'migrated-user',
        category: data.category || 'Other',
        incidentDate: data.incidentDate || new Date().toISOString().split('T')[0],
        incidentTime: data.incidentTime || '',
        description: data.description || 'Migrated incident report',
        amountLost: data.amountLost ? String(data.amountLost) : null,
        currency: data.currency || 'INR',
        platformUsed: data.platformUsed || '',
        suspectUrl: data.suspectUrl || '',
        suspectPhone: data.suspectPhone || '',
        suspectEmail: data.suspectEmail || '',
        transactionId: data.transactionId || '',
        reporterName: data.reporterName || 'Anonymous Citizen',
        reporterEmail: data.reporterEmail || 'unknown@domain.com',
        reporterPhone: data.reporterPhone || '',
        preferredContact: data.preferredContact || 'Email',
        status: data.status || 'Submitted',
        priority: data.priority || 'Medium',
        assignedOfficer: data.assignedOfficer || null,
        internalNotes: data.internalNotes || null,
      }).onConflictDoUpdate({
        target: complaints.complaintNumber,
        set: {
          status: data.status || 'Submitted',
          assignedOfficer: data.assignedOfficer || null,
          internalNotes: data.internalNotes || null,
          updatedAt: new Date(),
        },
      });

      syncedCount++;
    }

    console.log(`[Sync] Successfully synchronized ${syncedCount} complaints to PostgreSQL.`);
  } catch (err) {
    console.error('[Sync] Error synchronizing complaints:', err);
  }
}

export async function syncUsers() {
  console.log('[Sync] Reading users collection from Firestore...');
  try {
    const snapshot = await firestore.collection('users').get();
    console.log(`[Sync] Found ${snapshot.size} documents in Firestore 'users'.`);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const uid = doc.id || data.uid;

      if (!uid || !data.email) continue;

      await db.insert(users).values({
        uid,
        email: data.email,
        fullName: data.fullName || data.displayName || data.email.split('@')[0],
        phone: data.phone || data.phoneNumber || '',
        role: data.role || 'user',
      }).onConflictDoUpdate({
        target: users.uid,
        set: {
          email: data.email,
          fullName: data.fullName || data.displayName || undefined,
        },
      });
    }
    console.log('[Sync] Users synchronized to PostgreSQL successfully.');
  } catch (err) {
    console.error('[Sync] Error synchronizing users:', err);
  }
}

async function run() {
  console.log('--- Starting Firestore to Cloud SQL PostgreSQL Sync ---');
  await syncUsers();
  await syncComplaints();
  console.log('--- Synchronization Complete ---');
  process.exit(0);
}

if (process.argv[1] && process.argv[1].endsWith('sync-firestore-to-postgres.ts')) {
  run();
}
