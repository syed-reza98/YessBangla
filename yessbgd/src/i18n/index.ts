/**
 * i18n setup — react-i18next with EN + BN.
 *
 * SSR-safe: language detection only runs in the browser (no `window` access
 * during render on the server). Default language is English; the choice is
 * persisted in localStorage under `yb-lang`.
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import bn from "./locales/bn.json";

export const SUPPORTED_LANGS = ["en", "bn"] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];
const STORAGE_KEY = "yb-lang";

function detectInitialLang(): AppLang {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "bn") return saved;
  } catch {
    /* ignore */
  }
  const nav = (typeof navigator !== "undefined" && navigator.language) || "en";
  return nav.toLowerCase().startsWith("bn") ? "bn" : "en";
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      bn: { translation: bn },
    },
    lng: detectInitialLang(),
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    returnNull: false,
  });
}

export function persistLang(lang: AppLang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
  }
}

export default i18n;
