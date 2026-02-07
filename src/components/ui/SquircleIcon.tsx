import * as React from "react";
import { cn } from "@/lib/utils";

interface SquircleIconProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ElementType;
  variant?: 'default' | 'coral' | 'blue' | 'green' | 'purple' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
}

const variantStyles = {
  default: {
    bg: 'from-muted to-secondary',
    iconColor: 'text-cool-grey',
  },
  coral: {
    bg: 'from-primary/20 to-primary/10',
    iconColor: 'text-primary',
  },
  blue: {
    bg: 'from-blue-100 to-blue-50',
    iconColor: 'text-blue-600',
  },
  green: {
    bg: 'from-emerald-100 to-emerald-50',
    iconColor: 'text-emerald-600',
  },
  purple: {
    bg: 'from-violet-100 to-violet-50',
    iconColor: 'text-violet-600',
  },
  amber: {
    bg: 'from-amber-100 to-amber-50',
    iconColor: 'text-amber-600',
  },
};

const sizeStyles = {
  sm: {
    container: 'h-10 w-10 rounded-xl',
    icon: 'h-5 w-5',
  },
  md: {
    container: 'h-12 w-12 rounded-2xl',
    icon: 'h-6 w-6',
  },
  lg: {
    container: 'h-14 w-14 rounded-2xl',
    icon: 'h-7 w-7',
  },
};

export function SquircleIcon({
  icon: Icon,
  variant = 'default',
  size = 'md',
  isActive = false,
  className,
  ...props
}: SquircleIconProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <div
      className={cn(
        sizeStyle.container,
        "relative flex items-center justify-center transition-all duration-300",
        // Squircle base with gradient
        `bg-gradient-to-br ${variantStyle.bg}`,
        // Neomorphic effect - extruded look
        isActive
          ? "shadow-[inset_3px_3px_6px_rgba(0,0,0,0.08),inset_-3px_-3px_6px_rgba(255,255,255,0.9)]"
          : "shadow-[4px_4px_8px_rgba(0,0,0,0.08),-4px_-4px_8px_rgba(255,255,255,0.9)]",
        // Inner border for depth
        "before:absolute before:inset-[1px] before:rounded-[inherit] before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-60",
        className
      )}
      {...props}
    >
      <Icon 
        className={cn(
          sizeStyle.icon,
          variantStyle.iconColor,
          "relative z-10 transition-transform duration-300",
          isActive && "scale-95"
        )} 
      />
    </div>
  );
}

// Predefined icon assignments for nav items
export const navIconVariants: Record<string, SquircleIconProps['variant']> = {
  '/feed': 'coral',
  '/ventures': 'blue',
  '/jobs': 'green',
  '/challenges': 'purple',
  '/messages': 'amber',
  '/employer': 'coral',
  '/invest': 'green',
  '/profile': 'blue',
  '/notifications': 'amber',
};
