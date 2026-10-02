import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, ShieldCheck, ArrowRight, X, Clock, CheckCircle2, AlertOctagon } from 'lucide-react';

interface AwarenessSectionProps {
  onReportIncident: (category: string) => void;
}

const DEFAULT_AWARENESS_ARTICLES = [
  {
    id: 1,
    title: 'UPI Payment & QR Code Scams: How Attackers Steal Money in Seconds',
    category: 'Banking & Financial Fraud',
    readTime: '4 min',
    summary: 'Learn how fraudsters trick victims into entering UPI PINs to "receive" funds or scan deceptive QR codes.',
    content: 'Unified Payments Interface (UPI) has made instant payments simple, but scammers exploit the psychological gap between sending and receiving money. In reality, you NEVER need to enter your UPI PIN, scan a QR code, or approve a collect request to receive money into your bank account. Scammers post fake listings on online marketplaces (OLX, Quikr, Facebook Marketplace), posing as eager army officers or buyers. They send a QR code claiming "Scan this to receive your advance payment." Once you scan and enter your PIN, the funds are debited from your account immediately.',
    warningSigns: JSON.stringify([
      'Buyer insists on paying only via QR code or collect request',
      'Sender claims you must enter UPI PIN to receive money',
      'Urgent pressure to accept payment within 5 minutes',
      'Caller pretends to be defense personnel or government official'
    ]),
    whatToDo: JSON.stringify([
      'Remember: UPI PIN is ONLY entered to deduct money, NEVER to receive',
      'Reject any collect request from unfamiliar Virtual Payment Addresses (VPAs)',
      'Immediately report fraudulent transactions to 1930 / national cyber portal',
      'Block the fraudulent VPA and suspect phone number in your UPI app'
    ]),
    whatNotToDo: JSON.stringify([
      'Never enter your UPI PIN under any pretext when receiving money',
      'Do not scan QR codes sent via WhatsApp or SMS',
      'Do not click on unverified payment request links',
      'Never share screen using AnyDesk, TeamViewer, or RustDesk with callers'
    ]),
  },
  {
    id: 2,
    title: 'WhatsApp & Telegram Part-Time Job Scams',
    category: 'Messaging Scams',
    readTime: '5 min',
    summary: 'Attackers offer high daily payouts for rating hotels or liking YouTube videos, leading to catastrophic crypto deposits.',
    content: 'Scammers initiate contact via unsolicited WhatsApp or Telegram messages offering work-from-home tasks paying ₹2,000 to ₹10,000 per day. Victims are added to Telegram groups with fake participants celebrating payouts. The first few micro-tasks pay small amounts (₹150 to ₹500) to build trust. Subsequently, "prepaid tasks" or "merchant orders" are introduced requiring the victim to transfer money with promise of 30% profits. When the victim attempts to withdraw, scammers demand 30% "tax fee" or "frozen account reactivation charge" until the victim is completely drained.',
    warningSigns: JSON.stringify([
      'Unsolicited message offering high daily earnings for simple tasks (liking videos, writing reviews)',
      'Initial small payouts credited directly to create false trust',
      'Migration to private Telegram groups filled with bot screenshots of bank credits',
      'Demands for deposit money to unlock earned profits'
    ]),
    whatToDo: JSON.stringify([
      'Exit and report unsolicited Telegram groups immediately',
      'Verify legitimate corporate recruitments on official company career portals',
      'File a cyber complaint with transaction IDs and Telegram channel handles',
      'Inform your bank if you transferred funds to suspicious beneficiary accounts'
    ]),
    whatNotToDo: JSON.stringify([
      'Never pay money to get a job or unlock task commissions',
      'Do not join unknown investment or rating channels on Telegram',
      'Do not share bank account details with anonymous recruiters',
      'Never deposit funds into cryptocurrency exchanges on instructions of online strangers'
    ]),
  },
  {
    id: 3,
    title: 'Spear Phishing & Spoofed Executive Emails',
    category: 'Email Threats',
    readTime: '6 min',
    summary: 'Understanding Business Email Compromise (BEC), lookalike domains, and urgent credential theft.',
    content: 'Phishing attacks have evolved into highly targeted spear phishing and domain spoofing. Attackers register domains that look virtually identical to legitimate institutions (typosquatting) or forge header display names. The email creates false panic: "Account suspended due to unverified KYC", "Tax rebate awaiting immediate claim", or "Wire transfer requested by CEO". The links point to cloned login portals that capture corporate credentials and multi-factor authentication tokens in real time.',
    warningSigns: JSON.stringify([
      'Sender email domain differs by a single letter or uses free webmail',
      'Urgent deadline threatening account termination or legal penalty',
      'Mismatched hyperlink destination compared to display text',
      'Unusual requests for wire transfers or gift card purchases'
    ]),
    whatToDo: JSON.stringify([
      'Hover over links before clicking to inspect actual destination URL',
      'Verify critical financial requests via secondary offline communication',
      'Use hardware security keys (FIDO2) or authenticator apps rather than SMS OTP',
      'Forward phishing emails to internal security teams and report via CyberShield'
    ]),
    whatNotToDo: JSON.stringify([
      'Never click links inside unverified security warnings',
      'Do not download unexpected zip, iso, or html attachments',
      'Never enter credentials on pages lacking genuine domain certificates',
      'Do not reply directly to spoofed sender addresses'
    ]),
  },
  {
    id: 4,
    title: 'Malicious Android APKs & Fake Electricity Bill Disconnections',
    category: 'Malware & Device Threats',
    readTime: '5 min',
    summary: 'How malicious APK files sent via SMS hijack SMS permissions and drain bank accounts.',
    content: 'Attackers send threatening SMS messages stating electricity power or mobile SIM will be disconnected tonight due to unpaid dues. The message provides a "helpline" phone number. When the victim calls, the fraudster speaks convincingly and asks the victim to download a small "support app" (e.g. BijliUpdate.apk or CustomerSupport.apk) sent via WhatsApp or a third-party link. This app is an Android banking trojan that requests SMS and accessibility permissions, intercepting all banking OTPs and allowing remote device control.',
    warningSigns: JSON.stringify([
      'SMS threatening immediate utility cutoff with an ordinary mobile number as contact',
      'Insistence on downloading an APK file outside Google Play Store',
      'App requests broad Accessibility, SMS, and Screen Recording permissions',
      'Caller claims to be an electricity board executive or telecom technician'
    ]),
    whatToDo: JSON.stringify([
      'Pay all utility bills strictly through official electricity board portals or certified apps',
      'Keep Android Play Protect enabled and disable Install from Unknown Sources',
      'If installed, disconnect phone from Wi-Fi/data, boot in Safe Mode, and uninstall the malicious app',
      'Contact bank immediately to freeze online banking and debit cards'
    ]),
    whatNotToDo: JSON.stringify([
      'Never install APK files sent through WhatsApp, SMS, or third-party links',
      'Do not grant Accessibility permissions to untrusted applications',
      'Never call phone numbers embedded in panic alert text messages',
      'Do not share OTPs under the guise of bill verification'
    ]),
  },
];

