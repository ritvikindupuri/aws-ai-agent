export interface ComplianceReportRecord {
  id: string;
  content: string;
  created_at: string;
  conversation_id: string;
  conversation_title: string;
}

export interface FrameworkSummary {
  key: string;
  label: string;
  aliases: RegExp;
  reportsCount: number;
  passSignals: number;
  failSignals: number;
  notApplicableSignals: number;
  latestSeenAt: string | null;
  score: number | null;
}

export interface ControlTrendPoint {
  id: string;
  createdAt: string;
  label: string;
  passCount: number;
  failCount: number;
  notApplicableCount: number;
}

const FRAMEWORKS = [
  { key: "cis", label: "CIS AWS Foundations", aliases: /\bcis\b|\bcis aws foundations\b/i },
  { key: "nist", label: "NIST 800-53", aliases: /\bnist\b|\b800-53\b/i },
  { key: "pci", label: "PCI-DSS", aliases: /\bpci\b|\bpci-dss\b/i },
  { key: "iso27001", label: "ISO 27001", aliases: /\biso\b|\biso 27001\b/i },
  { key: "soc2", label: "SOC 2", aliases: /\bsoc ?2\b/i },
  { key: "hipaa", label: "HIPAA", aliases: /\bhipaa\b/i },
] as const;

const PASS_PATTERN = /\bpass(?:ed|ing)?\b/gi;
const FAIL_PATTERN = /\bfail(?:ed|ing)?\b|\bnon-?compliant\b/gi;
const NA_PATTERN = /\bnot applicable\b|\bnot assessed\b|\bn\/a\b/gi;

function countPattern(source: string, pattern: RegExp) {
  return source.match(pattern)?.length ?? 0;
}

function extractRiskPenalty(content: string) {
  const normalized = content.toLowerCase();
  if (/\bcritical\b/.test(normalized)) return 35;
  if (/\bhigh\b/.test(normalized)) return 20;
  if (/\bmedium\b/.test(normalized)) return 10;
  if (/\blow\b/.test(normalized)) return 5;
  return 0;
}

export function deriveFrameworkSummaries(reports: ComplianceReportRecord[]): FrameworkSummary[] {
  return FRAMEWORKS.map((framework) => {
    const matchingReports = reports.filter((report) => framework.aliases.test(report.content));
    let passSignals = 0;
    let failSignals = 0;
    let notApplicableSignals = 0;
    let latestSeenAt: string | null = null;

    for (const report of matchingReports) {
      const lines = report.content.split("\n").filter((line) => framework.aliases.test(line) || framework.aliases.test(report.content));
      const scannedContent = lines.length > 0 ? lines.join("\n") : report.content;
      passSignals += countPattern(scannedContent, PASS_PATTERN);
      failSignals += countPattern(scannedContent, FAIL_PATTERN);
      notApplicableSignals += countPattern(scannedContent, NA_PATTERN);

      if (!latestSeenAt || new Date(report.created_at) > new Date(latestSeenAt)) {
        latestSeenAt = report.created_at;
      }
    }

    const denominator = passSignals + failSignals;
    const score = denominator > 0 ? Math.max(0, Math.min(100, Math.round((passSignals / denominator) * 100))) : matchingReports.length > 0 ? Math.max(0, 100 - Math.min(60, matchingReports.reduce((sum, report) => sum + extractRiskPenalty(report.content), 0) / matchingReports.length)) : null;

    return {
      key: framework.key,
      label: framework.label,
      aliases: framework.aliases,
      reportsCount: matchingReports.length,
      passSignals,
      failSignals,
      notApplicableSignals,
      latestSeenAt,
      score,
    };
  });
}

export function deriveControlTrends(reports: ComplianceReportRecord[]): ControlTrendPoint[] {
  return reports
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((report) => ({
      id: report.id,
      createdAt: report.created_at,
      label: new Date(report.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
      passCount: countPattern(report.content, PASS_PATTERN),
      failCount: countPattern(report.content, FAIL_PATTERN),
      notApplicableCount: countPattern(report.content, NA_PATTERN),
    }));
}

export function getFrameworkOptions() {
  return FRAMEWORKS.map(({ key, label }) => ({ key, label }));
}

export function summarizeControlHealth(frameworks: FrameworkSummary[]) {
  return frameworks.reduce(
    (acc, item) => {
      acc.passSignals += item.passSignals;
      acc.failSignals += item.failSignals;
      acc.notApplicableSignals += item.notApplicableSignals;
      return acc;
    },
    { passSignals: 0, failSignals: 0, notApplicableSignals: 0 },
  );
}

export function formatFrameworkKey(value: string) {
  const found = FRAMEWORKS.find((framework) => framework.key === value);
  return found?.label ?? value;
}
