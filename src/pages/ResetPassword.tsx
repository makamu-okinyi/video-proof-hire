import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/input';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Input } from '@/components/ui/input';
import { useAuthActions } from '@convex-dev/auth/react';
import { toast } from 'sonner';
import { z } from 'zod';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

const passwordSchema = z.string()
  .min(8, { message: "Password must be at least 8 characters" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" });

export default function ResetPassword() {
  useDocumentTitle('Reset your password');
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuthActions();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!code.trim()) {
      toast.error('Please enter the reset code from your email');
      return;
    }
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast.error(passwordResult.error.errors[0].message);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signIn("password", {
        email,
        code,
        newPassword: password,
        flow: "reset-verification",
      });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      if (msg.includes('invalid') || msg.includes('code')) {
        toast.error('Invalid or expired reset code. Please request a new one.');
      } else if (msg.includes('same as')) {
        toast.error('New password must be different from your current password');
      } else {
        toast.error('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 animate-fade-in">
        <div className="glass-panel w-full max-w-sm space-y-6 text-center p-8 rounded-2xl">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Password Reset!</h1>
            <p className="text-muted-foreground">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
          </div>
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={() => navigate('/auth')}
          >
            Go to Login
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 animate-fade-in">
      <div className="glass-panel w-full max-w-sm space-y-8 p-8 rounded-2xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter the code sent to your email and your new password.
          </p>
        </div>

        <div className="space-y-4">
          <Field label="Email address" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </Field>

          <Field label="Reset code" required hint="The code we emailed you.">
            <Input type="text" value={code} onChange={(e) => setCode(e.target.value)} maxLength={8} inputMode="numeric" autoComplete="one-time-code" className="text-center tracking-widest" />
          </Field>

          <Field label="New password" required>
            <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <PasswordStrengthIndicator password={password} />

          <Field label="Confirm new password" required>
            <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" enterKeyHint="go" />
          </Field>

          {confirmPassword && (
            <p className={`text-xs ${password === confirmPassword ? 'text-green-500' : 'text-destructive'}`}>
              {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}

          <Button
            variant="default"
            size="lg"
            className="w-full mt-6"
            onClick={handleResetPassword}
            disabled={loading || !email || !code || !password || !confirmPassword}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t get a code?{' '}
            <button
              type="button"
              className="text-foreground hover:underline font-medium"
              onClick={() => navigate('/auth')}
            >
              Request again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
