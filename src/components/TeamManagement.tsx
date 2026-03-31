import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Shield, Mail, Users, UserPlus, UserMinus, Crown, Edit, Check, X } from "lucide-react";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  email?: string;
  role: "owner" | "admin" | "analyst" | "read_only";
}

interface TeamInvite {
  id: string;
  email: string;
  role: "owner" | "admin" | "analyst" | "read_only";
  status: string;
}

const ROLES = ["owner", "admin", "analyst", "read_only"] as const;

export default function TeamManagement() {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin" | "analyst" | "read_only">("analyst");
  const [inviting, setInviting] = useState(false);

  // User state
  const [currentUserRole, setCurrentUserRole] = useState<string>("read_only");

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      if (!userId) return;

      // 1. Get user's primary team (the one where they are a member)
      const { data: memberData, error: memberErr } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", userId)
        .limit(1)
        .single();

      if (memberErr || !memberData) {
        // Handle case where user has no team (create fallback locally or ignore)
        setLoading(false);
        return;
      }

      setCurrentUserRole(memberData.role);

      // 2. Fetch team details
      const { data: teamData, error: teamErr } = await supabase
        .from("teams")
        .select("id, name")
        .eq("id", memberData.team_id)
        .single();

      if (teamErr || !teamData) return;
      setTeam(teamData);

      // 3. Fetch all members
      const { data: allMembers, error: allMemErr } = await supabase
        .from("team_members")
        .select("id, user_id, role")
        .eq("team_id", teamData.id);

      if (!allMemErr && allMembers) {
        // Need to fetch emails manually or rely on a user view if possible
        // Since Supabase `auth.users` is not directly accessible without a view or edge function,
        // we'll mock the email or use `id` for display temporarily
        setMembers(
          allMembers.map(m => ({
            ...m,
            email: m.user_id === userId ? userData.user.email : `User (${m.user_id.slice(0, 8)})`,
            role: m.role as "owner" | "admin" | "analyst" | "read_only"
          }))
        );
      }

      // 4. Fetch active invites
      const { data: allInvites, error: invErr } = await supabase
        .from("team_invites")
        .select("id, email, role, status")
        .eq("team_id", teamData.id)
        .eq("status", "pending");

      if (!invErr && allInvites) {
        setInvites(allInvites as TeamInvite[]);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!team) return;

    setInviting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("team_invites").insert({
        team_id: team.id,
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        invited_by: userData.user?.id,
        status: "pending"
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      fetchTeamData(); // Refresh invites
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to send invite");
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase.from("team_invites").delete().eq("id", inviteId);
      if (error) throw new Error(error.message);
      toast.success("Invite revoked.");
      setInvites(invites.filter(i => i.id !== inviteId));
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to revoke invite");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase.from("team_members").delete().eq("id", memberId);
      if (error) throw new Error(error.message);
      toast.success("Member removed.");
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to remove member");
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase.from("team_members").update({ role: newRole }).eq("id", memberId);
      if (error) throw new Error(error.message);
      toast.success("Role updated.");
      setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole as TeamMember["role"] } : m));
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update role");
    }
  };

  if (loading) {
    return <div className="p-4 text-xs text-muted-foreground animate-pulse">Loading team data...</div>;
  }

  if (!team) {
    return <div className="p-4 text-xs text-muted-foreground">You do not currently belong to a team.</div>;
  }

  const isOwnerOrAdmin = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Team: {team.name}</h2>
          <p className="text-xs text-muted-foreground">Manage your organization's members and their access levels.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">
            Your Role: {currentUserRole.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Member List */}
        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Active Members</h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">{members.length} members</span>
            </div>

            <div className="divide-y divide-border">
              {members.map(member => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                      ${member.role === 'owner' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-secondary text-secondary-foreground border border-border'}`}>
                      {member.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{member.email}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {member.role === 'owner' && <Crown className="w-3 h-3 text-primary" />}
                        <p className="text-[10px] font-mono text-muted-foreground uppercase">{member.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>

                  {isOwnerOrAdmin && member.role !== 'owner' && (
                    <div className="flex items-center gap-2">
                      <select
                        className="text-[10px] font-mono bg-muted border border-border rounded px-2 py-1 focus:outline-none focus:border-primary/50 text-foreground"
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      >
                        {ROLES.filter(r => r !== 'owner').map(role => (
                          <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                        ))}
                      </select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMember(member.id)}>
                        <UserMinus className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Invite & Pending Panel */}
        <div className="space-y-4">
          {/* Invite Form */}
          {isOwnerOrAdmin && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <UserPlus className="w-4 h-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Invite Member</h3>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Email Address</label>
                  <Input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Role</label>
                  <select
                    className="w-full h-8 px-2 rounded-md bg-muted border border-border text-xs font-mono text-foreground focus:outline-none focus:border-primary/50"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as TeamInvite["role"])}
                  >
                    {ROLES.filter(r => currentUserRole === 'owner' || r !== 'owner').map(role => (
                      <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="w-full h-8 text-xs"
                  variant="action"
                >
                  {inviting ? "Sending..." : "Send Invite"}
                  <Mail className="w-3 h-3 ml-1.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Pending Invites */}
          {invites.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">Pending</h3>
                </div>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{invites.length}</span>
              </div>

              <div className="space-y-2 pt-1">
                {invites.map(invite => (
                  <div key={invite.id} className="flex flex-col gap-1 p-2 rounded bg-muted/40 border border-border">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-mono text-foreground truncate max-w-[150px]" title={invite.email}>{invite.email}</p>
                      {isOwnerOrAdmin && (
                        <button onClick={() => handleRevokeInvite(invite.id)} className="text-muted-foreground hover:text-destructive" title="Revoke Invite">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-mono text-muted-foreground uppercase">{invite.role.replace('_', ' ')}</p>
                      <p className="text-[9px] text-yellow-500 font-mono tracking-wider">PENDING</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
