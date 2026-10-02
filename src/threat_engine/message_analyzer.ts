import { ThreatAnalysisResult, ThreatIndicator, RiskLevel } from './types.ts';

const URGENCY_TRIGGERS = [
  'immediately', 'today only', 'within 24 hours', 'account will be blocked',
  'account suspended', 'electricity cut', 'power disconnect', 'urgent',
  'last warning', 'final notice', 'action required', 'deactivation notice'
];

const CREDENTIAL_TRIGGERS = [
  'otp', 'pin', 'upi pin', 'cvv', 'password', 'verify kyc', 'pan card update',
  'aadhaar', 'claim reward', 'bank account verify', 'debit card expire'
];

const FINANCIAL_LURE_TRIGGERS = [
  'lottery', 'winner', 'congratulations', 'won ₹', 'won $', 'part time job',
  'daily earnings', 'like youtube', 'rate hotel', 'prepaid task', 'crypto deposit',
  'free iphone', 'cashback', 'credit limit increase'
];

export function analyzeMessage(text: string, dbThreatPatterns: { patternType: string; pattern: string; severity: string }[] = []): ThreatAnalysisResult {
  const content = text.toLowerCase();
  const indicators: ThreatIndicator[] = [];
  const reasons: string[] = [];
  let score = 8; // Baseline

  // 1. Urgency detection
  const detectedUrgency = URGENCY_TRIGGERS.filter(trigger => content.includes(trigger));
  if (detectedUrgency.length > 0) {
    score += Math.min(30, detectedUrgency.length * 15);
    indicators.push({
      type: 'urgency',
      name: 'High-Pressure Urgency Language',
      severity: detectedUrgency.length > 1 ? 'high' : 'medium',
      description: `Contains artificial urgency signals: [${detectedUrgency.join(', ')}]. Scammers induce psychological panic to prevent victims from verifying claims.`,
    });
    reasons.push(`Contains urgent psychological coercion: ${detectedUrgency.join(', ')}.`);
  }

  // 2. Sensitive credential requests
  const detectedCredentials = CREDENTIAL_TRIGGERS.filter(trigger => content.includes(trigger));
  if (detectedCredentials.length > 0) {
    score += 40;
    indicators.push({
      type: 'credential_harvesting',
      name: 'Sensitive Credential / OTP Request',
      severity: 'critical',
      description: `Message references sensitive authorization factors: [${detectedCredentials.join(', ')}]. Legitimate financial institutions never solicit OTPs, PINs, or passwords.`,
    });
    reasons.push(`Solicits sensitive credentials: ${detectedCredentials.join(', ')}.`);
  }

  // 3. Financial lure / Advance-fee / Task scam patterns
  const detectedLures = FINANCIAL_LURE_TRIGGERS.filter(trigger => content.includes(trigger));
  if (detectedLures.length > 0) {
    score += 35;
    indicators.push({
      type: 'financial_lure',
      name: 'Scam Incentive / Task Fraud Pattern',
      severity: 'high',
      description: `Unrealistic financial incentives detected: [${detectedLures.join(', ')}]. Typical in Telegram task scams and advance-fee lottery fraud.`,
    });
    reasons.push(`Contains advance-fee or task scam indicators: ${detectedLures.join(', ')}.`);
  }

  // 4. Embedded URL detection
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(top|xyz|biz|tk|click|info)[^\s]*)/gi;
  const urlsFound = text.match(urlRegex) || [];
  if (urlsFound.length > 0) {
    score += 20;
    indicators.push({
      type: 'embedded_link',
      name: 'Unverified External Link in Message',
      severity: 'medium',
      description: `Contains embedded link: ${urlsFound[0]}. Scammers use unverified short links to lead users to credential-harvesting landing pages.`,
    });
    reasons.push(`Contains unverified external link (${urlsFound[0]}).`);
  }

  // 5. Threat database matching
  for (const item of dbThreatPatterns) {
    if (item.patternType === 'keyword' && content.includes(item.pattern.toLowerCase())) {
      score += 45;
      indicators.push({
        type: 'threat_intelligence',
        name: 'Database Match: Known Scam Keyword',
        severity: item.severity === 'critical' ? 'critical' : 'high',
        description: `Direct match against active scam phrase database: '${item.pattern}'.`,
      });
      reasons.push(`Matches reported threat intelligence phrase: "${item.pattern}".`);
    }
  }

  const clampedScore = Math.min(100, Math.max(0, score));
  let riskLevel: RiskLevel = 'LOW RISK';
  let recommendation = 'No distinct scam patterns identified. Always verify unexpected contacts through official support channels.';

  if (clampedScore >= 80) {
    riskLevel = 'CRITICAL RISK';
    recommendation = 'Strong probability of a cyber scam or phishing attempt. Do NOT click any links, do NOT reply, and NEVER share OTPs or UPI PINs.';
  } else if (clampedScore >= 55) {
    riskLevel = 'HIGH RISK';
    recommendation = 'Multiple suspicious indicators detected. Do not provide information or transfer money. Verify with the sender via an independent telephone call.';
  } else if (clampedScore >= 30) {
    riskLevel = 'MEDIUM RISK';
    recommendation = 'Contains questionable wording or urgency. Proceed with caution and do not disclose personal identifiers.';
  }

  return {
    checkType: 'message',
    inputPreview: text.length > 100 ? text.slice(0, 100) + '...' : text,
    riskLevel,
    riskScore: clampedScore,
    indicators,
    reasons: reasons.length ? reasons : ['No coercive or credential-harvesting patterns found.'],
    recommendation,
    analysisDetails: {
      scannedItems: [
        'Urgency & Coercion Heuristics',
        'OTP & UPI PIN Solicitation Analysis',
        'Advance-Fee & Lottery Patterns',
        'Task Investment Scam Patterns',
        'Embedded Link & Redirection Detection',
        'Active Threat Pattern Database',
      ],
      threatsDetectedCount: indicators.length,
      urgencyScore: detectedUrgency.length,
      impersonationDetected: indicators.some(i => i.type === 'credential_harvesting'),
    },
    timestamp: new Date().toISOString(),
    disclaimer: 'This automated risk assessment is generated based on heuristic analysis and known threat databases. It is not an absolute guarantee.',
  };
}
