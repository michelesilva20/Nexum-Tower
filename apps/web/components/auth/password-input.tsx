"use client";

import { cn } from "@nexum-tower/ui";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordInputProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  showToggleLabel: string;
  hideToggleLabel: string;
};

export function PasswordInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  error,
  showToggleLabel,
  hideToggleLabel,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-nexum-text">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "w-full rounded-xl border bg-nexum-bg-soft/60 px-4 py-3 pr-11 text-sm text-nexum-text placeholder:text-nexum-text-soft outline-none transition-colors",
            error
              ? "border-nexum-danger/60 focus:border-nexum-danger focus:ring-2 focus:ring-nexum-danger/20"
              : "border-nexum-border focus:border-nexum-primary/60 focus:ring-2 focus:ring-nexum-primary/20",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? hideToggleLabel : showToggleLabel}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-nexum-text-muted transition-colors hover:text-nexum-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-nexum-primary/40"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-nexum-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
