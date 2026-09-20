import { useEffect, useState } from "react";
import { Moon, Sun, Monitor } from "lucide-react";

/**
 * Theme preview switch for testing light/dark logo readability before
 * exporting documents. Toggles the `.dark` class on <html> so the
 * theme-aware `.logo-plate` activates and the wordmark can be checked
 * against light, dark, and system surfaces.
 *
 * Persists choice in localStorage. Pure UI/preview — does not change
 * exported PDF/DOCX defaults (those have their own letterheadTheme prop).
 */
type Mode = "light" | "dark" | "system";
const STORE_KEY = "yess-theme-preview-v1";

function apply(mode: Mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && sysDark);
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
}

export function ThemePreviewSwitch() {
  const [mode, setMode] = useState<Mode>("system");

  useEffect(() => {
    try {
      const saved = (localStorage.getItem(STORE_KEY) as Mode | null) ?? "system";
      setMode(saved);
      apply(saved);
    } catch {
      apply("system");
    }
  }, []);

  const set = (m: Mode) => {
    setMode(m);
    try { localStorage.setItem(STORE_KEY, m); } catch { /* quota */ }
    apply(m);
  };

  const Item = ({ value, label, Icon }: { value: Mode; label: string; Icon: typeof Sun }) => (
    <button
      type="button"
      onClick={() => set(value)}
      aria-pressed={mode === value}
      aria-label={`Preview ${label} theme — test logo readability`}
      title={`${label} theme`}
      className={`inline-grid h-7 w-7 place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        mode === value
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-foreground/70 hover:bg-secondary"
      }`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </button>
  );

  return (
    <div
      role="group"
      aria-label="Theme preview — for verifying logo readability before export"
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-sm backdrop-blur"
    >
      <Item value="light" label="Light" Icon={Sun} />
      <Item value="dark" label="Dark" Icon={Moon} />
      <Item value="system" label="System" Icon={Monitor} />
    </div>
  );
}
