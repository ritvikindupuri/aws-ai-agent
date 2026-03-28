CREATE TABLE public.cost_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rule_id text NOT NULL UNIQUE,
  rule_type text NOT NULL,
  threshold numeric,
  multiplier numeric,
  scope text NOT NULL DEFAULT 'total',
  action text NOT NULL DEFAULT 'notify',
  requires_confirm boolean NOT NULL DEFAULT true,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_query text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cost_automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cost automation rules"
  ON public.cost_automation_rules
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cost automation rules"
  ON public.cost_automation_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cost automation rules"
  ON public.cost_automation_rules
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cost automation rules"
  ON public.cost_automation_rules
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage cost automation rules"
  ON public.cost_automation_rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_cost_rules_user_id ON public.cost_automation_rules(user_id);
CREATE INDEX idx_cost_rules_scope ON public.cost_automation_rules(scope);
