/**
 * Types et interfaces pour PCI-DSS Compliance
 */

/**
 * Log d'audit PCI-DSS
 */
export interface PCIAuditLog {
  id: string;
  timestamp: Date;
  event: string;
  userId?: string | undefined;
  transactionId?: string | undefined;
  ipAddress: string;
  userAgent: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Record<string, any>;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW_REQUIRED';
}

/**
 * Scan de sécurité PCI
 */
export interface PCISecurityScan {
  id: string;
  timestamp: Date;
  scanType: 'VULNERABILITY' | 'PENETRATION' | 'COMPLIANCE' | 'NETWORK';
  status: 'PASSED' | 'FAILED' | 'WARNING';
  findings: PCIFinding[];
  remediationSteps: string[];
}

/**
 * Finding de sécurité PCI
 */
export interface PCIFinding {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'NETWORK' | 'APPLICATION' | 'DATA' | 'ACCESS' | 'ENCRYPTION';
  description: string;
  recommendation: string;
  cveId?: string;
  cvssScore?: number;
}

/**
 * Flux de données PCI
 */
export interface PCIDataFlow {
  id: string;
  source: string;
  destination: string;
  dataType: 'CARD_DATA' | 'AUTH_DATA' | 'PERSONAL_DATA';
  encryptionStatus: 'ENCRYPTED' | 'UNENCRYPTED' | 'PARTIALLY_ENCRYPTED';
  transmissionMethod: 'HTTPS' | 'TLS' | 'SFTP' | 'API';
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT';
}
