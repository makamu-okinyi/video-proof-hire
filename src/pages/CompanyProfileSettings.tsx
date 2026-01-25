import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, Upload, Globe, Linkedin, Twitter, Github,
  Youtube, Check, X, Eye, EyeOff, Loader2, Image, Link2, Sparkles,
  BadgeCheck, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Construction',
  'Transportation',
  'Hospitality',
  'Media & Entertainment',
  'Non-Profit',
  'Government',
  'Other',
];

const companySizes = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
];

const availablePerks = [
  'Remote Work',
  'Flexible Hours',
  'Health Insurance',
  'Dental & Vision',
  '401(k) / Retirement',
  'Stock Options',
  'Unlimited PTO',
  'Parental Leave',
  'Professional Development',
  'Gym Membership',
  'Free Meals',
  'Commuter Benefits',
  'Mental Health Support',
  'Education Reimbursement',
  'Home Office Stipend',
  'Team Events',
  'Competitive Salary',
  'Performance Bonus',
];

interface CompanyProfile {
  avatar: string | null;
  banner_url: string | null;
  company_name: string | null;
  username: string | null;
  industry: string | null;
  company_size: string | null;
  about_us: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  culture_video_url: string | null;
  perks: string[] | null;
  slug: string | null;
  is_public: boolean;
}

