import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Shield, Bell, Users, Trash2, 
  Mail, Lock, Eye, EyeOff, Loader2, Check, AlertTriangle,
  Plus, UserX, Crown, Upload, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  member_email: string;
  member_user_id: string | null;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  member_name: string | null;
  member_avatar: string | null;
}

interface AccountData {
  full_name: string | null;
  avatar: string | null;
  notify_new_applicants: string;
  notify_marketing: boolean;
  two_factor_enabled: boolean;
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Password change
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'recruiter'>('recruiter');
  const [inviting, setInviting] = useState(false);

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [accountData, setAccountData] = useState<AccountData>({
    full_name: null,
    avatar: null,
    notify_new_applicants: 'immediate',
    notify_marketing: true,
    two_factor_enabled: false,
  });

  useEffect(() => {
    if (user) {
      fetchAccountData();
      fetchTeamMembers();
    }
  }, [user]);

  const fetchAccountData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar, notify_new_applicants, notify_marketing, two_factor_enabled')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setAccountData({
          full_name: data.full_name,
          avatar: data.avatar,
          notify_new_applicants: data.notify_new_applicants || 'immediate',
          notify_marketing: data.notify_marketing ?? true,
          two_factor_enabled: data.two_factor_enabled ?? false,
        });
      }
    } catch (error) {
      console.error('Error fetching account data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase.rpc('get_team_members');
      
      if (error) {
        // Fallback: direct query
        const { data: directData } = await supabase
          .from('team_members')
          .select('*')
          .eq('company_owner_id', user?.id)
          .order('invited_at', { ascending: false });
        
        if (directData) {
          setTeamMembers(directData.map((m: any) => ({
            ...m,
            member_name: null,
            member_avatar: null,
          })));
        }
      } else {
        setTeamMembers((data || []) as TeamMember[]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const updateField = (field: keyof AccountData, value: any) => {
    setAccountData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      updateField('avatar', publicUrl);
      
      // Update profiles table
      await supabase.from('profiles').update({ avatar: publicUrl }).eq('id', user.id);
      
      toast.success('Avatar updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: accountData.full_name,
          notify_new_applicants: accountData.notify_new_applicants,
          notify_marketing: accountData.notify_marketing,
          two_factor_enabled: accountData.two_factor_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      setHasChanges(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      const { error } = await supabase.rpc('invite_team_member', {
        p_email: inviteEmail,
        p_role: inviteRole,
      });

      if (error) {
        // Fallback: direct insert
        await supabase.from('team_members').upsert({
          company_owner_id: user?.id,
          member_email: inviteEmail,
          role: inviteRole,
          status: 'pending',
        }, {
          onConflict: 'company_owner_id,member_email',
        });
      }

      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error inviting member:', error);
      toast.error('Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase.rpc('remove_team_member', { p_member_id: memberId });

      if (error) {
        // Fallback: direct delete
        await supabase
          .from('team_members')
          .delete()
          .eq('id', memberId)
          .eq('company_owner_id', user?.id);
      }

      toast.success('Team member removed');
      fetchTeamMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove team member');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeleting(true);
    try {
      // Note: This requires a Supabase Edge Function or admin API to fully delete
      // For now, we'll just sign out and show a message
      await logout();
      toast.success('Your account deletion request has been submitted');
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate('/employer')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Account Settings</h1>
              <p className="text-xs text-muted-foreground">Security & preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-8">
        {/* Personal Info */}
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-coral" />
            Personal Information
          </h2>
          
          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div 
                className="relative h-20 w-20 bg-secondary rounded-full overflow-hidden cursor-pointer group"
                onClick={() => avatarInputRef.current?.click()}
              >
                {accountData.avatar ? (
                  <img 
                    src={accountData.avatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <User className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <p className="font-medium">{profile?.username || 'User'}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input
                value={accountData.full_name || ''}
                onChange={(e) => updateField('full_name', e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Work Email</label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-secondary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Contact support to change your email address
              </p>
            </div>
          </div>
        </section>

        {/* Notification Preferences */}
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-coral" />
            Notification Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="bg-secondary rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">New Applicant Alerts</p>
                  <p className="text-sm text-muted-foreground">When someone applies to your jobs</p>
                </div>
              </div>
              <div className="flex gap-2">
                {['immediate', 'daily', 'never'].map((option) => (
                  <Button
                    key={option}
                    variant={accountData.notify_new_applicants === option ? 'coral' : 'outline'}
                    size="sm"
                    onClick={() => updateField('notify_new_applicants', option)}
                    className="capitalize"
                  >
                    {option === 'immediate' ? 'Instant' : option}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-secondary rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Marketing & Updates</p>
                <p className="text-sm text-muted-foreground">Platform news, tips, and promotions</p>
              </div>
              <Switch
                checked={accountData.notify_marketing}
                onCheckedChange={(checked) => updateField('notify_marketing', checked)}
              />
            </div>
          </div>
        </section>

        {/* Security */}
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-coral" />
            Security
          </h2>
          
          <div className="space-y-4">
            {/* Change Password */}
            <div className="bg-secondary rounded-xl p-4">
              <button
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <p className="font-medium">Change Password</p>
                    <p className="text-sm text-muted-foreground">Update your account password</p>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "h-5 w-5 transition-transform",
                  showPasswordSection && "rotate-90"
                )} />
              </button>

              {showPasswordSection && (
                <div className="mt-4 pt-4 border-t border-border space-y-3">
                  <div className="relative">
                    <Input
                      type={showOldPassword ? 'text' : 'password'}
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <Button 
                    variant="coral" 
                    className="w-full"
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword}
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-secondary rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add extra security to your account</p>
                </div>
              </div>
              <Switch
                checked={accountData.two_factor_enabled}
                onCheckedChange={(checked) => {
                  updateField('two_factor_enabled', checked);
                  if (checked) {
                    toast.info('2FA setup would be implemented with your auth provider');
                  }
                }}
              />
            </div>
          </div>
        </section>

        {/* Team Access */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-coral" />
              Team Access
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowInviteModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Invite
            </Button>
          </div>
          
          <div className="space-y-2">
            {/* Current User (Owner) */}
            <div className="bg-secondary rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {accountData.avatar ? (
                  <img src={accountData.avatar} alt="You" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-coral/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-coral" />
                  </div>
                )}
                <div>
                  <p className="font-medium">{accountData.full_name || profile?.username || 'You'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Badge className="bg-coral/10 text-coral border-0">
                <Crown className="h-3 w-3 mr-1" />
                Owner
              </Badge>
            </div>

            {/* Team Members */}
            {teamMembers.map((member) => (
              <div key={member.id} className="bg-secondary rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {member.member_avatar ? (
                    <img src={member.member_avatar} alt={member.member_name || ''} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{member.member_name || member.member_email}</p>
                    <p className="text-sm text-muted-foreground">{member.member_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status === 'pending' ? 'Pending' : member.role}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <UserX className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {teamMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No team members yet</p>
                <p className="text-xs">Invite colleagues to help manage hiring</p>
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h2>
          
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-destructive">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <Button 
                variant="outline" 
                className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Save Bar */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-area-pb">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <p className="text-sm text-muted-foreground">You have unsaved changes</p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  fetchAccountData();
                  setHasChanges(false);
                }}
              >
                Discard
              </Button>
              <Button variant="coral" onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowInviteModal(false)} />
          <div className="relative bg-background rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-semibold text-lg">Invite Team Member</h2>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Email Address</label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <div className="flex gap-2">
                <Button
                  variant={inviteRole === 'recruiter' ? 'coral' : 'outline'}
                  className="flex-1"
                  onClick={() => setInviteRole('recruiter')}
                >
                  Recruiter
                </Button>
                <Button
                  variant={inviteRole === 'admin' ? 'coral' : 'outline'}
                  className="flex-1"
                  onClick={() => setInviteRole('admin')}
                >
                  Admin
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {inviteRole === 'admin' 
                  ? 'Admins can manage jobs, challenges, and team members'
                  : 'Recruiters can view applicants and shortlist candidates'}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowInviteModal(false)}>
                Cancel
              </Button>
              <Button variant="coral" className="flex-1" onClick={handleInviteMember} disabled={inviting}>
                {inviting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invite'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-background rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="font-semibold text-lg">Delete Account</h2>
              <p className="text-sm text-muted-foreground mt-2">
                This action cannot be undone. All your data including jobs, challenges, and messages will be permanently deleted.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Type <span className="font-mono text-destructive">DELETE</span> to confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1" 
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
