import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Rocket, Users, Lightbulb, Target,
  Code, Check, Loader2, Video, Upload, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { usePitchDeckUpload } from '@/hooks/usePitchDeckUpload';
import { VideoPitchRecorder } from '@/components/apply/VideoPitchRecorder';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NeoCard } from '@/components/ui/neo-card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const INDUSTRIES = [
  'FinTech', 'HealthTech', 'EdTech', 'AgriTech', 'CleanTech',
  'E-commerce', 'Logistics', 'SaaS', 'AI/ML', 'IoT',
  'Social Impact', 'Media', 'Gaming', 'Mobility', 'Other'
];

const TECH_STACK = [
  'React', 'Node.js', 'Python', 'Django', 'Flutter', 'React Native',
  'Firebase', 'PostgreSQL', 'MongoDB', 'AWS', 'GCP', 'Azure',
  'TensorFlow', 'PyTorch', 'Blockchain', 'Solidity'
];

type WizardStep = 'basics' | 'problem' | 'team' | 'tech' | 'pitch' | 'review';

interface FormData {
  name: string;
  tagline: string;
  description: string;
  problemStatement: string;
  solution: string;
  marketSize: string;
  traction: string;
  businessModel: string;
  stage: 'idea' | 'prototype' | 'mvp' | 'growth' | 'scale';
  industry: string[];
  techStack: string[];
  websiteUrl: string;
  githubUrl: string;
  demoUrl: string;
  founderTitle: string;
}

const initialFormData: FormData = {
  name: '', tagline: '', description: '', problemStatement: '', solution: '',
  marketSize: '', traction: '', businessModel: '', stage: 'idea',
  industry: [], techStack: [], websiteUrl: '', githubUrl: '', demoUrl: '',
  founderTitle: 'CEO & Founder',
};

const steps: { id: WizardStep; title: string; icon: React.ReactNode }[] = [
  { id: 'basics', title: 'Basics', icon: <Rocket className="h-4 w-4" /> },
  { id: 'problem', title: 'Problem', icon: <Lightbulb className="h-4 w-4" /> },
  { id: 'team', title: 'Role', icon: <Users className="h-4 w-4" /> },
  { id: 'tech', title: 'Tech', icon: <Code className="h-4 w-4" /> },
  { id: 'pitch', title: 'Pitch', icon: <Video className="h-4 w-4" /> },
  { id: 'review', title: 'Review', icon: <Check className="h-4 w-4" /> },
];

