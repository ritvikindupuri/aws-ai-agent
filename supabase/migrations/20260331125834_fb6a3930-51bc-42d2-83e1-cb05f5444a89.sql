
-- Notification webhooks table for Slack/PagerDuty/generic webhook integrations
CREATE TABLE IF NOT EXISTS public.notification_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel_type TEXT NOT NULL DEFAULT 'slack',
  webhook_url TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT 'Default',
  subscribed_events JSONB NOT NULL DEFAULT '["guardian_alert","auto_fix","drift_detected","cost_anomaly"]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own webhooks" ON public.notification_webhooks
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access on notification_webhooks" ON public.notification_webhooks
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Add unique constraint for stored_aws_credentials upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stored_aws_credentials_user_id_label_key'
  ) THEN
    ALTER TABLE public.stored_aws_credentials ADD CONSTRAINT stored_aws_credentials_user_id_label_key UNIQUE (user_id, label);
  END IF;
END $$;
