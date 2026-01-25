import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'light' | 'dark';
  showText?: boolean;
}

const sizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export function Logo({ className, size = 'md', variant = 'default', showText = false }: LogoProps) {
  const fillColor = variant === 'light' ? 'white' : variant === 'dark' ? '#0a0a0a' : 'currentColor';
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn(sizes[size])}
      >
        {/* Background for standalone use */}
        {variant === 'default' && (
          <rect width="512" height="512" rx="96" fill="#0a0a0a"/>
        )}
        
        {/* Left rounded bar */}
        <path 
          d="M140 160 C140 140, 155 125, 175 125 L175 125 C195 125, 210 140, 210 160 L210 352 C210 372, 195 387, 175 387 L175 387 C155 387, 140 372, 140 352 Z" 
          fill={variant === 'default' ? 'white' : fillColor}
        />
        
        {/* Play triangle (outlined) */}
        <path 
          d="M200 256 L300 320 L300 192 Z" 
          fill="none" 
          stroke={variant === 'default' ? 'white' : fillColor} 
          strokeWidth="24" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        
        {/* Top right bar */}
        <path 
          d="M290 145 L370 200" 
          stroke={variant === 'default' ? 'white' : fillColor} 
          strokeWidth="32" 
          strokeLinecap="round"
        />
        
        {/* Bottom right bar */}
        <path 
          d="M290 367 L370 312" 
          stroke={variant === 'default' ? 'white' : fillColor} 
          strokeWidth="32" 
          strokeLinecap="round"
        />
      </svg>
      
      {showText && (
        <span className={cn("font-bold tracking-tight", textSizes[size])}>
          donjo
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ className, variant = 'light' }: { className?: string; variant?: 'light' | 'dark' }) {
  const fillColor = variant === 'light' ? 'white' : '#0a0a0a';
  
  return (
    <svg 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left rounded bar */}
      <path 
        d="M140 160 C140 140, 155 125, 175 125 L175 125 C195 125, 210 140, 210 160 L210 352 C210 372, 195 387, 175 387 L175 387 C155 387, 140 372, 140 352 Z" 
        fill={fillColor}
      />
      
      {/* Play triangle (outlined) */}
      <path 
        d="M200 256 L300 320 L300 192 Z" 
        fill="none" 
        stroke={fillColor} 
        strokeWidth="24" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Top right bar */}
      <path 
        d="M290 145 L370 200" 
        stroke={fillColor} 
        strokeWidth="32" 
        strokeLinecap="round"
      />
      
      {/* Bottom right bar */}
      <path 
        d="M290 367 L370 312" 
        stroke={fillColor} 
        strokeWidth="32" 
        strokeLinecap="round"
      />
    </svg>
  );
}
