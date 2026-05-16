import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "appearance-none flex h-11 w-full rounded-md border border-outline-variant bg-surface-1 px-3.5 pr-10 py-2 text-sm",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:bg-surface-0 focus-visible:ring-2 focus-visible:ring-primary/20",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-subtle" />
    </div>
  )
);
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[88px] w-full rounded-md border border-outline-variant bg-surface-1 px-3.5 py-2.5 text-sm",
        "placeholder:text-ink-subtle",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:bg-surface-0 focus-visible:ring-2 focus-visible:ring-primary/20",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-y",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium text-ink">
          {label}
          {required && <span className="text-warn ml-0.5">*</span>}
        </span>
        {hint && <span className="text-xs text-ink-subtle">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
