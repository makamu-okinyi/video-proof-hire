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
  Upload,
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

type WizardStep = 'basics' | 'problem' | 'team' | 'tech' | 'media' | 'review';

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
  demoUrl: '',
  founderTitle: 'CEO & Founder',
};

const steps: { id: WizardStep; title: string; icon: React.ReactNode }[] = [
  { id: 'basics', title: 'Basics', icon: <Rocket className="h-5 w-5" /> },
  { id: 'problem', title: 'Problem & Solution', icon: <Lightbulb className="h-5 w-5" /> },
  { id: 'team', title: 'Your Role', icon: <Users className="h-5 w-5" /> },
  { id: 'tech', title: 'Tech Stack', icon: <Code className="h-5 w-5" /> },
  { id: 'media', title: 'Links', icon: <Target className="h-5 w-5" /> },
  { id: 'review', title: 'Review', icon: <Check className="h-5 w-5" /> },
];

export default function FounderWizard() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basics');
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      case 'media':
        return true;
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

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to create a venture');
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    try {
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
          demo_url: formData.demoUrl || null,
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

      toast.success('Venture created successfully!');
      navigate('/ventures');
    } catch (error) {
      console.error('Error creating venture:', error);
      toast.error('Failed to create venture. Please try again.');
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
              <Label htmlFor="name">Venture Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => updateFormData({ name: e.target.value })}
                placeholder="e.g., PayStack, Flutterwave, Andela"
                className="text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">One-Line Pitch *</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={e => updateFormData({ tagline: e.target.value })}
                placeholder="e.g., Making payments in Africa easier"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{formData.tagline.length}/100</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => updateFormData({ description: e.target.value })}
                placeholder="Tell us more about what you're building..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-3">
              <Label>Stage</Label>
              <div className="grid grid-cols-5 gap-2">
                {(['idea', 'prototype', 'mvp', 'growth', 'scale'] as const).map(stage => (
                  <button
                    key={stage}
                    onClick={() => updateFormData({ stage })}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-all capitalize",
                      formData.stage === stage
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
              <Label htmlFor="problem">The Problem *</Label>
              <Textarea
                id="problem"
                value={formData.problemStatement}
                onChange={e => updateFormData({ problemStatement: e.target.value })}
                placeholder="What painful problem are you solving? Who feels it most?"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solution">Your Solution</Label>
              <Textarea
                id="solution"
                value={formData.solution}
                onChange={e => updateFormData({ solution: e.target.value })}
                placeholder="How does your product solve this better than alternatives?"
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="marketSize">Market Opportunity</Label>
              <Input
                id="marketSize"
                value={formData.marketSize}
                onChange={e => updateFormData({ marketSize: e.target.value })}
                placeholder="e.g., $5B addressable market in East Africa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="traction">Traction (if any)</Label>
              <Input
                id="traction"
                value={formData.traction}
                onChange={e => updateFormData({ traction: e.target.value })}
                placeholder="e.g., 500 beta users, $10K MRR, LOIs from 3 enterprises"
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
            <div className="bg-secondary/50 rounded-2xl p-6 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">You're the Lead Founder</h3>
              <p className="text-muted-foreground text-sm">
                You'll be registered as the primary founder. You can invite co-founders later.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="founderTitle">Your Title *</Label>
              <Input
                id="founderTitle"
                value={formData.founderTitle}
                onChange={e => updateFormData({ founderTitle: e.target.value })}
                placeholder="e.g., CEO & Co-Founder, CTO, Founding Engineer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessModel">Business Model</Label>
              <Input
                id="businessModel"
                value={formData.businessModel}
                onChange={e => updateFormData({ businessModel: e.target.value })}
                placeholder="e.g., SaaS subscription, Transaction fees, Marketplace"
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
              <Label>Industry *</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(industry => (
                  <Badge
                    key={industry}
                    variant={formData.industry.includes(industry) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      formData.industry.includes(industry) && "bg-primary"
                    )}
                    onClick={() => toggleArrayItem('industry', industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label>Tech Stack</Label>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.map(tech => (
                  <Badge
                    key={tech}
                    variant={formData.techStack.includes(tech) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-all",
                      formData.techStack.includes(tech) && "bg-primary"
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

      case 'media':
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website</Label>
              <Input
                id="websiteUrl"
                type="url"
                value={formData.websiteUrl}
                onChange={e => updateFormData({ websiteUrl: e.target.value })}
                placeholder="https://yourventure.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubUrl">GitHub Repository</Label>
              <Input
                id="githubUrl"
                type="url"
                value={formData.githubUrl}
                onChange={e => updateFormData({ githubUrl: e.target.value })}
                placeholder="https://github.com/yourorg/repo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="demoUrl">Demo / Pitch Video</Label>
              <Input
                id="demoUrl"
                type="url"
                value={formData.demoUrl}
                onChange={e => updateFormData({ demoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Pitch deck upload coming soon
              </p>
            </div>
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
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6">
              <h3 className="font-bold text-2xl mb-2">{formData.name}</h3>
              <p className="text-muted-foreground">{formData.tagline}</p>
              <Badge className="mt-3 capitalize">{formData.stage}</Badge>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Problem</h4>
                <p className="text-sm">{formData.problemStatement || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Solution</h4>
                <p className="text-sm">{formData.solution || 'Not specified'}</p>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Your Role</h4>
                <p className="text-sm">{formData.founderTitle}</p>
              </div>

              {formData.industry.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Industry</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.industry.map(i => (
                      <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {formData.techStack.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">Tech Stack</h4>
                  <div className="flex flex-wrap gap-1">
                    {formData.techStack.map(t => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">Apply to Startup Garage</h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => index <= currentStepIndex && setCurrentStep(step.id)}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                  index < currentStepIndex && "bg-primary text-primary-foreground",
                  index === currentStepIndex && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  index > currentStepIndex && "bg-secondary text-muted-foreground"
                )}
              >
                {index < currentStepIndex ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 mx-1",
                  index < currentStepIndex ? "bg-primary" : "bg-secondary"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{steps[currentStepIndex].title}</h2>
          <p className="text-muted-foreground mt-1">
            Step {currentStepIndex + 1} of {steps.length}
          </p>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={goPrev}
            disabled={currentStepIndex === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === 'review' ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Launch Venture
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={goNext}
              disabled={!canProceed()}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}