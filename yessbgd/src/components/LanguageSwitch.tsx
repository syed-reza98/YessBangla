/**
 * LanguageSwitch — compact EN ↔ BN toggle.
 *
 * Two visual variants:
 *   - "pill": full segmented control with both labels visible (header desktop)
 *   - "compact": single button showing the OTHER language (mobile chrome)
 *
 * Always shows BOTH languages so users instantly understand the choice.
 */
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { persistLang, type AppLang } from "@/i18n";

interface Props {
  variant?: "pill" | "compact";
  className?: string;
}

export function LanguageSwitch({ variant = "pill", className = "" }: Props) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage || i18n.language || "en") as AppLang;

  const setLang = (lang: AppLang) => {
    if (lang === current) return;
    void i18n.changeLanguage(lang);
    persistLang(lang);
  };

  if (variant === "compact") {
    const next: AppLang = current === "en" ? "bn" : "en";
    return (
      <button
        type="button"
        onClick={() => setLang(next)}
        aria-label={t("lang.switchAria")}
        className={[
          "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/85 backdrop-blur transition-colors hover:border-primary/50 hover:text-primary",
          className,
        ].join(" ")}
      >
        <Languages className="h-3.5 w-3.5" aria-hidden />
        <span aria-hidden>{current.toUpperCase()}</span>
        <span aria-hidden className="opacity-50">/</span>
        <span aria-hidden className="opacity-60">{next.toUpperCase()}</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={[
        "inline-flex items-center rounded-full border border-border/70 bg-background/70 p-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] backdrop-blur",
        className,
      ].join(" ")}
    >
      {(["en", "bn"] as AppLang[]).map((lang) => {
        const active = lang === current;
        return (
          <button
            key={lang}
            type="button"
            onClick={() => setLang(lang)}
            aria-pressed={active}
            aria-label={lang === "en" ? "English" : "বাংলা"}
            className={[
              "min-w-[2.4rem] rounded-full px-2.5 py-1 transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground/70 hover:text-foreground",
            ].join(" ")}
          >
            {lang.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
