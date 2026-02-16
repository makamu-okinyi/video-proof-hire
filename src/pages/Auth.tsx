import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Mail, Lock, Eye, EyeOff, User, Briefcase, ChevronLeft, Loader2, Fingerprint, ChevronDown } from 'lucide-react';
import { RocketLoader } from '@/components/ui/RocketLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { AuthBackground } from '@/components/auth/AuthBackground';

// Validation schemas
const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });
const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });
const usernameSchema = z.string().trim().max(50, { message: "Username must be less than 50 characters" }).optional();
const bioSchema = z.string().trim().max(500, { message: "Bio must be less than 500 characters" }).optional();

type Step = 'welcome' | 'login' | 'signup' | 'userType' | 'onboarding' | 'forgotPassword';
type UserType = 'talent' | 'employer';
type SkillCategory = 'tech' | 'design' | 'business' | 'other';

const skillCategories: { value: SkillCategory; label: string; icon: string }[] = [
  { value: 'tech', label: 'Technology', icon: '💻' },
  { value: 'design', label: 'Design', icon: '🎨' },
  { value: 'business', label: 'Business', icon: '📊' },
  { value: 'other', label: 'Other', icon: '📦' },
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
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const { user, login, signup, signInWithOAuth, signInWithWebAuthn, registerWebAuthn, logout, updateProfile, refreshProfile, isAuthenticated, isLoading, profile } = useAuth();
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
    if (!isLoading && isAuthenticated) {
      // If user has incomplete profile (new Google OAuth user), show onboarding
      if (profile && profileNeedsCompletion) {
        setStep('userType');
        return;
      }

      // Redirect when: just logged in, OAuth callback, or profile loaded (with role)
      const shouldRedirect = justLoggedIn || location.search.includes('code=') || location.hash.includes('access_token');
      if (shouldRedirect && profile) {
        const destination = (profile.user_type === 'employer' || profile.user_type === 'investor') ? '/admin' : 
                          profile.user_type === 'founder' ? '/founder' : '/feed';
        navigate(destination, { replace: true });
        setJustLoggedIn(false);
        return;
      }
      // Fallback: if authenticated but profile slow/null, redirect to feed after brief wait
      if (shouldRedirect && !profile) {
        const t = setTimeout(() => {
          navigate('/feed', { replace: true });
          setJustLoggedIn(false);
        }, 500);
        return () => clearTimeout(t);
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
          // User-friendly error messages based on error type
          const errorMsg = error.message?.toLowerCase() || '';
          if (errorMsg.includes('invalid login credentials') || errorMsg.includes('invalid_credentials')) {
            toast.error('Invalid email or password');
          } else if (errorMsg.includes('email not confirmed')) {
            toast.error('Please check your email to confirm your account');
          } else if (errorMsg.includes('too many requests') || errorMsg.includes('rate limit')) {
            toast.error('Too many attempts. Please wait a moment and try again.');
          } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
            toast.error('Network error. Please check your connection.');
          } else {
            toast.error(error.message || 'Login failed. Please try again.');
          }
        } else {
          // Successfully logged in - trigger redirect via useEffect
          setJustLoggedIn(true);
          // Removed passive "Welcome back" toast - no clear UX goal
        }
      } else {
        const { error } = await signup(email, password);
        if (error) {
          // Handle various signup errors including 422
          const errorMsg = error.message?.toLowerCase() || '';
          if (errorMsg.includes('already registered') || errorMsg.includes('already exists')) {
            toast.error('An account with this email already exists. Try logging in instead.');
          } else if (errorMsg.includes('password') && errorMsg.includes('weak')) {
            toast.error('Password is too weak. Use at least 8 characters with uppercase, lowercase, and numbers.');
          } else if (errorMsg.includes('invalid email') || errorMsg.includes('email')) {
            toast.error('Please enter a valid email address.');
          } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
            toast.error('Too many signup attempts. Please wait and try again.');
          } else if (errorMsg.includes('422') || errorMsg.includes('unprocessable')) {
            toast.error('Unable to create account. Please check your email and password format.');
          } else {
            toast.error(error.message || 'Signup failed. Please try again.');
          }
        } else {
          toast.success('Account created! Check your email to verify.');
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

  const handleForgotPassword = async () => {
    // Validate email
    const emailResult = emailSchema.safeParse(resetEmail);
    if (!emailResult.success) {
      toast.error(emailResult.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error('Failed to send reset email. Please try again.');
      } else {
        setResetEmailSent(true);
        toast.success('Password reset email sent!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
    setLoading(false);
  };

  const handleBiometricClick = async () => {
    setBioLoading(true);
    try {
      const { error } = await signInWithWebAuthn();
      if (error) {
        toast.info('Use password to sign in, or enable fingerprint after logging in.');
      }
    } finally {
      setBioLoading(false);
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
        navigate('/admin');
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-panel p-8 rounded-2xl">
          <RocketLoader indeterminate label="Loading..." />
        </div>
      </div>
    );
  }

  // Allow users to open /auth even if they're already signed in (so they can sign out / switch accounts)
  if (location.pathname === '/auth' && isAuthenticated && !justLoggedIn) {
    if (!profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <RocketLoader indeterminate label="Loading your account..." />
        </div>
      );
    }

    // If profile needs completion (new Google OAuth user), show onboarding flow
    // Let the step rendering handle it - don't show "already signed in" screen
    if (!profileNeedsCompletion && step === 'welcome') {
      const destination = (profile.user_type === 'employer' || profile.user_type === 'investor') ? '/admin' : 
                          profile.user_type === 'founder' ? '/founder' : '/feed';

      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">You're already signed in</h1>
              <p className="text-muted-foreground">
                Continue as {profile.username || user?.email || 'your account'}.
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
      <div className="soft-ui-card w-full max-w-md space-y-8 p-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <Logo size="xl" className="justify-center" />
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-charcoal">Startup Garage</h1>
            <p className="text-cool-grey text-lg">Venture Acceleration Engine</p>
          </div>
        </div>

        {/* Hero Visual - Neomorphic */}
        <div className="relative h-48 w-full glass-panel rounded-3xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-36 rounded-2xl bg-white/60 transform rotate-6 animate-float" />
            <div className="absolute w-24 h-36 rounded-2xl bg-white/40 transform -rotate-6 animate-float" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Role Selection - Clear Founder vs Admin distinction */}
        <div className="space-y-4 pt-4">
          <p className="text-center text-sm text-cool-grey mb-2">Select your role to continue</p>
          
          {/* Applicant Option - Primary CTA */}
          <div className="soft-ui-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal">Apply as Applicant</h3>
                <p className="text-xs text-cool-grey">Submit your video portfolio to find your next hire</p>
              </div>
            </div>
            <p className="text-sm text-cool-grey pl-15">
              Join our cohort program, get mentorship, and pitch to investors.
            </p>
            <button 
              className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-medium hover:bg-primary/90 transition-all duration-300 flex items-center justify-center gap-2 pointer-events-auto"
              onClick={() => { setUserType('talent'); setIsLogin(false); setStep('login'); }}
            >
              Apply Now
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          
          {/* Admin/Program Manager Option */}
          <div className="glass-panel p-5 rounded-3xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-white/60 rounded-2xl flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-charcoal" />
              </div>
              <div>
                <h3 className="font-semibold text-charcoal">Program Manager / Admin</h3>
                <p className="text-xs text-cool-grey">Manage cohorts and review applications</p>
              </div>
            </div>
            <button 
              className="w-full soft-ui-card py-3 font-medium text-[#1e293b] hover:opacity-90 transition-all duration-300 flex items-center justify-center gap-2 pointer-events-auto"
              onClick={() => { setUserType('employer'); setIsLogin(false); setStep('login'); }}
            >
              Admin Login
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 text-cool-grey">existing user?</span>
            </div>
          </div>
          
          <button 
            className="w-full py-3 text-cool-grey hover:text-charcoal transition-colors font-medium pointer-events-auto"
            onClick={() => { setIsLogin(true); setStep('login'); }}
          >
            Sign in to my account
          </button>
        </div>
      </div>
    </div>
  );

  const renderLoginSignup = () => (
      <div className="min-h-screen flex flex-col animate-fade-in">
        {/* Header - design1 layout */}
        <div className="flex items-center justify-between px-6 py-4 gap-4">
          <button
            type="button"
            onClick={() => setStep('welcome')}
            className="glass-panel px-4 py-2.5 text-sm font-medium text-[#1e293b] hover:opacity-90 pointer-events-auto"
          >
            UI Series
          </button>
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <select className="glass-panel px-4 py-2.5 text-sm font-medium text-[#1e293b] appearance-none cursor-pointer pointer-events-auto bg-transparent pr-8 min-w-[120px]" defaultValue="en">
                <option value="en">English</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto w-full">
          <div className="glass-panel w-full p-8 rounded-2xl space-y-6">
          {/* Avatar / Logo - design1 central */}
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 glass-panel rounded-full flex items-center justify-center p-1 ring-2 ring-white/40">
              <Logo size="lg" className="object-contain" />
            </div>
          </div>

          <div className="w-full space-y-4">
            {/* Phone number, email or username */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">Phone number, email or username</label>
              <div className="glass-panel rounded-[2px]">
                <Input
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-[2px] border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-4"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm text-slate-600">Password</label>
              <div className="glass-panel rounded-[2px] relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-[2px] border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 pointer-events-auto"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {!isLogin && <PasswordStrengthIndicator password={password} />}
            </div>

            {/* Log in - Emerald-500 for success/active */}
            <Button
              variant="default"
              className="w-full h-14 rounded-[2px] bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-none border-0 mt-4"
              onClick={handleAuth}
              disabled={loading || !email || !password}
            >
              {loading ? 'Loading...' : isLogin ? 'Log in' : 'Continue'}
              {!loading && <ArrowRight className="h-5 w-5 ml-2" />}
            </Button>

            {/* Forgot your login details? Get help login in. */}
            {isLogin && (
              <p className="text-center text-sm text-slate-600 mt-2">
                Forgot your login details?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetEmailSent(false);
                    setStep('forgotPassword');
                  }}
                  className="font-medium text-slate-800 hover:text-emerald-600 pointer-events-auto"
                >
                  Get help login in.
                </button>
              </p>
            )}

            {/* Biometric - Fingerprint icon (WebAuthn + password fallback) */}
            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={handleBiometricClick}
                disabled={bioLoading}
                className="w-16 h-16 glass-panel rounded-[2px] flex items-center justify-center text-[#64748b] hover:text-emerald-500 transition-colors pointer-events-auto disabled:opacity-50"
              >
                {bioLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Fingerprint className="h-8 w-8" />}
              </button>
            </div>

            {/* Don't have an account? Sign up */}
            <p className="text-center text-sm text-slate-600 pt-2">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-slate-800 hover:text-emerald-600 pointer-events-auto"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          </div>
          {/* Google Sign In - below main form, secondary */}
          <div className="mt-6 w-full">
            <div className="relative py-2">
              <span className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-300" />
              </span>
              <span className="relative flex justify-center text-xs uppercase">
                <span className="px-2 text-[#64748b]">or continue with</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full mt-4 rounded-[2px] glass-panel"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>
          </div>
        </div>
      </div>
    );

  const renderForgotPassword = () => (
    <div className="flex flex-col min-h-screen px-6 py-8 animate-fade-in">
      {/* Back Button */}
      <button 
        onClick={() => {
          setStep('login');
          setResetEmailSent(false);
        }}
        className="flex items-center gap-2 text-[#64748b] hover:text-[#1e293b] transition-colors mb-8 pointer-events-auto"
      >
        <ChevronLeft className="h-5 w-5" />
        <span>Back to login</span>
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="glass-panel p-8 rounded-2xl space-y-6">
          {resetEmailSent ? (
            // Success state
            <div className="space-y-6 text-center animate-fade-in">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Check your email</h2>
              <p className="text-muted-foreground">
                We've sent a password reset link to{' '}
                <span className="font-medium text-foreground">{resetEmail}</span>
              </p>
            </div>
            <div className="space-y-3 pt-4">
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => {
                  setResetEmailSent(false);
                  setResetEmail('');
                }}
              >
                Try a different email
              </Button>
              <p className="text-sm text-muted-foreground">
                Didn't receive the email?{' '}
                <button
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-coral hover:underline font-medium"
                >
                  {loading ? 'Sending...' : 'Resend'}
                </button>
              </p>
            </div>
            </div>
          ) : (
            // Form state
            <>
            <div className="space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Forgot password?</h2>
              <p className="text-muted-foreground">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-12 h-14 text-base"
                />
              </div>

              {/* Submit */}
              <Button 
                variant="hero" 
                size="xl" 
                className="w-full mt-2"
                onClick={handleForgotPassword}
                disabled={loading || !resetEmail}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
            </>
          )}
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
    <div className="min-h-screen relative">
      <AuthBackground />
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
      {step === 'forgotPassword' && renderForgotPassword()}
      {step === 'userType' && renderUserType()}
      {step === 'onboarding' && renderOnboarding()}
    </div>
  );
}