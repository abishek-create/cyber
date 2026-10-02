import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, FileText, Search, Clock, CheckCircle2,
  AlertTriangle, ArrowRight, Bell, Lock, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useWebSocket } from '../context/WebSocketContext.tsx';

interface UserDashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate }) => {
  const { user, getToken } = useAuth();
  const { lastEvent } = useWebSocket();

  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [threatHistory, setThreatHistory] = useState<any[]>([]);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Fetch user complaints
      try {
        const compRes = await fetch('/api/complaints', { headers });
        const compType = compRes.headers.get('content-type') || '';
        if (compRes.ok && compType.includes('application/json')) {
          const comps = await compRes.json();
          if (Array.isArray(comps)) {
            setMyComplaints(comps);
          }
        } else {
          const local = JSON.parse(localStorage.getItem('cybershield_complaints') || '[]');
          setMyComplaints(local);
        }
      } catch {
        const local = JSON.parse(localStorage.getItem('cybershield_complaints') || '[]');
        setMyComplaints(local);
      }

      // Fetch user threat checks
      try {
        const thRes = await fetch('/api/threat/history', { headers });
        const thType = thRes.headers.get('content-type') || '';
        if (thRes.ok && thType.includes('application/json')) {
          const th = await thRes.json();
          if (Array.isArray(th)) {
            setThreatHistory(th);
          }
        } else {
          const localChecks = JSON.parse(localStorage.getItem('cybershield_threat_checks') || '[]');
          setThreatHistory(localChecks);
        }
      } catch {
        const localChecks = JSON.parse(localStorage.getItem('cybershield_threat_checks') || '[]');
        setThreatHistory(localChecks);
      }

      // Fetch user notifications
      if (token) {
        try {
          const notifRes = await fetch('/api/notifications', { headers });
          const notifType = notifRes.headers.get('content-type') || '';
          if (notifRes.ok && notifType.includes('application/json')) {
            const notifs = await notifRes.json();
            setNotificationsList(notifs);
          }
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch warning:', err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Real-time live status update listener
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'complaint_status_changed') {
      fetchUserData();
    }
  }, [lastEvent, fetchUserData]);

  const activeComplaintsCount = myComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
  const resolvedCount = myComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1769AA] uppercase tracking-wider mb-1">
            <User className="w-3.5 h-3.5" />
            <span>Citizen Cyber Defense Console</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight">
            Welcome, {user?.fullName || 'Citizen User'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your reported cyber incidents, review previous threat scans, and monitor security advisories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('threat-checker')}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl shadow transition-colors"
          >
            Check a Threat
          </button>
          <button
            onClick={() => onNavigate('complaints')}
            className="px-4 py-2 text-xs font-semibold text-[#0B1F3A] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            File New Report
          </button>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Scans Performed</div>
          <div className="text-2xl font-bold font-mono text-[#0B1F3A] mt-1">{threatHistory.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">URL & message checks</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Complaints Filed</div>
          <div className="text-2xl font-bold font-mono text-[#1769AA] mt-1">{myComplaints.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Official incident cases</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Active Cases</div>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{activeComplaintsCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Under investigation</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Resolved Incidents</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">{resolvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Closed cases</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mr-2">
          Quick Actions:
        </span>
        <button
          onClick={() => onNavigate('threat-checker')}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          Check URL
        </button>
        <button
          onClick={() => onNavigate('threat-checker')}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          Check Message
        </button>
        <button
          onClick={() => onNavigate('threat-checker')}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          Check Email
        </button>
        <button
          onClick={() => onNavigate('complaints')}
          className="px-3 py-1.5 text-xs font-medium text-[#1769AA] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
        >
          Report Incident
        </button>
        <button
          onClick={() => onNavigate('awareness')}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
        >
          Cyber Awareness
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: My Reported Incidents */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1769AA]" />
              <span>My Incident Reports ({myComplaints.length})</span>
            </h3>
            <button
              onClick={() => onNavigate('complaints')}
              className="text-xs text-[#1769AA] hover:underline font-semibold"
            >
              File New Incident
            </button>
          </div>

          <div className="space-y-3">
            {myComplaints.map((comp) => (
              <div
                key={comp.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-[#1769AA]/40 transition-colors space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0B1F3A]">{comp.complaintNumber}</span>
                    <span className="text-[11px] font-semibold text-slate-500">· {comp.category}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${comp.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}>
                    {comp.status}
                  </span>
                </div>

                <p className="text-slate-600 line-clamp-2 leading-relaxed">
                  {comp.description}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Filed on {new Date(comp.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => onNavigate('complaints')}
                    className="font-semibold text-[#1769AA] hover:underline flex items-center gap-1"
                  >
                    <span>View Case Timeline</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {myComplaints.length === 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                You have not filed any incidents yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Threat Check History */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-[#1769AA]" />
              <span>Recent Threat Checks</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Session History</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
            <div className="divide-y divide-slate-100">
              {threatHistory.map((item) => (
                <div key={item.id} className="p-3.5 hover:bg-slate-50 transition-colors space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono uppercase text-[10px] text-slate-500 font-semibold">
                      {item.checkType}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${item.riskLevel === 'CRITICAL RISK' ? 'bg-red-50 text-red-700' : item.riskLevel === 'HIGH RISK' ? 'bg-orange-50 text-orange-700' : item.riskLevel === 'MEDIUM RISK' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {item.riskLevel}
                    </span>
                  </div>
                  <div className="font-mono text-slate-800 truncate">
                    {item.inputPreview}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Risk Score: {item.riskScore}/100 · {new Date(item.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}

              {threatHistory.length === 0 && (
                <div className="p-6 text-center text-slate-400">
                  No checks performed in this session.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
