import React, { useState, useEffect } from 'react';
import { AlertTriangle, PhoneCall, ExternalLink, ShieldCheck, CheckCircle2, X } from 'lucide-react';

interface EmergencyHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileComplaint: () => void;
}

const DEFAULT_HELP_CONFIG = {
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
};

export const EmergencyHelpModal: React.FC<EmergencyHelpModalProps> = ({
  isOpen,
  onClose,
  onFileComplaint,
}) => {
  const [config, setConfig] = useState<any>(DEFAULT_HELP_CONFIG);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/config/official-help')
        .then(async (res) => {
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            const data = await res.json();
            setConfig(data);
          }
        })
        .catch(() => {
          // Keep DEFAULT_HELP_CONFIG
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header with emergency alert badge */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-600">
                Critical Financial Loss / Account Compromise
              </div>
              <h3 className="text-xl font-bold text-[#0B1F3A]">Emergency Cyber Assistance</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Golden Hour Urgent Warning */}
        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-950 space-y-2">
          <div className="font-bold flex items-center gap-2 text-rose-900">
            <PhoneCall className="w-4 h-4 text-rose-600" />
            <span>Golden Hour Rule for Financial Fraud</span>
          </div>
          <p className="leading-relaxed">
            If you have lost money via unauthorized UPI, bank transfer, or card transaction, report within the first <strong>2 hours</strong>. Fast reporting enables the nodal clearing bank to freeze the fraudster’s mule account before funds are laundered or withdrawn via ATMs.
          </p>
        </div>

        {/* National Helplines */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Verified Official Cybercrime Helplines & Portals
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {config?.nationalHelplines ? (
              config.nationalHelplines.map((item: any, idx: number) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{item.country}</span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#0B1F3A] text-white">
                      {item.helpline}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 leading-snug">{item.name}</div>
                  <a
                    href={item.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-semibold text-[#1769AA] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Visit Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 text-slate-500 font-mono">
                Helpline: 1930 (National Cyber Crime Portal)
              </div>
            )}
          </div>
        </div>

        {/* Immediate Action Checklist */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Immediate 5-Step Containment Checklist</span>
          </div>
          <ul className="space-y-1.5 text-slate-700">
            {config?.immediateSafetyChecklist?.map((step: string, sIdx: number) => (
              <li key={sIdx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
          >
            Close Guidance
          </button>
          <button
            onClick={() => {
              onClose();
              onFileComplaint();
            }}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl shadow transition-colors"
          >
            Document Official Complaint
          </button>
        </div>

      </div>
    </div>
  );
};
