import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Input validation schema
const jobSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(10000, "Description must be less than 10,000 characters"),
  location: z.string().max(200, "Location must be less than 200 characters").optional().nullable(),
  company_name: z.string().max(200, "Company name must be less than 200 characters").optional().nullable(),
  company_logo: z.string().max(500, "Logo URL must be less than 500 characters").optional().nullable(),
  skills_required: z.array(z.string().max(50, "Skill must be less than 50 characters")).max(20, "Maximum 20 skills allowed"),
  benefits: z.array(z.string().max(100, "Benefit must be less than 100 characters")).max(20, "Maximum 20 benefits allowed"),
});

const jobTypes = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const experienceLevels = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'mid', label: 'Mid Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Manager' },
];

export default function CreateJob() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const { user, profile } = useAuth();
  const isEdit = !!jobId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [jobType, setJobType] = useState('full-time');
  const [experienceLevel, setExperienceLevel] = useState('entry');
  const [companyName, setCompanyName] = useState(profile?.username || '');
  const [companyLogo, setCompanyLogo] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [benefitInput, setBenefitInput] = useState('');
  const [benefits, setBenefits] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [videoPrompt, setVideoPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!jobId || !user) return;
    const fetchJob = async () => {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .eq('id', jobId)
        .eq('employer_id', user.id)
        .maybeSingle();
      setLoadingData(false);
      if (error || !data) return;
      setTitle(data.title || '');
      setDescription(data.description || '');
      setLocation(data.location || '');
      setSalaryMin(data.salary_min != null ? String(data.salary_min) : '');
      setSalaryMax(data.salary_max != null ? String(data.salary_max) : '');
      setJobType(data.job_type || 'full-time');
      setExperienceLevel(data.experience_level || 'entry');
      setCompanyName(data.company_name || profile?.username || '');
      setCompanyLogo(data.company_logo || '');
      setSkills(Array.isArray(data.skills_required) ? data.skills_required : []);
      setBenefits(Array.isArray(data.benefits) ? data.benefits : []);
      setDeadline(data.application_deadline ? data.application_deadline.slice(0, 10) : '');
      setVideoPrompt((data as Record<string, unknown>)?.video_prompt as string || '');
    };
    fetchJob();
  }, [jobId, user?.id, profile?.username]);

  const addSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      if (trimmedSkill.length > 50) {
        toast.error('Skill must be less than 50 characters');
        return;
      }
      if (skills.length >= 20) {
        toast.error('Maximum 20 skills allowed');
        return;
      }
      setSkills([...skills, trimmedSkill]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addBenefit = () => {
    const trimmedBenefit = benefitInput.trim();
    if (trimmedBenefit && !benefits.includes(trimmedBenefit)) {
      if (trimmedBenefit.length > 100) {
        toast.error('Benefit must be less than 100 characters');
        return;
      }
      if (benefits.length >= 20) {
        toast.error('Maximum 20 benefits allowed');
        return;
      }
      setBenefits([...benefits, trimmedBenefit]);
      setBenefitInput('');
    }
  };

  const removeBenefit = (benefit: string) => {
    setBenefits(benefits.filter(b => b !== benefit));
  };

  const handleSubmit = async () => {
    // Validate inputs with zod
    const validation = jobSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      location: location.trim() || null,
      company_name: companyName.trim() || null,
      company_logo: companyLogo.trim() || null,
      skills_required: skills,
      benefits: benefits,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      toast.error(validation.error.errors[0].message);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const parseSalary = (val: string): number | null => {
        if (!val?.trim()) return null;
        const n = parseInt(val, 10);
        return isNaN(n) ? null : n;
      };

      if (isEdit && jobId) {
        const { error } = await supabase
          .from('job_postings')
          .update({
            title: validation.data.title,
            description: validation.data.description,
            location: validation.data.location,
            salary_min: parseSalary(salaryMin),
            salary_max: parseSalary(salaryMax),
            job_type: jobType,
            experience_level: experienceLevel,
            company_name: validation.data.company_name,
            company_logo: validation.data.company_logo,
            skills_required: validation.data.skills_required,
            benefits: validation.data.benefits,
            application_deadline: deadline || null,
          })
          .eq('id', jobId)
          .eq('employer_id', user?.id);
        if (error) throw error;
        toast.success('Job updated!', { icon: null });
      } else {
        const { error } = await supabase.from('job_postings').insert({
          employer_id: user?.id,
          title: validation.data.title,
          description: validation.data.description,
          location: validation.data.location,
          salary_min: parseSalary(salaryMin),
          salary_max: parseSalary(salaryMax),
          job_type: jobType,
          experience_level: experienceLevel,
          company_name: validation.data.company_name,
          company_logo: validation.data.company_logo,
          skills_required: validation.data.skills_required,
          benefits: validation.data.benefits,
          application_deadline: deadline || null,
        });
        if (error) throw error;
        toast.success('Job posting created!', { icon: null });
      }
      navigate('/employer', { replace: true });
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job posting', { icon: null });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/employer')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <Button 
            variant="coral" 
            size="sm"
            onClick={handleSubmit}
            disabled={loading || loadingData || !title.trim() || !description.trim()}
          >
            {loading ? (isEdit ? 'Saving...' : 'Publishing...') : loadingData ? 'Loading...' : isEdit ? 'Save Changes' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Job Posting' : 'Create Job Posting'}</h1>
          <p className="text-muted-foreground text-sm">{isEdit ? 'Update your job listing' : 'Find your next hire through video portfolios'}</p>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title * <span className="text-muted-foreground text-xs">(max 200 chars)</span></label>
            <Input
              placeholder="e.g. Senior Frontend Developer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description * <span className="text-muted-foreground text-xs">(max 10,000 chars)</span></label>
            <Textarea
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={10000}
              className={errors.description ? 'border-destructive' : ''}
            />
            <div className="flex justify-between">
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
              <p className="text-xs text-muted-foreground ml-auto">{description.length}/10,000</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Type</label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Experience Level</label>
              <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {experienceLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location <span className="text-muted-foreground text-xs">(max 200 chars)</span></label>
            <Input
              placeholder="e.g. Remote, New York, NY"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Salary Min ($)</label>
              <Input
                type="number"
                placeholder="50000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Salary Max ($)</label>
              <Input
                type="number"
                placeholder="80000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div className="space-y-4">
          <h2 className="font-semibold">Company Info</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name <span className="text-muted-foreground text-xs">(max 200 chars)</span></label>
            <Input
              placeholder="Your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Company Logo URL <span className="text-muted-foreground text-xs">(max 500 chars)</span></label>
            <Input
              placeholder="https://example.com/logo.png"
              value={companyLogo}
              onChange={(e) => setCompanyLogo(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Required Skills <span className="text-muted-foreground text-xs">(max 20 skills, 50 chars each)</span></label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              maxLength={50}
            />
            <Button variant="outline" size="icon" onClick={addSkill} disabled={skills.length >= 20}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <button onClick={() => removeSkill(skill)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{skills.length}/20 skills</p>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Benefits <span className="text-muted-foreground text-xs">(max 20 benefits, 100 chars each)</span></label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a benefit"
              value={benefitInput}
              onChange={(e) => setBenefitInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
              maxLength={100}
            />
            <Button variant="outline" size="icon" onClick={addBenefit} disabled={benefits.length >= 20}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {benefits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {benefits.map(benefit => (
                <Badge key={benefit} variant="outline" className="gap-1">
                  {benefit}
                  <button onClick={() => removeBenefit(benefit)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{benefits.length}/20 benefits</p>
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Application Deadline</label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {/* Video Prompt — hidden until DB migration is deployed
        <div className="space-y-2">
          <label className="text-sm font-medium">Video Pitch Guidance <span className="text-muted-foreground text-xs">(optional)</span></label>
          <p className="text-xs text-muted-foreground">Tell applicants what to include in their video pitch. This will be shown when they apply.</p>
          <Textarea
            placeholder="e.g. In your 1-minute video, please include: your name, relevant experience, why you're interested in this role, and a brief example of a project you're proud of."
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">{videoPrompt.length}/1,000</p>
        </div>
        */}
      </div>
    </div>
  );
}
