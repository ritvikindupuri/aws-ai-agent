import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const ENV = {
  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
};

const _awsModuleCache: Record<string, any> = {};
async function loadAwsModule(service: string): Promise<any> {
  if (_awsModuleCache[service]) return _awsModuleCache[service];
  let mod: any;
  switch (service) {
    case "IAM": mod = await import("npm:@aws-sdk/client-iam@3.744.0"); break;
    case "EC2": mod = await import("npm:@aws-sdk/client-ec2@3.744.0"); break;
    case "S3": mod = await import("npm:@aws-sdk/client-s3@3.744.0"); break;
    case "STS": mod = await import("npm:@aws-sdk/client-sts@3.744.0"); break;
    case "Organizations": mod = await import("npm:@aws-sdk/client-organizations@3.744.0"); break;
    case "CloudWatch": mod = await import("npm:@aws-sdk/client-cloudwatch@3.744.0"); break;
    case "CostExplorer": mod = await import("npm:@aws-sdk/client-cost-explorer@3.744.0"); break;
    case "SNS": mod = await import("npm:@aws-sdk/client-sns@3.744.0"); break;
    case "CloudTrail": mod = await import("npm:@aws-sdk/client-cloudtrail@3.744.0"); break;
    case "CloudWatchLogs": mod = await import("npm:@aws-sdk/client-cloudwatch-logs@3.744.0"); break;
    default: throw new Error(`Unsupported AWS service: ${service}`);
  }
  _awsModuleCache[service] = mod;
  return mod;
}




const IPV4_ANYWHERE = "0.0.0.0/0";
const IPV6_ANYWHERE = "::/0";



serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { toolCalls, awsConfig, userId, conversationId, notificationEmail, userHasConfirmedMutation, latestUserMessage } = body;
    const supabaseAdmin = createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey);
    const apiMessages: any[] = [];
    let latestUnifiedAuditSummary: Record<string, any> | null = null;


    for (const toolCall of toolCalls) {






    }

    const results = apiMessages
      .filter((m: any) => m.role === "tool")
      .map((m: any) => ({
        toolCallId: m.tool_call_id,
        content: m.content,
        auditSummary: latestUnifiedAuditSummary || undefined,
      }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[CloudPilot Scanner] Fatal error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