export const AwarenessSection: React.FC<AwarenessSectionProps> = ({ onReportIncident }) => {
  const [articles, setArticles] = useState<any[]>(DEFAULT_AWARENESS_ARTICLES);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/awareness');
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setArticles(data);
          }
        }
      } catch {
        // Retain default articles
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const categories = ['All', 'Banking & Financial Fraud', 'Messaging Scams', 'Email Threats', 'Malware & Device Threats', 'Social Media Scams'];

  const filtered = articles.filter((art) => {
    const matchCat = selectedCategory === 'All' || art.category === selectedCategory;
    const matchSearch =
      art.title.toLowerCase().includes(search.toLowerCase()) ||
      art.summary.toLowerCase().includes(search.toLowerCase()) ||
      art.content.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5 text-[#1769AA]" />
          <span>Cyber Awareness & Protective Countermeasures</span>
        </div>
        <h2 className="text-3xl font-bold text-[#0B1F3A] tracking-tight">
          Cyber Awareness Library
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          In-depth protective guides explaining common scams, social engineering psychological triggers, and verified self-defense steps.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${selectedCategory === cat ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-slate-50'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1769AA]"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((art) => (
          <div
            key={art.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-[#1769AA]">{art.category}</span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {art.readTime} read
                </span>
              </div>

              <h3 className="text-base font-bold text-[#0B1F3A] hover:text-[#1769AA] transition-colors leading-snug">
                {art.title}
              </h3>

              <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                {art.summary}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedArticle(art)}
                className="text-xs font-semibold text-[#1769AA] hover:text-[#0B1F3A] flex items-center gap-1"
              >
                <span>Read Full Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onReportIncident(art.category)}
                className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors"
              >
                Report Case
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-[#1769AA] uppercase tracking-wider">
                  {selectedArticle.category} · {selectedArticle.readTime} read
                </span>
                <h3 className="text-2xl font-bold text-[#0B1F3A] mt-1">
                  {selectedArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="prose prose-sm max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
              <p>{selectedArticle.content}</p>
            </div>

            {/* Warning Signs */}
            {selectedArticle.warningSigns && (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
                  <AlertOctagon className="w-4 h-4 text-amber-600" />
                  <span>Warning Signs & Scam Tactics</span>
                </div>
                <ul className="space-y-1.5 text-xs text-amber-950">
                  {(() => {
                    try {
                      const signs = JSON.parse(selectedArticle.warningSigns);
                      return signs.map((s: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">›</span>
                          <span>{s}</span>
                        </li>
                      ));
                    } catch {
                      return <li>{selectedArticle.warningSigns}</li>;
                    }
                  })()}
                </ul>
              </div>
            )}

            {/* Protection Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedArticle.whatToDo && (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-900 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>How to Protect Yourself</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-950">
                    {(() => {
                      try {
                        const items = JSON.parse(selectedArticle.whatToDo);
                        return items.map((it: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>{it}</span>
                          </li>
                        ));
                      } catch {
                        return <li>{selectedArticle.whatToDo}</li>;
                      }
                    })()}
                  </ul>
                </div>
              )}

              {selectedArticle.whatNotToDo && (
                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
                  <div className="text-xs font-bold text-rose-900 mb-2 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>What NOT to Do</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-rose-950">
                    {(() => {
                      try {
                        const items = JSON.parse(selectedArticle.whatNotToDo);
                        return items.map((it: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-rose-600 font-bold">✕</span>
                            <span>{it}</span>
                          </li>
                        ));
                      } catch {
                        return <li>{selectedArticle.whatNotToDo}</li>;
                      }
                    })()}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const cat = selectedArticle.category;
                  setSelectedArticle(null);
                  onReportIncident(cat);
                }}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#123B66] rounded-xl shadow transition-colors"
              >
                <span>Report Incident in this Domain</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
