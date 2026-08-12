import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Media & Entertainment', 'Consulting', 'Real Estate', 'Other',
];

export default function CompanyProfileSettings() {
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
        companyLogoUrl: form.company_logo_url || undefined,
      });
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

            <div className="space-y-1.5">
              <Label htmlFor="company_name">Company Name</Label>
              <Input id="company_name" value={form.company_name} onChange={set('company_name')} placeholder="Acme Inc." maxLength={100} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company_description">About the Company</Label>
              <Textarea id="company_description" value={form.company_description} onChange={set('company_description')} placeholder="What does your company do? What's the mission?" rows={4} maxLength={500} className="resize-none" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="industry">Industry</Label>
                <Select value={form.industry} onValueChange={v => setForm(p => ({ ...p, industry: v }))}>
                  <SelectTrigger id="industry"><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company_size">Company Size</Label>
                <Select value={form.company_size} onValueChange={v => setForm(p => ({ ...p, company_size: v }))}>
                  <SelectTrigger id="company_size"><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    {['1–10', '11–50', '51–200', '201–500', '500+'].map(s => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company_website" className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Website</Label>
              <Input id="company_website" value={form.company_website} onChange={set('company_website')} placeholder="https://yourcompany.com" type="url" maxLength={255} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company_logo_url">Logo URL</Label>
              <Input id="company_logo_url" value={form.company_logo_url} onChange={set('company_logo_url')} placeholder="https://yourcompany.com/logo.png" type="url" maxLength={500} />
              {form.company_logo_url && (
                <img src={form.company_logo_url} alt="Logo preview" className="h-12 w-12 rounded-xl object-contain neo-extruded-sm p-1 mt-2" onError={e => (e.currentTarget.style.display = 'none')} />
              )}
            </div>

            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save Company Profile'}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
