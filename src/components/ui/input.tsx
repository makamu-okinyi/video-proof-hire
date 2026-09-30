import * as React from "react";
import { Eye, EyeOff, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFieldContext } from "@/components/ui/field";

type InputProps = React.ComponentProps<"input">;

/** Sensible keyboard / autofill defaults per input type (callers can still override). */
function typeDefaults(type: string | undefined): Partial<InputProps> {
  switch (type) {
    case "email":
      return { inputMode: "email", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, enterKeyHint: "next" };
    case "tel":
      return { inputMode: "tel", enterKeyHint: "next" };
    case "url":
      return { inputMode: "url", autoCapitalize: "none", autoCorrect: "off", spellCheck: false, enterKeyHint: "next" };
    case "number":
      return { inputMode: "decimal", enterKeyHint: "next" };
    case "search":
      return { inputMode: "search", enterKeyHint: "search", autoCapitalize: "none", spellCheck: false };
    case "password":
      return { autoCapitalize: "none", autoCorrect: "off", spellCheck: false, enterKeyHint: "go" };
    default:
      return { enterKeyHint: "next" };
  }
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, id, required, "aria-invalid": ariaInvalid, "aria-describedby": describedByProp, ...props }, ref) => {
    const field = useFieldContext();
    return (
      <input
        type={type}
        id={id ?? field?.id}
        required={required ?? field?.required}
        aria-required={(required ?? field?.required) || undefined}
        aria-invalid={ariaInvalid ?? (field?.invalid ? true : undefined)}
        aria-describedby={describedByProp ?? field?.describedBy}
        className={cn(
          "field-control h-11 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className,
        )}
        ref={ref}
        {...typeDefaults(type)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

/** Password field with a show/hide toggle. Pass autoComplete="current-password" | "new-password". */
const PasswordInput = React.forwardRef<HTMLInputElement, Omit<InputProps, "type">>(
  ({ className, autoComplete = "current-password", ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className={cn("pr-12", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

interface SearchInputProps extends Omit<InputProps, "type" | "value" | "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name when there is no visible <Field> label. */
  "aria-label"?: string;
}

/** Search box with a leading icon and a clear button. */
const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onValueChange, placeholder = "Search", ...props }, ref) => (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn("pl-10 pr-10", className)}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  ),
);
SearchInput.displayName = "SearchInput";

export { Input, PasswordInput, SearchInput };
