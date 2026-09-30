import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { errorMessage } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';
import { z } from 'zod';

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
  useDocumentTitle(isEdit ? 'Edit job' : 'Post a job');

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const existingJob = useQuery(api.jobs.getJob, jobId ? { jobId: jobId as Id<'jobPostings'> } : 'skip');
  const loadingData = isEdit && existingJob === undefined;
  const createJob = useMutation(api.jobs.createJob);
  const updateJob = useMutation(api.jobs.updateJob);

  useEffect(() => {
    if (!existingJob) return;
    setTitle(existingJob.title || '');
    setDescription(existingJob.description || '');
    setLocation(existingJob.location || '');
    setSalaryMin(existingJob.salaryMin != null ? String(existingJob.salaryMin) : '');
    setSalaryMax(existingJob.salaryMax != null ? String(existingJob.salaryMax) : '');
    setJobType(existingJob.jobType || 'full-time');
    setExperienceLevel(existingJob.experienceLevel || 'entry');
    setCompanyName(existingJob.companyName || profile?.username || '');
    setCompanyLogo(existingJob.companyLogo || '');
    setSkills(Array.isArray(existingJob.skillsRequired) ? existingJob.skillsRequired : []);
    setBenefits(Array.isArray(existingJob.benefits) ? existingJob.benefits : []);
    setDeadline(existingJob.applicationDeadline ? existingJob.applicationDeadline.slice(0, 10) : '');
    setVideoPrompt(existingJob.videoPrompt || '');
  }, [existingJob, profile?.username]);

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
        await updateJob({
          jobId: jobId as Id<'jobPostings'>,
          title: validation.data.title,
          description: validation.data.description,
          location: validation.data.location || undefined,
          salaryMin: parseSalary(salaryMin) ?? undefined,
          salaryMax: parseSalary(salaryMax) ?? undefined,
          jobType,
          experienceLevel,
          skillsRequired: validation.data.skills_required,
          benefits: validation.data.benefits,
          applicationDeadline: deadline || undefined,
          videoPrompt: videoPrompt || undefined,
        });
        toast.success('Job updated!', { icon: null });
      } else {
        await createJob({
          title: validation.data.title,
          description: validation.data.description,
          location: validation.data.location || undefined,
          salaryMin: parseSalary(salaryMin) ?? undefined,
          salaryMax: parseSalary(salaryMax) ?? undefined,
          jobType,
          experienceLevel,
          companyName: validation.data.company_name || undefined,
          companyLogo: validation.data.company_logo || undefined,
          skillsRequired: validation.data.skills_required,
          benefits: validation.data.benefits,
          applicationDeadline: deadline || undefined,
          videoPrompt: videoPrompt || undefined,
        });
        toast.success('Job posting created!', { icon: null });
      }
      navigate('/employer', { replace: true });
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error(errorMessage(error, 'Failed to save the job posting'), { icon: null });
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
      <div className="p-4 sm:p-6 space-y-6 pb-12 max-w-3xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Job Posting' : 'Create Job Posting'}</h1>
          <p className="text-muted-foreground text-sm">{isEdit ? 'Update your job listing' : 'Find your next hire through video portfolios'}</p>
        </div>

        {/* Basic Info */}
        <section className="space-y-5" aria-labelledby="job-basics">
          <h2 id="job-basics" className="font-semibold">Role details</h2>
          <Field label="Job title" required error={errors.title} counter={{ length: title.length, max: 200 }}>
            <Input placeholder="e.g. Senior Frontend Developer" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoComplete="off" />
          </Field>

          <Field label="Description" required hint="Describe the role, responsibilities and what you are looking for." error={errors.description} counter={{ length: description.length, max: 10000 }}>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={10000} />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Job type">
              <Select value={jobType} onValueChange={setJobType} options={jobTypes} />
            </Field>
            <Field label="Experience level">
              <Select value={experienceLevel} onValueChange={setExperienceLevel} options={experienceLevels} />
            </Field>
          </div>

          <Field label="Location" optional counter={{ length: location.length, max: 200 }} error={errors.location}>
            <Input placeholder="e.g. Nairobi, Kenya or Remote" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={200} autoComplete="off" />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Salary minimum (USD)" optional>
              <Input type="number" min={0} step={100} placeholder="50000" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} />
            </Field>
            <Field label="Salary maximum (USD)" optional>
              <Input type="number" min={0} step={100} placeholder="80000" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} />
            </Field>
          </div>
        </section>

        {/* Company Info */}
        <section className="space-y-5" aria-labelledby="job-company">
          <h2 id="job-company" className="font-semibold">Company</h2>
          <Field label="Company name" optional counter={{ length: companyName.length, max: 200 }} error={errors.company_name}>
            <Input placeholder="Your company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} maxLength={200} autoComplete="organization" />
          </Field>
          <Field label="Company logo URL" optional hint="A direct link to your logo image." error={errors.company_logo}>
            <Input type="url" placeholder="https://example.com/logo.png" value={companyLogo} onChange={(e) => setCompanyLogo(e.target.value)} maxLength={500} />
          </Field>
        </section>

        {/* Skills */}
        <section className="space-y-3" aria-labelledby="job-skills">
          <Field label="Required skills" optional id="job-skills" hint="Press Enter to add. Up to 20 skills.">
            <div className="flex gap-2">
              <Input placeholder="Add a skill" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} maxLength={50} enterKeyHint="done" />
              <Button type="button" variant="outline" size="icon" aria-label="Add skill" onClick={addSkill} disabled={skills.length >= 20} className="h-11 w-11 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Field>
          {skills.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Added skills">
              {skills.map((skill) => (
                <li key={skill}>
                  <Badge variant="secondary" className="gap-1">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}><X className="h-3 w-3" /></button>
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Benefits */}
        <section className="space-y-3" aria-labelledby="job-benefits">
          <Field label="Benefits" optional id="job-benefits" hint="Press Enter to add. Up to 20 benefits.">
            <div className="flex gap-2">
              <Input placeholder="Add a benefit" value={benefitInput} onChange={(e) => setBenefitInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())} maxLength={100} enterKeyHint="done" />
              <Button type="button" variant="outline" size="icon" aria-label="Add benefit" onClick={addBenefit} disabled={benefits.length >= 20} className="h-11 w-11 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Field>
          {benefits.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Added benefits">
              {benefits.map((benefit) => (
                <li key={benefit}>
                  <Badge variant="outline" className="gap-1">
                    {benefit}
                    <button type="button" onClick={() => removeBenefit(benefit)} aria-label={`Remove ${benefit}`}><X className="h-3 w-3" /></button>
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Deadline */}
        <Field label="Application deadline" optional>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>

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
