import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mail, Lock, Eye, EyeOff, User, Briefcase, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

// Validation schemas
const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });
const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });
const usernameSchema = z.string().trim().max(50, { message: "Username must be less than 50 characters" }).optional();
const bioSchema = z.string().trim().max(500, { message: "Bio must be less than 500 characters" }).optional();

type Step = 'welcome' | 'login' | 'signup' | 'userType' | 'onboarding';
type UserType = 'talent' | 'employer';
type SkillCategory = 'tech' | 'design' | 'business' | 'other';

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

  const { login, signup, updateProfile, refreshProfile, isAuthenticated, isLoading, profile } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && profile) {
      // Redirect based on user type
      if (profile.user_type === 'employer') {
        navigate('/employer');
      } else {
        navigate('/feed');
      }
    }
  }, [isAuthenticated, isLoading, profile, navigate]);

  const handleAuth = async () => {
    // Validate email
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    // Validate password (only for signup)
    if (!isLogin) {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        toast.error(passwordResult.error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await login(email, password);
        if (error) {
          // User-friendly error messages
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please check your email to confirm your account');
          } else {
            toast.error('Login failed. Please try again.');
          }
        }
        // Navigation handled by useEffect when profile loads
      } else {
        const { error } = await signup(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('An account with this email already exists');
          } else {
            toast.error('Signup failed. Please try again.');
          }
        } else {
          toast.success('Account created!');
          setStep('userType');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
    setLoading(false);
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep('onboarding');
  };

  const handleOnboardingComplete = async () => {
    // Validate inputs
    if (username) {
      const usernameResult = usernameSchema.safeParse(username);
      if (!usernameResult.success) {
        toast.error(usernameResult.error.errors[0].message);
        return;
      }
    }

    if (bio) {
      const bioResult = bioSchema.safeParse(bio);
      if (!bioResult.success) {
        toast.error(bioResult.error.errors[0].message);
        return;
      }
    }

    setLoading(true);
    try {
      // Use the secure database function to update role
      const { error: roleError } = await supabase.rpc('update_user_role', {
        new_role: userType
      });

      if (roleError) {
        toast.error('Failed to set account type');
        setLoading(false);
        return;
      }

      // Update profile info
      await updateProfile({
        username: username || null,
        skill_category: selectedCategory || 'other',
        bio: bio || null,
      });

      // Refresh to get updated profile
      await refreshProfile();

      // Redirect based on user type
      if (userType === 'employer') {
        navigate('/employer');
      } else {
        navigate('/feed');
      }
    } catch (error) {
      toast.error('Failed to complete setup');
    }
    setLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

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
          <p className="text-muted-foreground">
            {userType === 'employer' 
              ? 'Tell candidates about your company'
              : 'Help employers discover you'}
          </p>
        </div>

        <div className="space-y-6 flex-1">
          {/* Username / Company Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {userType === 'employer' ? 'Company Name' : 'Username'} (optional)
            </label>
            <Input
              placeholder={userType === 'employer' ? 'Acme Inc.' : '@username'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-14 text-base"
            />
          </div>

          {/* Skill Category - Only for talent */}
          {userType === 'talent' && (
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
          )}

          {/* Bio */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {userType === 'employer' ? 'Company description' : 'Short bio'} (optional)
            </label>
            <Input
              placeholder={userType === 'employer' 
                ? 'What does your company do?'
                : 'Tell employers about yourself...'}
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
          disabled={loading}
        >
          {loading ? 'Setting up...' : 'Complete Setup'}
          {!loading && <ArrowRight className="h-5 w-5 ml-2" />}
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
