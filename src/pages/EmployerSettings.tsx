import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Upload, Camera, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function EmployerSettings() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState(profile?.username || '');
  const [companyDescription, setCompanyDescription] = useState(profile?.bio || '');
  const [companyLogo, setCompanyLogo] = useState(profile?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.username || '');
      setCompanyDescription(profile.bio || '');
      setCompanyLogo(profile.avatar || '');
    }
  }, [profile]);

  // Redirect if not an employer
  useEffect(() => {
    if (profile && profile.user_type !== 'employer') {
      navigate('/feed');
    }
  }, [profile, navigate]);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-logo-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      setCompanyLogo(publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        username: companyName || null,
        bio: companyDescription || null,
        avatar: companyLogo || null,
      });
      
      await refreshProfile();
      toast.success('Company profile updated!');
      navigate('/employer');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || profile?.user_type !== 'employer') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/employer')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Company Settings</h1>
          </div>
          <Button variant="coral" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-8">
        {/* Company Logo */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Company Logo</label>
          <div className="flex items-center gap-6">
            <div className="relative">
              {companyLogo ? (
                <img
                  src={companyLogo}
                  alt="Company logo"
                  className="h-24 w-24 rounded-2xl object-cover border-2 border-border"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-secondary flex items-center justify-center border-2 border-dashed border-border">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingLogo}
              >
                {isUploadingLogo ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>
        </div>

        {/* Company Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company Name</label>
          <Input
            placeholder="Enter your company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            This will be displayed on your job postings and profile.
          </p>
        </div>

        {/* Company Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Company Description</label>
          <Textarea
            placeholder="Tell candidates about your company, culture, and what makes you unique..."
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            className="min-h-[150px] resize-none"
            maxLength={500}
          />
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">
              This appears on your company profile.
            </p>
            <p className="text-xs text-muted-foreground">
              {companyDescription.length}/500
            </p>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-secondary rounded-xl p-4 space-y-2">
          <h3 className="font-medium text-sm">💡 Tips for a great company profile</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Use a clear, recognizable logo</li>
            <li>• Keep your company name consistent across platforms</li>
            <li>• Highlight your company culture and values</li>
            <li>• Mention any notable achievements or perks</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
