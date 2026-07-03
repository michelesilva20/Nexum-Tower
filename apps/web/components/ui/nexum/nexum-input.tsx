import { cn } from "@nexum-tower/ui";
import type { InputHTMLAttributes } from "react";

type NexumInputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
  success?: boolean;
};

export function NexumInput({ className, error, success, ...props }: NexumInputProps) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-xl border bg-nexum-bg-soft px-3.5 text-sm text-nexum-text",
        "placeholder:text-nexum-text-soft",
        "transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-nexum-primary/30 focus:border-nexum-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error
          ? "border-nexum-danger focus:border-nexum-danger focus:ring-nexum-danger/30"
          : success
            ? "border-nexum-success focus:border-nexum-success focus:ring-nexum-success/30"
            : "border-nexum-border hover:border-nexum-border/80",
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
        "min-h-[100px] w-full rounded-xl border bg-nexum-bg-soft px-3.5 py-2.5 text-sm text-nexum-text",
        "placeholder:text-nexum-text-soft",
        "focus:outline-none focus:ring-2 focus:ring-nexum-primary/30 focus:border-nexum-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-nexum-danger" : "border-nexum-border hover:border-nexum-border/80",
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
        "h-10 w-full rounded-xl border bg-nexum-bg-soft px-3.5 text-sm text-nexum-text",
        "focus:outline-none focus:ring-2 focus:ring-nexum-primary/30 focus:border-nexum-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        error ? "border-nexum-danger" : "border-nexum-border",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
