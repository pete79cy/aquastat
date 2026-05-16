import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? "el";

  const change = (lng: "el" | "en") => {
    void i18n.changeLanguage(lng);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-outline-variant bg-surface-0 p-0.5 text-xs font-semibold",
        className
      )}
      role="group"
      aria-label="Language"
    >
      {(["el", "en"] as const).map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => change(lng)}
          className={cn(
            "px-2.5 py-1 rounded-full transition-colors",
            current === lng ? "bg-primary text-primary-fg" : "text-ink-muted hover:text-primary"
          )}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
