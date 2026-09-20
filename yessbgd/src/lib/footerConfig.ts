/**
 * Footer configuration — every visual and content aspect of the site footer
 * is stored in a single `footer_config` row of `cms_settings`, so the whole
 * four-column footer can be edited from Dashboard → Site settings.
 */
import { useSettings } from "@/lib/siteContent";

export type FooterColumnType = "brand" | "links" | "ventures" | "contact" | "text";

export type FooterLink = {
  label: string;
  label_bn?: string;
  href: string;
  external?: boolean;
};

export type FooterColumn = {
  /** What the column renders. */
  type: FooterColumnType;
  title: string;
  title_bn?: string;
  /** For `links` columns: use the CMS "footer" menu instead of manual links. */
  use_menu?: boolean;
  links?: FooterLink[];
  /** For `text` / `brand` columns. */
  text?: string;
  text_bn?: string;
  /** For `contact` columns. */
  show_address?: boolean;
  show_phone?: boolean;
  show_email?: boolean;
  show_newsletter?: boolean;
  /** For `brand` columns. */
  show_logo?: boolean;
  show_social?: boolean;
  /** Hide the column entirely without deleting it. */
  hidden?: boolean;
};

export type FooterSocial = {
  network: "facebook" | "twitter" | "youtube" | "instagram" | "linkedin";
  href: string;
};

export type FooterStyle = {
  /** Background treatment. */
  background: "gradient" | "solid" | "transparent" | "ink";
  /** Vertical padding rhythm. */
  spacing: "compact" | "normal" | "spacious";
  /** Number of columns rendered on large screens. */
  columns: 1 | 2 | 3 | 4;
  /** Number of columns rendered on phones. */
  mobile_columns: 1 | 2;
  /** Text alignment on phones. */
  mobile_align: "left" | "center";
  /** Column heading case. */
  heading: "uppercase" | "normal";
  /** Top hairline border. */
  border_top: boolean;
  /** Bottom bar with copyright + legal links. */
  show_bottom_bar: boolean;
  /** Centre-align everything (nice for short footers). */
  align_center: boolean;
};

/** A user-saved snapshot of the footer configuration. */
export type FooterPreset = {
  name: string;
  config: Omit<FooterConfig, "saved_presets">;
};

export type FooterConfig = {
  style: FooterStyle;
  columns: FooterColumn[];
  social: FooterSocial[];
  bottom_links: FooterLink[];
  copyright: string;
  copyright_bn?: string;
  /** Presets the user saved from the dashboard. */
  saved_presets?: FooterPreset[];
};


export const FOOTER_DEFAULTS: FooterConfig = {
  style: {
    background: "gradient",
    spacing: "normal",
    columns: 4,
    mobile_columns: 1,
    mobile_align: "left",
    heading: "uppercase",
    border_top: true,
    show_bottom_bar: true,
    align_center: false,
  },

  columns: [
    {
      type: "brand",
      title: "",
      title_bn: "",
      show_logo: true,
      show_social: true,
      text: "",
      text_bn: "",
    },
    { type: "links", title: "Company", title_bn: "কোম্পানি", use_menu: true, links: [] },
    { type: "ventures", title: "Our Ventures", title_bn: "আমাদের ভেঞ্চার" },
    {
      type: "contact",
      title: "Get in touch",
      title_bn: "যোগাযোগ",
      show_address: true,
      show_phone: true,
      show_email: true,
      show_newsletter: true,
    },
  ],
  social: [
    { network: "facebook", href: "https://www.facebook.com/yessbanglaltd" },
    { network: "twitter", href: "https://x.com/YessBangla" },
    { network: "youtube", href: "https://www.youtube.com/@yessbangla" },
    { network: "linkedin", href: "https://www.linkedin.com/" },
  ],
  bottom_links: [
    { label: "Privacy", label_bn: "গোপনীয়তা", href: "/privacy" },
    { label: "Terms", label_bn: "শর্তাবলি", href: "/terms" },
    { label: "FAQ", label_bn: "প্রশ্নোত্তর", href: "/faq" },
  ],
  copyright: "",
  copyright_bn: "",
};

