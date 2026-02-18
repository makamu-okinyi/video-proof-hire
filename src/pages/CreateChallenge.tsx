import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  const navigate = useNavigate();
  const { challengeId } = useParams<{ challengeId: string }>();
  const { user } = useAuth();
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
  const [loadingData, setLoadingData] = useState(isEdit);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!challengeId || !user) return;
    const fetchChallenge = async () => {
      setLoadingData(true);
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .eq('employer_id', user.id)
        .maybeSingle();
      setLoadingData(false);
      if (error || !data) return;
      setTitle(data.title || '');
      setDescription(data.description || '');
      setPrizeDescription(data.prize_description || '');
      setPrizeAmount(data.prize_amount != null ? String(data.prize_amount) : '');
      setDeadline(formatDeadlineForInput(data.deadline));
      setIsFeatured(data.is_featured ?? false);
      setSkills(Array.isArray(data.skills_tags) ? data.skills_tags : []);
      setVideoPrompt((data as Record<string, unknown>)?.video_prompt as string || '');
    };
    fetchChallenge();
  }, [challengeId, user?.id]);

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
        const { error } = await supabase
          .from('challenges')
          .update({
            title: validation.data.title,
            description: validation.data.description,
            prize_description: validation.data.prize_description,
            prize_amount: prizeAmount ? parseInt(prizeAmount) : null,
            deadline: deadline || null,
            is_featured: isFeatured,
            skills_tags: validation.data.skills_tags,
          })
          .eq('id', challengeId)
          .eq('employer_id', user?.id);
        if (error) throw error;
        toast.success('Challenge updated!');
      } else {
        const { error } = await supabase.from('challenges').insert({
          employer_id: user?.id,
          title: validation.data.title,
          description: validation.data.description,
          prize_description: validation.data.prize_description,
          prize_amount: prizeAmount ? parseInt(prizeAmount) : null,
          deadline: deadline || null,
          is_featured: isFeatured,
          skills_tags: validation.data.skills_tags,
        });
        if (error) throw error;
        toast.success('Challenge created!');
      }
      navigate('/employer');
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
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
          <h1 className="text-2xl font-bold">{isEdit ? 'Edit Challenge' : 'Create Challenge'}</h1>
          <p className="text-muted-foreground text-sm">{isEdit ? 'Update your challenge' : 'Launch a competition to discover top talent'}</p>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Challenge Title * <span className="text-muted-foreground text-xs">(max 200 chars)</span></label>
            <Input
              placeholder="e.g. Build a React Component Challenge"
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
              placeholder="Describe the challenge, what participants need to create, and judging criteria..."
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
        </div>

        {/* Prize Info */}
        <div className="space-y-4">
          <h2 className="font-semibold">Prize Information</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Prize Amount ($)</label>
            <Input
              type="number"
              placeholder="500"
              value={prizeAmount}
              onChange={(e) => setPrizeAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prize Description <span className="text-muted-foreground text-xs">(max 500 chars)</span></label>
            <Input
              placeholder="e.g. Cash prize + interview opportunity"
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{prizeDescription.length}/500</p>
          </div>
        </div>

        {/* Skills Tags */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Skill Tags <span className="text-muted-foreground text-xs">(max 20 tags, 50 chars each)</span></label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill tag"
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
          <p className="text-xs text-muted-foreground">{skills.length}/20 skill tags</p>
        </div>

        {/* Deadline */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Deadline</label>
          <Input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {/* Video Prompt */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Video Submission Guidance <span className="text-muted-foreground text-xs">(optional)</span></label>
          <p className="text-xs text-muted-foreground">Tell participants what to include in their video submission. This will be shown when they submit an entry.</p>
          <Textarea
            placeholder="e.g. In your video, please demonstrate: your solution approach, a working demo, and explain the technical decisions you made."
            value={videoPrompt}
            onChange={(e) => setVideoPrompt(e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground text-right">{videoPrompt.length}/1,000</p>
        </div>

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
