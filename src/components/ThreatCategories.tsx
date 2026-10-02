import React, { useState } from 'react';
import { CreditCard, MessageSquare, Mail, Link, Users, Briefcase, ShieldAlert, ChevronRight, X, ArrowRight, CheckCircle2, AlertOctagon } from 'lucide-react';

interface ThreatCategory {
  id: string;
  title: string;
  icon: any;
  summary: string;
  subcategories: string[];
  warningSigns: string[];
  attackerTactics: string[];
  whatToDo: string[];
  whatNotToDo: string[];
}

const THREAT_CATEGORIES: ThreatCategory[] = [
  {
    id: 'banking',
    title: 'Banking & Financial Fraud',
    icon: CreditCard,
    summary: 'Attacks targeting online banking credentials, UPI payment handles, credit/debit cards, and investment accounts.',
    subcategories: ['UPI Scams', 'Fake Bank Calls', 'Fake Customer Care', 'OTP Fraud', 'QR-Code Scams', 'Payment Collect Requests', 'Fake Loan Apps'],
    warningSigns: [
      'Callers demanding you read out an SMS OTP to "prevent account deactivation"',
      'Buyer sending a QR code claiming "Scan this to receive your advance money"',
      'Google Search results showing personal mobile numbers for bank customer care',
      'Sudden debits under unfamiliar Virtual Payment Addresses (VPAs)',
    ],
    attackerTactics: [
      'Falsifying caller ID to appear as national banks or credit card fraud departments',
      'Luring victims to install screen-sharing software (AnyDesk, RustDesk) under pretext of KYC',
      'Sending reverse-charge UPI collect requests disguised as credit approvals',
    ],
    whatToDo: [
      'Remember: UPI PIN is solely used to deduct money from your account, never to receive funds',
      'Immediately dial 1930 (National Cyber Crime Helpline) within the golden hour to freeze funds',
      'Block suspect cards and internet banking via your official banking app',
    ],
    whatNotToDo: [
      'Never disclose an OTP, debit card PIN, or CVV to anyone, including bank employees',
      'Never scan QR codes sent over WhatsApp or SMS to accept payments',
      'Never allow unknown callers to guide you through remote desktop installations',
    ],
  },
  {
    id: 'messaging',
    title: 'Messaging & Chat Scams',
    icon: MessageSquare,
    summary: 'Deceptive messages delivered via WhatsApp, Telegram, SMS, and RCS exploiting urgency and artificial trust.',
    subcategories: ['WhatsApp Task Scams', 'Telegram Crypto Groups', 'Delivery Courier SMS', 'Electricity Cutoff Panic', 'Impersonation Calls'],
    warningSigns: [
      'Unsolicited WhatsApp message offering ₹3,000/day for liking YouTube clips or rating hotels',
      'SMS warning of power/electricity cut tonight with an ordinary mobile number to contact',
      'Telegram channel with automated screenshot bots celebrating massive daily investment gains',
    ],
    attackerTactics: [
      'Paying small amounts (₹150 to ₹500) initially to establish fraudulent trust',
      'Creating false group dynamics with sock-puppet accounts echoing successful withdrawals',
      'Demanding prepaid deposit tasks with increasing financial commitments',
    ],
    whatToDo: [
      'Exit and report unsolicited Telegram investment groups immediately',
      'Verify utility dues directly via the official state electricity corporation portal',
      'Report suspicious numbers to CyberShield and the Telecom Regulatory Authority (TAFCOP)',
    ],
    whatNotToDo: [
      'Never transfer money to "unlock" commissions or refund prepaid task balances',
      'Do not install APK packages sent through WhatsApp chat attachments',
      'Never click unverified short links in delivery or courier notifications',
    ],
  },
  {
    id: 'email',
    title: 'Email Threats & Spear Phishing',
    icon: Mail,
    summary: 'Targeted deceptive emails attempting credential harvesting, business email compromise, and malicious payload delivery.',
    subcategories: ['Phishing Emails', 'Business Email Compromise (BEC)', 'Fake Invoices', 'Fake Account Suspensions', 'Spoofed Sender Addresses'],
    warningSigns: [
      'Sender email address domain does not match the official organization branding',
      'Urgent threats requiring password verification within 24 hours to prevent account lockout',
      'Unsolicited invoice attachments ending in .scr, .iso, .html, or .zip',
    ],
    attackerTactics: [
      'Registering lookalike domains (typosquatting) that resemble authentic institutions',
      'Spoofing executive or supplier display names to request wire transfers',
      'Hosting cloned corporate login portals that intercept Multi-Factor Authentication (MFA) tokens',
    ],
    whatToDo: [
      'Inspect the actual sender email address header rather than the display name',
      'Hover over hyperlinks to verify destination domain before clicking',
      'Use hardware security keys (FIDO2) or authenticator apps instead of SMS OTPs',
    ],
    whatNotToDo: [
      'Never open unexpected executable or macro-enabled attachments',
      'Never input credentials on pages reached via email links',
      'Do not authorize payment transfers based solely on an email request',
    ],
  },
  {
    id: 'links',
    title: 'Suspicious Links & Deceptive Portals',
    icon: Link,
    summary: 'Fraudulent landing pages, cloned government portals, and deceptive redirects capturing confidential information.',
    subcategories: ['Cloned Banking Portals', 'Fake Shopping Portals', 'Malware Download Redirects', 'Shortened URL Obfuscation', 'IP Address Hosts'],
    warningSigns: [
      'Address bar displays http:// without valid SSL/TLS certificate padlock',
      'Domain uses high-risk extension (.top, .xyz, .biz) for established commercial brands',
      'Excessive subdomains masking the genuine host (e.g., sbi.com.account-update.info)',
    ],
    attackerTactics: [
      'Purchasing search engine sponsored ads (Google Ads) to appear above legitimate banking links',
      'Deploying browser fingerprinting to redirect mobile visitors to fraudulent forms while showing clean pages to bots',
      'Creating fake e-commerce flash sales with 90% discounts to harvest credit cards',
    ],
    whatToDo: [
      'Always type the official URL directly into the browser address bar',
      'Bookmark verified portals for banking, tax returns, and utility payments',
      'Analyze unfamiliar links using the CyberShield Real-Time Threat Checker',
    ],
    whatNotToDo: [
      'Never click the first sponsored search ad for customer support queries',
      'Never input sensitive details on websites using raw IP address hosts',
      'Do not rely on padlock symbols alone—scammers can also obtain free SSL certificates',
    ],
  },
  {
    id: 'social',
    title: 'Social Media Fraud & Extortion',
    icon: Users,
    summary: 'Account takeovers, friend impersonations, romance scams, and sextortion schemes across Instagram, Facebook, and LinkedIn.',
    subcategories: ['Account Takeover', 'Impersonation Profiles', 'Romance Scams', 'Blackmail Extortion', 'Fake Giveaway Contests'],
    warningSigns: [
      'A known friend suddenly sends a direct message asking for urgent UPI funds due to an emergency',
      'Contact asking you to receive an SMS code on their behalf to vote for an influencer contest',
      'New online romantic acquaintance soliciting funds for emergency travel or medical expenses',
    ],
    attackerTactics: [
      'Harvesting 2FA backup codes through deceptive "help me recover my account" messages',
      'Screen-recording video calls to capture compromised angles for extortion threats',
      'Cloning public social profiles to target close family members with emergency money requests',
    ],
    whatToDo: [
      'Phone your friend directly via a traditional voice call before sending any money',
      'Enable app-based 2FA (Google Authenticator) on all social accounts',
      'Report hijacked profiles immediately to the social platform safety team',
    ],
    whatNotToDo: [
      'Never pay ransom or extortion money—blackmailers will continuously escalate demands',
      'Never share SMS verification links or security codes with anyone',
      'Do not accept video calls from unknown profiles without verification',
    ],
  },
  {
    id: 'jobs',
    title: 'Job & Internship Scams',
    icon: Briefcase,
    summary: 'Fraudulent recruitment schemes, bogus employment letters, and advance registration fees exploiting job seekers.',
    subcategories: ['Fake Job Offers', 'Registration Fee Scams', 'Work-From-Home Task Scams', 'Fake Interview Portals', 'Freelance Deposit Fraud'],
    warningSigns: [
      'Job offer provided without formal interview or technical evaluation',
      'Recruiter asking for a "security deposit", "training kit fee", or "laptop delivery charge"',
      'Recruiter communicating exclusively via WhatsApp or Telegram without corporate email domain',
    ],
    attackerTactics: [
      'Issuing counterfeit offer letters with forged corporate stamps and logos',
      'Operating cloned recruitment portals to harvest identity documents (passport, PAN, Aadhaar)',
      'Assigning bogus data entry tasks and demanding fee payments before releasing salaries',
    ],
    whatToDo: [
      'Check official corporate career pages directly to verify open requisition IDs',
      'Verify that official recruiters write from genuine company domain addresses',
      'Report fake recruitment schemes on the CyberShield complaint portal',
    ],
    whatNotToDo: [
      'Never pay money to secure a job, interview, or training certification',
      'Do not provide bank account login credentials for "salary direct deposit setup"',
      'Never surrender original educational certificates or identity credentials',
    ],
  },
  {
    id: 'malware',
    title: 'Malware & Device Threats',
    icon: ShieldAlert,
    summary: 'Malicious Android APKs, spyware, ransomware, and Trojan applications designed to hijack device permissions.',
    subcategories: ['Malicious APKs', 'Ransomware', 'Spyware & Keyloggers', 'Browser Hijackers', 'Fake Android Updates'],
    warningSigns: [
      'Caller demanding you download a helper app (.apk) via a third-party link',
      'App requesting sensitive permissions (SMS read, Accessibility service, Call logs)',
      'Sudden device overheating, battery drain, or unexpected pop-up advertisements',
    ],
    attackerTactics: [
      'Disguising banking trojans as government portals, electric bills, or courier trackers',
      'Using Android Accessibility permissions to read incoming OTPs and auto-approve bank transfers',
      'Locking device files and encrypting documents with ransomware demands',
    ],
    whatToDo: [
      'Keep Google Play Protect active and disable "Install from Unknown Sources"',
      'Immediately switch device to Airplane Mode if an untrusted APK was installed',
      'Boot device in Safe Mode to uninstall suspicious apps and revoke device admin privileges',
    ],
    whatNotToDo: [
      'Never install APK packages sent through WhatsApp, Telegram, or SMS links',
      'Never grant Accessibility permissions to apps outside verified system utilities',
      'Do not connect untrusted USB thumb drives or external media to critical computers',
    ],
  },
];

