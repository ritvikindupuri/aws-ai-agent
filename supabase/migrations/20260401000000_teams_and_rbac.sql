-- Teams and RBAC
-- This migration sets up the basic schema for team management, role assignments, and invites.

-- 1. Create `teams` table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create `team_members` table
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'analyst', 'read_only')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- 3. Create `team_invites` table
CREATE TABLE IF NOT EXISTS public.team_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'analyst', 'read_only')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, email)
);

-- RLS setup
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

-- Teams RLS: Users can select teams they are a member of
CREATE POLICY select_teams ON public.teams
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_id = teams.id AND user_id = auth.uid()
        )
    );

-- Team Members RLS: Users can see all members of teams they are a part of
CREATE POLICY select_team_members ON public.team_members
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
        )
    );

-- Team Invites RLS: Users can see invites for their teams
CREATE POLICY select_team_invites ON public.team_invites
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_invites.team_id AND tm.user_id = auth.uid()
        )
    );

-- Allow owners/admins to manage invites
CREATE POLICY manage_team_invites ON public.team_invites
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_invites.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
        )
    );

-- Allow owners/admins to manage members
CREATE POLICY manage_team_members ON public.team_members
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
        )
    );

-- Allow anyone to create a team (they become owner)
CREATE POLICY create_teams ON public.teams
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow inserting team_members (handled by functions or superuser/admin logic)
CREATE POLICY insert_team_members ON public.team_members
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
        )
    );

-- Helper function to auto-create a team and member on user signup (Optional, but good for single-user start)
CREATE OR REPLACE FUNCTION public.handle_new_user_team()
RETURNS trigger AS $$
DECLARE
  new_team_id uuid;
BEGIN
  -- Insert a new team for the user
  INSERT INTO public.teams (name)
  VALUES (coalesce(NEW.email, 'My Team'))
  RETURNING id INTO new_team_id;

  -- Add the user as owner
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (new_team_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created_team ON auth.users;
CREATE TRIGGER on_auth_user_created_team
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_team();

-- Notify Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_invites;
