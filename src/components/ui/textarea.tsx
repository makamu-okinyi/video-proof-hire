import * as React from "react";

import { cn } from "@/lib/utils";
import { useFieldContext } from "@/components/ui/field";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, id, required, "aria-invalid": ariaInvalid, "aria-describedby": describedByProp, ...props }, ref) => {
    const field = useFieldContext();
    return (
      <textarea
        id={id ?? field?.id}
        required={required ?? field?.required}
        aria-required={(required ?? field?.required) || undefined}
        aria-invalid={ariaInvalid ?? (field?.invalid ? true : undefined)}
        aria-describedby={describedByProp ?? field?.describedBy}
        className={cn("field-control min-h-[6rem]", className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
