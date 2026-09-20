"use client";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHero } from "@/components/PageHero";

const sections = [
  {
    h: "1. Acceptance of terms",
    body: <p>By accessing yessbangla.com (the “Site”) or engaging YESS Bangla Private Limited (“YESS Bangla”, “we”, “our”) for any service, you (“Client”, “you”) agree to be bound by these Terms of Service together with any signed Statement of Work (“SOW”). If you do not agree, do not use the Site or our services.</p>,
  },
  {
    h: "2. Services & statements of work",
    body: (
      <>
        <p>Each paid engagement is governed by a separate written SOW that defines scope, deliverables, milestones, acceptance criteria, timeline and fees. In the event of conflict, the SOW controls over these terms for that specific engagement.</p>
        <p>Any change to scope after kick-off requires a written change order signed by both parties.</p>
      </>
    ),
  },
  {
    h: "3. Fees, invoicing & taxes",
    body: (
      <ul className="ml-5 list-disc space-y-2">
        <li>Unless stated otherwise, fees are quoted in BDT and exclude VAT, withholding tax or any cross-border duties.</li>
        <li>Invoices are payable within 14 days of issuance via bank transfer or approved digital channels.</li>
        <li>Overdue amounts accrue interest at 1.5% per month or the maximum permitted by law.</li>
        <li>We may suspend work on any project with overdue invoices after 7 days of written notice.</li>
      </ul>
    ),
  },
  {
    h: "4. Acceptance & change requests",
    body: <p>Each milestone is deemed accepted 7 business days after delivery unless you submit a written list of in-scope defects. We will remediate accepted defects at no charge. Out-of-scope changes are quoted as a change order.</p>,
  },
  {
    h: "5. Intellectual property",
    body: (
      <>
        <p>All Site content, branding, designs and proprietary methodologies remain the property of YESS Bangla. On full payment for an engagement, we assign to you the foreground intellectual property rights in custom deliverables created specifically for that SOW.</p>
        <p>We retain ownership of pre-existing tools, libraries, frameworks and know-how (“Background IP”), and grant you a perpetual, non-exclusive licence to use them as embedded in the deliverables.</p>
      </>
    ),
  },
  {
    h: "6. Confidentiality",
    body: <p>Each party will treat the other’s non-public information as confidential and use it only to perform under the engagement. Confidentiality obligations survive for 3 years after the engagement ends.</p>,
  },
  {
    h: "7. Warranties & disclaimers",
    body: <p>We warrant that services will be performed with reasonable skill and care by qualified personnel. To the maximum extent permitted by law, the Site and any free resources are provided “as is” without further warranties of merchantability, fitness for purpose or non-infringement.</p>,
  },
  {
    h: "8. Limitation of liability",
    body: <p>Except for liability that cannot be limited by law (e.g. fraud, gross negligence, IP indemnities), each party’s total aggregate liability arising out of or in connection with an engagement is capped at the fees paid to us under that SOW in the 12 months preceding the claim. Neither party is liable for indirect, incidental or consequential damages.</p>,
  },
  {
    h: "9. Indemnities",
    body: <p>We indemnify you against third-party claims that our deliverables, as delivered and used as intended, infringe a registered Bangladeshi intellectual property right. You indemnify us against claims arising from materials you provide or from your use of the deliverables outside the agreed scope.</p>,
  },
  {
    h: "10. Term & termination",
    body: (
      <ul className="ml-5 list-disc space-y-2">
        <li>Either party may terminate an engagement for material breach not cured within 15 days of written notice.</li>
        <li>You may terminate for convenience by paying for work completed plus non-cancellable commitments.</li>
        <li>On termination, we deliver work-in-progress for the period that has been paid for.</li>
      </ul>
    ),
  },
  {
    h: "11. Force majeure",
    body: <p>Neither party is liable for delay or failure caused by events beyond reasonable control, including natural disaster, pandemic, war, civil unrest, strikes, government action or major internet outages.</p>,
  },
  {
    h: "12. Acceptable use",
    body: <p>You agree not to misuse the Site, attempt unauthorised access, scrape data, run automated load tests without permission, or use the Site to violate any law or third-party right.</p>,
  },
  {
    h: "13. Governing law & disputes",
    body: <p>These terms are governed by the laws of the People’s Republic of Bangladesh. The parties will first attempt to resolve disputes through good-faith negotiation for 30 days. Unresolved disputes are subject to the exclusive jurisdiction of the courts of Dhaka, Bangladesh, save for either party’s right to seek injunctive relief in any competent jurisdiction.</p>,
  },
  {
    h: "14. Changes to these terms",
    body: <p>We may update these terms from time to time. The version in force at the date of your SOW continues to govern that engagement. Updated terms apply to use of the Site from the “last updated” date below.</p>,
  },
];

export function TermsPage() {
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        page="terms"
        eyebrow={t("pages.terms.eyebrow")}
        title={t("pages.terms.title")}
        subtitle={t("pages.terms.subtitle")}
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
              Need a custom Master Services Agreement, NDA or DPA? Email{" "}
              <a className="text-primary underline underline-offset-4" href="mailto:legal@yessbangla.com">legal@yessbangla.com</a>{" "}
              or <Link to="/contact" className="text-primary underline underline-offset-4">contact our team</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
