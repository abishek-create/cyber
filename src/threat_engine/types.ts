export type RiskLevel = 'LOW RISK' | 'MEDIUM RISK' | 'HIGH RISK' | 'CRITICAL RISK' | 'UNKNOWN';

export interface ThreatIndicator {
  type: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface ThreatAnalysisResult {
  checkType: 'url' | 'message' | 'email' | 'phone';
  inputPreview: string;
  riskLevel: RiskLevel;
  riskScore: number;
  indicators: ThreatIndicator[];
  reasons: string[];
  recommendation: string;
  analysisDetails: {
    scannedItems: string[];
    threatsDetectedCount: number;
    protocolChecked?: string;
    domainAnalyzed?: string;
    urgencyScore?: number;
    impersonationDetected?: boolean;
  };
  timestamp: string;
  disclaimer: string;
}
