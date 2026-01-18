import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Mail, Lock, Eye, EyeOff, User, Briefcase, ChevronLeft, Loader2 } from 'lucide-react';
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
  const [googleLoading, setGoogleLoading] = useState(false);

  const { user, login, signup, signInWithOAuth, logout, updateProfile, refreshProfile, isAuthenticated, isLoading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if profile needs completion (for Google OAuth users)
  const profileNeedsCompletion = profile && !profile.username && !profile.user_type;

  // Track if user just logged in (to trigger redirect)
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Prefill username from Google OAuth user metadata
  useEffect(() => {
    if (user && profileNeedsCompletion && !username) {
      // Get name from Google OAuth metadata
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      if (googleName) {
        setUsername(googleName);
      }
    }
  }, [user, profileNeedsCompletion, username]);

  // Handle authentication state changes and redirects
  useEffect(() => {
    if (!isLoading && isAuthenticated && profile) {
      // If user has incomplete profile (new Google OAuth user), show onboarding
      if (profileNeedsCompletion) {
        setStep('userType');
        return;
      }
      
      // Redirect to appropriate page based on user type
      // This handles: login, Google OAuth return for existing users
      if (justLoggedIn || location.search.includes('code=') || location.hash.includes('access_token')) {
        const destination = profile.user_type === 'employer' ? '/employer' : '/feed';
        navigate(destination, { replace: true });
        setJustLoggedIn(false);
      }
    }
  }, [isAuthenticated, isLoading, profile, navigate, location.search, location.hash, profileNeedsCompletion, justLoggedIn]);

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
        } else {
          // Successfully logged in - trigger redirect via useEffect
          setJustLoggedIn(true);
          toast.success('Welcome back!');
        }
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
          // Skip userType selection since it's already chosen on welcome screen
          setStep('onboarding');
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error, url } = await signInWithOAuth('google', `${window.location.origin}/auth`);

      if (error) {
        console.error('Google sign-in error:', error);
        toast.error('Google sign-in failed. Please try again.');
        setGoogleLoading(false);
        return;
      }

      // If we got a URL, redirect to it (this is the OAuth provider's login page)
      if (url) {
        window.location.href = url;
        return;
      }

      // Keep loading state until redirect happens
    } catch (err) {
      console.error('Google sign-in unexpected error:', err);
      toast.error('An unexpected error occurred');
      setGoogleLoading(false);
    }
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

  // Allow users to open /auth even if they're already signed in (so they can sign out / switch accounts)
  if (location.pathname === '/auth' && isAuthenticated && !justLoggedIn) {
    if (!profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-pulse text-muted-foreground">Loading your account...</div>
        </div>
      );
    }

    // If profile needs completion (new Google OAuth user), show onboarding flow
    // Let the step rendering handle it - don't show "already signed in" screen
    if (!profileNeedsCompletion && step === 'welcome') {
      const destination = profile.user_type === 'employer' ? '/employer' : '/feed';

      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">You're already signed in</h1>
              <p className="text-muted-foreground">
                Continue as {profile.username || profile.email || 'your account'}.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={() => navigate(destination)}
              >
                Continue
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  try {
                    await logout();
                    toast.success('Signed out');
                    setStep('welcome');
                    setEmail('');
                    setPassword('');
                  } catch {
                    toast.error('Sign out failed. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Sign out
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              To sign in with a different account, sign out first.
            </p>
          </div>
        </div>
      );
    }
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

        {/* Role Selection */}
        <div className="space-y-3 pt-4">
          <p className="text-center text-sm text-muted-foreground mb-4">I am a...</p>
          
          {/* Student/Applicant Option */}
          <Button 
            variant="hero" 
            size="xl" 
            className="w-full"
            onClick={() => { setUserType('talent'); setIsLogin(false); setStep('login'); }}
          >
            <User className="h-5 w-5 mr-2" />
            Student / Applicant
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          {/* Employer Option */}
          <Button 
            variant="outline" 
            size="xl" 
            className="w-full"
            onClick={() => { setUserType('employer'); setIsLogin(false); setStep('login'); }}
          >
            <Briefcase className="h-5 w-5 mr-2" />
            Employer / Recruiter
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
          
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
          <h2 className="text-3xl font-bold">
            {isLogin ? 'Welcome back' : userType === 'employer' ? 'Create employer account' : 'Create applicant account'}
          </h2>
          <p className="text-muted-foreground">
            {isLogin 
              ? 'Sign in to continue to Donjo' 
              : userType === 'employer'
                ? 'Start discovering and hiring verified talent'
                : 'Start building your video portfolio'}
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

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button 
            variant="outline" 
            size="xl" 
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
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
    <div className="bg-background min-h-screen relative">
      {/* Google OAuth Loading Overlay */}
      {googleLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-coral mb-4" />
          <p className="text-lg font-medium text-foreground">Redirecting to Google...</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait</p>
        </div>
      )}
      {step === 'welcome' && renderWelcome()}
      {step === 'login' && renderLoginSignup()}
      {step === 'userType' && renderUserType()}
      {step === 'onboarding' && renderOnboarding()}
    </div>
  );
}