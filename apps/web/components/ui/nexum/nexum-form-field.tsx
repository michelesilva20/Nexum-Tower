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
        className="block text-[13px] font-medium leading-snug text-nexum-text"
      >
        {label}
        {required && <span className="ml-0.5 text-nexum-primary">*</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-nexum-danger" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs leading-relaxed text-nexum-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}

/** Container vertical para seções de formulário em modais/drawers. */
export function NexumFormSections({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}

/** Seção agrupada com título, descrição opcional e card visual. */
export function NexumFormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-nexum-border bg-nexum-surface p-4 shadow-[0_1px_3px_rgba(7,17,31,0.06)] sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-3 border-b border-nexum-border/70 pb-3">
        <span
          className="mt-1 h-4 w-1 shrink-0 rounded-full bg-nexum-primary"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-nexum-text">{title}</h3>
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-nexum-text-muted">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Grid padrão de campos (2 colunas em telas médias+). */
export function NexumFormGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>;
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
