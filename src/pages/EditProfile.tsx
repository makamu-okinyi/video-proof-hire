import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { skillsList } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  
  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [editSkills, setEditSkills] = useState<string[]>(profile?.skills || []);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditBio(profile.bio || '');
      setEditSkills(profile.skills || []);
    }
  }, [profile]);

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

      </main>
    </div>
  );
}
