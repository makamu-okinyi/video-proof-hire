import * as React from "react";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

interface FieldContextValue {
  id: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

/** Read the surrounding <Field> (id, aria wiring). Controls work fine without one. */
export function useFieldContext() {
  return React.useContext(FieldContext);
}

export interface FieldProps {
  label: React.ReactNode;
  /** Helper text shown under the control (hidden while an error is showing). */
  hint?: React.ReactNode;
  /** Inline error text. Setting it marks the control aria-invalid. */
  error?: React.ReactNode;
  required?: boolean;
  /** Renders a quiet "Optional" tag next to the label. */
  optional?: boolean;
  /** Character counter, e.g. { length: bio.length, max: 200 }. */
  counter?: { length: number; max: number };
  /** Override the generated control id (rarely needed). */
  id?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + helper/error wrapper. The label is always visible above the control
 * (never placeholder-as-label) and is programmatically tied to it via the shared id.
 */
export function Field({ label, hint, error, required, optional, counter, id, className, children }: FieldProps) {
  const autoId = React.useId();
  const controlId = id ?? `f-${autoId.replace(/:/g, "")}`;
  const hintId = `${controlId}-hint`;
  const errorId = `${controlId}-error`;
  const hasError = !!error;
  const describedBy = [hasError ? errorId : hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  const counterOver = counter ? counter.length > counter.max : false;

  return (
    <FieldContext.Provider value={{ id: controlId, describedBy, invalid: hasError, required: !!required }}>
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={controlId} className="text-sm font-medium text-foreground">
            {label}
            {required && (
              <>
                <span aria-hidden="true" className="ml-0.5 text-[hsl(var(--danger))]">*</span>
                <span className="sr-only"> (required)</span>
              </>
            )}
          </label>
          {optional && !required && <span className="text-xs text-muted-foreground">Optional</span>}
        </div>
        {children}
        {(hasError || hint || counter) && (
          <div className="flex items-start justify-between gap-3 text-xs leading-5">
            <div className="min-w-0 flex-1">
              {hasError ? (
                <p id={errorId} role="alert" className="flex items-start gap-1.5 text-[hsl(var(--danger))]">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </p>
              ) : hint ? (
                <p id={hintId} className="text-muted-foreground">{hint}</p>
              ) : null}
            </div>
            {counter && (
              <span
                className={cn("shrink-0 tabular-nums", counterOver ? "text-[hsl(var(--danger))]" : "text-muted-foreground")}
                aria-live="off"
              >
                {counter.length}/{counter.max}
              </span>
            )}
          </div>
        )}
      </div>
    </FieldContext.Provider>
  );
}
