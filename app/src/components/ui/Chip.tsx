import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "achieved" | "close" | "warn" | "primary" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-muted",
  achieved: "bg-achieved-bg text-achieved",
  close: "bg-close-bg text-close",
  warn: "bg-warn-bg text-warn",
  primary: "bg-primary-fixed text-primary",
  info: "bg-secondary-container text-secondary-container-fg",
};

export function Chip({
  tone = "neutral",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span className={cn("chip", tones[tone], className)} {...props}>
      {children}
    </span>
  );
}
