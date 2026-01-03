import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function CreateChallenge() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
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

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in title and description');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('challenges').insert({
        employer_id: user?.id,
        title: title.trim(),
        description: description.trim(),
        prize_description: prizeDescription.trim() || null,
        prize_amount: prizeAmount ? parseInt(prizeAmount) : null,
        deadline: deadline || null,
        is_featured: isFeatured,
        skills_tags: skills,
      });

      if (error) throw error;

      toast.success('Challenge created!');
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
            disabled={loading || !title.trim() || !description.trim()}
          >
            {loading ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="p-4 space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold">Create Challenge</h1>
          <p className="text-muted-foreground text-sm">Launch a competition to discover top talent</p>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Challenge Title *</label>
            <Input
              placeholder="e.g. Build a React Component Challenge"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              placeholder="Describe the challenge, what participants need to create, and judging criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
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
            <label className="text-sm font-medium">Prize Description</label>
            <Input
              placeholder="e.g. Cash prize + interview opportunity"
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Skills Tags */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Skill Tags</label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill tag"
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

        {/* Deadline */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Deadline</label>
          <Input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
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