/**
 * Example Repository: Switching from Firestore Document Queries to Native PostgreSQL
 */

import { query, transaction } from './pg-client.ts';

export interface ComplaintRecord {
  id?: number;
  complaintNumber: string;
  userId?: string;
  category: string;
  incidentDate: string;
  description: string;
  amountLost?: string | null;
  status: string;
  priority: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone: string;
}

export const ComplaintsRepository = {
  /**
   * BEFORE (Firestore):
   *   await firestore.collection('complaints').doc(complaintNumber).set(data);
   * 
   * AFTER (PostgreSQL with 'pg'):
   */
  async create(complaint: ComplaintRecord) {
    const text = `
      INSERT INTO complaints (
        complaint_number, user_id, category, incident_date, description,
        amount_lost, status, priority, reporter_name, reporter_email, reporter_phone
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      complaint.complaintNumber,
      complaint.userId || 'public',
      complaint.category,
      complaint.incidentDate,
      complaint.description,
      complaint.amountLost || null,
      complaint.status || 'Submitted',
      complaint.priority || 'Medium',
      complaint.reporterName,
      complaint.reporterEmail,
      complaint.reporterPhone,
    ];

    const result = await query(text, values);
    return result.rows[0];
  },

  /**
   * BEFORE (Firestore):
   *   const snap = await firestore.collection('complaints').where('complaintNumber', '==', id).get();
   * 
   * AFTER (PostgreSQL with 'pg'):
   */
  async findByComplaintNumber(complaintNumber: string) {
    const text = `SELECT * FROM complaints WHERE complaint_number = $1 LIMIT 1;`;
    const result = await query(text, [complaintNumber.toUpperCase()]);
    return result.rows[0] || null;
  },

  /**
   * Transaction Example: Update Status and Log Timeline Atomically
   */
  async updateStatusWithTimeline(
    complaintNumber: string,
    newStatus: string,
    updateMessage: string,
    officer: string
  ) {
    return await transaction(async (client) => {
      // 1. Update the complaint record
      const updateQuery = `
        UPDATE complaints
        SET status = $1, assigned_officer = $2, updated_at = NOW()
        WHERE complaint_number = $3
        RETURNING *;
      `;
      const updateRes = await client.query(updateQuery, [newStatus, officer, complaintNumber]);

      if (updateRes.rows.length === 0) {
        throw new Error(`Complaint ${complaintNumber} not found.`);
      }

      // 2. Insert into complaint_updates timeline table
      const timelineQuery = `
        INSERT INTO complaint_updates (complaint_number, status, message, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      await client.query(timelineQuery, [complaintNumber, newStatus, updateMessage, officer]);

      return updateRes.rows[0];
    });
  },
};
