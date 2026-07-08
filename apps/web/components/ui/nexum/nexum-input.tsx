import { cn } from "@nexum-tower/ui";
import type { InputHTMLAttributes } from "react";

type NexumInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  success?: boolean;
};

const fieldBaseClass =
  "h-10 w-full rounded-lg border px-3 text-sm text-nexum-text shadow-[0_1px_2px_rgba(7,17,31,0.04)] transition-colors duration-200 bg-nexum-surface focus:outline-none focus:ring-2 focus:ring-nexum-primary/25 focus:border-nexum-primary disabled:cursor-not-allowed disabled:opacity-50";

export function NexumInput({ className, error, success, ...props }: NexumInputProps) {
  return (
    <input
      className={cn(
        fieldBaseClass,
        "placeholder:text-nexum-text-soft",
        error
          ? "border-nexum-danger focus:border-nexum-danger focus:ring-nexum-danger/25"
          : success
            ? "border-nexum-success focus:border-nexum-success focus:ring-nexum-success/25"
            : "border-nexum-border hover:border-nexum-text-soft/60",
        className,
      )}
      {...props}
    />
  );
}

type NexumTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
};

export function NexumTextarea({ className, error, ...props }: NexumTextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-[100px] w-full rounded-lg border bg-nexum-surface px-3 py-2.5 text-sm text-nexum-text shadow-[0_1px_2px_rgba(7,17,31,0.04)]",
        "placeholder:text-nexum-text-soft",
        "focus:outline-none focus:ring-2 focus:ring-nexum-primary/25 focus:border-nexum-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-nexum-danger"
          : "border-nexum-border hover:border-nexum-text-soft/60",
        className,
      )}
      {...props}
    />
  );
}

type NexumSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: boolean;
};

export function NexumSelect({ className, error, children, ...props }: NexumSelectProps) {
  return (
    <select
      className={cn(
        fieldBaseClass,
        error
          ? "border-nexum-danger focus:border-nexum-danger focus:ring-nexum-danger/25"
          : "border-nexum-border hover:border-nexum-text-soft/60",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
