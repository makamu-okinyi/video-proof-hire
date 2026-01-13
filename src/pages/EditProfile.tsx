import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, X, Check, User, Briefcase, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { skillsList } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type UserRole = 'talent' | 'employer';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  
  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [editSkills, setEditSkills] = useState<string[]>(profile?.skills || []);
  const [isSaving, setIsSaving] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>((profile?.user_type as UserRole) || 'talent');
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [isRoleSwitching, setIsRoleSwitching] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditBio(profile.bio || '');
      setEditSkills(profile.skills || []);
      setCurrentRole((profile.user_type as UserRole) || 'talent');
    }
  }, [profile]);

  const handleRoleSwitch = async () => {
    if (!pendingRole || pendingRole === currentRole) {
      setPendingRole(null);
      return;
    }

    setIsRoleSwitching(true);
    try {
      // Use the secure database function to update role
      const { error: roleError } = await supabase.rpc('update_user_role', {
        new_role: pendingRole
      });

      if (roleError) {
        throw roleError;
      }

      // Refresh profile to get updated role
      await refreshProfile();
      
      setCurrentRole(pendingRole);
      toast({
        title: "Role updated!",
        description: `You are now using Donjo as ${pendingRole === 'employer' ? 'an Employer' : 'a Student/Applicant'}`,
      });

      // Redirect to appropriate dashboard
      if (pendingRole === 'employer') {
        navigate('/employer');
      } else {
        navigate('/feed');
      }
    } catch (error) {
      console.error('Role switch error:', error);
      toast({
        title: "Error",
        description: "Failed to switch role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRoleSwitching(false);
      setPendingRole(null);
    }
  };

  const handleSkillToggle = (skill: string) => {
    if (editSkills.includes(skill)) {
      setEditSkills(editSkills.filter(s => s !== skill));
    } else if (editSkills.length < 6) {
      setEditSkills([...editSkills, skill]);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        username: editUsername,
        bio: editBio,
        skills: editSkills,
      });
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved",
      });
      navigate('/profile');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Edit Profile</h1>
          </div>
          <Button variant="coral" size="sm" onClick={handleSaveProfile} disabled={isSaving}>
            <Check className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative">
            <img 
              src={profile?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'} 
              alt={profile?.username || 'User'}
              className="h-24 w-24 rounded-full object-cover border-2 border-border"
            />
            <Button 
              variant="secondary" 
              size="icon-sm" 
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              onClick={() => toast({ title: "Coming soon", description: "Avatar upload will be available soon" })}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>
          <Input
            placeholder="Your username"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
          />
        </div>
        
        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Bio</label>
          <Textarea
            placeholder="Tell employers about yourself..."
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            className="min-h-[120px] resize-none"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground text-right">
            {editBio.length}/200
          </p>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Skills (up to 6)</label>
          
          {/* Selected Skills */}
          {editSkills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {editSkills.map((skill) => (
                <Badge 
                  key={skill} 
                  variant="default" 
                  className="cursor-pointer gap-1"
                  onClick={() => handleSkillToggle(skill)}
                >
                  {skill}
                  <X className="h-3 w-3" />
                </Badge>
              ))}
            </div>
          )}

          {/* Available Skills */}
          <div className="flex flex-wrap gap-2">
            {skillsList.filter(s => !editSkills.includes(s)).slice(0, 15).map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="cursor-pointer"
                onClick={() => handleSkillToggle(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Account Type / Role Switching */}
        <div className="space-y-3 pt-4 border-t border-border">
          <label className="text-sm font-medium">Account Type</label>
          <p className="text-xs text-muted-foreground">
            Switch between applicant and employer modes
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Student/Applicant Option */}
            <button
              onClick={() => currentRole !== 'talent' && setPendingRole('talent')}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all duration-200",
                currentRole === 'talent'
                  ? "border-coral bg-coral/5"
                  : "border-border hover:border-coral/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  currentRole === 'talent' ? "bg-coral/20" : "bg-muted"
                )}>
                  <User className={cn(
                    "h-5 w-5",
                    currentRole === 'talent' ? "text-coral" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">Student / Applicant</p>
                  {currentRole === 'talent' && (
                    <p className="text-xs text-coral">Current</p>
                  )}
                </div>
              </div>
            </button>

            {/* Employer Option */}
            <button
              onClick={() => currentRole !== 'employer' && setPendingRole('employer')}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all duration-200",
                currentRole === 'employer'
                  ? "border-coral bg-coral/5"
                  : "border-border hover:border-coral/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  currentRole === 'employer' ? "bg-coral/20" : "bg-muted"
                )}>
                  <Briefcase className={cn(
                    "h-5 w-5",
                    currentRole === 'employer' ? "text-coral" : "text-muted-foreground"
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">Employer</p>
                  {currentRole === 'employer' && (
                    <p className="text-xs text-coral">Current</p>
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>
      </main>

      {/* Role Switch Confirmation Dialog */}
      <AlertDialog open={!!pendingRole} onOpenChange={() => setPendingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-coral" />
              Switch Account Type?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to switch from{' '}
              <strong>{currentRole === 'talent' ? 'Student/Applicant' : 'Employer'}</strong> to{' '}
              <strong>{pendingRole === 'talent' ? 'Student/Applicant' : 'Employer'}</strong>.
              <br /><br />
              {pendingRole === 'employer' 
                ? "As an employer, you'll be able to post jobs, create challenges, and discover talent."
                : "As a student/applicant, you'll be able to showcase your skills and apply to jobs."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRoleSwitching}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRoleSwitch}
              disabled={isRoleSwitching}
              className="bg-coral hover:bg-coral/90"
            >
              {isRoleSwitching ? 'Switching...' : 'Switch Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
