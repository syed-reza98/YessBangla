import {
  Building2, ShoppingCart, GraduationCap, HeartPulse, Landmark,
  Factory, Tv, Truck,
} from "lucide-react";

export type IndustryItem = {
  slug: string;
  icon: typeof Tv;
  title: string;
  desc: string;
  outcomes: string[];
  // Enriched detail-page content
  intro: string;
  challenges: string[];
  solutions: { title: string; desc: string }[];
  keyMetrics: { value: string; label: string }[];
  caseHighlights: { title: string; result: string }[];
  compliance: string[];
  faqs: { q: string; a: string }[];
};

export const industries: IndustryItem[] = [
  {
    slug: "media-broadcasting",
    icon: Tv,
    title: "Media & Broadcasting",
    desc: "OTT platforms, digital news and content distribution at national scale.",
    outcomes: ["Akash OTT launch", "Editorial CMS", "Live streaming infra"],
    intro: "From OTT launches to newsroom modernisation, we help broadcasters and publishers reach Bangladeshi audiences at scale with reliable, monetisable platforms.",
    challenges: [
      "Legacy CMS that can't keep up with breaking news",
      "Streaming infrastructure that drops under load",
      "Fragmented monetisation across web, app and TV",
      "Content rights and DRM complexity",
    ],
    solutions: [
      { title: "Streaming platforms", desc: "End-to-end OTT — encoding, DRM, multi-device playback and analytics." },
      { title: "Newsroom CMS", desc: "Real-time editorial workspaces with workflow, SEO and multimedia." },
      { title: "Monetisation", desc: "SVOD, AVOD, paywalls and ad-server integration with yield reporting." },
    ],
    keyMetrics: [
      { value: "120k+", label: "Concurrent viewers" },
      { value: "−65%", label: "Editorial publish time" },
      { value: "−42%", label: "Infra cost per stream" },
      { value: "99.95%", label: "Streaming uptime" },
    ],
    caseHighlights: [
      { title: "Akash OTT launch", result: "Multi-device platform live in 18 weeks with SVOD + AVOD monetisation." },
      { title: "National daily CMS", result: "Editorial throughput +108% with sub-second publishing." },
    ],
    compliance: ["DRM (Widevine/FairPlay)", "Bangladesh broadcasting regulations", "Content rights workflows"],
    faqs: [
      { q: "Do you handle live streaming?", a: "Yes — including low-latency live, simulcast and live-to-VOD workflows." },
      { q: "Can you integrate with our existing ad server?", a: "Yes — server-side ad insertion (SSAI) with Google Ad Manager and Magnite supported." },
    ],
  },
  {
    slug: "retail-ecommerce",
    icon: ShoppingCart,
    title: "Retail & E-commerce",
    desc: "Storefronts, marketplaces, payments and last-mile delivery integrations.",
    outcomes: ["Multi-vendor stores", "bKash / Nagad / cards", "Nationwide delivery"],
    intro: "Commerce platforms that scale from a single brand to a multi-vendor marketplace, integrated with local payments and nationwide logistics.",
    challenges: [
      "Cart abandonment due to checkout friction",
      "Stock-outs and overselling across channels",
      "High delivery costs outside Dhaka",
      "Manual reconciliation across payment methods",
    ],
    solutions: [
      { title: "Storefront + apps", desc: "Web storefront and native apps with shared catalogue and one-tap checkout." },
      { title: "Local payments", desc: "bKash, Nagad, Rocket, cards and COD with automated reconciliation." },
      { title: "OMS & logistics", desc: "Multi-warehouse inventory, returns and 3PL integrations across districts." },
    ],
    keyMetrics: [
      { value: "+312%", label: "Online revenue (12 months)" },
      { value: "−40%", label: "Delivery TAT" },
      { value: "−27%", label: "Customer acquisition cost" },
      { value: "64", label: "Districts covered" },
    ],
    caseHighlights: [
      { title: "Fashion retailer scale-up", result: "Online revenue tripled in 12 months across all 64 districts." },
      { title: "Multi-vendor marketplace", result: "Onboarded 400+ vendors with self-serve dashboards and split settlement." },
    ],
    compliance: ["PCI-aware checkout", "VAT-compliant invoicing", "Consumer protection guidelines"],
    faqs: [
      { q: "Can you migrate from Shopify or WooCommerce?", a: "Yes — with full catalogue, customer and order migration plus SEO continuity." },
      { q: "Do you support B2B as well as B2C?", a: "Yes — including tiered pricing, credit terms and approval workflows." },
    ],
  },
  {
    slug: "education",
    icon: GraduationCap,
    title: "Education",
    desc: "Learning management, school ERPs and digital classroom solutions.",
    outcomes: ["LMS platforms", "Student portals", "Online assessment"],
    intro: "Digital learning platforms for schools, universities and training providers — from LMS to administrative ERP.",
    challenges: [
      "Manual attendance and grading workflows",
      "Disconnected systems for fees, exams and academics",
      "Low engagement on existing learning platforms",
      "Parent and guardian communication gaps",
    ],
    solutions: [
      { title: "Learning management", desc: "Course delivery, assessments, progress tracking and certificates." },
      { title: "School ERP", desc: "Admissions, attendance, fees, exams and HR in a single system." },
      { title: "Parent engagement", desc: "Mobile apps with attendance, grades and announcements in real time." },
    ],
    keyMetrics: [
      { value: "50k+", label: "Active learners" },
      { value: "+62%", label: "Course completion" },
      { value: "−70%", label: "Admin paperwork" },
      { value: "4.7/5", label: "Parent NPS" },
    ],
    caseHighlights: [
      { title: "K–12 school network", result: "8 schools unified on one ERP with parent app rolled out in a single term." },
      { title: "Training provider LMS", result: "Course completion rate up 62% after gamified learning paths." },
    ],
    compliance: ["Student data protection", "Accessibility (WCAG 2.2 AA)", "Local curriculum mapping"],
    faqs: [
      { q: "Do you support both Bangla and English?", a: "Yes — fully bilingual UI and content with RTL-ready architecture for future expansion." },
      { q: "Can you integrate with payment for fees?", a: "Yes — bKash/Nagad/card and bank transfer with automated receipts and reminders." },
    ],
  },
  {
    slug: "healthcare",
    icon: HeartPulse,
    title: "Healthcare",
    desc: "Clinic management, telemedicine and patient engagement platforms.",
    outcomes: ["Clinic ERP", "Telemedicine apps", "Patient portals"],
    intro: "Patient-centred platforms for clinics, hospitals and telemedicine providers — secure, auditable and built for clinical workflows.",
    challenges: [
      "Paper-based patient records",
      "Long appointment booking cycles",
      "Limited reach beyond major cities",
      "Insurance and billing complexity",
    ],
    solutions: [
      { title: "Clinic ERP", desc: "Appointments, EMR, billing and pharmacy in one system." },
      { title: "Telemedicine", desc: "Video consultation, e-prescriptions and follow-up reminders." },
      { title: "Patient portal", desc: "Records, lab results, prescriptions and appointment management." },
    ],
    keyMetrics: [
      { value: "−55%", label: "Appointment lead time" },
      { value: "+220%", label: "Tele-consultations / mo" },
      { value: "98%", label: "Prescription accuracy" },
      { value: "4.8/5", label: "Patient satisfaction" },
    ],
    caseHighlights: [
      { title: "Multi-branch clinic ERP", result: "12 branches unified with central reporting and inventory." },
      { title: "Telemedicine startup", result: "10x consultation volume in 6 months with mobile-first UX." },
    ],
    compliance: ["HIPAA-aware data handling", "DGHS guidelines alignment", "Clinical audit trails"],
    faqs: [
      { q: "Is patient data encrypted?", a: "Yes — at rest and in transit, with role-based access and full audit logs." },
      { q: "Can it handle prescriptions in Bangla?", a: "Yes — bilingual prescriptions with structured drug data and interaction warnings." },
    ],
  },
  {
    slug: "banking-finance",
    icon: Landmark,
    title: "Banking & Finance",
    desc: "Secure portals, dashboards and fintech integrations.",
    outcomes: ["Customer portals", "Internal dashboards", "API integrations"],
    intro: "Digital experiences for banks, NBFIs and fintechs — designed for trust, regulatory rigour and measurable activation.",
    challenges: [
      "Slow customer onboarding (KYC)",
      "Legacy core integrations",
      "Internal tooling fragmented across teams",
      "Regulatory reporting overhead",
    ],
    solutions: [
      { title: "Customer portals", desc: "Onboarding, account servicing and product discovery with secure auth." },
      { title: "Internal dashboards", desc: "Risk, ops and exec dashboards drawn from core systems via APIs." },
      { title: "Fintech APIs", desc: "Open banking, payments and partner integrations with audit trails." },
    ],
    keyMetrics: [
      { value: "+47%", label: "Onboarding conversion" },
      { value: "−51%", label: "Time to first transaction" },
      { value: "−33%", label: "Customer acquisition cost" },
      { value: "100%", label: "Audit-ready logs" },
    ],
    caseHighlights: [
      { title: "Digital wallet onboarding", result: "Sign-up conversion +47% after a 4-week design sprint." },
      { title: "Bank ops dashboard", result: "12 internal tools consolidated with role-based SSO." },
    ],
    compliance: ["Bangladesh Bank guidelines", "PCI-aware checkout", "ISO 27001-aligned security"],
    faqs: [
      { q: "Do you integrate with core banking?", a: "Yes — we have integrated with Flexcube, T24 and several local cores via secure APIs." },
      { q: "Can you support our internal audit needs?", a: "Yes — every action is logged with immutable audit trails and exportable reports." },
    ],
  },
  {
    slug: "manufacturing",
    icon: Factory,
    title: "Manufacturing",
    desc: "ERP, inventory and operations digitisation for factories.",
    outcomes: ["Production tracking", "Inventory control", "Quality reporting"],
    intro: "Operations digitisation for factories — production tracking, quality, inventory and maintenance under one roof.",
    challenges: [
      "Production data captured on paper",
      "Stock-outs of raw materials",
      "Quality issues caught too late",
      "Maintenance schedules ignored until breakdown",
    ],
    solutions: [
      { title: "Production tracking", desc: "Shop-floor terminals, OEE and shift reporting." },
      { title: "Inventory & procurement", desc: "Raw material, WIP and finished goods with reorder automation." },
      { title: "Quality & maintenance", desc: "QC checklists, NCR workflows and preventive maintenance schedules." },
    ],
    keyMetrics: [
      { value: "+18%", label: "OEE improvement" },
      { value: "−24%", label: "Stock-out incidents" },
      { value: "−31%", label: "Quality rejection rate" },
      { value: "−40%", label: "Unplanned downtime" },
    ],
    caseHighlights: [
      { title: "Garments factory MES", result: "OEE up 18% within two production cycles." },
      { title: "Food processing ERP", result: "Procurement automated with supplier portals and PO workflows." },
    ],
    compliance: ["ISO 9001-aligned QMS", "Audit-ready batch traceability", "Worker safety reporting"],
    faqs: [
      { q: "Do shop-floor workers need to be tech-literate?", a: "No — terminals are designed for low-literacy use with icons, Bangla labels and barcode scanning." },
      { q: "Can it work offline?", a: "Yes — terminals queue locally and sync when connectivity is restored." },
    ],
  },
  {
    slug: "logistics-supply-chain",
    icon: Truck,
    title: "Logistics & Supply Chain",
    desc: "Tracking, dispatch and fleet management systems.",
    outcomes: ["Live tracking", "Dispatch ops", "Driver apps"],
    intro: "Visibility and control across the supply chain — from dispatch and driver apps to live tracking for end customers.",
    challenges: [
      "Manual dispatch via phone calls",
      "No visibility for end customers",
      "Idle fleet capacity and dead miles",
      "Proof of delivery disputes",
    ],
    solutions: [
      { title: "Dispatch & routing", desc: "Optimised routes, capacity allocation and exception handling." },
      { title: "Driver apps", desc: "Pickup, delivery, proof of delivery and earnings transparency." },
      { title: "Customer tracking", desc: "Live ETA, push notifications and one-click rescheduling." },
    ],
    keyMetrics: [
      { value: "−40%", label: "Delivery TAT" },
      { value: "+28%", label: "Fleet utilisation" },
      { value: "−72%", label: "POD disputes" },
      { value: "98%", label: "Tracking accuracy" },
    ],
    caseHighlights: [
      { title: "3PL dispatch overhaul", result: "Manual dispatch eliminated; TAT down 40% across 8 hubs." },
      { title: "Last-mile fleet app", result: "Driver retention up after transparent earnings and shift bidding." },
    ],
    compliance: ["Vehicle and driver KYC", "Cash-on-delivery reconciliation", "Insurance-ready trip logs"],
    faqs: [
      { q: "Do you support multi-modal logistics?", a: "Yes — road, rail and last-mile bike with capacity-aware routing." },
      { q: "Can drivers use it on low-end phones?", a: "Yes — the app is optimised for entry-level Android with offline mode." },
    ],
  },
  {
    slug: "government-ngo",
    icon: Building2,
    title: "Government & NGOs",
    desc: "Public-sector portals, citizen services and reporting tools.",
    outcomes: ["Citizen portals", "Reporting dashboards", "Survey tools"],
    intro: "Public-sector and NGO platforms designed for accessibility, accountability and reach across all 64 districts.",
    challenges: [
      "Paper-based citizen services",
      "Limited reach in rural districts",
      "Manual reporting to donors and ministries",
      "Accessibility gaps for differently-abled citizens",
    ],
    solutions: [
      { title: "Citizen portals", desc: "Online services, applications and document delivery with NID-based auth." },
      { title: "Field data collection", desc: "Offline-first survey apps with geo-tagged evidence." },
      { title: "Reporting dashboards", desc: "Automated MIS reporting for donors, ministries and the public." },
    ],
    keyMetrics: [
      { value: "1M+", label: "Citizens served" },
      { value: "64", label: "Districts covered" },
      { value: "−85%", label: "Reporting effort" },
      { value: "WCAG AA", label: "Accessibility" },
    ],
    caseHighlights: [
      { title: "Citizen services portal", result: "Application processing time reduced from weeks to days." },
      { title: "NGO field MIS", result: "Real-time donor reporting from 4,000+ field workers." },
    ],
    compliance: ["WCAG 2.2 AA accessibility", "Government data residency", "Donor reporting standards"],
    faqs: [
      { q: "Can it work in low-connectivity areas?", a: "Yes — offline-first apps sync when connectivity returns, with conflict resolution built in." },
      { q: "Do you support open data exports?", a: "Yes — exports to CSV, Excel and standard donor reporting formats." },
    ],
  },
];

export const getIndustry = (slug: string) => industries.find((i) => i.slug === slug);
