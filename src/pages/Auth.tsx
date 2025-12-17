import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, Eye, EyeOff, User, Briefcase, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { UserType, SkillCategory } from '@/types';
import { cn } from '@/lib/utils';

type Step = 'welcome' | 'login' | 'signup' | 'userType' | 'onboarding';

const skillCategories: { value: SkillCategory; label: string; icon: string }[] = [
  { value: 'tech', label: 'Technology', icon: '💻' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'business', label: 'Business', icon: '📊' },
  { value: 'other', label: 'Other', icon: '✨' },
];

export default function Auth() {
  const [step, setStep] = useState<Step>('welcome');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('talent');
  const [username, setUsername] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, updateProfile } = useAuth();
  const navigate = useNavigate();

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/feed');
      } else {
        await signup(email, password, userType);
        setStep('userType');
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
    setLoading(false);
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep('onboarding');
  };

  const handleOnboardingComplete = () => {
    updateProfile({
      username,
      skillCategory: selectedCategory || 'other',
      bio,
    });
    navigate('/feed');
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">donjo</h1>
          <p className="text-muted-foreground text-lg">Prove your skills. Get hired.</p>
        </div>

        {/* Hero Visual */}
        <div className="relative h-64 w-full rounded-3xl bg-gradient-to-br from-secondary to-muted overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-48 rounded-2xl bg-foreground/10 backdrop-blur-sm transform rotate-6 animate-float" />
            <div className="absolute w-32 h-48 rounded-2xl bg-coral/20 backdrop-blur-sm transform -rotate-6 animate-float" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-3 pt-4">
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full"
            onClick={() => { setIsLogin(false); setStep('login'); }}
          >
            Get Started
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="w-full"
            onClick={() => { setIsLogin(true); setStep('login'); }}
          >
            I already have an account
          </Button>
        </div>
      </div>
    </div>
  );

  const renderLoginSignup = () => (
    <div className="flex flex-col min-h-screen px-6 py-8 animate-fade-in">
      {/* Back Button */}
      <button 
        onClick={() => setStep('welcome')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ChevronLeft className="h-5 w-5" />
        <span>Back</span>
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="space-y-2 mb-8">
          <h2 className="text-3xl font-bold">{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <p className="text-muted-foreground">
            {isLogin ? 'Sign in to continue to Donjo' : 'Start building your video portfolio'}
          </p>
        </div>

        <div className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-12 h-14 text-base"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-12 h-14 text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Submit */}
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full mt-6"
            onClick={handleAuth}
            disabled={loading || !email || !password}
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Continue'}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          {/* Toggle */}
          <p className="text-center text-muted-foreground pt-4">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-foreground font-medium hover:text-coral transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );

  const renderUserType = () => (
    <div className="flex flex-col min-h-screen px-6 py-8 animate-fade-in">
      <button 
        onClick={() => setStep('login')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ChevronLeft className="h-5 w-5" />
        <span>Back</span>
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="space-y-2 mb-10">
          <h2 className="text-3xl font-bold">Who are you?</h2>
          <p className="text-muted-foreground">Select your primary role on Donjo</p>
        </div>

        <div className="space-y-4">
          {/* Talent Option */}
          <button
            onClick={() => handleUserTypeSelect('talent')}
            className={cn(
              "w-full p-6 rounded-2xl border-2 text-left transition-all duration-200",
              "hover:border-coral hover:shadow-md",
              "border-border"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-coral/10 flex items-center justify-center">
                <User className="h-7 w-7 text-coral" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Student / Talent</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Showcase your skills and get discovered by employers
                </p>
              </div>
            </div>
          </button>

          {/* Employer Option */}
          <button
            onClick={() => handleUserTypeSelect('employer')}
            className={cn(
              "w-full p-6 rounded-2xl border-2 text-left transition-all duration-200",
              "hover:border-coral hover:shadow-md",
              "border-border"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-foreground/5 flex items-center justify-center">
                <Briefcase className="h-7 w-7 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Employer</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Discover and hire verified talent faster
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderOnboarding = () => (
    <div className="flex flex-col min-h-screen px-6 py-8 animate-fade-in">
      <button 
        onClick={() => setStep('userType')}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ChevronLeft className="h-5 w-5" />
        <span>Back</span>
      </button>

      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
        <div className="space-y-2 mb-8">
          <h2 className="text-3xl font-bold">Set up your profile</h2>
          <p className="text-muted-foreground">Help employers discover you</p>
        </div>

        <div className="space-y-6 flex-1">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Username (optional)</label>
            <Input
              placeholder="@username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-14 text-base"
            />
          </div>

          {/* Skill Category */}
          <div className="space-y-3">
            <label className="text-sm font-medium">What's your field?</label>
            <div className="grid grid-cols-2 gap-3">
              {skillCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all duration-200",
                    selectedCategory === cat.value
                      ? "border-coral bg-coral/5"
                      : "border-border hover:border-coral/50"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <p className="text-sm font-medium mt-2">{cat.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Short bio (optional)</label>
            <Input
              placeholder="Tell employers about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="h-14 text-base"
            />
          </div>
        </div>

        {/* Complete */}
        <Button 
          variant="coral" 
          size="xl" 
          className="w-full mt-8"
          onClick={handleOnboardingComplete}
        >
          Complete Setup
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      {step === 'welcome' && renderWelcome()}
      {step === 'login' && renderLoginSignup()}
      {step === 'userType' && renderUserType()}
      {step === 'onboarding' && renderOnboarding()}
    </div>
  );
}
