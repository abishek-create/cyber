import { ThreatAnalysisResult, ThreatIndicator, RiskLevel } from './types.ts';

const SUSPICIOUS_TLDS = ['.top', '.xyz', '.biz', '.click', '.tk', '.work', '.download', '.live', '.link', '.ru', '.rest', '.quest', '.country'];
const SUSPICIOUS_KEYWORDS = [
  'login', 'signin', 'verify', 'verification', 'bank', 'secure', 'security',
  'claim', 'reward', 'gift', 'bonus', 'wallet', 'kyc', 'otp', 'update',
  'account', 'confirm', 'suspend', 'reactivate', 'bill', 'lottery', 'winner', 'free'
];
const TARGET_BRANDS = [
  'sbi', 'hdfc', 'icici', 'axis', 'paytm', 'phonepe', 'gpay', 'google',
  'microsoft', 'apple', 'amazon', 'netflix', 'paypal', 'facebook', 'instagram'
];

export function analyzeUrl(rawUrl: string, dbThreatPatterns: { patternType: string; pattern: string; severity: string }[] = []): ThreatAnalysisResult {
  const indicators: ThreatIndicator[] = [];
  const reasons: string[] = [];
  let score = 5; // Baseline low risk

  let parsed: URL | null = null;
  let formattedUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(formattedUrl)) {
    formattedUrl = 'https://' + formattedUrl;
  }

  try {
    parsed = new URL(formattedUrl);
  } catch {
    return {
      checkType: 'url',
      inputPreview: rawUrl.slice(0, 80),
      riskLevel: 'UNKNOWN',
      riskScore: 0,
      indicators: [{
        type: 'syntax',
        name: 'Malformed URL Syntax',
        severity: 'low',
        description: 'The provided input could not be parsed as a valid web URL.',
      }],
      reasons: ['Malformed URL structure.'],
      recommendation: 'Please enter a well-formed URL (e.g., https://example.com/page).',
      analysisDetails: { scannedItems: ['URL Syntax Validation'], threatsDetectedCount: 1 },
      timestamp: new Date().toISOString(),
      disclaimer: 'This automated risk assessment is generated based on heuristic analysis and known threat databases. It is not an absolute guarantee.',
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();

  // 1. Protocol check
  if (protocol === 'http:') {
    score += 25;
    indicators.push({
      type: 'transport',
      name: 'Unencrypted HTTP Transport',
      severity: 'medium',
      description: 'The URL uses unencrypted HTTP. Legitimate banking and authentication portals always require HTTPS encryption.',
    });
    reasons.push('Uses unencrypted HTTP connection.');
  }

  // 2. IP Address check
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith('[') && hostname.endsWith(']');
  if (isIpAddress) {
    score += 45;
    indicators.push({
      type: 'host',
      name: 'Direct IP Address Hostname',
      severity: 'high',
      description: 'The URL connects directly to a raw numeric IP address instead of an authenticated domain name. This is a common tactic in malware hosting and credential harvesting.',
    });
    reasons.push('Direct IP address used instead of domain name.');
  }

  // 3. Suspicious TLD check
  for (const tld of SUSPICIOUS_TLDS) {
    if (hostname.endsWith(tld)) {
      score += 25;
      indicators.push({
        type: 'tld',
        name: `High-Risk Top-Level Domain (${tld})`,
        severity: 'medium',
        description: `Domain uses '${tld}', which has a statistically elevated frequency in temporary phishing campaigns.`,
      });
      reasons.push(`Uses high-risk top-level domain ${tld}.`);
      break;
    }
  }

  // 4. Excessive Subdomains / Domain Obfuscation
  const domainParts = hostname.split('.');
  if (domainParts.length >= 4) {
    score += 20;
    indicators.push({
      type: 'structure',
      name: 'Excessive Subdomain Stacking',
      severity: 'medium',
      description: 'Multiple subdomains detected. Threat actors often nest brand names inside deep subdomains to deceive mobile browser address bars.',
    });
    reasons.push('Multiple subdomains indicate potential domain masking.');
  }

  // 5. Brand Impersonation / Typosquatting
  for (const brand of TARGET_BRANDS) {
    if (hostname.includes(brand)) {
      // Check if it's the official domain
      const isOfficial = hostname === `${brand}.com` ||
        hostname.endsWith(`.${brand}.com`) ||
        hostname === `${brand}.in` ||
        hostname.endsWith(`.${brand}.in`) ||
        hostname === `${brand}.co.in` ||
        hostname.endsWith(`.${brand}.co.in`) ||
        hostname === `${brand}.org` ||
        hostname.endsWith(`.${brand}.org`);

      if (!isOfficial) {
        score += 50;
        indicators.push({
          type: 'impersonation',
          name: `Suspected Brand Impersonation (${brand.toUpperCase()})`,
          severity: 'critical',
          description: `The hostname includes brand keyword '${brand}', but does not belong to the authentic organization's primary domain namespace.`,
        });
        reasons.push(`Contains target brand keyword '${brand}' outside authentic namespace.`);
      }
    }
  }

  // 6. Suspicious credential / panic keywords in URL path or query
  const fullPathAndQuery = (pathname + parsed.search).toLowerCase();
  const detectedKeywords: string[] = [];
  for (const kw of SUSPICIOUS_KEYWORDS) {
    if (fullPathAndQuery.includes(kw) || hostname.includes(kw)) {
      detectedKeywords.push(kw);
    }
  }

  if (detectedKeywords.length >= 2) {
    score += Math.min(30, detectedKeywords.length * 10);
    indicators.push({
      type: 'keywords',
      name: 'Credential & Panic Keywords Detected',
      severity: 'high',
      description: `URL contains sensitive lure keywords: [${detectedKeywords.slice(0, 4).join(', ')}]. Frequently observed in fraudulent harvesting pages.`,
    });
    reasons.push(`Contains sensitive keywords: ${detectedKeywords.slice(0, 4).join(', ')}.`);
  }

  // 7. Non-standard port check
  if (parsed.port && !['80', '443'].includes(parsed.port)) {
    score += 20;
    indicators.push({
      type: 'network',
      name: `Non-Standard Port (:${parsed.port})`,
      severity: 'medium',
      description: `Connection routed over custom port :${parsed.port}, atypical for official public websites.`,
    });
    reasons.push(`Custom network port :${parsed.port} detected.`);
  }

  // 8. Match against threat intelligence database
  for (const item of dbThreatPatterns) {
    if (item.patternType === 'domain' && (hostname === item.pattern.toLowerCase() || hostname.endsWith(`.${item.pattern.toLowerCase()}`))) {
      score += 65;
      indicators.push({
        type: 'threat_intelligence',
        name: 'Database Match: Known Deceptive Domain',
        severity: 'critical',
        description: `Matches known high-risk domain list: ${item.pattern}.`,
      });
      reasons.push(`Direct match in threat intelligence database (${item.pattern}).`);
    }
  }

  // Risk Score calculation
  const clampedScore = Math.min(100, Math.max(0, score));
  let riskLevel: RiskLevel = 'LOW RISK';
  let recommendation = 'No immediate high-risk indicators detected on this URL. Exercise standard caution before entering sensitive details.';

  if (clampedScore >= 80) {
    riskLevel = 'CRITICAL RISK';
    recommendation = 'Potentially dangerous website. Do NOT enter passwords, OTPs, UPI PINs, or banking details. Do not download any files.';
  } else if (clampedScore >= 55) {
    riskLevel = 'HIGH RISK';
    recommendation = 'High-risk indicators detected. Strongly advise against submitting personal credentials or financial authorizations.';
  } else if (clampedScore >= 30) {
    riskLevel = 'MEDIUM RISK';
    recommendation = 'Some suspicious characteristics detected. Verify the authentic domain independently before taking action.';
  }

  return {
    checkType: 'url',
    inputPreview: rawUrl.length > 90 ? rawUrl.slice(0, 90) + '...' : rawUrl,
    riskLevel,
    riskScore: clampedScore,
    indicators,
    reasons: reasons.length ? reasons : ['Domain structure appears consistent with standard web formatting.'],
    recommendation,
    analysisDetails: {
      scannedItems: [
        'Transport Security Protocol',
        'Hostname & Domain Resolution',
        'Top-Level Domain Reputation',
        'Subdomain Depth & Masking',
        'Brand Impersonation & Typosquatting',
        'Path Heuristics & Keywords',
        'Active Threat Intelligence Database',
      ],
      threatsDetectedCount: indicators.length,
      protocolChecked: protocol,
      domainAnalyzed: hostname,
      impersonationDetected: indicators.some(i => i.type === 'impersonation'),
    },
    timestamp: new Date().toISOString(),
    disclaimer: 'This automated risk assessment is generated based on heuristic analysis and known threat databases. It is not an absolute guarantee.',
  };
}
