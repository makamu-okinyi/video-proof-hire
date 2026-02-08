import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Rocket, 
  Users, 
  Lightbulb, 
  Target,
  Code,
  Video,
  Check,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { GlassBackground } from '@/components/layout/GlassBackground';
import { GlassCard } from '@/components/ui/glass-card';
import { VideoPitchRecorder } from '@/components/video/VideoPitchRecorder';
import { useVideoUpload } from '@/hooks/useVideoUpload';

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
  pitchVideoUrl: string;
  pitchVideoBlob: Blob | null;
  founderTitle: string;
}

const initialFormData: FormData = {
  name: '',
  tagline: '',
  description: '',
  problemStatement: '',
  solution: '',
  marketSize: '',
  traction: '',
  businessModel: '',
  stage: 'idea',
  industry: [],
  techStack: [],
  websiteUrl: '',
  githubUrl: '',
  pitchVideoUrl: '',
  pitchVideoBlob: null,
  founderTitle: 'CEO & Founder',
};

const steps: { id: WizardStep; title: string; icon: React.ReactNode }[] = [
  { id: 'basics', title: 'Basics', icon: <Rocket className="h-5 w-5" /> },
  { id: 'problem', title: 'Problem', icon: <Lightbulb className="h-5 w-5" /> },
  { id: 'team', title: 'Your Role', icon: <Users className="h-5 w-5" /> },
  { id: 'tech', title: 'Tech', icon: <Code className="h-5 w-5" /> },
  { id: 'pitch', title: '1-Min Pitch', icon: <Video className="h-5 w-5" /> },
  { id: 'review', title: 'Review', icon: <Check className="h-5 w-5" /> },
];

