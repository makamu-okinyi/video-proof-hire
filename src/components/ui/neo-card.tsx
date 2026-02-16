import * as React from "react";
import { cn } from "@/lib/utils";

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'depth' | 'extruded' | 'pressed' | 'subtle' | 'flat';
}

const NeoCard = React.forwardRef<HTMLDivElement, NeoCardProps>(
  ({ className, variant = 'glass', ...props }, ref) => {
    const variantClasses = {
      glass: 'glass-panel',
      depth: 'donjo-depth-card',
      extruded: 'neo-extruded',
      pressed: 'neo-pressed',
      subtle: 'neo-subtle',
      flat: 'neo-flat',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variantClasses[variant],
          "p-6 rounded-3xl text-[#1e293b]",
          className
        )}
        {...props}
      />
    );
  }
);
NeoCard.displayName = "NeoCard";

const NeoCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 mb-4", className)}
    {...props}
  />
));
NeoCardHeader.displayName = "NeoCardHeader";

const NeoCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight text-charcoal",
      className
    )}
    {...props}
  />
));
NeoCardTitle.displayName = "NeoCardTitle";

const NeoCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-cool-grey", className)}
    {...props}
  />
));
NeoCardDescription.displayName = "NeoCardDescription";

const NeoCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
NeoCardContent.displayName = "NeoCardContent";

const NeoCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center mt-4 pt-4 border-t border-border/30", className)}
    {...props}
  />
));
NeoCardFooter.displayName = "NeoCardFooter";

export {
  NeoCard,
  NeoCardHeader,
  NeoCardFooter,
  NeoCardTitle,
  NeoCardDescription,
  NeoCardContent,
};
