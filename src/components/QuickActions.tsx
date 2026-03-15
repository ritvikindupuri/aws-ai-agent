import {
  Shield, Search, AlertTriangle, Lock, Server,
  Database, Globe, Users, FileSearch, Zap,
  Eye, Activity, Network, HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onAction: (prompt: string) => void;
  disabled?: boolean;
}

const categories = [
  {
    label: "AUDIT",
    actions: [
      { icon: Search, label: "S3 Buckets", prompt: "Audit all S3 buckets: check for public access, missing encryption, absent logging, and overly permissive bucket policies. Provide a severity-ranked findings table." },
      { icon: Lock, label: "IAM Posture", prompt: "Comprehensive IAM audit: check for users without MFA, overly permissive policies (especially AdministratorAccess and *:* wildcards), unused credentials older than 90 days, and access key rotation status." },
      { icon: AlertTriangle, label: "Security Groups", prompt: "Audit all security groups for dangerous inbound rules: 0.0.0.0/0 on SSH(22), RDP(3389), database ports(3306,5432,1433,27017), and any unrestricted ingress. Rank by severity." },
      { icon: Server, label: "EC2 Instances", prompt: "Assess all EC2 instances: check for public IPs, IMDSv2 enforcement, unencrypted EBS volumes, missing Systems Manager agent, and instances running without IAM roles." },
    ],
  },
  {
    label: "COMPLIANCE",
    actions: [
      { icon: Shield, label: "CIS Benchmark", prompt: "Run a CIS AWS Foundations Benchmark v3.0 assessment covering: IAM, logging, monitoring, networking, and storage controls. Report pass/fail status for each control." },
      { icon: Eye, label: "CloudTrail", prompt: "Verify CloudTrail configuration: multi-region trail enabled, log file validation, S3 bucket access logging, KMS encryption, and CloudWatch integration. Check for any logging gaps." },
      { icon: Database, label: "RDS Security", prompt: "Audit all RDS instances: public accessibility, encryption at rest and in transit, automated backups, deletion protection, and IAM authentication status." },
      { icon: Activity, label: "GuardDuty Status", prompt: "Check GuardDuty status across all regions. List any active findings sorted by severity. Verify S3 protection and EKS protection are enabled." },
    ],
  },
  {
    label: "INCIDENT RESPONSE",
    actions: [
      { icon: Zap, label: "Isolate Instance", prompt: "Guide me through isolating a potentially compromised EC2 instance: create quarantine security group, snapshot volumes for forensics, disable instance metadata, and preserve CloudTrail logs." },
      { icon: FileSearch, label: "Credential Audit", prompt: "Emergency credential audit: list all active IAM access keys, their last used dates, and associated permissions. Identify any keys that should be immediately rotated or deactivated." },
      { icon: Network, label: "Network Forensics", prompt: "Analyze VPC Flow Logs for suspicious patterns: unusual outbound connections, data exfiltration indicators, lateral movement between subnets, and communication with known-bad IP ranges." },
      { icon: HardDrive, label: "Snapshot Forensics", prompt: "Create forensic snapshots: guide me through capturing EBS snapshots, memory dumps, and metadata preservation for a compromised instance while maintaining chain of custody." },
    ],
  },
  {
    label: "REMEDIATION",
    actions: [
      { icon: Globe, label: "Close Public Access", prompt: "Generate remediation commands to close all public access: restrict S3 bucket policies, remove 0.0.0.0/0 security group rules, enable S3 Block Public Access at account level, and disable public RDS endpoints." },
      { icon: Users, label: "Enforce MFA", prompt: "Generate a remediation plan to enforce MFA: create IAM policy denying actions without MFA, list all users without MFA enabled, and provide step-by-step enrollment commands." },
      { icon: Lock, label: "Encrypt Everything", prompt: "Audit and remediate encryption: enable default EBS encryption, encrypt unencrypted RDS instances, enable S3 default encryption with KMS, and enforce TLS for all services." },
      { icon: Shield, label: "Harden Config", prompt: "Generate a hardening checklist: enable AWS Config rules, set up Security Hub, configure access analyzer, enable EBS default encryption, enforce IMDSv2, and restrict root account usage." },
    ],
  },
];

const QuickActions = ({ onAction, disabled }: QuickActionsProps) => {
  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.label}>
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2 px-1">{cat.label}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {cat.actions.map((action) => (
              <Button
                key={action.label}
                variant="action"
                size="xs"
                onClick={() => onAction(action.prompt)}
                disabled={disabled}
                className="flex items-center gap-1.5 justify-start h-auto py-2 px-2.5"
              >
                <action.icon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickActions;
