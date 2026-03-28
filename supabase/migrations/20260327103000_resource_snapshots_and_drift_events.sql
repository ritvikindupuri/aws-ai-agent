create table if not exists public.resource_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id text not null,
  resource_type text not null,
  account_id text not null,
  region text not null,
  state jsonb not null,
  fingerprint text not null,
  captured_at timestamptz not null,
  is_baseline boolean not null default false,
  unique (user_id, resource_id, resource_type, account_id)
);

create table if not exists public.drift_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id text not null,
  region text not null,
  resource_id text not null,
  resource_type text not null,
  change_type text not null,
  severity text not null,
  title text not null,
  baseline_state jsonb,
  current_state jsonb,
  diff jsonb not null,
  explanation text,
  fix_prompt text,
  resolved boolean not null default false,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  detected_at timestamptz not null
);

alter table public.resource_snapshots enable row level security;
alter table public.drift_events enable row level security;

create policy "Users can view their own resource snapshots"
on public.resource_snapshots
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own resource snapshots"
on public.resource_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own resource snapshots"
on public.resource_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Service role can manage resource snapshots"
on public.resource_snapshots
for all
to service_role
using (true)
with check (true);

create policy "Users can view their own drift events"
on public.drift_events
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own drift events"
on public.drift_events
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own drift events"
on public.drift_events
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Service role can manage drift events"
on public.drift_events
for all
to service_role
using (true)
with check (true);