export default function FounderWizard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pitchPreviewUrl, setPitchPreviewUrl] = useState<string | null>(null);
  const { uploadVideo, uploading, progress } = useVideoUpload();

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (field: 'industry' | 'techStack', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'basics':
        return formData.name.length >= 2 && formData.tagline.length >= 10;
      case 'problem':
        return formData.problemStatement.length >= 20;
      case 'team':
        return formData.founderTitle.length >= 2;
      case 'tech':
        return formData.industry.length >= 1;
      case 'pitch':
        return true; // Video is optional but encouraged
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleVideoReady = (blob: Blob, url: string) => {
    setFormData(prev => ({ ...prev, pitchVideoBlob: blob }));
    setPitchPreviewUrl(url);
    toast.success('Video pitch recorded successfully!');
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to create a venture');
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    try {
      let pitchVideoUrl = '';

      // Upload video if exists
      if (formData.pitchVideoBlob) {
        const videoUrl = await uploadVideo(formData.pitchVideoBlob, user.id);
        if (videoUrl) {
          pitchVideoUrl = videoUrl;
        }
      }

      // Create the venture
      const { data: venture, error: ventureError } = await supabase
        .from('ventures')
        .insert({
          name: formData.name,
          tagline: formData.tagline,
          description: formData.description,
          problem_statement: formData.problemStatement,
          solution: formData.solution,
          market_size: formData.marketSize,
          traction: formData.traction,
          business_model: formData.businessModel,
          stage: formData.stage,
          industry: formData.industry,
          tech_stack: formData.techStack,
          website_url: formData.websiteUrl || null,
          github_url: formData.githubUrl || null,
          pitch_video_url: pitchVideoUrl || null,
        })
        .select()
        .single();

      if (ventureError) throw ventureError;

      // Add the user as lead founder
      const { error: founderError } = await supabase
        .from('venture_founders')
        .insert({
          venture_id: venture.id,
          user_id: user.id,
          role: 'lead',
          title: formData.founderTitle,
          is_lead: true,
        });

      if (founderError) throw founderError;

      toast.success('Application submitted successfully!');
      navigate('/ventures');
    } catch (error) {
      console.error('Error creating venture:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basics':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Venture Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => updateFormData({ name: e.target.value })}
                placeholder="e.g., PayStack, Flutterwave, Andela"
                className="text-lg bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline" className="text-white">One-Line Pitch *</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={e => updateFormData({ tagline: e.target.value })}
                placeholder="e.g., Making payments in Africa easier"
                maxLength={100}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-white/50">{formData.tagline.length}/100</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => updateFormData({ description: e.target.value })}
                placeholder="Tell us more about what you're building..."
                className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-white">Stage</Label>
              <div className="grid grid-cols-5 gap-2">
                {(['idea', 'prototype', 'mvp', 'growth', 'scale'] as const).map(stage => (
                  <button
                    key={stage}
                    onClick={() => updateFormData({ stage })}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize",
                      formData.stage === stage
                        ? "bg-primary text-white"
                        : "bg-white/10 text-white/60 hover:bg-white/20"
                    )}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'problem':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="problem" className="text-white">The Problem *</Label>
              <Textarea
                id="problem"
                value={formData.problemStatement}
                onChange={e => updateFormData({ problemStatement: e.target.value })}
                placeholder="What painful problem are you solving? Who feels it most?"
                className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution" className="text-white">Your Solution</Label>
              <Textarea
                id="solution"
                value={formData.solution}
                onChange={e => updateFormData({ solution: e.target.value })}
                placeholder="How does your product solve this better than alternatives?"
                className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketSize" className="text-white">Market Opportunity</Label>
              <Input
                id="marketSize"
                value={formData.marketSize}
                onChange={e => updateFormData({ marketSize: e.target.value })}
                placeholder="e.g., $5B addressable market in East Africa"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="traction" className="text-white">Traction (if any)</Label>
              <Input
                id="traction"
                value={formData.traction}
                onChange={e => updateFormData({ traction: e.target.value })}
                placeholder="e.g., 500 beta users, $10K MRR, LOIs from 3 enterprises"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </motion.div>
        );

      case 'team':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-white">You're the Lead Founder</h3>
              <p className="text-white/60 text-sm">
                You'll be registered as the primary founder. You can invite co-founders later.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="founderTitle" className="text-white">Your Title *</Label>
              <Input
                id="founderTitle"
                value={formData.founderTitle}
                onChange={e => updateFormData({ founderTitle: e.target.value })}
                placeholder="e.g., CEO & Co-Founder, CTO, Founding Engineer"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessModel" className="text-white">Business Model</Label>
              <Input
                id="businessModel"
                value={formData.businessModel}
                onChange={e => updateFormData({ businessModel: e.target.value })}
                placeholder="e.g., SaaS subscription, Transaction fees, Marketplace"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>
          </motion.div>
        );

      case 'tech':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-3">
              <Label className="text-white">Industry *</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(industry => (
                  <Badge
                    key={industry}
                    variant={formData.industry.includes(industry) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      formData.industry.includes(industry) 
                        ? "bg-primary text-white" 
                        : "bg-white/10 border-white/20 text-white/60 hover:bg-white/20"
                    )}
                    onClick={() => toggleArrayItem('industry', industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-white">Tech Stack</Label>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.map(tech => (
                  <Badge
                    key={tech}
                    variant={formData.techStack.includes(tech) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      formData.techStack.includes(tech) 
                        ? "bg-primary text-white" 
                        : "bg-white/10 border-white/20 text-white/60 hover:bg-white/20"
                    )}
                    onClick={() => toggleArrayItem('techStack', tech)}
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 'pitch':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {pitchPreviewUrl ? (
              <div className="space-y-4">
                <div className="text-center space-y-2 mb-4">
                  <h3 className="text-lg font-semibold text-white">Your Pitch Video</h3>
                  <p className="text-sm text-white/60">Looking good! You can re-record if needed.</p>
                </div>
                <div className="aspect-video bg-black rounded-2xl overflow-hidden">
                  <video
                    src={pitchPreviewUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPitchPreviewUrl(null);
                      setFormData(prev => ({ ...prev, pitchVideoBlob: null }));
                    }}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    Re-record Video
                  </Button>
                </div>
              </div>
            ) : (
              <VideoPitchRecorder
                onVideoReady={handleVideoReady}
                maxDuration={60}
              />
            )}
          </motion.div>
        );

      case 'review':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
              <h3 className="font-bold text-2xl mb-2 text-white">{formData.name}</h3>
              <p className="text-white/70">{formData.tagline}</p>
              <Badge className="mt-3 capitalize bg-white/20">{formData.stage}</Badge>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-white/50 mb-1">Problem</h4>
                <p className="text-sm text-white">{formData.problemStatement || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-white/50 mb-1">Solution</h4>
                <p className="text-sm text-white">{formData.solution || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-white/50 mb-1">Your Role</h4>
                <p className="text-sm text-white">{formData.founderTitle}</p>
              </div>

              {pitchPreviewUrl && (
                <div>
                  <h4 className="font-medium text-sm text-white/50 mb-2">Pitch Video</h4>
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Check className="h-4 w-4" />
                    Video pitch recorded
                  </div>
                </div>
              )}

              {formData.industry.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-white/50 mb-2">Industry</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.industry.map(i => (
                      <Badge key={i} variant="secondary" className="text-xs bg-white/10">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.techStack.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-white/50 mb-2">Tech Stack</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.techStack.map(t => (
                      <Badge key={t} variant="outline" className="text-xs border-white/20 text-white/60">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {uploading && (
              <div className="bg-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-white">Uploading video...</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative">
      <GlassBackground variant="burgundy" />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 lg:p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Apply to Startup Garage</h1>
              <p className="text-sm text-white/60">Submit your venture for the cohort program</p>
            </div>
          </div>
        </header>

        {/* Progress Steps */}
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 transition-all",
                    index <= currentStepIndex ? "opacity-100" : "opacity-40",
                    index < currentStepIndex && "cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                    index === currentStepIndex
                      ? "bg-primary text-white"
                      : index < currentStepIndex
                        ? "bg-green-500/20 text-green-400"
                        : "bg-white/10 text-white/40"
                  )}>
                    {index < currentStepIndex ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className="text-xs text-white/60 hidden md:block">{step.title}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 lg:w-16 h-0.5 mx-2",
                    index < currentStepIndex ? "bg-green-500" : "bg-white/20"
                  )} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 px-4 lg:px-6 py-6">
          <GlassCard variant="dark" className="max-w-2xl mx-auto p-6 lg:p-8">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </GlassCard>
        </div>

        {/* Footer Navigation */}
        <footer className="p-4 lg:p-6">
          <div className="max-w-2xl mx-auto flex justify-between">
            <Button
              variant="outline"
              onClick={goPrev}
              disabled={currentStepIndex === 0}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep === 'review' ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || uploading}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting || uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={goNext}
                disabled={!canProceed()}
                className="bg-primary hover:bg-primary/90 text-white disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
