import React from 'react';
import { ShieldCheck, Search, FileText, CheckCircle2, Activity, Server, Database } from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext.tsx';

interface HeroSectionProps {
  onCheckThreat: () => void;
  onReportIncident: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onCheckThreat, onReportIncident }) => {
  const { systemStatus } = useWebSocket();

  return (
    <section className="relative bg-[#0B1F3A] text-white overflow-hidden border-b border-slate-800">
      {/* Subtle radial lighting and low-opacity generated cyber network visual */}
      <div className="absolute inset-0 pointer-events-none opacity-20 mix-blend-screen">
        <img
          src="/src/assets/images/hero_cyber_network_1790901981889.jpg"
          alt="Cyber network background"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Subtle geometric shield watermark */}
      <div className="absolute -right-20 -bottom-20 w-96 h-96 opacity-5 pointer-events-none">
        <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M100 20 L170 50 L170 110 C170 155 100 185 100 185 C100 185 30 155 30 110 L30 50 Z" />
          <circle cx="100" cy="100" r="40" strokeDasharray="4 4" />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading and CTAs */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#123B66]/80 border border-[#20A4D8]/30 text-xs font-medium text-sky-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Cyber Safety & Incident Operations</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight font-sans">
              Stay Safe.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-[#20A4D8]">Detect Threats.</span><br />
              Report Cybercrime.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
              CyberShield helps you identify suspicious online activity, verify dangerous links and messages, understand emerging cyber fraud, and securely submit cyber incident complaints to security officers.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onCheckThreat}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#1769AA] hover:bg-[#20A4D8] rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Search className="w-4 h-4" />
                <span>Check a Threat</span>
              </button>

              <button
                onClick={onReportIncident}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#0B1F3A] bg-white hover:bg-slate-100 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                <FileText className="w-4 h-4 text-[#1769AA]" />
                <span>Report an Incident</span>
              </button>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Non-invasive safe URL analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>Unique complaint ID tracking</span>
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Security Status Console */}
          <div className="lg:col-span-5">
            <div className="bg-[#123B66]/60 backdrop-blur-md rounded-2xl border border-slate-700/60 p-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span className="text-sm font-semibold text-white">CyberShield Security Status</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              </div>

              {/* Status metrics grid */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B1F3A]/60 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-950/70 text-sky-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Threat Detection Engine</div>
                      <div className="text-sm font-medium text-white">Heuristic & Intelligence Engine</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-md">
                    {systemStatus?.threat_engine || 'Online'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B1F3A]/60 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-950/70 text-sky-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Complaint System</div>
                      <div className="text-sm font-medium text-white">Incident Queue & Operations</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-md">
                    Online
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B1F3A]/60 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-950/70 text-sky-400">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Database Storage</div>
                      <div className="text-sm font-medium text-white">Cloud SQL PostgreSQL</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2.5 py-1 rounded-md">
                    {systemStatus?.database === 'connected' ? 'Connected' : 'Active'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B1F3A]/60 border border-slate-700/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-sky-950/70 text-sky-400">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Active Monitoring</div>
                      <div className="text-sm font-medium text-white">WebSocket Push & Audit Log</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-sky-400 bg-sky-950/50 border border-sky-800/40 px-2.5 py-1 rounded-md">
                    Active
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                <span>Enterprise Protocol v2.4</span>
                <span className="font-mono text-slate-400">Region: asia-southeast1</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
