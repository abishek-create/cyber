import React, { useState } from 'react';
import { Search, Globe, MessageSquare, Mail, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight, Loader2, Info, ExternalLink } from 'lucide-react';
import { ThreatAnalysisResult } from '../threat_engine/types.ts';
import { analyzeUrl, analyzeMessage, analyzeEmail } from '../threat_engine/index.ts';

interface ThreatCheckerProps {
  onReportPrefill?: (data: { category: string; description: string; url?: string; suspectPhone?: string }) => void;
}

const DEFAULT_PATTERNS = [
  { patternType: 'keyword', pattern: 'urgent account suspension', severity: 'critical' },
  { patternType: 'keyword', pattern: 'send otp to claim', severity: 'critical' },
  { patternType: 'keyword', pattern: 'congratulations you won lottery', severity: 'high' },
  { patternType: 'keyword', pattern: 'part-time job daily earnings telegram', severity: 'high' },
  { patternType: 'keyword', pattern: 'kyc expired click link', severity: 'critical' },
  { patternType: 'keyword', pattern: 'pan card update mandatory', severity: 'high' },
  { patternType: 'keyword', pattern: 'electricity power cut today bill unpaid', severity: 'high' },
  { patternType: 'domain', pattern: 'paytm-secure-verify.top', severity: 'critical' },
  { patternType: 'domain', pattern: 'sbi-online-update.xyz', severity: 'critical' },
  { patternType: 'domain', pattern: 'hdfc-kyc-service.info', severity: 'critical' },
  { patternType: 'domain', pattern: 'free-giftcard-portal.biz', severity: 'high' },
  { patternType: 'phone', pattern: '+9118002081234', severity: 'high' },
];

