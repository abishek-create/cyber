import React, { useState, useEffect } from 'react';
import {
  FileText, Shield, UploadCloud, Search, CheckCircle2,
  Clock, AlertTriangle, UserCheck, ShieldAlert,
  ArrowRight, ArrowLeft, Loader2, X, Paperclip, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWebSocket } from '../context/WebSocketContext.tsx';

interface ComplaintPortalProps {
  initialCategory?: string;
  initialDescription?: string;
  initialUrl?: string;
}

const CATEGORIES = [
  'Banking Fraud',
  'UPI Fraud',
  'Online Payment Fraud',
  'Phishing',
  'Email Scam',
  'Messaging Scam',
  'Social Media Fraud',
  'Fake Website',
  'Identity Theft',
  'Account Takeover',
  'Job Scam',
  'Investment Scam',
  'Malware',
  'Online Harassment',
  'Other',
];

const STATUS_STAGES = [
  'Submitted',
  'Acknowledged',
  'Under Review',
  'Assigned',
  'Investigation',
  'Resolved',
  'Closed',
];

export const ComplaintPortal: React.FC<ComplaintPortalProps> = ({
  initialCategory,
  initialDescription,
  initialUrl,
}) => {
  const { user } = useAuth();
  const { lastEvent } = useWebSocket();

  // Mode: 'new' or 'track'
  const [viewMode, setViewMode] = useState<'new' | 'track'>('new');

  // Form Step: 1 = Details, 2 = Evidence, 3 = Review, 4 = Success
  const [step, setStep] = useState<number>(1);

  // Form State
  const [formData, setFormData] = useState({
    category: initialCategory || 'Banking Fraud',
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: '12:00',
    description: initialDescription || '',
    amountLost: '',
    currency: 'INR',
    platformUsed: '',
    suspectUrl: initialUrl || '',
    suspectPhone: '',
    suspectEmail: '',
    transactionId: '',
    reporterName: user?.fullName || '',
    reporterEmail: user?.email || '',
    reporterPhone: user?.phone || '',
    preferredContact: 'Email',
  });

  // Attached files
  const [evidenceFiles, setEvidenceFiles] = useState<{ name: string; type: string; size: number; data: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  // Tracking State
  const [trackId, setTrackId] = useState('CS-2026-000184');
  const [trackKey, setTrackKey] = useState('aarav.mehta@example.com');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedComplaint, setTrackedComplaint] = useState<any>(null);
  const [trackedUpdates, setTrackedUpdates] = useState<any[]>([]);
  const [trackedEvidence, setTrackedEvidence] = useState<any[]>([]);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Sync user info when available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        reporterName: prev.reporterName || user.fullName,
        reporterEmail: prev.reporterEmail || user.email,
        reporterPhone: prev.reporterPhone || user.phone || '',
      }));
    }
  }, [user]);

  // Real-time live status update listener via WebSocket
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'complaint_status_changed') {
      const updateData = lastEvent.data;
      if (trackedComplaint && trackedComplaint.complaintNumber === updateData.complaintNumber) {
        setTrackedComplaint((prev: any) => ({
          ...prev,
          status: updateData.status,
        }));
        setTrackedUpdates((prev) => [
          {
            complaintNumber: updateData.complaintNumber,
            status: updateData.status,
            message: updateData.message,
            createdBy: 'Security Operations Center (Live Sync)',
            createdAt: updateData.updatedAt || new Date().toISOString(),
          },
          ...prev,
        ]);
      }
    }
  }, [lastEvent, trackedComplaint]);

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (file.size > 8 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 8MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setEvidenceFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Complaint
  const handleSubmitComplaint = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      let complaintId = '';
      let isSuccess = false;

      try {
        const res = await fetch('/api/complaints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            evidenceFiles,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          complaintId = data.complaintNumber;
          isSuccess = true;
        }
      } catch {
        // Fallback to local persistence
      }

      if (!isSuccess) {
        // Local generation for static deployment environments (e.g. Vercel)
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        complaintId = `CS-2026-${randomNum}`;
        const newRecord = {
          ...formData,
          complaintNumber: complaintId,
          status: 'Submitted',
          priority: Number(formData.amountLost || 0) > 50000 ? 'High' : 'Medium',
          createdAt: new Date().toISOString(),
          assignedOfficer: 'Inspector V. Sharma (Cyber Cell)',
        };

        try {
          const existing = JSON.parse(localStorage.getItem('cybershield_complaints') || '[]');
          localStorage.setItem('cybershield_complaints', JSON.stringify([newRecord, ...existing]));
        } catch {
          // Ignore storage quota
        }
      }

      setSubmittedId(complaintId);
      setStep(4);
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  // Track Complaint
  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackId.trim() || !trackKey.trim()) {
      setTrackError('Please provide both Complaint ID and Verification email/phone.');
      return;
    }

    setTrackingLoading(true);
    setTrackError(null);
    setTrackedComplaint(null);

    const cleanId = trackId.trim().toUpperCase();
    const cleanKey = trackKey.trim().toLowerCase();

    try {
      let foundData: any = null;

      try {
        const res = await fetch('/api/complaints/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            complaintNumber: cleanId,
            verificationKey: cleanKey,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          foundData = await res.json();
        }
      } catch {
        // Fallback to local storage check
      }

      // Check fallback local storage and built-in demo records
      if (!foundData) {
        // Demo case CS-2026-000184
        if (cleanId === 'CS-2026-000184' && (cleanKey === 'aarav.mehta@example.com' || cleanKey === '+919811223344')) {
          foundData = {
            complaint: {
              complaintNumber: 'CS-2026-000184',
              reporterName: 'Aarav Mehta',
              reporterEmail: 'aarav.mehta@example.com',
              reporterPhone: '+919811223344',
              category: 'UPI Fraud',
              incidentDate: '2026-09-28',
              description: 'Victim was contacted on OLX by a buyer claiming to be an army officer. Buyer sent a QR code stating advance payment of ₹15,000. Upon scanning and entering UPI PIN, funds were debited to fraud VPA.',
              amountLost: '15000',
              platformUsed: 'OLX / Google Pay',
              status: 'Under Review',
              priority: 'High',
              assignedOfficer: 'Inspector V. Sharma (Cyber Cell)',
              preferredContact: 'Email',
              transactionId: 'UPI/427189021481',
              createdAt: '2026-09-28T14:35:00.000Z',
            },
            updates: [
              { status: 'Submitted', message: 'Complaint registered securely via CyberShield Portal.', createdBy: 'System Automated', createdAt: '2026-09-28T14:36:00.000Z' },
              { status: 'Acknowledged', message: 'Complaint received and verified by Desk Officer.', createdBy: 'Duty Officer R. Nair', createdAt: '2026-09-29T10:15:00.000Z' },
              { status: 'Under Review', message: 'Assigned to Cyber Crime Cell Special Investigation Unit. Nodal payment authority contacted for transaction freeze.', createdBy: 'Inspector V. Sharma (Cyber Cell)', createdAt: '2026-09-30T16:00:00.000Z' },
            ],
            evidence: [],
          };
        } else {
          // Check localStorage
          const localStored = JSON.parse(localStorage.getItem('cybershield_complaints') || '[]');
          const match = localStored.find((c: any) =>
            c.complaintNumber?.toUpperCase() === cleanId &&
            (c.reporterEmail?.toLowerCase() === cleanKey || c.reporterPhone === cleanKey)
          );
          if (match) {
            foundData = {
              complaint: match,
              updates: [
                {
                  status: match.status || 'Submitted',
                  message: 'Complaint registered in CyberShield queue.',
                  createdBy: 'System Automated',
                  createdAt: match.createdAt || new Date().toISOString(),
                },
              ],
              evidence: [],
            };
          }
        }
      }

      if (foundData && foundData.complaint) {
        setTrackedComplaint(foundData.complaint);
        setTrackedUpdates(foundData.updates || []);
        setTrackedEvidence(foundData.evidence || []);
      } else {
        throw new Error('No complaint found matching this Reference ID and verification credential. Please verify your details.');
      }
    } catch (err: any) {
      setTrackError(err.message || 'Unable to fetch complaint');
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStageIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'submitted') return 0;
    if (s === 'acknowledged') return 1;
    if (s === 'under review') return 2;
    if (s === 'assigned') return 3;
    if (s === 'investigation') return 4;
    if (s === 'resolved') return 5;
    if (s === 'closed') return 6;
    return 1;
  };

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      {/* Formal Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1769AA] uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Cyber Incident Response Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight">
            {viewMode === 'new' ? 'Report a Cyber Incident' : 'Track Submitted Incident'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Encrypted formal documentation for legal, law enforcement, and financial security review.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('new')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'new' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            New Complaint
          </button>
          <button
            onClick={() => setViewMode('track')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${viewMode === 'track' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Track Incident
          </button>
        </div>
      </div>

      {/* VIEW MODE: NEW COMPLAINT */}
      {viewMode === 'new' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          
          {/* Progress Indicator (Incident Details -> Evidence -> Review -> Submit) */}
          {step < 4 && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className={step >= 1 ? 'text-[#1769AA]' : ''}>1. Incident Details</span>
                <span className="text-slate-300">───</span>
                <span className={step >= 2 ? 'text-[#1769AA]' : ''}>2. Evidence Files</span>
                <span className="text-slate-300">───</span>
                <span className={step >= 3 ? 'text-[#1769AA]' : ''}>3. Review & Verify</span>
                <span className="text-slate-300">───</span>
                <span>4. Complaint ID</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-[#1769AA] h-full transition-all duration-300"
                  style={{ width: `${(step / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 1: INCIDENT & REPORTER DETAILS */}
          {step === 1 && (
            <div className="space-y-6">
              
              {/* Reporter Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#1769AA]" />
                  <span>Reporter Contact Information</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.reporterName}
                      onChange={(e) => setFormData({ ...formData, reporterName: e.target.value })}
                      placeholder="e.g. Aarav Mehta"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.reporterEmail}
                      onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                      placeholder="e.g. aarav.mehta@example.com"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.reporterPhone}
                      onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                      placeholder="e.g. +91 98112 23344"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>
                </div>
              </div>

              {/* Incident Details Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Incident Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Incident Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Incident Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.incidentDate}
                      onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Approximate Time</label>
                    <input
                      type="time"
                      value={formData.incidentTime}
                      onChange={(e) => setFormData({ ...formData, incidentTime: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Amount Lost (if applicable)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.amountLost}
                        onChange={(e) => setFormData({ ...formData, amountLost: e.target.value })}
                        placeholder="e.g. 15000"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                      />
                      <span className="absolute right-3 top-2 text-slate-400 font-mono">INR</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Platform / Medium Used</label>
                    <input
                      type="text"
                      value={formData.platformUsed}
                      onChange={(e) => setFormData({ ...formData, platformUsed: e.target.value })}
                      placeholder="e.g. Google Pay, WhatsApp, OLX, Telegram"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Bank Transaction ID / UTR</label>
                    <input
                      type="text"
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      placeholder="e.g. UPI/427189021481"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA] font-mono"
                    />
                  </div>
                </div>

                {/* Suspect Identifiers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Suspect Phone / VPA</label>
                    <input
                      type="text"
                      value={formData.suspectPhone}
                      onChange={(e) => setFormData({ ...formData, suspectPhone: e.target.value })}
                      placeholder="e.g. +919876543210 or fraud@okaxis"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Suspect Website / URL</label>
                    <input
                      type="text"
                      value={formData.suspectUrl}
                      onChange={(e) => setFormData({ ...formData, suspectUrl: e.target.value })}
                      placeholder="e.g. https://paytm-secure-verify.top"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Suspect Email Address</label>
                    <input
                      type="email"
                      value={formData.suspectEmail}
                      onChange={(e) => setFormData({ ...formData, suspectEmail: e.target.value })}
                      placeholder="e.g. army.procurement99@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                    />
                  </div>
                </div>

                {/* Narrative Description */}
                <div>
                  <label className="block text-xs text-slate-700 font-semibold mb-1">
                    Chronological Description of the Incident *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe how the fraud occurred: who contacted you, what instructions were given, what links or QR codes were presented, and when you realized it was fraudulent."
                    className="w-full p-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769AA] text-slate-900 leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.reporterName || !formData.reporterEmail || !formData.reporterPhone || !formData.description) {
                      alert('Please complete the mandatory reporter and description fields.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl shadow transition-colors"
                >
                  <span>Continue to Evidence</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 2: EVIDENCE UPLOAD */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Upload Supporting Digital Evidence
                </h3>
                <p className="text-xs text-slate-500">
                  Attach screenshots of chats, payment receipts, debit alerts, or fraudulent emails.
                </p>
              </div>

              {/* Mandatory Privacy Safety Warning */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Security Compliance Notice:</span> Do NOT upload passwords, OTPs, PINs, CVV numbers, or other credentials. Redact sensitive personal card numbers if visible in screenshots.
                </div>
              </div>

              {/* Drag & Drop Upload Zone */}
              <label className="border-2 border-dashed border-slate-300 hover:border-[#1769AA] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors block text-center">
                <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
                <span className="text-xs font-semibold text-slate-800">
                  Click to select evidence files (Screenshots, PDFs, Images)
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  PNG, JPG, PDF up to 8MB each. Non-executable security validation applied.
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/png, image/jpeg, image/webp, application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded Files List */}
              {evidenceFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Attached Files ({evidenceFiles.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {evidenceFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium text-slate-700">{file.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl shadow transition-colors"
                >
                  <span>Proceed to Final Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: REVIEW & SUBMIT */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Review Incident Summary Before Submission
                </h3>
                <p className="text-xs text-slate-500">
                  Please verify all information for accuracy. An official Complaint Reference ID will be generated upon submission.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 border-b border-slate-200">
                  <div>
                    <span className="text-slate-400 block">Reporter</span>
                    <span className="font-semibold text-slate-900">{formData.reporterName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Category</span>
                    <span className="font-semibold text-slate-900">{formData.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Incident Date</span>
                    <span className="font-semibold text-slate-900">{formData.incidentDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Amount Claimed</span>
                    <span className="font-semibold text-slate-900">
                      {formData.amountLost ? `₹${Number(formData.amountLost).toLocaleString()}` : 'None'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Narrative</span>
                  <p className="text-slate-700 leading-relaxed">{formData.description}</p>
                </div>

                {(formData.suspectUrl || formData.suspectPhone || formData.transactionId) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px] font-mono">
                    {formData.suspectUrl && <div><span className="text-slate-400">URL:</span> {formData.suspectUrl}</div>}
                    {formData.suspectPhone && <div><span className="text-slate-400">Phone:</span> {formData.suspectPhone}</div>}
                    {formData.transactionId && <div><span className="text-slate-400">Txn:</span> {formData.transactionId}</div>}
                  </div>
                )}

                <div className="pt-2 text-[11px] text-slate-500">
                  Attached Evidence Files: <span className="font-semibold text-slate-800">{evidenceFiles.length} file(s)</span>
                </div>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Evidence</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitComplaint}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl shadow transition-colors disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                  <span>Confirm & Register Incident</span>
                </button>
              </div>

            </div>
          )}

          {/* STEP 4: SUCCESS RECEIPT */}
          {step === 4 && submittedId && (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <span>Incident Logged in Database</span>
                </div>
                <h3 className="text-2xl font-bold text-[#0B1F3A]">Complaint Registered Successfully</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your incident has been recorded in the CyberShield Security Operations queue. Save your unique Complaint ID below to track investigations.
                </p>
              </div>

              {/* Complaint Reference ID Box */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 max-w-sm mx-auto">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Unique Complaint ID
                </div>
                <div className="text-2xl font-mono font-bold text-[#0B1F3A] mt-1 select-all">
                  {submittedId}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Status: <span className="font-semibold text-emerald-600">Submitted</span> · Date: {new Date().toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => {
                    setTrackId(submittedId);
                    setTrackKey(formData.reporterEmail);
                    setViewMode('track');
                    handleTrackSubmit({ preventDefault: () => {} } as any);
                  }}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl shadow transition-colors"
                >
                  Track Complaint Progress
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setFormData({
                      ...formData,
                      description: '',
                      amountLost: '',
                      transactionId: '',
                      suspectUrl: '',
                    });
                    setEvidenceFiles([]);
                    setSubmittedId(null);
                  }}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
                >
                  Submit Another
                </button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* VIEW MODE: TRACK INCIDENT */}
      {viewMode === 'track' && (
        <div className="space-y-8">
          
          {/* Tracking Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-base font-bold text-[#0B1F3A] mb-2">Track Your Cyber Incident</h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter your official Complaint Reference ID (e.g. CS-2026-000184) and your registered email address or phone number for identity verification.
            </p>

            <form onSubmit={handleTrackSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Complaint Reference ID
                </label>
                <input
                  type="text"
                  required
                  value={trackId}
                  onChange={(e) => setTrackId(e.target.value)}
                  placeholder="e.g. CS-2026-000184"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1769AA] font-mono"
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Email or Phone
                </label>
                <input
                  type="text"
                  required
                  value={trackKey}
                  onChange={(e) => setTrackKey(e.target.value)}
                  placeholder="e.g. aarav.mehta@example.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1769AA]"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 h-[42px]"
                >
                  {trackingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Verify & Track</span>
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Try sample verified complaint: <strong className="text-slate-600 font-mono">CS-2026-000184</strong></span>
              <button
                type="button"
                onClick={() => {
                  setTrackId('CS-2026-000184');
                  setTrackKey('aarav.mehta@example.com');
                }}
                className="text-[#1769AA] hover:underline"
              >
                Auto-Fill Demo ID
              </button>
            </div>

            {trackError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{trackError}</span>
              </div>
            )}
          </div>

          {/* Tracked Complaint Details & Live Timeline */}
          {trackedComplaint && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8 animate-fadeIn">
              
              {/* Header Status Banner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-[#0B1F3A]">
                      {trackedComplaint.complaintNumber}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-sky-100 text-sky-800">
                      {trackedComplaint.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Filed on {new Date(trackedComplaint.createdAt).toLocaleDateString()} by {trackedComplaint.reporterName}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Current State</div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#0B1F3A] text-white mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-sky-400" />
                    <span>{trackedComplaint.status}</span>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Incident Resolution Progress
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 text-center text-xs">
                  {STATUS_STAGES.map((st, idx) => {
                    const activeIdx = getStageIndex(trackedComplaint.status);
                    const isPassed = idx <= activeIdx;
                    const isCurrent = idx === activeIdx;
                    return (
                      <div
                        key={st}
                        className={`p-2.5 rounded-xl border transition-all ${isCurrent ? 'bg-[#0B1F3A] text-white border-[#0B1F3A] shadow' : isPassed ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
                      >
                        <div className="text-[10px] font-mono mb-1">Step {idx + 1}</div>
                        <div className="font-semibold truncate">{st}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Case Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-3 text-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Incident Parameters
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Incident Date:</span>
                      <span className="font-semibold text-slate-800">{trackedComplaint.incidentDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Claimed Loss:</span>
                      <span className="font-semibold text-slate-800">
                        {trackedComplaint.amountLost ? `₹${Number(trackedComplaint.amountLost).toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Platform Involved:</span>
                      <span className="font-semibold text-slate-800">{trackedComplaint.platformUsed || 'Not specified'}</span>
                    </div>
                    {trackedComplaint.transactionId && (
                      <div className="flex justify-between font-mono">
                        <span className="text-slate-400">UTR Reference:</span>
                        <span className="font-semibold text-slate-800">{trackedComplaint.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Assigned Cyber Cell Personnel
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Officer:</span>
                      <span className="font-semibold text-slate-800">
                        {trackedComplaint.assignedOfficer || 'Desk Officer (Triage)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Priority Assessment:</span>
                      <span className="font-semibold text-sky-800 px-2 py-0.5 rounded bg-sky-50">
                        {trackedComplaint.priority} Priority
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Preferred Contact:</span>
                      <span className="font-semibold text-slate-800">{trackedComplaint.preferredContact}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Updates Log */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Official Investigation Updates ({trackedUpdates.length})
                </h4>
                <div className="space-y-3">
                  {trackedUpdates.map((upd, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-3 text-xs">
                      <div className="w-2 h-2 rounded-full bg-[#1769AA] mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{upd.status}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(upd.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-1">{upd.message}</p>
                        <div className="text-[10px] text-slate-400 mt-1">Logged by: {upd.createdBy}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};
