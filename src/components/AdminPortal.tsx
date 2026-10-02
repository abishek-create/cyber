import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Users, FileText, CheckCircle2, AlertTriangle,
  Search, Filter, Plus, Trash2, ArrowRight, Eye, RefreshCw,
  Check, Lock, Activity, BarChart3, Database, Shield, X, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWebSocket } from '../context/WebSocketContext.tsx';

const STATUS_OPTIONS = [
  'Submitted',
  'Acknowledged',
  'Under Review',
  'Assigned',
  'Investigation',
  'Additional Information Required',
  'Resolved',
  'Closed',
];

export const AdminPortal: React.FC = () => {
  const { user, signInAsDemo } = useAuth();
  const { isConnected, lastEvent } = useWebSocket();

  const [activeTab, setActiveTab] = useState<'queue' | 'analytics' | 'threat-db' | 'audit'>('queue');
  
  // Data States
  const [complaintsList, setComplaintsList] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [threatPatterns, setThreatPatterns] = useState<any[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected complaint for review/status change
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [statusInput, setStatusInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [assignedOfficerInput, setAssignedOfficerInput] = useState('');
  const [internalNotesInput, setInternalNotesInput] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New Threat Pattern Form
  const [newPatternType, setNewPatternType] = useState<'keyword' | 'domain' | 'phone'>('keyword');
  const [newPattern, setNewPattern] = useState('');
  const [newSeverity, setNewSeverity] = useState<'high' | 'critical'>('high');
  const [newDesc, setNewDesc] = useState('');

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      // Complaints
      try {
        const compRes = await fetch(`/api/admin/complaints?status=${statusFilter}&category=${categoryFilter}&search=${encodeURIComponent(searchQuery)}`);
        const compType = compRes.headers.get('content-type') || '';
        if (compRes.ok && compType.includes('application/json')) {
          const comps = await compRes.json();
          setComplaintsList(comps);
        } else {
          // Local fallback
          const localComps = JSON.parse(localStorage.getItem('cybershield_complaints') || '[]');
          const defaultDemo = [
            {
              id: 1,
              complaintNumber: 'CS-2026-000184',
              reporterName: 'Aarav Mehta',
              reporterEmail: 'aarav.mehta@example.com',
              reporterPhone: '+919811223344',
              category: 'UPI Fraud',
              incidentDate: '2026-09-28',
              description: 'Victim contacted on OLX. Buyer sent QR code claiming advance payment. ₹15,000 debited immediately.',
              amountLost: '15000',
              status: 'Under Review',
              priority: 'High',
              assignedOfficer: 'Inspector V. Sharma (Cyber Cell)',
              createdAt: '2026-09-28T14:35:00.000Z',
            },
          ];
          setComplaintsList([...localComps, ...defaultDemo]);
        }
      } catch {
        const localComps = JSON.parse(localStorage.getItem('cybershield_complaints') || '[]');
        setComplaintsList(localComps);
      }

      // Analytics
      try {
        const anaRes = await fetch('/api/admin/analytics');
        const anaType = anaRes.headers.get('content-type') || '';
        if (anaRes.ok && anaType.includes('application/json')) {
          const anaData = await anaRes.json();
          setAnalytics(anaData);
        } else {
          setAnalytics({
            totalComplaints: 1,
            newComplaints: 0,
            underReview: 1,
            resolved: 0,
            resolutionRate: 0,
            totalThreatChecks: 12,
            highRiskChecks: 4,
          });
        }
      } catch {
        setAnalytics({
          totalComplaints: 1,
          newComplaints: 0,
          underReview: 1,
          resolved: 0,
          resolutionRate: 0,
          totalThreatChecks: 12,
          highRiskChecks: 4,
        });
      }

      // Threat Database
      try {
        const thRes = await fetch('/api/admin/threat-patterns');
        const thType = thRes.headers.get('content-type') || '';
        if (thRes.ok && thType.includes('application/json')) {
          const patterns = await thRes.json();
          setThreatPatterns(patterns);
        } else {
          setThreatPatterns([
            { id: 1, patternType: 'domain', pattern: 'paytm-secure-verify.top', severity: 'critical', description: 'Known phishing domain' },
            { id: 2, patternType: 'keyword', pattern: 'urgent account suspension', severity: 'critical', description: 'Panic lure phrase' },
            { id: 3, patternType: 'keyword', pattern: 'send otp to claim', severity: 'critical', description: 'Credential harvesting pattern' },
          ]);
        }
      } catch {
        setThreatPatterns([
          { id: 1, patternType: 'domain', pattern: 'paytm-secure-verify.top', severity: 'critical', description: 'Known phishing domain' },
          { id: 2, patternType: 'keyword', pattern: 'urgent account suspension', severity: 'critical', description: 'Panic lure phrase' },
        ]);
      }

      // Audit logs
      try {
        const logRes = await fetch('/api/admin/audit-logs');
        const logType = logRes.headers.get('content-type') || '';
        if (logRes.ok && logType.includes('application/json')) {
          const logs = await logRes.json();
          setAuditLogsList(logs);
        } else {
          setAuditLogsList([
            { id: 1, actor: 'System Automated', action: 'SOC_INITIALIZE', entityType: 'system', entityId: 'SOC-01', details: 'CyberShield Security Operations Console active', createdAt: new Date().toISOString() },
          ]);
        }
      } catch {
        setAuditLogsList([]);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Live WebSocket update reflection
  useEffect(() => {
    if (lastEvent && (lastEvent.type === 'new_complaint' || lastEvent.type === 'complaint_status_changed')) {
      fetchAdminData();
    }
  }, [lastEvent, fetchAdminData]);

  // Handle status update
  const handleUpdateComplaintStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/complaints/${selectedComplaint.complaintNumber}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusInput,
          message: statusMessage || `Status changed to ${statusInput}`,
          assignedOfficer: assignedOfficerInput || selectedComplaint.assignedOfficer,
          internalNotes: internalNotesInput || selectedComplaint.internalNotes,
          updatedBy: user?.fullName || 'Duty Inspector',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedComplaint(data.complaint);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Add threat pattern
  const handleAddThreatPattern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim()) return;

    try {
      const res = await fetch('/api/admin/threat-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternType: newPatternType,
          pattern: newPattern.trim(),
          severity: newSeverity,
          description: newDesc.trim() || 'Admin-defined heuristic pattern',
        }),
      });

      if (res.ok) {
        setNewPattern('');
        setNewDesc('');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to add pattern:', err);
    }
  };

  const handleDeletePattern = async (id: number) => {
    try {
      await fetch(`/api/admin/threat-patterns/${id}`, { method: 'DELETE' });
      fetchAdminData();
    } catch (err) {
      console.error('Delete pattern failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      
      {/* Sub-header SOC Bar */}
      <div className="bg-[#0B1F3A] text-white border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight">Security Operations Center (SOC) Console</div>
              <div className="text-[11px] text-slate-400 font-mono">
                PostgreSQL Storage · Role-Based Access · Live WebSocket Sync
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.role !== 'admin' && (
              <button
                onClick={() => signInAsDemo('admin')}
                className="px-3 py-1.5 text-xs font-semibold text-[#0B1F3A] bg-sky-300 hover:bg-sky-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Switch to SOC Officer Role
              </button>
            )}

            <button
              onClick={() => fetchAdminData()}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Refresh console"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Analytics High-Density Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Total Cases</div>
            <div className="text-2xl font-bold font-mono text-[#0B1F3A] mt-1">
              {analytics?.totalComplaints || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">New Pending</div>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
              {analytics?.newComplaints || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">In Investigation</div>
            <div className="text-2xl font-bold font-mono text-[#1769AA] mt-1">
              {analytics?.underReview || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Resolved Cases</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              {analytics?.resolved || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Scans Run</div>
            <div className="text-2xl font-bold font-mono text-[#0B1F3A] mt-1">
              {analytics?.totalThreatChecks || 0}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="text-[11px] text-slate-500 uppercase font-semibold">Resolution Rate</div>
            <div className="text-2xl font-bold font-mono text-sky-700 mt-1">
              {analytics?.resolutionRate || 0}%
            </div>
          </div>
        </div>

        {/* Tab Navigation: Interactive Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'queue' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Incident Queue ({complaintsList.length})
          </button>
          <button
            onClick={() => setActiveTab('threat-db')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'threat-db' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Threat Rules DB ({threatPatterns.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'audit' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            SOC Audit Logs
          </button>
        </div>

        {/* TAB 1: INCIDENT QUEUE */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            
            {/* Search and Filters */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID, reporter, narrative..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA]"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="all">All Statuses</option>
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Complaints Data Grid */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Complaint ID</th>
                      <th className="py-3 px-4">Reporter</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Current Status</th>
                      <th className="py-3 px-4">Assigned Officer</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {complaintsList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#0B1F3A]">
                          {c.complaintNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{c.reporterName}</div>
                          <div className="text-[11px] text-slate-400">{c.reporterEmail}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {c.category}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {c.amountLost ? `₹${Number(c.amountLost).toLocaleString()}` : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : c.status === 'Under Review' || c.status === 'Investigation' ? 'bg-sky-50 text-sky-700' : 'bg-amber-50 text-amber-700'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">
                          {c.assignedOfficer || <span className="text-slate-300 italic">Unassigned</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedComplaint(c);
                              setStatusInput(c.status);
                              setAssignedOfficerInput(c.assignedOfficer || 'Inspector V. Sharma (Cyber Cell)');
                              setInternalNotesInput(c.internalNotes || '');
                              setStatusMessage('');
                            }}
                            className="px-3 py-1 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-md transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect & Update</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {complaintsList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          No complaints match the current filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: THREAT RULES DATABASE */}
        {activeTab === 'threat-db' && (
          <div className="space-y-6">
            
            {/* Add Rule Form */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Add Threat Pattern / Heuristic Rule
              </h3>
              <form onSubmit={handleAddThreatPattern} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs">
                <div className="sm:col-span-3">
                  <label className="block text-slate-700 font-semibold mb-1">Pattern Type</label>
                  <select
                    value={newPatternType}
                    onChange={(e) => setNewPatternType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="keyword">Keyword Phrase</option>
                    <option value="domain">Domain / Host</option>
                    <option value="phone">Fraud Phone</option>
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-slate-700 font-semibold mb-1">Pattern String</label>
                  <input
                    type="text"
                    required
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    placeholder="e.g. sbi-kyc-service.top or send otp"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-700 font-semibold mb-1">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Reason for heuristic flag"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-lg transition-colors flex items-center justify-center gap-1.5 h-[38px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rule</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Pattern List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Pattern Type</th>
                    <th className="py-3 px-4">Target Pattern</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {threatPatterns.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono uppercase text-slate-500 font-medium">
                        {pat.patternType}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#0B1F3A]">
                        {pat.pattern}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${pat.severity === 'critical' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                          {pat.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {pat.description}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeletePattern(pat.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Remove rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Immutable SOC Operational Audit Trail
              </h3>
              <span className="text-xs text-slate-400 font-mono">Real-Time PostgreSQL Recording</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogsList.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {log.actor}
                    </td>
                    <td className="py-2.5 px-4 text-sky-700 font-bold">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {log.entityType} ({log.entityId})
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 font-sans text-xs">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* INSPECT & STATUS UPDATE MODAL */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-mono text-[#1769AA] font-bold">
                  {selectedComplaint.complaintNumber}
                </div>
                <h3 className="text-lg font-bold text-[#0B1F3A]">
                  Review & Update Incident Status
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick incident details */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-400">Reporter:</span> <strong className="text-slate-800">{selectedComplaint.reporterName}</strong> ({selectedComplaint.reporterPhone})</div>
                <div><span className="text-slate-400">Category:</span> <strong className="text-slate-800">{selectedComplaint.category}</strong></div>
                <div><span className="text-slate-400">Incident Date:</span> <span className="text-slate-800">{selectedComplaint.incidentDate}</span></div>
                <div><span className="text-slate-400">Amount:</span> <span className="text-slate-800">{selectedComplaint.amountLost ? `₹${selectedComplaint.amountLost}` : 'None'}</span></div>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 block mb-0.5">Reported Narrative:</span>
                <p className="text-slate-700 leading-relaxed font-sans">{selectedComplaint.description}</p>
              </div>
            </div>

            {/* Live Update Form */}
            <form onSubmit={handleUpdateComplaintStatus} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Transition Incident Status *
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-900"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Assigned Officer
                  </label>
                  <input
                    type="text"
                    value={assignedOfficerInput}
                    onChange={(e) => setAssignedOfficerInput(e.target.value)}
                    placeholder="e.g. Inspector V. Sharma (Cyber Cell)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Public Timeline Update Message (Pushed to citizen in real time)
                </label>
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  placeholder="e.g. Case forwarded to Nodal Payment Authority for transaction freeze."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Confidential Internal SOC Notes (Law Enforcement only)
                </label>
                <textarea
                  rows={2}
                  value={internalNotesInput}
                  onChange={(e) => setInternalNotesInput(e.target.value)}
                  placeholder="Internal notes regarding beneficiary accounts, IP tracing, or telecom requests."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="px-6 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl shadow transition-colors flex items-center gap-2"
                >
                  {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Push Real-Time Update</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
