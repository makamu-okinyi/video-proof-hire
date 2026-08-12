import { useState, useEffect, type ElementType } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Mail, Lock, Eye, EyeOff, User, Briefcase, ChevronLeft, Loader2, Fingerprint, ChevronDown, Rocket, ShieldCheck, Code2, Palette, BarChart3, Package } from 'lucide-react';
import { RocketLoader } from '@/components/ui/RocketLoader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
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

type Step = 'welcome' | 'login' | 'signup' | 'userType' | 'onboarding' | 'forgotPassword' | 'confirmation';
type UserType = 'talent' | 'employer';
type SkillCategory = 'tech' | 'design' | 'business' | 'other';

const skillCategories: { value: SkillCategory; label: string; Icon: ElementType }[] = [
  { value: 'tech', label: 'Technology', Icon: Code2 },
  { value: 'design', label: 'Design', Icon: Palette },
  { value: 'business', label: 'Business', Icon: BarChart3 },
  { value: 'other', label: 'Other', Icon: Package },
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
  const { signIn } = useAuthActions();
  const setUserTypeMutation = useMutation(api.profiles.setUserType);
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
      const googleName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || '';
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
        const destination = profile.user_type === 'admin' ? '/admin' :
                          profile.user_type === 'employer' ? '/employer' :
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
        const metadata = {
          username: username.trim() || null,
          skill_category: selectedCategory || 'other',
          user_type: userType,
          industry: selectedCategory || null,
        };
        const { error } = await signup(email, password, metadata);
        if (error) {
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
          // Send welcome email via Convex HTTP action (fire and forget)
          const convexSiteUrl = import.meta.env.VITE_CONVEX_SITE_URL as string;
          if (convexSiteUrl) {
            fetch(`${convexSiteUrl}/welcome-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: '', username, email }),
            }).catch(console.error);
          }
          // With Convex auth, signup signs in immediately — go to profile setup
          setJustLoggedIn(true);
          setStep('userType');
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
      await signIn("password", { email: resetEmail, flow: "reset" });
      setResetEmailSent(true);
      toast.success('Password reset code sent to your email!');
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('not found') || msg.includes('no user')) {
        // Don't reveal if email exists — show success anyway
        setResetEmailSent(true);
        toast.success('If that email exists, you\'ll receive a reset code.');
      } else {
        toast.error('Failed to send reset email. Please try again.');
      }
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
      // Set user type in Convex profile
      await setUserTypeMutation({ userType });

      // Update profile info
      await updateProfile({
        username: username || null,
        skill_category: selectedCategory || 'other',
        bio: bio || null,
        user_type: userType,
      });

      // Refresh to get updated profile
      await refreshProfile();

      // Redirect based on user type (employer = hiring dashboard; talent -> feed,
      // then useRoleBasedRedirect routes founders on to /founder).
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="neo-extruded p-8">
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
      const destination = profile.user_type === 'admin' ? '/admin' :
                          profile.user_type === 'employer' ? '/employer' :
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
                variant="default"
                size="xl"
                className="w-full rounded-full"
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
      {/* Glass container */}
      <div className="neo-extruded w-full max-w-md space-y-8 p-6 sm:p-8">
        {/* Logo & headline */}
        <div className="text-center space-y-2">
          <Logo size="xl" className="justify-center" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Donjo
          </h1>
          <p className="text-muted-foreground text-sm">
            Prove your skills, get hired
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Role selection eyebrow */}
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Choose your path
        </p>

        {/* Selection cards */}
        <div className="space-y-3">

          {/* Applicant card */}
          <button
            onClick={() => { setUserType('talent'); setIsLogin(false); setStep('login'); }}
            className="neo-extruded-sm group w-full text-center p-6 transition-transform duration-200 hover:-translate-y-0.5 pointer-events-auto"
          >
            <div className="flex justify-center mb-4">
              <div className="squircle-icon h-16 w-16">
                <Rocket className="h-8 w-8 text-brand-strong" strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5 tracking-tight">
              Apply as Applicant
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Submit your video portfolio and get discovered by employers.
            </p>
            <p className="mt-4 text-xs font-semibold text-foreground flex items-center justify-center gap-1">
              Select <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </button>

          {/* Program Manager card */}
          <button
            onClick={() => { setUserType('employer'); setIsLogin(false); setStep('login'); }}
            className="neo-extruded-sm group w-full text-center p-6 transition-transform duration-200 hover:-translate-y-0.5 pointer-events-auto"
          >
            <div className="flex justify-center mb-4">
              <div className="squircle-icon h-16 w-16">
                <ShieldCheck className="h-8 w-8 text-foreground" strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5 tracking-tight">
              Hire Talent
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Post jobs, review video applications, and hire verified talent.
            </p>
            <p className="mt-4 text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1">
              Select <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </button>
        </div>

        {/* Existing user — subtle, non-competing */}
        <div className="text-center pt-2">
          <button
            className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 pointer-events-auto"
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
            className="neo-extruded-sm flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-foreground hover:-translate-y-0.5 transition-transform pointer-events-auto"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <select className="neo-extruded-sm px-4 py-2.5 text-sm font-medium text-foreground appearance-none cursor-pointer pointer-events-auto pr-8 min-w-[120px]" defaultValue="en">
                <option value="en">English</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-md mx-auto w-full">
          <div className="neo-extruded w-full p-6 sm:p-8 space-y-6">
          {/* Avatar / Logo */}
          <div className="mb-4 flex justify-center">
            <div className="w-20 h-20 neo-extruded-sm rounded-full flex items-center justify-center p-1">
              <Logo size="lg" className="object-contain" />
            </div>
          </div>

          <div className="w-full space-y-4">
            {/* Email or username */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Email or username</label>
              <div className="neo-inset">
                <Input
                  type="email"
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-[inherit] border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Password</label>
              <div className="neo-inset relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-[inherit] border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 pl-4 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground pointer-events-auto"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {!isLogin && <PasswordStrengthIndicator password={password} />}
            </div>

            {/* Signup-only: Username + Niche */}
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">
                    {userType === 'employer' ? 'Company / Display name' : 'Username'} (optional)
                  </label>
                  <div className="neo-inset">
                    <Input
                      type="text"
                      placeholder={userType === 'employer' ? 'Acme Inc.' : '@username'}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 rounded-[inherit] border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    {userType === 'employer' ? 'Industry / Sector' : 'Your field'}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {skillCategories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setSelectedCategory(cat.value as SkillCategory)}
                        className={cn(
                          "p-3 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-2",
                          selectedCategory === cat.value
                            ? "border-brand bg-brand/5"
                            : "border-border hover:border-brand/50"
                        )}
                      >
                        <cat.Icon className="h-4 w-4 text-brand-strong shrink-0" />
                        <span className="text-xs font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Primary CTA */}
            <Button
              variant="default"
              className="w-full h-14 rounded-full font-semibold mt-4"
              onClick={handleAuth}
              disabled={loading || !email || !password}
            >
              {loading ? 'Loading...' : isLogin ? 'Log in' : 'Create Account'}
              {!loading && <ArrowRight className="h-5 w-5 ml-2" />}
            </Button>

            {/* Forgot password */}
            {isLogin && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Forgot your login details?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetEmailSent(false);
                    setStep('forgotPassword');
                  }}
                  className="font-medium text-foreground hover:underline pointer-events-auto"
                >
                  Get help signing in.
                </button>
              </p>
            )}

            {/* Biometric (WebAuthn passkey) */}
            <div className="flex justify-center py-4">
              <button
                type="button"
                onClick={handleBiometricClick}
                disabled={bioLoading}
                className="w-16 h-16 neo-inset flex items-center justify-center text-muted-foreground hover:text-brand-strong transition-colors pointer-events-auto disabled:opacity-50"
              >
                {bioLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Fingerprint className="h-8 w-8" />}
              </button>
            </div>

            {/* Toggle sign in / sign up */}
            <p className="text-center text-sm text-muted-foreground pt-2">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="font-medium text-brand-strong hover:text-brand-strong/80 pointer-events-auto"
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
                <span className="w-full border-t border-border" />
              </span>
              <span className="relative flex justify-center text-xs uppercase">
                <span className="px-2 bg-background text-muted-foreground">or continue with</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="lg"
              className="w-full mt-4 rounded-full"
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
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 pointer-events-auto"
      >
        <ChevronLeft className="h-5 w-5" />
        <span>Back to login</span>
      </button>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="neo-extruded p-6 sm:p-8 space-y-6">
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
                  className="text-foreground hover:underline font-medium"
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
                variant="default"
                size="xl"
                className="w-full mt-2 rounded-full"
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
              "hover:border-brand hover:-translate-y-0.5",
              "border-border"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-brand/10 flex items-center justify-center">
                <User className="h-7 w-7 text-brand-strong" />
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
              "hover:border-brand hover:-translate-y-0.5",
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
                        ? "border-brand bg-brand/5"
                        : "border-border hover:border-brand/50"
                    )}
                  >
                    <cat.Icon className="h-6 w-6 text-brand-strong" />
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
          variant="default"
          size="xl"
          className="w-full mt-8 rounded-full"
          onClick={handleOnboardingComplete}
          disabled={loading}
        >
          {loading ? 'Setting up...' : 'Complete Setup'}
          {!loading && <ArrowRight className="h-5 w-5 ml-2" />}
        </Button>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="flex flex-col min-h-screen items-center justify-center px-6 py-8 animate-fade-in">
      <div className="neo-extruded w-full max-w-md p-8 text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Check your email</h2>
          <p className="text-muted-foreground text-sm">
            We sent a verification link to <strong>{email}</strong>. Click the link to activate your account, then sign in below.
          </p>
        </div>
        <Button
          variant="default"
          size="xl"
          className="w-full rounded-full"
          onClick={() => { setIsLogin(true); setStep('login'); setPassword(''); }}
        >
          Proceed to Sign In
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground">
          Didn&apos;t receive it? Check your spam folder.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      <AuthBackground />
      {googleLoading && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-strong mb-4" />
          <p className="text-lg font-medium text-foreground">Redirecting to Google...</p>
          <p className="text-sm text-muted-foreground mt-1">Please wait</p>
        </div>
      )}
      {step === 'welcome' && renderWelcome()}
      {step === 'login' && renderLoginSignup()}
      {step === 'forgotPassword' && renderForgotPassword()}
      {step === 'userType' && renderUserType()}
      {step === 'onboarding' && renderOnboarding()}
      {step === 'confirmation' && renderConfirmation()}
    </div>
  );
}