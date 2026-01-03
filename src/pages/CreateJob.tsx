import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const { user, profile } = useAuth();
  
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
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const addBenefit = () => {
    if (benefitInput.trim() && !benefits.includes(benefitInput.trim())) {
      setBenefits([...benefits, benefitInput.trim()]);
      setBenefitInput('');
    }
  };

  const removeBenefit = (benefit: string) => {
    setBenefits(benefits.filter(b => b !== benefit));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('job_postings').insert({
        employer_id: user?.id,
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        job_type: jobType,
        experience_level: experienceLevel,
        company_name: companyName.trim() || null,
        company_logo: companyLogo.trim() || null,
        skills_required: skills,
        benefits: benefits,
        application_deadline: deadline || null,
      });

      if (error) throw error;

      toast.success('Job posting created!');
      navigate('/employer');
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job posting');
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
            disabled={loading || !title.trim() || !description.trim()}
          >
            {loading ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold">Create Job Posting</h1>
          <p className="text-muted-foreground text-sm">Find your next hire through video portfolios</p>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title *</label>
            <Input
              placeholder="e.g. Senior Frontend Developer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
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
            <label className="text-sm font-medium">Location</label>
            <Input
              placeholder="e.g. Remote, New York, NY"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
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
            <label className="text-sm font-medium">Company Name</label>
            <Input
              placeholder="Your company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Company Logo URL</label>
            <Input
              placeholder="https://example.com/logo.png"
              value={companyLogo}
              onChange={(e) => setCompanyLogo(e.target.value)}
            />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Required Skills</label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <Button variant="outline" size="icon" onClick={addSkill}>
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
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Benefits</label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a benefit"
              value={benefitInput}
              onChange={(e) => setBenefitInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
            />
            <Button variant="outline" size="icon" onClick={addBenefit}>
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
      </div>
    </div>
  );
}