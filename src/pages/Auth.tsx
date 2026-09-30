import { useState, useEffect, type ElementType } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Mail, Lock, User, Briefcase, ChevronLeft, Rocket, ShieldCheck, Code2, Palette, BarChart3, Package } from 'lucide-react';
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
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { PasskeyButton } from '@/components/auth/PasskeyButton';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/input';
import { LocationFields, fromLocationValue, type LocationValue } from '@/components/profile/LocationFields';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { LEGAL_VERSION } from '@/data/legal';
import { LegalLinks } from '@/components/legal/LegalLinks';

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

export default function Auth({ pageTitle = 'Sign in or create an account', heading = 'Sign in to Donjo' }: { pageTitle?: string; heading?: string }) {
  useDocumentTitle(pageTitle);
  const [step, setStep] = useState<Step>('welcome');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('talent');
  const [username, setUsername] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem('donjo-suspended')) {
        sessionStorage.removeItem('donjo-suspended');
        toast.error('This account has been suspended. Contact the Donjo team if you think this is a mistake.');
      }
    } catch {
      /* storage unavailable */
    }
  }, []);
  const [geo, setGeo] = useState<LocationValue>({ county: '', country: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { user, login, signup, signInWithWebAuthn, logout, updateProfile, refreshProfile, isAuthenticated, isLoading, profile } = useAuth();
  const { signIn } = useAuthActions();
  const setUserTypeMutation = useMutation(api.profiles.setUserType);
  const acceptTermsMutation = useMutation(api.profiles.acceptTerms);
  const upsertLocation = useMutation(api.profiles.upsertProfile);
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

  // Finish a fresh signup: create the profile from the signup form choices, then route.
  const [pendingSignup, setPendingSignup] = useState<{
    userType: UserType;
    username: string | null;
    skillCategory: string;
    location: LocationValue;
  } | null>(null);

  useEffect(() => {
    if (!pendingSignup || isLoading || !isAuthenticated || profile) return;
    const pending = pendingSignup;
    setPendingSignup(null);
    (async () => {
      try {
        await setUserTypeMutation({ userType: pending.userType });
        await updateProfile({
          username: pending.username,
          skill_category: pending.skillCategory,
          user_type: pending.userType,
        });
        await acceptTermsMutation({ version: LEGAL_VERSION });
        const loc = fromLocationValue(pending.location);
        if (loc.county || loc.country) await upsertLocation(loc);
        navigate(pending.userType === 'employer' ? '/employer' : '/feed', { replace: true });
      } catch {
        toast.error('Your account was created but profile setup failed. Please finish setup.');
        setStep('userType');
      }
    })();
  }, [pendingSignup, isLoading, isAuthenticated, profile, setUserTypeMutation, updateProfile, navigate]);

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
      if (!acceptedTerms) {
        toast.error('Please agree to the Terms of Use and Privacy Policy to continue.');
        return;
      }
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
          // Convex auth signs the user in immediately. The profile is created by the
          // effect below once the session is live, using the choices made on this form.
          setPendingSignup({
            userType,
            username: username.trim() || null,
            skillCategory: selectedCategory || 'other',
            location: geo,
          });
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
    setLoading(false);
  };

  const handlePasskeySignIn = async () => {
    // Email-first when a valid email is typed, otherwise usernameless (discoverable credential).
    const typed = emailSchema.safeParse(email);
    setPasskeyLoading(true);
    try {
      const { error } = await signInWithWebAuthn(typed.success ? { email: typed.data } : undefined);
      if (error) {
        toast.error(error.message);
      } else {
        setJustLoggedIn(true);
      }
    } finally {
      setPasskeyLoading(false);
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
      await acceptTermsMutation({ version: LEGAL_VERSION });
      { const loc = fromLocationValue(geo); if (loc.county || loc.country) await upsertLocation(loc); }

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
            {heading}</h1>
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
          <div className="flex-1" />
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
            <form
              className="space-y-5"
              noValidate
              onSubmit={(e) => { e.preventDefault(); if (!loading && email && password) void handleAuth(); }}
            >
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete={isLogin ? 'username' : 'email'} />
            </Field>

            <Field label="Password" required hint={!isLogin ? 'At least 8 characters with upper and lower case letters and a number.' : undefined}>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={isLogin ? 'current-password' : 'new-password'} />
            </Field>
            {!isLogin && <PasswordStrengthIndicator password={password} />}

            {/* Signup-only: Username + Niche + Location + consent */}
            {!isLogin && (
              <>
                <Field label={userType === 'employer' ? 'Company / display name' : 'Username'} optional counter={{ length: username.length, max: 50 }}>
                  <Input type="text" placeholder={userType === 'employer' ? 'Acme Inc.' : '@username'} value={username} onChange={(e) => setUsername(e.target.value)} maxLength={50} autoComplete="nickname" />
                </Field>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">{userType === 'employer' ? 'Industry / sector' : 'Your field'}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {skillCategories.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        aria-pressed={selectedCategory === cat.value}
                        onClick={() => setSelectedCategory(cat.value as SkillCategory)}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all duration-200 flex items-center gap-2 min-h-11",
                          selectedCategory === cat.value ? "border-brand-strong bg-brand/10" : "border-[hsl(var(--field-border))] hover:border-brand-strong/60"
                        )}
                      >
                        <cat.Icon className="h-4 w-4 text-brand-strong shrink-0" />
                        <span className="text-sm font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <LocationFields value={geo} onChange={setGeo} />

                <label className="flex items-start gap-3 text-sm text-foreground">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[hsl(var(--brand-strong))]" required />
                  <span>
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium underline">Terms of Use</a>{' '}
                    and{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium underline">Privacy Policy</a>.
                  </span>
                </label>
              </>
            )}

            {/* Primary CTA */}
            <Button
              variant="default"
              className="w-full h-14 rounded-full font-semibold mt-4"
              type="submit"
              disabled={loading || !email || !password || (!isLogin && !acceptedTerms)}
            >
              {loading ? 'Loading...' : isLogin ? 'Log in' : 'Create Account'}
              {!loading && <ArrowRight className="h-5 w-5 ml-2" />}
            </Button>
            </form>

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
          {/* Passkey + social sign-in, below the main form */}
          <div className="mt-6 w-full space-y-4">
            {isLogin && (
              <PasskeyButton
                onClick={handlePasskeySignIn}
                loading={passkeyLoading}
                disabled={loading}
                label="Sign in with a passkey"
              />
            )}
            <SocialAuthButtons />
            <LegalLinks className="pt-2" />
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
              <Field label="Email address" required>
                <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} autoComplete="email" />
              </Field>

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
          <Field label={userType === 'employer' ? 'Company name' : 'Username'} optional>
            <Input placeholder={userType === 'employer' ? 'Acme Inc.' : '@username'} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="nickname" />
          </Field>

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
      {step === 'welcome' && renderWelcome()}
      {step === 'login' && renderLoginSignup()}
      {step === 'forgotPassword' && renderForgotPassword()}
      {step === 'userType' && renderUserType()}
      {step === 'onboarding' && renderOnboarding()}
      {step === 'confirmation' && renderConfirmation()}
    </div>
  );
}