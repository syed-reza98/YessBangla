import { Link } from "@tanstack/react-router";
import { Facebook, Twitter, Youtube, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import fallbackLogo from "@/assets/yess-bangla-logo.png";
import { useVentures } from "@/lib/dynamicContent";
import { activeVentures } from "@/data/ventures";
import { COMPANY_CONTACT, phoneHref } from "@/lib/companyContact";
import { useMenu, useSettingText } from "@/lib/siteContent";
import { resolveMediaUrl } from "@/lib/mediaAssets";
import {
  useFooterConfig,
  footerAlignClass,
  FOOTER_BACKGROUND_CLASS,
  FOOTER_COLUMNS_CLASS,
  FOOTER_MOBILE_COLUMNS_CLASS,
  FOOTER_SPACING_CLASS,
  type FooterColumn,
  type FooterConfig,
  type FooterLink,
} from "@/lib/footerConfig";


const SOCIAL_ICON = {
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  instagram: Instagram,
  linkedin: Linkedin,
} as const;

export function Footer({ configOverride }: { configOverride?: FooterConfig } = {}) {
  const ventures = useVentures();
  const { t, i18n } = useTranslation();
  const footerLinks = useMenu("footer");
  const bn = i18n.language?.startsWith("bn");
  const email = useSettingText("contact_email", COMPANY_CONTACT.email);
  const address = useSettingText("contact_address", COMPANY_CONTACT.office);
  const headerLogo = useSettingText("logo_url", "");
  const logo = resolveMediaUrl(useSettingText("footer_logo_url", "") || headerLogo, fallbackLogo);
  const liveCfg = useFooterConfig();
  const cfg = configOverride ?? liveCfg;


  const pick = (en?: string, bnText?: string) => (bn && bnText ? bnText : en ?? "");
  const headingCls = `font-display text-sm font-semibold ${
    cfg.style.heading === "uppercase" ? "uppercase tracking-wider" : "tracking-tight"
  }`;

  const linkList = (links: FooterLink[]) => (
    <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
      {links.map((l, i) => (
        <li key={`${l.href}-${i}`}>
          {l.external ? (
            <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              {pick(l.label, l.label_bn)}
            </a>
          ) : (
            <Link to={l.href} className="hover:text-primary">
              {pick(l.label, l.label_bn)}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );

  const renderColumn = (col: FooterColumn, index: number) => {
    if (col.hidden) return null;

    const heading = pick(col.title, col.title_bn);

    if (col.type === "brand") {
      return (
        <div key={index}>
          {col.show_logo !== false && (
            <Link to="/" className="inline-flex items-center" aria-label={t("nav.homeAria")}>
              <span className="logo-plate" role="img" aria-label="YESS Bangla">
                <img
                  src={logo}
                  srcSet={`${logo} 1x, ${logo} 2x, ${logo} 3x`}
                  alt="YESS Bangla — Enterprise Solutions, Media & Technology"
                  loading="lazy"
                  decoding="async"
                  width={279}
                  height={153}
                  data-surface="footer"
                  style={{ imageRendering: "auto" }}
                  className="logo-mark h-11 w-auto max-w-[60vw] bg-transparent object-contain [@media(min-width:380px)]:h-12 sm:h-14 lg:h-16 [@media(min-width:1440px)]:h-[72px]"
                />
              </span>
            </Link>
          )}
          {heading && <h4 className={`mt-4 ${headingCls}`}>{heading}</h4>}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {pick(col.text, col.text_bn) || t("footer.tagline")}
          </p>
          {col.show_social !== false && cfg.social.length > 0 && (
            <div
              className={`mt-5 flex gap-2 ${
                cfg.style.mobile_align === "center" ? "justify-center" : "justify-start"
              } ${cfg.style.align_center ? "md:justify-center" : "md:justify-start"}`}
            >

              {cfg.social.map((s, i) => {
                const Icon = SOCIAL_ICON[s.network] ?? Facebook;
                return (
                  <a
                    key={`${s.network}-${i}`}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.network}
                    className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (col.type === "links") {
      const manual = col.links ?? [];
      const items: FooterLink[] =
        col.use_menu !== false && footerLinks.length > 0
          ? footerLinks.map((l) => ({
              label: l.label,
              label_bn: l.label_bn ?? undefined,
              href: l.href,
              external: Boolean(l.is_external),
            }))
          : manual;
      return (
        <div key={index}>
          <h4 className={headingCls}>{heading || t("footer.company")}</h4>
          {items.length > 0 ? (
            linkList(items)
          ) : (
            <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary">{t("footer.links.about")}</Link></li>
              <li><Link to="/industries" className="hover:text-primary">{t("footer.links.industries")}</Link></li>
              <li><Link to="/projects" className="hover:text-primary">{t("footer.links.projects")}</Link></li>
              <li><Link to="/careers" className="hover:text-primary">{t("footer.links.careers")}</Link></li>
              <li><Link to="/contact" className="hover:text-primary">{t("footer.links.contact")}</Link></li>
            </ul>
          )}
        </div>
      );
    }

    if (col.type === "ventures") {
      return (
        <div key={index}>
          <h4 className={headingCls}>{heading || t("footer.ourVentures")}</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            {activeVentures(ventures).slice(0, 8).map((v) => (
              <li key={v.slug}>
                <Link to="/ventures/$slug" params={{ slug: v.slug }} className="hover:text-primary">
                  {v.title}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/ventures" className="font-semibold text-primary hover:underline">
                {t("footer.links.viewAll")}
              </Link>
            </li>
          </ul>
        </div>
      );
    }

    if (col.type === "contact") {
      return (
        <div key={index}>
          <h4 className={headingCls}>{heading || t("footer.getInTouch")}</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {col.show_address !== false && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                <span>{address}</span>
              </li>
            )}
            {col.show_phone !== false && (
              <li className="flex gap-3">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                <a href={phoneHref} className="tabular-nums hover:text-primary" aria-label={`Call ${COMPANY_CONTACT.phone.display}`}>
                  {COMPANY_CONTACT.phone.display}
                </a>
              </li>
            )}
            {col.show_email !== false && (
              <li className="flex gap-3">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" aria-hidden="true" />
                <a href={`mailto:${email}`} className="hover:text-primary">{email}</a>
              </li>
            )}
          </ul>

          {col.show_newsletter !== false && (
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-5 flex overflow-hidden rounded-full border border-border bg-card"
            >
              <input
                type="email"
                required
                placeholder={t("footer.yourEmail")}
                aria-label={t("footer.newsletterAria")}
                className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button type="submit" className="bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground">
                {t("footer.subscribe")}
              </button>
            </form>
          )}
        </div>
      );
    }

    // Free text column
    return (
      <div key={index}>
        {heading && <h4 className={headingCls}>{heading}</h4>}
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
          {pick(col.text, col.text_bn)}
        </p>
        {(col.links?.length ?? 0) > 0 && linkList(col.links ?? [])}
      </div>
    );
  };

  const year = new Date().getFullYear();
  const copyright =
    pick(cfg.copyright, cfg.copyright_bn) ||
    `© ${year} YESS Bangla Private Limited. ${t("footer.rights")}`;

  return (
    <footer
      data-on-dark
      className={`${configOverride ? "" : "mt-24"} ${
        cfg.style.border_top ? "border-t border-glass-border-soft" : ""
      } ${FOOTER_BACKGROUND_CLASS[cfg.style.background]}`}
    >
      <div className={`container-tight ${FOOTER_SPACING_CLASS[cfg.style.spacing]}`}>
        <div
          className={`grid gap-10 ${FOOTER_MOBILE_COLUMNS_CLASS[cfg.style.mobile_columns]} ${
            FOOTER_COLUMNS_CLASS[cfg.style.columns]
          } ${footerAlignClass(cfg.style)}`}
        >
          {cfg.columns.slice(0, cfg.style.columns).map(renderColumn)}
        </div>


        {cfg.style.show_bottom_bar && (
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
            <p>{copyright}</p>
            <div className="flex flex-wrap items-center justify-center gap-5">
              {cfg.bottom_links.map((l, i) =>
                l.external ? (
                  <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {pick(l.label, l.label_bn)}
                  </a>
                ) : (
                  <Link key={i} to={l.href} className="hover:text-primary">
                    {pick(l.label, l.label_bn)}
                  </Link>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
