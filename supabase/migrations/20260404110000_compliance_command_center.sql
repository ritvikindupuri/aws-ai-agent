create table if not exists public.compliance_exceptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  framework text not null,
  control_id text not null,
  title text not null,
  justification text not null,
  status text not null default 'open',
  severity text not null default 'medium',
  owner_email text,
  approved_by text,
  expires_at timestamptz,
  evidence_export_id uuid references public.compliance_evidence_exports(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compliance_exceptions_user_created_at_idx
  on public.compliance_exceptions (user_id, created_at desc);

create index if not exists compliance_exceptions_framework_status_idx
  on public.compliance_exceptions (framework, status);

create table if not exists public.compliance_attestations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  framework text not null,
  title text not null,
  control_scope text not null default 'all_controls',
  cadence text not null default 'quarterly',
  owner_email text,
  due_at timestamptz not null,
  status text not null default 'scheduled',
  notes text,
  latest_export_id uuid references public.compliance_evidence_exports(id) on delete set null,
  last_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists compliance_attestations_user_due_at_idx
  on public.compliance_attestations (user_id, due_at asc);

create index if not exists compliance_attestations_framework_status_idx
  on public.compliance_attestations (framework, status);

alter table public.compliance_exceptions enable row level security;
alter table public.compliance_attestations enable row level security;

create policy "Users can view own compliance exceptions"
on public.compliance_exceptions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create own compliance exceptions"
on public.compliance_exceptions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own compliance exceptions"
on public.compliance_exceptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own compliance exceptions"
on public.compliance_exceptions
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Service role can manage compliance exceptions"
on public.compliance_exceptions
for all
to service_role
using (true)
with check (true);

create policy "Users can view own compliance attestations"
on public.compliance_attestations
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create own compliance attestations"
on public.compliance_attestations
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own compliance attestations"
on public.compliance_attestations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own compliance attestations"
on public.compliance_attestations
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Service role can manage compliance attestations"
on public.compliance_attestations
for all
to service_role
using (true)
with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'compliance_exceptions'
  ) then
    alter publication supabase_realtime add table public.compliance_exceptions;
  end if;
exception
  when undefined_object then null;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'compliance_attestations'
  ) then
    alter publication supabase_realtime add table public.compliance_attestations;
  end if;
exception
  when undefined_object then null;
end $$;
