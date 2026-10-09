import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit2, X, Check, Loader2, User, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { skillsList } from '@/lib/skills';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery } from 'convex/react';
import { Field } from '@/components/ui/field';
import { LocationFields, fromLocationValue, toLocationValue, type LocationValue } from '@/components/profile/LocationFields';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { DataRightsPanel } from '@/components/settings/DataRightsPanel';
import { LegalLinks } from '@/components/legal/LegalLinks';
import { PasskeysManager } from '@/components/settings/PasskeysManager';
import { ChangePasswordPanel } from '@/components/settings/ChangePasswordPanel';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { describeError } from '@/lib/errors';

import { IMAGE_TYPES as ALLOWED_AVATAR_TYPES, uploadImageToConvex } from '@/lib/uploadImage';

export default function EditProfile() {
  useDocumentTitle('Edit profile');
  const navigate = useNavigate();
  const { user, profile, updateProfile, refreshProfile, isLoading: authLoading } = useAuth();
  const generateAvatarUploadUrl = useMutation(api.employer.generateAvatarUploadUrl);
  const setAvatarFromUpload = useMutation(api.employer.setAvatarFromUpload);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editUsername, setEditUsername] = useState(profile?.username || '');
  const [editBio, setEditBio] = useState(profile?.bio || '');
  const [editSkills, setEditSkills] = useState<string[]>(profile?.skills || []);
  const [editAvatar, setEditAvatar] = useState<string | null>(profile?.avatar || null);
  const [isSaving, setIsSaving] = useState(false);
  const myProfile = useQuery(api.profiles.getMyProfile, {});
  const upsertLocation = useMutation(api.profiles.upsertProfile);
  const [geo, setGeo] = useState<LocationValue>({ county: '', country: '' });
  useEffect(() => {
    if (myProfile) setGeo(toLocationValue(myProfile.county, myProfile.country));
  }, [myProfile]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditBio(profile.bio || '');
      setEditSkills(profile.skills || []);
      setEditAvatar(profile.avatar || null);
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setIsUploadingAvatar(true);
    try {
      const storageId = await uploadImageToConvex(file, () => generateAvatarUploadUrl({}));
      const publicUrl = await setAvatarFromUpload({ storageId: storageId as Id<'_storage'> });
      setEditAvatar(publicUrl);
      toast({ title: 'Photo updated', description: 'Your profile photo has been updated' });
      refreshProfile();
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast({ title: 'Upload failed', description: describeError(err, (err as Error).message), variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
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
      await upsertLocation(fromLocationValue(geo));
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
    return authLoading ? null : <Navigate to="/auth" replace />;
  }

  // Wait for profile to load so we don't show empty form on refresh
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading profile...</p>
      </div>
    );
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
        {/* Avatar - upload */}
        <div className="flex justify-center">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_AVATAR_TYPES.join(',')}
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <div className="relative">
            {(editAvatar || profile?.avatar)
              ? <img src={editAvatar || profile?.avatar || ''} alt={profile?.username || 'User'} className="h-24 w-24 rounded-full object-cover border-2 border-border" onError={e => { e.currentTarget.style.display = 'none'; }} />
              : <div className="h-24 w-24 rounded-full bg-secondary border-2 border-border flex items-center justify-center"><User className="h-10 w-10 text-muted-foreground" /></div>
            }
            <Button 
              variant="secondary" 
              size="icon-sm" 
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Field label="Username">
          <Input placeholder="Your username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} autoComplete="nickname" maxLength={50} />
        </Field>

        <Field label="Bio" optional counter={{ length: editBio.length, max: 200 }}>
          <Textarea placeholder="Tell employers about yourself..." value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={4} maxLength={200} />
        </Field>

        <LocationFields value={geo} onChange={setGeo} />

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

        <p className="border-t border-border/50 pt-6 text-sm text-muted-foreground">
          Password, passkeys and data export are also in <Link to="/settings/account" className="font-medium text-foreground underline underline-offset-4">Account settings</Link>.
        </p>

        <section className="space-y-3 pt-0" aria-labelledby="password-heading">
          <h2 id="password-heading" className="text-sm font-medium">Change password</h2>
          <ChangePasswordPanel />
        </section>

        {/* Security: passkeys */}
        <section className="space-y-3 border-t border-border/50 pt-6" aria-labelledby="passkeys-heading">
          <h2 id="passkeys-heading" className="flex items-center gap-2 text-sm font-medium">
            <Fingerprint className="h-4 w-4" /> Passkeys
          </h2>
          <PasskeysManager />
        </section>

        <section className="space-y-3 border-t border-border/50 pt-6" aria-labelledby="data-heading">
          <h2 id="data-heading" className="text-sm font-medium">Your data</h2>
          <DataRightsPanel />
        </section>

        <LegalLinks className="pt-2" />

      </main>
    </div>
  );
}
