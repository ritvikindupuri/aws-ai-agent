import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ChevronDown, ChevronUp, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Finding {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  resource: string;
  timestamp: Date;
  fixPrompt?: string;
}

interface FindingsPanelProps {
  findings: Finding[];
  onClear: () => void;
  onInvestigate: (finding: Finding) => void;
}

const severityConfig = {
  critical: { label: "CRIT", className: "bg-severity-critical text-severity-critical border-destructive/30" },
  high: { label: "HIGH", className: "bg-severity-high text-severity-high border-orange-500/30" },
  medium: { label: "MED", className: "bg-severity-medium text-severity-medium border-warning/30" },
  low: { label: "LOW", className: "bg-severity-low text-severity-low border-info/30" },
};

const FindingsPanel = ({ findings, onClear, onInvestigate }: FindingsPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const counts = {
    critical: findings.filter(f => f.severity === "critical").length,
    high: findings.filter(f => f.severity === "high").length,
    medium: findings.filter(f => f.severity === "medium").length,
    low: findings.filter(f => f.severity === "low").length,
  };

  if (findings.length === 0) return null;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          <span className="text-xs font-medium text-foreground">Findings</span>
          <div className="flex items-center gap-1">
            {counts.critical > 0 && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-severity-critical text-severity-critical">{counts.critical}C</span>}
            {counts.high > 0 && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-severity-high text-severity-high">{counts.high}H</span>}
            {counts.medium > 0 && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-severity-medium text-severity-medium">{counts.medium}M</span>}
            {counts.low > 0 && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-severity-low text-severity-low">{counts.low}L</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); onClear(); }} className="text-muted-foreground hover:text-destructive h-5 w-5 p-0">
            <X className="w-3 h-3" />
          </Button>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border max-h-48 overflow-y-auto scrollbar-thin">
              {findings.map((finding) => {
                const sev = severityConfig[finding.severity];
                return (
                  <button
                    key={finding.id}
                    onClick={() => onInvestigate(finding)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-secondary/40 transition-colors border-b border-border last:border-b-0 text-left"
                  >
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${sev.className}`}>
                      {sev.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{finding.title}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate">{finding.resource}</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FindingsPanel;