/** Merge a stored (possibly partial) value with the defaults. */
export function normaliseFooterConfig(value: unknown): FooterConfig {
  const raw = (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Partial<FooterConfig>;
  const columns = Array.isArray(raw.columns) && raw.columns.length ? raw.columns : FOOTER_DEFAULTS.columns;
  return {
    style: { ...FOOTER_DEFAULTS.style, ...(raw.style ?? {}) },
    columns: columns
      .slice(0, 4)
      .map((c) => ({ ...(FOOTER_DEFAULTS.columns.find((d) => d.type === c.type) ?? {}), ...c })),
    social: Array.isArray(raw.social) ? raw.social : FOOTER_DEFAULTS.social,
    bottom_links: Array.isArray(raw.bottom_links) ? raw.bottom_links : FOOTER_DEFAULTS.bottom_links,
    copyright: typeof raw.copyright === "string" ? raw.copyright : "",
    copyright_bn: typeof raw.copyright_bn === "string" ? raw.copyright_bn : "",
    saved_presets: Array.isArray(raw.saved_presets) ? raw.saved_presets : [],
  };
}

/* ------------------------------ template presets ------------------------- */

/** Built-in footer templates the dashboard can apply with one click. */
export const FOOTER_TEMPLATES: {
  id: string;
  label: string;
  label_bn: string;
  apply: (c: FooterConfig) => FooterConfig;
}[] = [
  {
    id: "corporate",
    label: "Corporate",
    label_bn: "কর্পোরেট",
    apply: (c) => ({
      ...c,
      style: { ...FOOTER_DEFAULTS.style },
      columns: FOOTER_DEFAULTS.columns.map((x) => ({ ...x })),
    }),
  },
  {
    id: "simple",
    label: "Simple",
    label_bn: "সাধারণ",
    apply: (c) => ({
      ...c,
      style: {
        ...c.style,
        background: "transparent",
        spacing: "compact",
        columns: 2,
        mobile_columns: 1,
        mobile_align: "center",
        heading: "normal",
        border_top: true,
        show_bottom_bar: true,
        align_center: true,
      },
      columns: [
        { ...FOOTER_DEFAULTS.columns[0] },
        { ...FOOTER_DEFAULTS.columns[1] },
      ],
    }),
  },
  {
    id: "contact-first",
    label: "Contact first",
    label_bn: "যোগাযোগ প্রধান",
    apply: (c) => ({
      ...c,
      style: { ...c.style, background: "solid", spacing: "normal", columns: 3, mobile_columns: 1, mobile_align: "left", align_center: false },
      columns: [
        { ...FOOTER_DEFAULTS.columns[3] },
        { ...FOOTER_DEFAULTS.columns[0] },
        { ...FOOTER_DEFAULTS.columns[1] },
      ],
    }),
  },
  {
    id: "ink",
    label: "Deep ink",
    label_bn: "গাঢ়",
    apply: (c) => ({
      ...c,
      style: { ...c.style, background: "ink", spacing: "spacious", columns: 4, mobile_columns: 2, mobile_align: "left" },
      columns: FOOTER_DEFAULTS.columns.map((x) => ({ ...x })),
    }),
  },
];

/** Live footer configuration for the public site. */

export function useFooterConfig(): FooterConfig {
  const { map } = useSettings();
  return normaliseFooterConfig(map["footer_config"]);
}

/* ------------------------------- style maps ------------------------------- */

export const FOOTER_BACKGROUND_CLASS: Record<FooterStyle["background"], string> = {
  gradient: "bg-gradient-to-b from-transparent to-secondary/30 backdrop-blur-xl dark:bg-[oklch(0.18_0.04_260)]",
  solid: "bg-secondary/40 backdrop-blur-xl dark:bg-[oklch(0.2_0.03_260)]",
  transparent: "bg-transparent",
  ink: "bg-[oklch(0.21_0.04_260)] text-[oklch(0.96_0.01_260)] backdrop-blur-xl",
};

export const FOOTER_SPACING_CLASS: Record<FooterStyle["spacing"], string> = {
  compact: "py-10",
  normal: "py-16",
  spacious: "py-24",
};

export const FOOTER_COLUMNS_CLASS: Record<FooterStyle["columns"], string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
  4: "md:grid-cols-2 lg:grid-cols-4",
};

export const FOOTER_MOBILE_COLUMNS_CLASS: Record<FooterStyle["mobile_columns"], string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
};

/** Alignment classes: mobile first, then the desktop override. */
export function footerAlignClass(style: FooterStyle): string {
  const mobile = style.mobile_align === "center" ? "text-center" : "text-left";
  const desktop = style.align_center ? "md:text-center" : "md:text-left";
  return `${mobile} ${desktop}`;
}