export default function FounderWizard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pitchVideoBlob, setPitchVideoBlob] = useState<Blob | null>(null);
  const [pitchDeckFile, setPitchDeckFile] = useState<File | null>(null);

  const { uploading: videoUploading, uploadVideo } = useVideoUpload();
  const { uploading: deckUploading, uploadDeck } = usePitchDeckUpload();

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (field: 'industry' | 'techStack', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item) ? prev[field].filter(i => i !== item) : [...prev[field], item],
    }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'basics': return formData.name.length >= 2 && formData.tagline.length >= 10;
      case 'problem': return formData.problemStatement.length >= 20;
      case 'team': return formData.founderTitle.length >= 2;
      case 'tech': return formData.industry.length >= 1;
      case 'pitch': return true; // Video is encouraged but not required
      case 'review': return true;
      default: return false;
    }
  };

  const goNext = () => {
    const next = currentStepIndex + 1;
    if (next < steps.length) setCurrentStep(steps[next].id);
  };

  const goPrev = () => {
    const prev = currentStepIndex - 1;
    if (prev >= 0) setCurrentStep(steps[prev].id);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in first');
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload video if provided
      let videoUrl: string | null = null;
      if (pitchVideoBlob) {
        videoUrl = await uploadVideo(pitchVideoBlob, user.id);
        if (!videoUrl) throw new Error('Video upload failed');
      }

      // Create venture
      const { data: venture, error: ventureError } = await supabase
        .from('ventures')
        .insert({
          name: formData.name, tagline: formData.tagline, description: formData.description,
          problem_statement: formData.problemStatement, solution: formData.solution,
          market_size: formData.marketSize, traction: formData.traction,
          business_model: formData.businessModel, stage: formData.stage,
          industry: formData.industry, tech_stack: formData.techStack,
          website_url: formData.websiteUrl || null, github_url: formData.githubUrl || null,
          demo_url: formData.demoUrl || null,
          pitch_video_url: videoUrl,
        })
        .select()
        .single();

      if (ventureError) throw ventureError;

      // Add founder
      const { error: founderError } = await supabase
        .from('venture_founders')
        .insert({ venture_id: venture.id, user_id: user.id, role: 'lead', title: formData.founderTitle, is_lead: true });
      if (founderError) throw founderError;

      // Upload pitch deck if provided
      if (pitchDeckFile) {
        await uploadDeck(pitchDeckFile, venture.id, user.id);
      }

      // Update user role to founder
      await supabase.rpc('update_user_role', { new_role: 'founder' });

      toast.success('Application submitted! 🎉');
      navigate('/founder');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const variants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

    switch (currentStep) {
      case 'basics':
        return (
          <motion.div {...variants} className="space-y-5">
            <div className="space-y-2">
              <Label>Venture Name *</Label>
              <Input value={formData.name} onChange={e => updateFormData({ name: e.target.value })} placeholder="e.g., PayStack, Andela" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label>One-Line Pitch *</Label>
              <Input value={formData.tagline} onChange={e => updateFormData({ tagline: e.target.value })} placeholder="Making payments easier in Africa" maxLength={100} className="h-12" />
              <p className="text-xs text-cool-grey">{formData.tagline.length}/100</p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={e => updateFormData({ description: e.target.value })} placeholder="Tell us more..." className="min-h-[100px]" />
            </div>
            <div className="space-y-2">
              <Label>Stage</Label>
              <div className="flex flex-wrap gap-2">
                {(['idea', 'prototype', 'mvp', 'growth', 'scale'] as const).map(s => (
                  <button key={s} onClick={() => updateFormData({ stage: s })} className={cn("px-4 py-2 rounded-xl text-sm capitalize transition-all", formData.stage === s ? "neo-pressed text-charcoal font-medium" : "neo-extruded text-cool-grey")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 'problem':
        return (
          <motion.div {...variants} className="space-y-5">
            <div className="space-y-2">
              <Label>The Problem *</Label>
              <Textarea value={formData.problemStatement} onChange={e => updateFormData({ problemStatement: e.target.value })} placeholder="What painful problem are you solving?" className="min-h-[120px]" />
            </div>
            <div className="space-y-2">
              <Label>Your Solution</Label>
              <Textarea value={formData.solution} onChange={e => updateFormData({ solution: e.target.value })} placeholder="How does your product solve this?" className="min-h-[120px]" />
            </div>
            <div className="space-y-2">
              <Label>Market Size</Label>
              <Input value={formData.marketSize} onChange={e => updateFormData({ marketSize: e.target.value })} placeholder="e.g., $5B in East Africa" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label>Traction</Label>
              <Input value={formData.traction} onChange={e => updateFormData({ traction: e.target.value })} placeholder="e.g., 500 beta users" className="h-12" />
            </div>
          </motion.div>
        );
      case 'team':
        return (
          <motion.div {...variants} className="space-y-5">
            <div className="neo-subtle rounded-2xl p-5 text-center">
              <Users className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="font-semibold text-charcoal">You're the Lead Founder</p>
              <p className="text-cool-grey text-sm mt-1">Invite co-founders later.</p>
            </div>
            <div className="space-y-2">
              <Label>Your Title *</Label>
              <Input value={formData.founderTitle} onChange={e => updateFormData({ founderTitle: e.target.value })} placeholder="CEO & Co-Founder" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label>Business Model</Label>
              <Input value={formData.businessModel} onChange={e => updateFormData({ businessModel: e.target.value })} placeholder="SaaS, Marketplace, etc." className="h-12" />
            </div>
          </motion.div>
        );
      case 'tech':
        return (
          <motion.div {...variants} className="space-y-5">
            <div className="space-y-2">
              <Label>Industry *</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(i => (
                  <Badge key={i} variant={formData.industry.includes(i) ? "default" : "outline"} className="cursor-pointer transition-all" onClick={() => toggleArrayItem('industry', i)}>{i}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tech Stack</Label>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.map(t => (
                  <Badge key={t} variant={formData.techStack.includes(t) ? "default" : "outline"} className="cursor-pointer transition-all" onClick={() => toggleArrayItem('techStack', t)}>{t}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={formData.websiteUrl} onChange={e => updateFormData({ websiteUrl: e.target.value })} placeholder="https://..." className="h-12" />
            </div>
            <div className="space-y-2">
              <Label>GitHub</Label>
              <Input value={formData.githubUrl} onChange={e => updateFormData({ githubUrl: e.target.value })} placeholder="https://github.com/..." className="h-12" />
            </div>
          </motion.div>
        );
      case 'pitch':
        return (
          <motion.div {...variants} className="space-y-5">
            <div className="text-center mb-2">
              <h3 className="font-semibold text-charcoal text-lg">60-Second Pitch Video</h3>
              <p className="text-cool-grey text-sm">Record or upload your elevator pitch (max 60 seconds)</p>
            </div>

            {pitchVideoBlob ? (
              <div className="neo-subtle rounded-2xl p-4 text-center">
                <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium text-charcoal">Video ready!</p>
                <p className="text-cool-grey text-sm">{(pitchVideoBlob.size / 1024 / 1024).toFixed(1)} MB</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setPitchVideoBlob(null)}>
                  Replace Video
                </Button>
              </div>
            ) : (
              <VideoPitchRecorder onVideoReady={setPitchVideoBlob} maxDuration={60} />
            )}

            {/* Pitch Deck Upload */}
            <div className="space-y-2 pt-4 border-t border-border/30">
              <Label>Pitch Deck (Optional)</Label>
              {pitchDeckFile ? (
                <div className="neo-subtle rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm text-charcoal truncate max-w-[200px]">{pitchDeckFile.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setPitchDeckFile(null)}>Remove</Button>
                </div>
              ) : (
                <label className="neo-extruded rounded-2xl p-5 text-center block cursor-pointer hover:shadow-neo-pressed transition-all duration-300">
                  <Upload className="h-7 w-7 mx-auto mb-2 text-cool-grey" />
                  <p className="text-sm text-cool-grey">Upload PDF or PPTX</p>
                  <input type="file" accept=".pdf,.pptx,.ppt" className="hidden" onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) setPitchDeckFile(f);
                  }} />
                </label>
              )}
            </div>
          </motion.div>
        );
      case 'review':
        return (
          <motion.div {...variants} className="space-y-5">
            <div className="neo-subtle rounded-2xl p-5">
              <h3 className="font-bold text-xl text-charcoal mb-1">{formData.name}</h3>
              <p className="text-cool-grey text-sm">{formData.tagline}</p>
              <Badge className="mt-2 capitalize">{formData.stage}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><p className="text-cool-grey text-xs mb-1">Problem</p><p className="text-charcoal">{formData.problemStatement || '—'}</p></div>
              <div><p className="text-cool-grey text-xs mb-1">Solution</p><p className="text-charcoal">{formData.solution || '—'}</p></div>
              <div><p className="text-cool-grey text-xs mb-1">Role</p><p className="text-charcoal">{formData.founderTitle}</p></div>
              <div><p className="text-cool-grey text-xs mb-1">Video</p><p className={pitchVideoBlob ? "text-green-600" : "text-amber-600"}>{pitchVideoBlob ? 'Uploaded ✓' : 'Not provided'}</p></div>
            </div>
            {formData.industry.length > 0 && (
              <div>
                <p className="text-cool-grey text-xs mb-2">Industry</p>
                <div className="flex flex-wrap gap-1">
                  {formData.industry.map(i => <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>)}
                </div>
              </div>
            )}
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <button key={s.id} onClick={() => i <= currentStepIndex && setCurrentStep(s.id)} className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-300",
              i === currentStepIndex ? "neo-pressed text-charcoal" : i < currentStepIndex ? "text-primary" : "text-cool-grey"
            )}>
              {s.icon}
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <NeoCard className="p-5 lg:p-8">
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </NeoCard>

        {/* Navigation */}
        <div className="flex justify-between gap-3">
          <Button variant="outline" className="neo-extruded border-none" onClick={currentStepIndex === 0 ? () => navigate(-1) : goPrev}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>

          {currentStep === 'review' ? (
            <Button onClick={handleSubmit} disabled={isSubmitting || videoUploading || deckUploading} className="min-w-[140px]">
              {isSubmitting || videoUploading || deckUploading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><Check className="h-4 w-4 mr-2" /> Submit Application</>
              )}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canProceed()}>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
