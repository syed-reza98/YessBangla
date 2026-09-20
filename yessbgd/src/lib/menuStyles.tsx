// Shared presentation helpers for CMS menu items: icon set, accent colours and
// visual styles. Used by the dashboard menu editor, its live preview and the
// public header/footer so a label looks identical everywhere.
import type { CSSProperties, ComponentType } from "react";
import {
  Home,
  Info,
  Briefcase,
  Building2,
  Factory,
  Layers,
  Rocket,
  Sparkles,
  Star,
  Globe,
  Plane,
  Ship,
  Truck,
  GraduationCap,
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  FileText,
  Newspaper,
  BookOpen,
  Lightbulb,
  BarChart3,
  ShieldCheck,
  Award,
  Handshake,
  Leaf,
  Heart,
  Camera,
  Megaphone,
  Cpu,
  Code2,
  Wrench,
  Package,
  Calendar,
  HelpCircle,
  Link2,
} from "lucide-react";

export type IconComp = ComponentType<{ className?: string; strokeWidth?: number }>;

export const MENU_ICONS: Record<string, IconComp> = {
  Home,
  Info,
  Briefcase,
  Building2,
  Factory,
  Layers,
  Rocket,
  Sparkles,
  Star,
  Globe,
  Plane,
  Ship,
  Truck,
  GraduationCap,
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  FileText,
  Newspaper,
  BookOpen,
  Lightbulb,
  BarChart3,
  ShieldCheck,
  Award,
  Handshake,
  Leaf,
  Heart,
  Camera,
  Megaphone,
  Cpu,
  Code2,
  Wrench,
  Package,
  Calendar,
  HelpCircle,
  Link2,
};

export const MENU_ICON_NAMES = Object.keys(MENU_ICONS);

export function MenuIcon({ name, className = "h-4 w-4" }: { name?: string | null; className?: string }) {
  if (!name) return null;
  const Comp = MENU_ICONS[name];
  if (!Comp) return null;
  return <Comp className={className} strokeWidth={1.7} />;
}

/* --------------------------------- accents -------------------------------- */

export type MenuAccent = { key: string; label: string; color: string };

export const MENU_ACCENTS: MenuAccent[] = [
  { key: "default", label: "Default", color: "" },
  { key: "primary", label: "Primary", color: "oklch(0.55 0.11 235)" },
  { key: "teal", label: "Teal", color: "oklch(0.62 0.10 195)" },
  { key: "emerald", label: "Emerald", color: "oklch(0.60 0.11 160)" },
  { key: "indigo", label: "Indigo", color: "oklch(0.52 0.13 275)" },
  { key: "violet", label: "Violet", color: "oklch(0.55 0.14 300)" },
  { key: "amber", label: "Amber", color: "oklch(0.72 0.12 78)" },
  { key: "rose", label: "Rose", color: "oklch(0.62 0.14 15)" },
  { key: "slate", label: "Slate", color: "oklch(0.50 0.02 250)" },
];

export function accentColor(key?: string | null): string | undefined {
  const found = MENU_ACCENTS.find((a) => a.key === key);
  return found?.color || undefined;
}

/* --------------------------------- styles --------------------------------- */

export type MenuStyleKey = "plain" | "soft" | "pill" | "outline" | "underline" | "bold";

export const MENU_STYLES: { key: MenuStyleKey; label: string; labelBn: string }[] = [
  { key: "plain", label: "Plain", labelBn: "সাধারণ" },
  { key: "soft", label: "Soft tint", labelBn: "সফট" },
  { key: "pill", label: "Solid pill", labelBn: "পিল" },
  { key: "outline", label: "Outline", labelBn: "আউটলাইন" },
  { key: "underline", label: "Underline", labelBn: "আন্ডারলাইন" },
  { key: "bold", label: "Bold accent", labelBn: "বোল্ড" },
];

/** Returns className + inline style for a menu label chip. */
export function menuItemAppearance(
  style?: string | null,
  accent?: string | null,
): { className: string; style: CSSProperties } {
  const c = accentColor(accent);
  const base = "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-2 text-sm font-medium transition-colors";
  switch (style as MenuStyleKey) {
    case "soft":
      return {
        className: `${base} rounded-lg`,
        style: c ? { color: c, backgroundColor: `color-mix(in oklch, ${c} 12%, transparent)` } : {},
      };
    case "pill":
      return {
        className: `${base} rounded-full text-white shadow-sm`,
        style: { backgroundColor: c ?? "oklch(0.55 0.11 235)", color: "white" },
      };
    case "outline":
      return {
        className: `${base} rounded-full border`,
        style: c ? { color: c, borderColor: `color-mix(in oklch, ${c} 45%, transparent)` } : {},
      };
    case "underline":
      return {
        className: `${base} rounded-none border-b-2`,
        style: { color: c, borderColor: c ?? "transparent" },
      };
    case "bold":
      return { className: `${base} font-bold tracking-tight`, style: c ? { color: c } : {} };
    default:
      return { className: base, style: c ? { color: c } : {} };
  }
}
