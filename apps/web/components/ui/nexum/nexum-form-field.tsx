import { cn } from "@nexum-tower/ui";
import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

type NexumFormFieldProps = {
  label: string;
  htmlFor?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function NexumFormField({
  label,
  htmlFor,
  helperText,
  error,
  required,
  children,
  className,
}: NexumFormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium uppercase tracking-wide text-nexum-text-muted"
      >
        {label}
        {required && <span className="ml-0.5 text-nexum-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-nexum-danger" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-nexum-text-soft">{helperText}</p>
      ) : null}
    </div>
  );
}

type NexumCheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function NexumCheckbox({ label, className, id, ...props }: NexumCheckboxProps) {
  const inputId = id ?? props.name;

  return (
    <label htmlFor={inputId} className={cn("flex cursor-pointer items-center gap-2.5", className)}>
      <input
        id={inputId}
        type="checkbox"
        className="h-4 w-4 rounded border-nexum-border bg-nexum-bg-soft text-nexum-primary focus:ring-nexum-primary/30"
        {...props}
      />
      <span className="text-sm text-nexum-text-muted">{label}</span>
    </label>
  );
}

type NexumSwitchProps = {
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  id?: string;
};

export function NexumSwitch({ label, checked, onChange, id }: NexumSwitchProps) {
  const switchId = id ?? label;

  return (
    <label htmlFor={switchId} className="flex cursor-pointer items-center justify-between gap-3">
      <span className="text-sm text-nexum-text-muted">{label}</span>
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full border transition-colors",
          checked
            ? "border-nexum-primary/50 bg-nexum-primary/20"
            : "border-nexum-border bg-nexum-bg-soft",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-nexum-text transition-transform",
            checked ? "translate-x-5 bg-nexum-primary" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}
