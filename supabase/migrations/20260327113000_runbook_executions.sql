create table if not exists public.runbook_executions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  runbook_id text not null,
  runbook_name text not null,
  trigger_query text not null,
  dry_run boolean not null default false,
  status text not null default 'PLANNED',
  current_step_index integer not null default 0,
  steps jsonb not null default '[]'::jsonb,
  results jsonb not null default '[]'::jsonb,
  approved_by uuid references auth.users(id) on delete set null,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.runbook_execution_steps (
  id uuid primary key default gen_random_uuid(),
  execution_id uuid not null references public.runbook_executions(id) on delete cascade,
  step_id text not null,
  step_order integer not null,
  step_name text not null,
  risk text not null,
  status text not null,
  output text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (execution_id, step_id)
);

alter table public.runbook_executions enable row level security;
alter table public.runbook_execution_steps enable row level security;

create policy "Users can view their own runbook executions"
on public.runbook_executions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own runbook executions"
on public.runbook_executions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own runbook executions"
on public.runbook_executions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Service role can manage runbook executions"
on public.runbook_executions
for all
to service_role
using (true)
with check (true);

create policy "Users can view steps for their own runbook executions"
on public.runbook_execution_steps
for select
to authenticated
using (
  exists (
    select 1
    from public.runbook_executions re
    where re.id = execution_id
      and re.user_id = auth.uid()
  )
);

create policy "Users can insert steps for their own runbook executions"
on public.runbook_execution_steps
for insert
to authenticated
with check (
  exists (
    select 1
    from public.runbook_executions re
    where re.id = execution_id
      and re.user_id = auth.uid()
  )
);

create policy "Users can update steps for their own runbook executions"
on public.runbook_execution_steps
for update
to authenticated
using (
  exists (
    select 1
    from public.runbook_executions re
    where re.id = execution_id
      and re.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.runbook_executions re
    where re.id = execution_id
      and re.user_id = auth.uid()
  )
);

create policy "Service role can manage runbook execution steps"
on public.runbook_execution_steps
for all
to service_role
using (true)
with check (true);