export default function CompanyProfileSettings() {
  const navigate = useNavigate();
  const { user, profile: authProfile } = useAuth();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  const [profile, setProfile] = useState<CompanyProfile>({
    avatar: null,
    banner_url: null,
    company_name: null,
    username: null,
    industry: null,
    company_size: null,
    about_us: null,
    website_url: null,
    linkedin_url: null,
    twitter_url: null,
    github_url: null,
    culture_video_url: null,
    perks: [],
    slug: null,
    is_public: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar, banner_url, company_name, username, industry, company_size, about_us, website_url, linkedin_url, twitter_url, github_url, culture_video_url, perks, slug, is_public')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile({
          ...data,
          perks: data.perks || [],
          is_public: data.is_public ?? true,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CompanyProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateUrl = (url: string, fieldName: string): boolean => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      setErrors(prev => ({ ...prev, [fieldName]: 'Please enter a valid URL' }));
      return false;
    }
  };

  const validateSlug = (slug: string): boolean => {
    if (!slug) return true;
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      setErrors(prev => ({ ...prev, slug: 'Slug must be lowercase with hyphens only' }));
      return false;
    }
    return true;
  };

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || !validateSlug(slug)) {
      setSlugAvailable(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const { data, error } = await supabase.rpc('check_slug_availability', { target_slug: slug });
      if (error) {
        // Fallback: direct query
        const { data: existingSlug } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', slug)
          .neq('id', user?.id)
          .maybeSingle();
        
        setSlugAvailable(!existingSlug);
      } else {
        setSlugAvailable(data);
      }
    } catch (error) {
      console.error('Error checking slug:', error);
    } finally {
      setCheckingSlug(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      updateField('avatar', publicUrl);
      
      // Also update the profiles table avatar
      await supabase.from('profiles').update({ avatar: publicUrl }).eq('id', user.id);
      
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/banner-${Date.now()}.${fileExt}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      updateField('banner_url', publicUrl);
      toast.success('Banner uploaded successfully');
    } catch (error) {
      console.error('Error uploading banner:', error);
      toast.error('Failed to upload banner');
    }
  };

  const togglePerk = (perk: string) => {
    const currentPerks = profile.perks || [];
    const newPerks = currentPerks.includes(perk)
      ? currentPerks.filter(p => p !== perk)
      : [...currentPerks, perk];
    updateField('perks', newPerks);
  };

  const handleSave = async () => {
    // Validate URLs
    const urlFields = ['website_url', 'linkedin_url', 'twitter_url', 'github_url', 'culture_video_url'] as const;
    let hasError = false;
    
    for (const field of urlFields) {
      if (profile[field] && !validateUrl(profile[field]!, field)) {
        hasError = true;
      }
    }

    if (profile.slug && !validateSlug(profile.slug)) {
      hasError = true;
    }

    if (slugAvailable === false) {
      setErrors(prev => ({ ...prev, slug: 'This slug is already taken' }));
      hasError = true;
    }

    if (hasError) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: profile.company_name,
          industry: profile.industry,
          company_size: profile.company_size,
          about_us: profile.about_us,
          website_url: profile.website_url,
          linkedin_url: profile.linkedin_url,
          twitter_url: profile.twitter_url,
          github_url: profile.github_url,
          culture_video_url: profile.culture_video_url,
          perks: profile.perks,
          slug: profile.slug,
          is_public: profile.is_public,
          banner_url: profile.banner_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      setHasChanges(false);
      toast.success('Company profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
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
              <h1 className="text-lg font-semibold">Company Profile</h1>
              <p className="text-xs text-muted-foreground">Public branding & info</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-8">
        {/* Visibility Toggle */}
        <div className="bg-gradient-to-r from-coral/10 to-coral/5 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {profile.is_public ? (
              <Eye className="h-5 w-5 text-coral" />
            ) : (
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Profile Visibility</p>
              <p className="text-sm text-muted-foreground">
                {profile.is_public ? 'Visible to candidates' : 'Hidden from search'}
              </p>
            </div>
          </div>
          <Switch
            checked={profile.is_public}
            onCheckedChange={(checked) => updateField('is_public', checked)}
          />
        </div>

        {/* Branding Assets */}
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Image className="h-4 w-4 text-coral" />
            Branding Assets
          </h2>
          
          {/* Banner */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Cover Banner (16:9)</label>
            <div 
              className="relative aspect-[3/1] bg-secondary rounded-xl overflow-hidden cursor-pointer group"
              onClick={() => bannerInputRef.current?.click()}
            >
              {profile.banner_url ? (
                <img 
                  src={profile.banner_url} 
                  alt="Banner" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Upload className="h-8 w-8 mb-2" />
                  <span className="text-sm">Upload banner image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="h-8 w-8 text-white" />
              </div>
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
            />
          </div>

          {/* Logo */}
          <div>
            <label className="text-sm font-medium mb-2 block">Company Logo (1:1)</label>
            <div className="flex items-center gap-4">
              <div 
                className="relative h-24 w-24 bg-secondary rounded-xl overflow-hidden cursor-pointer group"
                onClick={() => logoInputRef.current?.click()}
              >
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                    <Building2 className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Square image recommended</p>
                <p>PNG, JPG up to 5MB</p>
              </div>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </section>

        {/* Company Identity */}
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-coral" />
            Company Identity
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Company Name</label>
              <Input
                value={profile.company_name || ''}
                onChange={(e) => updateField('company_name', e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Industry</label>
                <select
                  value={profile.industry || ''}
                  onChange={(e) => updateField('industry', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm"
                >
                  <option value="">Select industry</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Company Size</label>
                <select
                  value={profile.company_size || ''}
                  onChange={(e) => updateField('company_size', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm"
                >
                  <option value="">Select size</option>
                  {companySizes.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">About Us</label>
              <Textarea
                value={profile.about_us || ''}
                onChange={(e) => updateField('about_us', e.target.value)}
                placeholder="Tell candidates about your company, mission, and culture..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {(profile.about_us || '').length}/2000 characters
              </p>
            </div>
          </div>
        </section>

        {/* Online Presence */}
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-coral" />
            Online Presence
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </label>
              <Input
                value={profile.website_url || ''}
                onChange={(e) => updateField('website_url', e.target.value)}
                placeholder="https://yourcompany.com"
                className={errors.website_url ? 'border-destructive' : ''}
              />
              {errors.website_url && (
                <p className="text-xs text-destructive mt-1">{errors.website_url}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </label>
              <Input
                value={profile.linkedin_url || ''}
                onChange={(e) => updateField('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
                className={errors.linkedin_url ? 'border-destructive' : ''}
              />
              {errors.linkedin_url && (
                <p className="text-xs text-destructive mt-1">{errors.linkedin_url}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter / X
                </label>
                <Input
                  value={profile.twitter_url || ''}
                  onChange={(e) => updateField('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/company"
                  className={errors.twitter_url ? 'border-destructive' : ''}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub
                </label>
                <Input
                  value={profile.github_url || ''}
                  onChange={(e) => updateField('github_url', e.target.value)}
                  placeholder="https://github.com/company"
                  className={errors.github_url ? 'border-destructive' : ''}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Culture Media */}
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Youtube className="h-4 w-4 text-coral" />
            Culture Video
          </h2>
          
          <div>
            <label className="text-sm font-medium mb-2 block">YouTube or Vimeo URL</label>
            <Input
              value={profile.culture_video_url || ''}
              onChange={(e) => updateField('culture_video_url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className={errors.culture_video_url ? 'border-destructive' : ''}
            />
            {errors.culture_video_url && (
              <p className="text-xs text-destructive mt-1">{errors.culture_video_url}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Share a video showcasing your workplace and culture
            </p>
          </div>
        </section>

        {/* Perks & Benefits */}
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-coral" />
            Perks & Benefits
          </h2>
          
          <div className="flex flex-wrap gap-2">
            {availablePerks.map((perk) => (
              <Badge
                key={perk}
                variant={(profile.perks || []).includes(perk) ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => togglePerk(perk)}
              >
                {perk}
                {(profile.perks || []).includes(perk) && (
                  <Check className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {(profile.perks || []).length} perks selected
          </p>
        </section>

        {/* Vanity URL */}
        <section>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-coral" />
            Vanity URL
          </h2>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Company Slug</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">donjo.app/company/</span>
              <div className="flex-1 relative">
                <Input
                  value={profile.slug || ''}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    updateField('slug', value);
                    setSlugAvailable(null);
                  }}
                  onBlur={() => profile.slug && checkSlugAvailability(profile.slug)}
                  placeholder="your-company"
                  className={cn(
                    errors.slug ? 'border-destructive' : '',
                    slugAvailable === true ? 'border-green-500' : '',
                    slugAvailable === false ? 'border-destructive' : ''
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {checkingSlug && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {!checkingSlug && slugAvailable === true && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  {!checkingSlug && slugAvailable === false && (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                </div>
              </div>
            </div>
            {errors.slug && (
              <p className="text-xs text-destructive mt-1">{errors.slug}</p>
            )}
            {slugAvailable === true && (
              <p className="text-xs text-green-500 mt-1">This slug is available!</p>
            )}
            {slugAvailable === false && (
              <p className="text-xs text-destructive mt-1">This slug is already taken</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
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
                  fetchProfile();
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
    </div>
  );
}
