import { useState } from "react";
import { Shield, Loader2, CheckCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MfaSetupProps {
  onComplete?: () => void;
}

const MfaSetup = ({ onComplete }: MfaSetupProps) => {
  const [step, setStep] = useState<"idle" | "enrolling" | "verifying" | "complete">("idle");
  const [factorId, setFactorId] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "CloudPilot Authenticator",
      });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep("enrolling");
    } catch (err: any) {
      toast.error(err.message || "Failed to start MFA enrollment");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Enter a 6-digit code from your authenticator app");
      return;
    }
    setLoading(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) throw verify.error;

      setStep("complete");
      toast.success("MFA enabled successfully!");
      onComplete?.();
    } catch (err: any) {
      toast.error(err.message || "Verification failed. Check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success("Secret copied to clipboard");
  };

  if (step === "complete") {
    return (
      <div className="border border-primary/20 rounded-lg bg-primary/5 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-foreground">MFA Enabled</p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Two-factor authentication is active on your account. You'll need your authenticator app to sign in.
        </p>
      </div>
    );
  }

  if (step === "enrolling") {
    return (
      <div className="border border-border rounded-lg bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Set Up MFA</p>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
          </p>
          
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
          </div>

          <div className="flex items-center gap-2">
            <code className="flex-1 text-[10px] font-mono bg-muted px-2 py-1.5 rounded border border-border text-muted-foreground break-all">
              {secret}
            </code>
            <button onClick={copySecret} className="text-muted-foreground hover:text-foreground">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Verification Code</p>
            <Input
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="font-mono text-center text-lg h-10 tracking-[0.3em]"
              maxLength={6}
            />
          </div>

          <Button
            variant="terminal"
            onClick={handleVerify}
            disabled={loading || verifyCode.length !== 6}
            className="w-full"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Enable MFA"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg bg-card p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Shield className="w-3 h-3 text-muted-foreground" />
        <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">MFA</p>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Protect your account with TOTP two-factor authentication.
      </p>
      <Button
        variant="action"
        size="sm"
        onClick={handleEnroll}
        disabled={loading}
        className="w-full text-xs"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Enable MFA"}
      </Button>
    </div>
  );
};

export default MfaSetup;