interface ThreatCategoriesProps {
  onReportCategory: (categoryTitle: string) => void;
}

export const ThreatCategories: React.FC<ThreatCategoriesProps> = ({ onReportCategory }) => {
  const [selectedThreat, setSelectedThreat] = useState<ThreatCategory | null>(null);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Header */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
          <ShieldAlert className="w-3.5 h-3.5 text-[#1769AA]" />
          <span>Threat Intelligence Knowledge Base</span>
        </div>
        <h2 className="text-3xl font-bold text-[#0B1F3A] tracking-tight font-sans">
          Cyber Threat Categories
        </h2>
        <p className="text-base text-slate-600 mt-2 leading-relaxed">
          Comprehensive defense guides detailing prevalent cybercrime tactics, attacker methodologies, key warning signs, and decisive response protocols.
        </p>
      </div>

      {/* Grid of Threat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {THREAT_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#1769AA] group-hover:bg-[#0B1F3A] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {cat.subcategories.length} Vectors
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#0B1F3A] group-hover:text-[#1769AA] transition-colors">
                  {cat.title}
                </h3>
                
                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {cat.summary}
                </p>

                {/* Subcategory tags: clean unboxed metadata */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-500">
                  {cat.subcategories.slice(0, 3).map((sub, sIdx) => (
                    <span key={sIdx} className="hover:text-slate-900 transition-colors">
                      {sub} {sIdx < 2 && <span className="text-slate-300 ml-1">·</span>}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedThreat(cat)}
                  className="text-xs font-semibold text-[#1769AA] hover:text-[#0B1F3A] flex items-center gap-1 transition-colors"
                >
                  <span>View Defense Guide</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onReportCategory(cat.title)}
                  className="text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
                >
                  Report Fraud
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Full Category Defense Specification */}
      {selectedThreat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#1769AA] flex items-center justify-center">
                  <selectedThreat.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#0B1F3A]">{selectedThreat.title}</h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">Threat Prevention & Response Dossier</div>
                </div>
              </div>
              <button
                onClick={() => setSelectedThreat(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {selectedThreat.summary}
            </p>

            {/* Warning Signs */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
                <AlertOctagon className="w-4 h-4 text-amber-600" />
                <span>Primary Warning Signs</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-950">
                {selectedThreat.warningSigns.map((w, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">›</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Attacker Tactics */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                What Attackers Usually Do
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {selectedThreat.attackerTactics.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* What you should do & NOT do */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>What You SHOULD Do</span>
                </div>
                <ul className="space-y-1.5 text-xs text-emerald-950">
                  {selectedThreat.whatToDo.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900 mb-2">
                  <X className="w-3.5 h-3.5 text-rose-600" />
                  <span>What You MUST NOT Do</span>
                </div>
                <ul className="space-y-1.5 text-xs text-rose-950">
                  {selectedThreat.whatNotToDo.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedThreat(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const catTitle = selectedThreat.title;
                  setSelectedThreat(null);
                  onReportCategory(catTitle);
                }}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-lg shadow transition-colors"
              >
                <span>Report Incident in this Category</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
