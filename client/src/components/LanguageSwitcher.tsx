"use client";

import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Language } from "@/lib/i18n";
import { useTranslation } from "@/contexts/LanguageContext";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

const languageOptions: Array<{ value: Language; shortLabel: string; labelKey: string }> = [
  { value: "en", shortLabel: "EN", labelKey: "common.english" },
  { value: "am", shortLabel: "አማ", labelKey: "common.amharic" },
];

export function LanguageSwitcher({ className, compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useTranslation();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-border bg-white/90 p-1 shadow-sm",
        compact && "rounded-full",
        className
      )}
      aria-label={t("common.language")}
    >
      {!compact && (
        <div className="flex items-center justify-center px-2 text-muted-foreground">
          <Languages className="h-4 w-4" />
        </div>
      )}
      {languageOptions.map((option) => {
        const isActive = language === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLanguage(option.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
              compact ? "min-w-[42px] px-2.5" : "min-w-[52px]",
              isActive
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={t(option.labelKey)}
            aria-pressed={isActive}
          >
            {compact ? option.shortLabel : option.labelKey === "common.english" ? "EN" : "አማ"}
          </button>
        );
      })}
    </div>
  );
}
