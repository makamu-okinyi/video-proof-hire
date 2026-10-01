import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Loader2, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LocationFields, fromLocationValue, toLocationValue, type LocationValue } from '@/components/profile/LocationFields';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';
import type { Id } from '../../convex/_generated/dataModel';
import { IMAGE_TYPES, uploadImageToConvex } from '@/lib/uploadImage';
import { describeError } from '@/lib/errors';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Media & Entertainment', 'Consulting', 'Real Estate', 'Other',
];

export default function CompanyProfileSettings() {
  useDocumentTitle('Company profile');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    company_name: '',
    company_description: '',
    company_website: '',
    company_size: '',
    industry: '',
    company_logo_url: '',
  });

  const employerProfile = useQuery(
    api.employer.getEmployerProfile,
    isAuthenticated ? {} : 'skip'
  );
  const upsertEmployerProfile = useMutation(api.employer.upsertEmployerProfile);
  const upsertProfile = useMutation(api.profiles.upsertProfile);
  const generateUploadUrl = useMutation(api.employer.generateAvatarUploadUrl);
  const setLogoFromUpload = useMutation(api.employer.setCompanyLogoFromUpload);
  const removeLogo = useMutation(api.employer.removeCompanyLogo);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const storageId = await uploadImageToConvex(file, () => generateUploadUrl({}));
      const url = await setLogoFromUpload({ storageId: storageId as Id<'_storage'> });
      setForm((p) => ({ ...p, company_logo_url: url }));
      toast.success('Logo updated');
    } catch (err) {
      toast.error(describeError(err, (err as Error).message || 'Logo upload failed. Please try again.'));
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await removeLogo({});
      setForm((p) => ({ ...p, company_logo_url: '' }));
    } catch (err) {
      toast.error(describeError(err));
    }
  };
  const myProfile = useQuery(api.profiles.getMyProfile, isAuthenticated ? {} : 'skip');
  const [location, setLocation] = useState<LocationValue>({ county: '', country: '' });
  useEffect(() => {
    if (myProfile) setLocation(toLocationValue(myProfile.county, myProfile.country));
  }, [myProfile]);

  const isLoading = employerProfile === undefined;

  // Populate form when data loads
  useEffect(() => {
    if (employerProfile) {
      setForm({
        company_name: employerProfile.companyName ?? '',
        company_description: employerProfile.companyDescription ?? '',
        company_website: employerProfile.companyWebsite ?? '',
        company_size: employerProfile.companySize ?? '',
        industry: employerProfile.industry ?? '',
        company_logo_url: employerProfile.companyLogoUrl ?? '',
      });
    }
  }, [employerProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertEmployerProfile({
        companyName: form.company_name || undefined,
        companyDescription: form.company_description || undefined,
        companyWebsite: form.company_website || undefined,
        companySize: form.company_size || undefined,
        industry: form.industry || undefined,
      });
      await upsertProfile(fromLocationValue(location));
      toast.success('Company profile saved');
    } catch (error) {
      toast.error('Failed to save company profile');
    } finally {
      setIsSaving(false);
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">Company Profile</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="neo-extruded p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="squircle-icon w-10 h-10"><Building2 className="h-5 w-5 text-foreground" strokeWidth={1.5} /></div>
              <h2 className="font-semibold text-foreground">Company Info</h2>
            </div>

            <Field label="Company name" counter={{ length: form.company_name.length, max: 100 }}>
              <Input value={form.company_name} onChange={set('company_name')} placeholder="Acme Inc." maxLength={100} autoComplete="organization" />
            </Field>

            <Field label="About the company" optional counter={{ length: form.company_description.length, max: 500 }}>
              <Textarea value={form.company_description} onChange={set('company_description')} placeholder="What does your company do? What is the mission?" rows={4} maxLength={500} />
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Industry" optional>
                <Select value={form.industry} onValueChange={(v) => setForm((p) => ({ ...p, industry: v }))} placeholder="Select industry" options={INDUSTRIES.map((i) => ({ value: i, label: i }))} />
              </Field>
              <Field label="Company size" optional>
                <Select value={form.company_size} onValueChange={(v) => setForm((p) => ({ ...p, company_size: v }))} placeholder="Select size" options={['1–10', '11–50', '51–200', '201–500', '500+'].map((s) => ({ value: s, label: `${s} employees` }))} />
              </Field>
            </div>

            <LocationFields value={location} onChange={setLocation} label="Company location" hint="Where your team is mainly based." />

            <Field label="Website" optional>
              <Input value={form.company_website} onChange={set('company_website')} placeholder="https://yourcompany.com" type="url" maxLength={255} />
            </Field>

            <Field label="Company logo" optional hint="JPEG, PNG, WebP or GIF, up to 5MB.">
              <div className="flex items-center gap-4">
                {form.company_logo_url ? (
                  <img src={form.company_logo_url} alt="Company logo" className="h-16 w-16 rounded-xl object-contain neo-extruded-sm p-1" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <div className="h-16 w-16 rounded-xl neo-extruded-sm flex items-center justify-center"><Building2 className="h-6 w-6 text-muted-foreground" /></div>
                )}
                <input ref={logoInputRef} type="file" accept={IMAGE_TYPES.join(',')} className="hidden" onChange={handleLogoFile} />
                <Button type="button" variant="secondary" onClick={() => logoInputRef.current?.click()} disabled={isUploadingLogo}>
                  {isUploadingLogo ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : <><Upload className="h-4 w-4 mr-2" />{form.company_logo_url ? 'Replace logo' : 'Upload logo'}</>}
                </Button>
                {form.company_logo_url && !isUploadingLogo && (
                  <Button type="button" variant="ghost" size="icon" onClick={handleRemoveLogo} aria-label="Remove logo"><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            </Field>

            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Company Profile'}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
