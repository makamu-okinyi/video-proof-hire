import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark' | 'light';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', blur = 'xl', children, ...props }, ref) => {
    const blurClasses = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    };

    const variantClasses = {
      default: 'bg-white/20 border border-white/30',
      dark: 'bg-black/40 border border-white/10',
      light: 'bg-white/40 border border-white/50',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl shadow-lg",
          blurClasses[blur],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";

export { GlassCard, GlassPanel };
