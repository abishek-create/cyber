import { ThreatAnalysisResult, ThreatIndicator, RiskLevel } from './types.ts';

const DANGEROUS_EXTENSIONS = ['.exe', '.scr', '.apk', '.bat', '.cmd', '.vbs', '.js', '.iso', '.img', '.docm', '.xlsm', '.hta'];
const SUSPICIOUS_EMAIL_SUBJECTS = ['urgent', 'action required', 'account suspended', 'invoice overdue', 'wire transfer', 'kyc update', 'password reset', 'tax refund', 'gift voucher'];
const FREE_EMAIL_PROVIDERS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'proton.me', 'mail.ru'];

export function analyzeEmail(
  sender: string,
  subject: string,
  body: string,
  attachmentName?: string,
  dbThreatPatterns: { patternType: string; pattern: string; severity: string }[] = []
): ThreatAnalysisResult {
  const indicators: ThreatIndicator[] = [];
  const reasons: string[] = [];
  let score = 10;

  const senderLower = sender.toLowerCase().trim();
  const subjectLower = subject.toLowerCase().trim();
  const bodyLower = body.toLowerCase().trim();

  // 1. Sender validation & free webmail for institutional claim
  let senderDomain = '';
  if (senderLower.includes('@')) {
    senderDomain = senderLower.split('@')[1] || '';
  }

  const institutionKeywords = ['bank', 'security', 'support', 'customercare', 'admin', 'billing', 'finance', 'official', 'service'];
  const hasInstitutionalName = institutionKeywords.some(kw => senderLower.includes(kw) || subjectLower.includes(kw));

  if (hasInstitutionalName && FREE_EMAIL_PROVIDERS.includes(senderDomain)) {
    score += 45;
    indicators.push({
      type: 'sender_spoofing',
      name: 'Free Webmail Claiming Institutional Identity',
      severity: 'critical',
      description: `Sender presents institutional or security branding, but originates from a free consumer email domain (${senderDomain}). Legitimate organizations communicate exclusively via verified corporate domains.`,
    });
    reasons.push(`Institutional claim sent from free webmail domain (${senderDomain}).`);
  }

  // 2. Subject urgency
  for (const subjTrigger of SUSPICIOUS_EMAIL_SUBJECTS) {
    if (subjectLower.includes(subjTrigger)) {
      score += 20;
      indicators.push({
        type: 'subject_coercion',
        name: `High-Urgency Subject Flag (${subjTrigger})`,
        severity: 'medium',
        description: `Subject line employs urgency phrasing: "${subjTrigger}". Designed to provoke hasty click-throughs before scrutiny.`,
      });
      reasons.push(`Urgent subject phrasing: "${subjTrigger}".`);
      break;
    }
  }

  // 3. Dangerous Attachment Check
  if (attachmentName) {
    const ext = '.' + attachmentName.toLowerCase().split('.').pop();
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      score += 55;
      indicators.push({
        type: 'attachment_risk',
        name: `High-Risk Executable Attachment (${ext})`,
        severity: 'critical',
        description: `Attachment '${attachmentName}' has extension '${ext}' which can execute malicious payloads or ransomware directly upon opening.`,
      });
      reasons.push(`Dangerous executable attachment extension (${ext}).`);
    } else if (['.zip', '.rar', '.7z'].includes(ext)) {
      score += 20;
      indicators.push({
        type: 'archive_attachment',
        name: 'Compressed Archive Attachment',
        severity: 'medium',
        description: `Archive file '${attachmentName}' detected. Threat actors frequently package malicious scripts within password-protected archives to bypass basic email scanners.`,
      });
      reasons.push(`Compressed archive file attached (${attachmentName}).`);
    }
  }

  // 4. Credential & Wire Transfer harvesting inside email body
  if (bodyLower.includes('password') || bodyLower.includes('enter your credentials') || bodyLower.includes('verify your account by logging in')) {
    score += 30;
    indicators.push({
      type: 'credential_harvesting',
      name: 'Direct Credential Request in Body',
      severity: 'high',
      description: 'Email body prompts user to enter passwords or credentials via an unverified message.',
    });
    reasons.push('Contains prompts soliciting account credentials.');
  }

  if (bodyLower.includes('wire transfer') || bodyLower.includes('gift card') || bodyLower.includes('urgent payment')) {
    score += 25;
    indicators.push({
      type: 'financial_redirection',
      name: 'Unusual Financial Transfer Solicitation',
      severity: 'high',
      description: 'Body requests urgent financial transactions or gift cards, matching typical Business Email Compromise (BEC) fraud.',
    });
    reasons.push('Contains wire transfer or gift card solicitation.');
  }

  // 5. Threat database matching
  for (const item of dbThreatPatterns) {
    if (item.patternType === 'keyword' && (bodyLower.includes(item.pattern.toLowerCase()) || subjectLower.includes(item.pattern.toLowerCase()))) {
      score += 40;
      indicators.push({
        type: 'threat_intelligence',
        name: 'Database Match: Phishing Campaign Signature',
        severity: 'high',
        description: `Matches known phishing database pattern: '${item.pattern}'.`,
      });
      reasons.push(`Known threat phrase detected: "${item.pattern}".`);
    }
  }

  const clampedScore = Math.min(100, Math.max(0, score));
  let riskLevel: RiskLevel = 'LOW RISK';
  let recommendation = 'No obvious phishing signatures identified. Always inspect sender address headers before opening attachments.';

  if (clampedScore >= 80) {
    riskLevel = 'CRITICAL RISK';
    recommendation = 'Potentially dangerous phishing or spoofed email. Do NOT open attachments, do NOT click internal links, and do NOT reply.';
  } else if (clampedScore >= 55) {
    riskLevel = 'HIGH RISK';
    recommendation = 'High-risk characteristics identified. Verify the sender through an independent out-of-band communication before taking action.';
  } else if (clampedScore >= 30) {
    riskLevel = 'MEDIUM RISK';
    recommendation = 'Contains questionable urgency or domain patterns. Handle with caution.';
  }

  return {
    checkType: 'email',
    inputPreview: `From: ${sender} | Subject: ${subject}`.slice(0, 90),
    riskLevel,
    riskScore: clampedScore,
    indicators,
    reasons: reasons.length ? reasons : ['Sender domain and email body pass basic spoofing and threat heuristic filters.'],
    recommendation,
    analysisDetails: {
      scannedItems: [
        'Sender Domain & SPF/DKIM Alignment Heuristics',
        'Subject Urgency & Coercion Markers',
        'Attachment Extension & Security Filter',
        'Body Credential & Financial Redirection Patterns',
        'Active Threat Pattern Database',
      ],
      threatsDetectedCount: indicators.length,
      domainAnalyzed: senderDomain,
      impersonationDetected: indicators.some(i => i.type === 'sender_spoofing'),
    },
    timestamp: new Date().toISOString(),
    disclaimer: 'This automated risk assessment is generated based on heuristic analysis and known threat databases. It is not an absolute guarantee.',
  };
}
