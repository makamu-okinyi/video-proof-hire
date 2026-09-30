import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { errorMessage } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';
import { z } from 'zod';

// Input validation schema
const challengeSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(10000, "Description must be less than 10,000 characters"),
  prize_description: z.string().max(500, "Prize description must be less than 500 characters").optional().nullable(),
  skills_tags: z.array(z.string().max(50, "Skill must be less than 50 characters")).max(20, "Maximum 20 skill tags allowed"),
});

function formatDeadlineForInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16);
}

export default function CreateChallenge() {
  const isEditRoute = !!useParams<{ challengeId: string }>().challengeId;
  useDocumentTitle(isEditRoute ? 'Edit challenge' : 'Create a challenge');
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  const isEdit = !!challengeId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const existingChallenge = useQuery(
    api.challenges.getChallenge,
    challengeId ? { challengeId: challengeId as Id<'challenges'> } : 'skip'
  );
  const loadingData = isEdit && existingChallenge === undefined;
  const createChallenge = useMutation(api.challenges.createChallenge);
  const updateChallenge = useMutation(api.challenges.updateChallenge);

  useEffect(() => {
    if (!existingChallenge) return;
    setTitle(existingChallenge.title || '');
    setDescription(existingChallenge.description || '');
    setPrizeDescription(existingChallenge.prizeDescription || '');
    setPrizeAmount(existingChallenge.prizeAmount != null ? String(existingChallenge.prizeAmount) : '');
    setDeadline(formatDeadlineForInput(existingChallenge.deadline ?? null));
    setIsFeatured(existingChallenge.isFeatured ?? false);
    setSkills(Array.isArray(existingChallenge.skillsTags) ? existingChallenge.skillsTags : []);
    setVideoPrompt(existingChallenge.videoPrompt || '');
  }, [existingChallenge]);

  const addSkill = () => {
    const trimmedSkill = skillInput.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      if (trimmedSkill.length > 50) {
        toast.error('Skill must be less than 50 characters');
        return;
      }
      if (skills.length >= 20) {
        toast.error('Maximum 20 skill tags allowed');
        return;
      }
      setSkills([...skills, trimmedSkill]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleSubmit = async () => {
    // Validate inputs with zod
    const validation = challengeSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      prize_description: prizeDescription.trim() || null,
      skills_tags: skills,
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
      if (isEdit && challengeId) {
        await updateChallenge({
          challengeId: challengeId as Id<'challenges'>,
          title: validation.data.title,
          description: validation.data.description,
          prizeDescription: validation.data.prize_description || undefined,
          prizeAmount: prizeAmount ? parseInt(prizeAmount) : undefined,
          deadline: deadline || undefined,
          isFeatured,
          skillsTags: validation.data.skills_tags,
          videoPrompt: videoPrompt || undefined,
        });
        toast.success('Challenge updated!');
      } else {
        await createChallenge({
          title: validation.data.title,
          description: validation.data.description,
          prizeDescription: validation.data.prize_description || undefined,
          prizeAmount: prizeAmount ? parseInt(prizeAmount) : undefined,
          deadline: deadline || undefined,
          isFeatured,
          skillsTags: validation.data.skills_tags,
          videoPrompt: videoPrompt || undefined,
        });
        toast.success('Challenge created!');
      }
      navigate('/employer');
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error(errorMessage(error, 'Failed to save the challenge'));
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
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Challenge' : 'Create Challenge'}</h1>
          <p className="text-muted-foreground text-sm">{isEdit ? 'Update your challenge' : 'Launch a competition to discover top talent'}</p>
        </div>

        {/* Basic Info */}
        <section className="space-y-5" aria-labelledby="ch-basics">
          <h2 id="ch-basics" className="font-semibold">Challenge details</h2>
          <Field label="Challenge title" required error={errors.title} counter={{ length: title.length, max: 200 }}>
            <Input placeholder="e.g. Build a React component" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} autoComplete="off" />
          </Field>
          <Field label="Description" required hint="What participants need to create, and how you will judge it." error={errors.description} counter={{ length: description.length, max: 10000 }}>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} maxLength={10000} />
          </Field>
        </section>

        {/* Prize Info */}
        <section className="space-y-5" aria-labelledby="ch-prize">
          <h2 id="ch-prize" className="font-semibold">Prize</h2>
          <Field label="Prize amount (USD)" optional>
            <Input type="number" min={0} step={50} placeholder="500" value={prizeAmount} onChange={(e) => setPrizeAmount(e.target.value)} />
          </Field>
          <Field label="Prize description" optional counter={{ length: prizeDescription.length, max: 500 }} error={errors.prize_description}>
            <Input placeholder="e.g. Cash prize and an interview" value={prizeDescription} onChange={(e) => setPrizeDescription(e.target.value)} maxLength={500} />
          </Field>
        </section>

        {/* Skills Tags */}
        <section className="space-y-3" aria-labelledby="ch-skills">
          <Field label="Skill tags" optional id="ch-skills" hint="Press Enter to add. Up to 20 tags.">
            <div className="flex gap-2">
              <Input placeholder="Add a skill tag" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} maxLength={50} enterKeyHint="done" />
              <Button type="button" variant="outline" size="icon" aria-label="Add skill tag" onClick={addSkill} disabled={skills.length >= 20} className="h-11 w-11 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Field>
          {skills.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Added skill tags">
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

        {/* Deadline */}
        <Field label="Deadline" optional>
          <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>

        {/* Video Prompt */}
        <Field label="Video submission guidance" optional hint="Shown to participants when they submit an entry." counter={{ length: videoPrompt.length, max: 1000 }}>
          <Textarea placeholder="e.g. Demonstrate your approach, a working demo, and explain your technical decisions." value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} rows={4} maxLength={1000} />
        </Field>

        {/* Featured Toggle */}
        <div className="flex items-center justify-between py-4 border-t border-border">
          <div>
            <p className="font-medium">Featured Challenge</p>
            <p className="text-sm text-muted-foreground">Show this challenge at the top of the feed</p>
          </div>
          <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
        </div>
      </div>
    </div>
  );
}
