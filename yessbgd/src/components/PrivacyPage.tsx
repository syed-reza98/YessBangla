"use client";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/PageHero";

const sections = [
  {
    h: "1. Who we are",
    body: (
      <>
        <p>YESS Bangla Private Limited (“YESS Bangla”, “we”, “our”, “us”) is a private limited company incorporated in Bangladesh, with its registered office at Block A, Road 3, House 127 (Green View), 1st Floor, Mirpur 12, Dhaka 1216. We act as the <strong>data controller</strong> of personal information collected through this website and our service engagements.</p>
        <p>Questions about this policy can be sent to <a className="text-primary underline underline-offset-4" href="mailto:privacy@yessbangla.com">privacy@yessbangla.com</a>.</p>
      </>
    ),
  },
  {
    h: "2. Information we collect",
    body: (
      <ul className="ml-5 list-disc space-y-2">
        <li><strong>Identity & contact data</strong> — name, email, phone, company, role and country provided through contact, careers, sales or support forms.</li>
        <li><strong>Application data</strong> — résumé/CV, cover letter, employment history and any references you submit when applying for a role.</li>
        <li><strong>Engagement data</strong> — project briefs, written communication, meeting notes and deliverables shared during paid engagements.</li>
        <li><strong>Technical data</strong> — IP address, device, browser, language, referring URL and pages visited via cookies and analytics SDKs.</li>
        <li><strong>Cookies</strong> — strictly-necessary cookies for sessions, plus optional analytics cookies (only set after consent where law requires).</li>
      </ul>
    ),
  },
  {
    h: "3. Lawful bases for processing",
    body: (
      <ul className="ml-5 list-disc space-y-2">
        <li><strong>Contract</strong> — to deliver services you have engaged us for.</li>
        <li><strong>Legitimate interests</strong> — to operate, secure and improve our website and respond to enquiries.</li>
        <li><strong>Consent</strong> — for marketing emails, optional cookies and any sensitive data processing.</li>
        <li><strong>Legal obligation</strong> — to comply with tax, accounting, employment and regulatory requirements.</li>
      </ul>
    ),
  },
  {
    h: "4. How we use information",
    body: (
      <p>We use personal data to respond to enquiries, deliver and invoice services, evaluate job applications, send service updates, secure our infrastructure, comply with legal obligations and — only with consent — send occasional newsletters.</p>
    ),
  },
  {
    h: "5. Sharing & sub-processors",
    body: (
      <>
        <p>We do not sell personal data. We share it only with vetted sub-processors under written confidentiality terms, including hosting (Cloudflare, Lovable Cloud), email delivery, analytics and customer-support tooling. A current list is available on request.</p>
        <p>We may disclose information when required by Bangladeshi law, court order or to protect our legal rights.</p>
      </>
    ),
  },
  {
    h: "6. International transfers",
    body: <p>Some sub-processors operate outside Bangladesh. Where personal data is transferred internationally, we rely on Standard Contractual Clauses or equivalent safeguards to ensure an adequate level of protection.</p>,
  },
  {
    h: "7. Data retention",
    body: (
      <ul className="ml-5 list-disc space-y-2">
        <li>Contact-form submissions: up to 24 months from last interaction.</li>
        <li>Job applications: up to 12 months after the role is closed (longer with explicit consent).</li>
        <li>Client engagement records: 7 years to meet statutory accounting and audit requirements.</li>
        <li>Analytics data: aggregated and retained up to 26 months.</li>
      </ul>
    ),
  },
  {
    h: "8. Your rights",
    body: (
      <>
        <p>Subject to applicable law (including GDPR, UK GDPR and Bangladesh’s Data Protection framework), you may:</p>
        <ul className="ml-5 list-disc space-y-2">
          <li>Access a copy of the personal data we hold about you.</li>
          <li>Request correction or deletion of inaccurate or outdated data.</li>
          <li>Object to or restrict processing based on legitimate interests.</li>
          <li>Withdraw consent for marketing or optional cookies at any time.</li>
          <li>Lodge a complaint with your local data protection authority.</li>
        </ul>
        <p>To exercise any right, email <a className="text-primary underline underline-offset-4" href="mailto:privacy@yessbangla.com">privacy@yessbangla.com</a>. We respond within 30 days.</p>
      </>
    ),
  },
  {
    h: "9. Security",
    body: <p>We protect data with TLS in transit, encryption at rest, role-based access controls, audit logging on administrative actions, least-privilege service accounts and regular vulnerability reviews. No system is perfectly secure — we will notify you and the appropriate authority within 72 hours of becoming aware of a breach affecting your personal data.</p>,
  },
  {
    h: "10. Children",
    body: <p>Our services are not directed to children under 16. We do not knowingly collect personal data from minors; if you believe we have, please contact us so we can delete it.</p>,
  },
  {
    h: "11. Changes to this policy",
    body: <p>We may update this policy to reflect operational, legal or regulatory changes. The “last updated” date below will change accordingly. Material changes will be announced on this page or via email where appropriate.</p>,
  },
];

export function PrivacyPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        page="privacy"
        eyebrow={t("pages.privacy.eyebrow")}
        title={t("pages.privacy.title")}
        subtitle={t("pages.privacy.subtitle")}
      />
      <section className="pb-24">
        <div className="container-tight max-w-3xl">
          <p className="text-sm text-muted-foreground">Last updated: 6 May 2026 · Effective: 6 May 2026</p>
          <div className="mt-10 space-y-10 text-sm leading-relaxed text-foreground/90">
            {sections.map((s) => (
              <div key={s.h}>
                <h2 className="font-display text-xl font-semibold">{s.h}</h2>
                <div className="mt-3 space-y-3">{s.body}</div>
              </div>
            ))}
          </div>
          <div className="mt-12 rounded-2xl glass-card p-6">
            <p className="text-sm text-muted-foreground">
              Questions or requests? Email{" "}
              <a className="text-primary underline underline-offset-4" href="mailto:privacy@yessbangla.com">privacy@yessbangla.com</a>{" "}
              or <Link to="/contact" className="text-primary underline underline-offset-4">contact our team</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
