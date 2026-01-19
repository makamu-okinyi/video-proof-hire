import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'One number', test: (p) => /[0-9]/.test(p) },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { strength, passed } = useMemo(() => {
    const passedCount = requirements.filter((req) => req.test(password)).length;
    return {
      strength: passedCount,
      passed: requirements.map((req) => req.test(password)),
    };
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return '';
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Fair';
    if (strength <= 3) return 'Good';
    return 'Strong';
  }, [strength, password.length]);

  const strengthColor = useMemo(() => {
    if (strength <= 1) return 'bg-destructive';
    if (strength <= 2) return 'bg-yellow-500';
    if (strength <= 3) return 'bg-blue-500';
    return 'bg-green-500';
  }, [strength]);

  if (password.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Password strength</span>
          <span className={cn(
            "text-xs font-medium",
            strength <= 1 && "text-destructive",
            strength === 2 && "text-yellow-500",
            strength === 3 && "text-blue-500",
            strength === 4 && "text-green-500"
          )}>
            {strengthLabel}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                strength >= level ? strengthColor : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1">
        {requirements.map((req, index) => (
          <li
            key={req.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors duration-200",
              passed[index] ? "text-green-500" : "text-muted-foreground"
            )}
          >
            {passed[index] ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