export const ThreatChecker: React.FC<ThreatCheckerProps> = ({ onReportPrefill }) => {
  const [activeTab, setActiveTab] = useState<'url' | 'message' | 'email'>('url');
  
  // URL Form
  const [urlInput, setUrlInput] = useState('');

  // Message Form
  const [messageInput, setMessageInput] = useState('');

  // Email Form
  const [emailSender, setEmailSender] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailAttachment, setEmailAttachment] = useState('');

  // Analysis State
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [result, setResult] = useState<ThreatAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysisWithSteps = async (
    apiEndpoint: string,
    payload: any,
    fallbackFn: () => ThreatAnalysisResult
  ) => {
    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      setAnalysisStep('Validating input syntax and protocol format...');
      await new Promise((r) => setTimeout(r, 220));

      setAnalysisStep('Inspecting domain characteristics & security heuristics...');
      await new Promise((r) => setTimeout(r, 250));

      setAnalysisStep('Cross-referencing active threat intelligence rules...');
      
      let data: ThreatAnalysisResult | null = null;
      try {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          data = await res.json();
        } else if (res.ok) {
          const text = await res.text();
          try {
            data = JSON.parse(text);
          } catch {
            // Not valid JSON, fallback to client-side engine
            data = fallbackFn();
          }
        } else {
          // If 404 or backend unavailable on static deploy (e.g. Vercel), fallback seamlessly
          data = fallbackFn();
        }
      } catch {
        // Network or route failure, fallback seamlessly to client-side engine
        data = fallbackFn();
      }

      setAnalysisStep('Calculating weighted risk indicators and recommendations...');
      await new Promise((r) => setTimeout(r, 180));

      if (data) {
        setResult(data);
        // Persist to local check history
        try {
          const existing = JSON.parse(localStorage.getItem('cybershield_threat_checks') || '[]');
          localStorage.setItem('cybershield_threat_checks', JSON.stringify([
            {
              id: Date.now(),
              checkType: data.checkType,
              inputPreview: data.inputPreview,
              riskLevel: data.riskLevel,
              riskScore: data.riskScore,
              createdAt: new Date().toISOString(),
            },
            ...existing,
          ].slice(0, 25)));
        } catch {
          // Ignore localStorage errors
        }
      } else {
        throw new Error('Analysis could not be completed.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during threat scanning');
    } finally {
      setAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleAnalyzeUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setError('Please paste or enter a URL to analyze.');
      return;
    }
    runAnalysisWithSteps('/api/threat/url', { url: urlInput.trim() }, () =>
      analyzeUrl(urlInput.trim(), DEFAULT_PATTERNS)
    );
  };

  const handleAnalyzeMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) {
      setError('Please enter SMS, WhatsApp, or Telegram message text to analyze.');
      return;
    }
    runAnalysisWithSteps('/api/threat/message', { message: messageInput.trim() }, () =>
      analyzeMessage(messageInput.trim(), DEFAULT_PATTERNS)
    );
  };

  const handleAnalyzeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSender.trim() && !emailBody.trim()) {
      setError('Please provide at least a sender address or email body content.');
      return;
    }
    runAnalysisWithSteps(
      '/api/threat/email',
      {
        sender: emailSender.trim(),
        subject: emailSubject.trim(),
        body: emailBody.trim(),
        attachmentName: emailAttachment.trim(),
      },
      () =>
        analyzeEmail(
          emailSender.trim() || 'unspecified@domain.com',
          emailSubject.trim() || 'No Subject',
          emailBody.trim() || '',
          emailAttachment.trim(),
          DEFAULT_PATTERNS
        )
    );
  };

  const loadSample = (type: 'url' | 'message' | 'email') => {
    if (type === 'url') {
      setUrlInput('https://paytm-secure-verify.top/claim-reward-login?id=9214');
    } else if (type === 'message') {
      setMessageInput('Dear user, your electricity power will be disconnected today at 9:30 PM due to unpaid bill. Immediately contact officer at +919876543210 or install BijliUpdate.apk to avoid disconnection.');
    } else {
      setEmailSender('hdfc-security-desk@gmail.com');
      setEmailSubject('URGENT: Your NetBanking access has been suspended due to unverified PAN');
      setEmailBody('Dear Customer, Your account is under temporary freeze. Verify your credentials within 24 hours at the attached link or your debit card will be blocked permanently. Contact helpdesk immediately.');
      setEmailAttachment('PAN_Verification_Tool.scr');
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL RISK':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH RISK':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'MEDIUM RISK':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'LOW RISK':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 80) return 'bg-red-600';
    if (score >= 55) return 'bg-orange-500';
    if (score >= 30) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="relative py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Background soft security gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-50/50 via-[#F5F8FC] to-white pointer-events-none rounded-3xl" />

      <div className="relative">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/70 text-sky-800 text-xs font-semibold mb-3">
            <Search className="w-3.5 h-3.5 text-[#1769AA]" />
            <span>Automated Threat Inspection Service</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] tracking-tight">
            Real-Time Threat Checker
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Inspect suspicious links, SMS alerts, WhatsApp forwards, and phishing emails using non-invasive heuristic and threat intelligence algorithms.
          </p>
        </div>

        {/* Checker Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
          
          {/* Tabs: Interactive Filter Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-6 max-w-md mx-auto">
            <button
              onClick={() => { setActiveTab('url'); setResult(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'url' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>URL / Link</span>
            </button>
            <button
              onClick={() => { setActiveTab('message'); setResult(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'message' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>SMS / Message</span>
            </button>
            <button
              onClick={() => { setActiveTab('email'); setResult(null); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'email' ? 'bg-white text-[#0B1F3A] shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Phishing</span>
            </button>
          </div>

          {/* URL Form */}
          {activeTab === 'url' && (
            <form onSubmit={handleAnalyzeUrl} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Paste Suspicious Website Link or URL
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="e.g. https://paytm-secure-verify.top/claim or sbi-online-update.xyz"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1769AA] focus:bg-white transition-all text-slate-900 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={analyzing}
                  className="px-6 py-3 text-sm font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                >
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Analyze URL</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Safe inspection: CyberShield does not trigger client code execution.</span>
                <button
                  type="button"
                  onClick={() => loadSample('url')}
                  className="text-[#1769AA] hover:underline font-medium"
                >
                  Load Sample Suspicious URL
                </button>
              </div>
            </form>
          )}

          {/* Message Form */}
          {activeTab === 'message' && (
            <form onSubmit={handleAnalyzeMessage} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">
                Paste SMS, WhatsApp, Telegram, or Chat Message
              </label>
              <textarea
                rows={4}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Paste the suspicious message content here (e.g. 'Your bank account will be blocked today. Click link to verify OTP...')"
                className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1769AA] focus:bg-white transition-all text-slate-900"
              />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => loadSample('message')}
                  className="text-xs text-[#1769AA] hover:underline font-medium"
                >
                  Load Sample Electricity Cutoff Scam
                </button>
                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Analyze Message</span>
                </button>
              </div>
            </form>
          )}

          {/* Email Form */}
          {activeTab === 'email' && (
            <form onSubmit={handleAnalyzeEmail} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sender Email Address
                  </label>
                  <input
                    type="text"
                    value={emailSender}
                    onChange={(e) => setEmailSender(e.target.value)}
                    placeholder="e.g. security-alert@sbi-updates.xyz or alert@gmail.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1769AA] text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attachment Filename (Optional)
                  </label>
                  <input
                    type="text"
                    value={emailAttachment}
                    onChange={(e) => setEmailAttachment(e.target.value)}
                    placeholder="e.g. Invoice_Payment.scr or KYC_Form.apk"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1769AA] text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. URGENT: Account Suspended within 24 hours"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1769AA] text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Body Content
                </label>
                <textarea
                  rows={3}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Paste the email text or call-to-action here..."
                  className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1769AA] text-slate-900"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => loadSample('email')}
                  className="text-xs text-[#1769AA] hover:underline font-medium"
                >
                  Load Sample Spoofed Phishing Email
                </button>
                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Analyze Email</span>
                </button>
              </div>
            </form>
          )}

          {/* Progress / Analyzing Indicator */}
          {analyzing && (
            <div className="mt-6 p-4 rounded-xl bg-sky-50 border border-sky-100 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-[#1769AA] animate-spin shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[#0B1F3A]">Threat Engine Running</div>
                <div className="text-xs text-sky-800 font-mono mt-0.5">{analysisStep}</div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className="mt-8 pt-6 border-t border-slate-200 animate-fadeIn space-y-6">
              
              {/* Header result row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Scanned Target</div>
                  <div className="text-sm font-mono font-medium text-slate-900 break-all">
                    {result.inputPreview}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Threat Level</div>
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${getRiskBadgeColor(result.riskLevel)}`}>
                      {result.riskLevel === 'LOW RISK' ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{result.riskLevel}</span>
                    </div>
                  </div>

                  <div className="pl-3 border-l border-slate-200 text-right">
                    <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Score</div>
                    <div className="text-xl font-bold font-mono text-[#0B1F3A]">
                      {result.riskScore}<span className="text-xs text-slate-400 font-normal">/100</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Score bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
                  <span>Calculated Risk Indicator</span>
                  <span className="font-mono">{result.riskScore}% Probability Index</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getRiskBarColor(result.riskScore)}`}
                    style={{ width: `${result.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Detected Indicators List */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Detected Threat Signals ({result.indicators.length})
                </h4>
                {result.indicators.length > 0 ? (
                  <div className="space-y-2">
                    {result.indicators.map((ind, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-start gap-3">
                        <div className="mt-0.5">
                          {ind.severity === 'critical' ? (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          ) : ind.severity === 'high' ? (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          ) : (
                            <Info className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{ind.name}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {ind.severity}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1 leading-relaxed">{ind.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No known malicious indicators or suspicious keyword lures detected.</span>
                  </div>
                )}
              </div>

              {/* Recommendation Box */}
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 text-xs">
                <div className="font-bold text-[#0B1F3A] mb-1">Recommended Action</div>
                <p className="text-slate-700 leading-relaxed">{result.recommendation}</p>
              </div>

              {/* Action row: Report to CyberShield */}
              {(result.riskLevel === 'HIGH RISK' || result.riskLevel === 'CRITICAL RISK') && (
                <div className="p-4 rounded-xl bg-[#0B1F3A] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">Incident Pre-Verification Active</div>
                    <div className="text-xs text-slate-300">
                      You can transfer this analysis directly into a formal cyber incident complaint.
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (onReportPrefill) {
                        onReportPrefill({
                          category: result.checkType === 'url' ? 'Suspicious Links' : result.checkType === 'email' ? 'Email Threats' : 'Messaging Scams',
                          description: `Threat detected on ${result.checkType}: ${result.inputPreview}. Risk score: ${result.riskScore}/100. Signals: ${result.reasons.join('; ')}`,
                          url: result.checkType === 'url' ? urlInput : undefined,
                        });
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-[#0B1F3A] bg-white hover:bg-slate-100 rounded-lg shadow transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Report This Incident</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Responsible Disclaimer */}
              <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                {result.disclaimer}
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
