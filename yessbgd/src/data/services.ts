import {
  Tv, Newspaper, LayoutGrid, Code2, Palette, ShoppingBag,
} from "lucide-react";

export type ServiceItem = {
  slug: string;
  icon: typeof Tv;
  title: string;
  desc: string;
  bullets: string[];
  pricing: { from: string; model: string; timeline: string };
  cta: { label: string; sub: string };
  // Enriched detail-page content
  intro: string;
  capabilities: { title: string; desc: string }[];
  deliverables: string[];
  techStack: string[];
  process: { step: string; title: string; desc: string }[];
  faqs: { q: string; a: string }[];
};

export const services: ServiceItem[] = [
  {
    slug: "akash-ott",
    icon: Tv,
    title: "Akash OTT",
    desc: "Bangladesh's new digital streaming platform launched by YESS Bangla Communications under Akash TV.",
    bullets: ["Multi-device streaming (web, iOS, Android, TV)", "Subscription & ad-supported monetisation", "Content management & DRM"],
    pricing: { from: "৳ 8,00,000", model: "Fixed-price project", timeline: "12–20 weeks" },
    cta: { label: "Get a streaming quote", sub: "Free 30-min strategy call" },
    intro:
      "End-to-end OTT platform engineering — from ingest and DRM to multi-device playback, monetisation and analytics. Built for Bangladeshi audiences with global delivery infrastructure.",
    capabilities: [
      { title: "Adaptive streaming", desc: "HLS / DASH packaging with multi-bitrate transcoding and CDN-backed delivery for low latency at national scale." },
      { title: "DRM & content protection", desc: "Widevine, FairPlay and PlayReady integration with concurrent-stream limits and watermarking." },
      { title: "SVOD + AVOD monetisation", desc: "Subscription tiers, in-app purchases, server-side ad insertion and yield management." },
      { title: "CMS & scheduling", desc: "Editorial workflows, EPG, content tagging, recommendation rules and rights management." },
    ],
    deliverables: [
      "Web, iOS, Android and Smart-TV apps",
      "Admin CMS with role-based access",
      "Subscription, billing and entitlement engine",
      "Real-time analytics dashboards",
      "DevOps runbooks and 24/5 support plan",
    ],
    techStack: ["TypeScript", "Node.js", "AWS MediaConvert", "CloudFront", "Widevine DRM", "PostgreSQL", "Redis"],
    process: [
      { step: "01", title: "Discovery", desc: "Audience, content rights, device strategy and monetisation modelled with finance and content teams." },
      { step: "02", title: "Architecture", desc: "Streaming stack, DRM, billing and analytics architecture documented and signed off." },
      { step: "03", title: "Build", desc: "Two-week sprints across web, mobile and CMS with weekly demos." },
      { step: "04", title: "Launch & operate", desc: "Soft-launch, load testing, observability and 24/5 support in place." },
    ],
    faqs: [
      { q: "How long does an OTT launch take?", a: "Typical timeline is 12–20 weeks from kick-off to public launch, depending on device coverage and monetisation complexity." },
      { q: "Can you integrate local payments?", a: "Yes — bKash, Nagad, Rocket and card processing are supported alongside global gateways for diaspora audiences." },
      { q: "Do you offer 24/7 support after launch?", a: "We provide 24/5 SLA-backed support by default, with optional 24/7 coverage on managed retainers." },
    ],
  },
  {
    slug: "akash-news",
    icon: Newspaper,
    title: "Akash News",
    desc: "A modern Bangladeshi digital news platform delivering real-time stories with a robust editorial CMS.",
    bullets: ["Editorial workflow & approvals", "Real-time publishing", "SEO & social distribution"],
    pricing: { from: "৳ 3,50,000", model: "Fixed-price + retainer", timeline: "8–12 weeks" },
    cta: { label: "Request newsroom demo", sub: "Live walkthrough in 24 hours" },
    intro:
      "Newsroom-grade publishing platform built for speed, SEO and editorial control — the same stack powering Akash News and several national dailies.",
    capabilities: [
      { title: "Editorial workspace", desc: "Story-level approvals, version history, embargoes and inline collaboration." },
      { title: "Real-time publishing", desc: "Sub-second cache invalidation, live blogs and breaking-news push notifications." },
      { title: "SEO automation", desc: "Schema.org markup, sitemap pings, AMP pages and editorial SEO checks before publish." },
      { title: "Multimedia delivery", desc: "Adaptive image pipelines, video embeds, podcast hosting and social-card generation." },
    ],
    deliverables: [
      "Public news website with regional editions",
      "Editorial CMS with role-based workflows",
      "Mobile reader app (iOS + Android)",
      "Newsletter and push-notification engine",
      "SEO + analytics integration",
    ],
    techStack: ["Next.js", "PostgreSQL", "Redis", "Cloudflare", "Algolia", "Elastic"],
    process: [
      { step: "01", title: "Editorial audit", desc: "Workflows, beats and publication cadence mapped with newsroom leadership." },
      { step: "02", title: "Information architecture", desc: "Sections, taxonomies and SEO structure designed for crawl efficiency." },
      { step: "03", title: "Build & migrate", desc: "Headless CMS, archive migration and editor training delivered in parallel." },
      { step: "04", title: "Go-live & optimise", desc: "Performance tuning, Core Web Vitals and editorial KPIs tracked weekly." },
    ],
    faqs: [
      { q: "Can you migrate our existing archive?", a: "Yes — we routinely migrate 100k+ legacy stories with redirects and SEO continuity." },
      { q: "Do you support regional editions?", a: "The CMS ships with multi-edition support out of the box, including separate editorial teams." },
      { q: "How do you handle traffic spikes?", a: "We cache aggressively at the edge and have autoscaling origins; load tested to 100k+ concurrent readers." },
    ],
  },
  {
    slug: "yess-one-stop",
    icon: LayoutGrid,
    title: "YESS One Stop Solution",
    desc: "Centralised technology services, IT support and home services like cleaning and maintenance — under one trusted roof.",
    bullets: ["Managed IT services", "On-site technicians", "Vendor consolidation"],
    pricing: { from: "৳ 35,000 / mo", model: "Monthly retainer", timeline: "Live in 7 days" },
    cta: { label: "Start managed IT", sub: "Free IT health check" },
    intro:
      "A single accountable partner for every operational service your business needs — IT, networking, on-site maintenance and back-office support.",
    capabilities: [
      { title: "Managed IT", desc: "Helpdesk, endpoint management, identity and access, backups and disaster recovery." },
      { title: "On-site technicians", desc: "Field engineers across Dhaka and major districts with SLA-backed response times." },
      { title: "Vendor consolidation", desc: "We negotiate, manage and report on third-party vendors so you have one bill." },
      { title: "Office services", desc: "Cleaning, maintenance and supply management bundled with technology operations." },
    ],
    deliverables: [
      "Service catalogue with SLAs",
      "Quarterly business reviews",
      "Asset register and licence tracking",
      "Monthly health and uptime reports",
      "Single point of contact",
    ],
    techStack: ["Microsoft 365", "Google Workspace", "Intune", "Jamf", "Jira Service Management"],
    process: [
      { step: "01", title: "Audit", desc: "Free IT and operations audit covering infrastructure, security and vendors." },
      { step: "02", title: "Transition", desc: "Knowledge transfer, runbook creation and tool onboarding within 7 days." },
      { step: "03", title: "Operate", desc: "Helpdesk, on-site visits and proactive maintenance per the agreed SLA." },
      { step: "04", title: "Improve", desc: "Quarterly reviews surface savings, risks and modernisation opportunities." },
    ],
    faqs: [
      { q: "How fast can you take over operations?", a: "Most clients are live within 7 days of contract sign-off." },
      { q: "Do you support offices outside Dhaka?", a: "Yes — we have engineer coverage across all major divisional cities." },
      { q: "Can you co-exist with our internal IT team?", a: "Absolutely — we frequently augment in-house teams with overflow and night-shift coverage." },
    ],
  },
  {
    slug: "web-development",
    icon: Code2,
    title: "Web Development",
    desc: "Frontend (HTML, CSS, JavaScript) and backend (PHP, Laravel, Node) engineering with responsive design.",
    bullets: ["Custom web applications", "API & system integrations", "Performance & accessibility audits"],
    pricing: { from: "৳ 1,20,000", model: "Fixed-price or T&M", timeline: "4–10 weeks" },
    cta: { label: "Get a development quote", sub: "Written proposal in 1–3 days" },
    intro:
      "Production-grade web applications and integrations engineered by senior developers — typed end-to-end, observable and built to scale.",
    capabilities: [
      { title: "Custom applications", desc: "Internal tools, customer portals and SaaS products with role-based access and audit logs." },
      { title: "API & integrations", desc: "REST and GraphQL APIs, ERP/CRM integrations and ETL pipelines." },
      { title: "Performance audits", desc: "Core Web Vitals, accessibility (WCAG 2.2 AA) and security audits with prioritised remediation." },
      { title: "Cloud delivery", desc: "Container-based deployment, CI/CD pipelines and infrastructure-as-code." },
    ],
    deliverables: [
      "Architecture and ADRs",
      "Source code with tests and CI",
      "Staging + production environments",
      "Monitoring, alerting and runbooks",
      "Handover documentation and training",
    ],
    techStack: ["TypeScript", "React", "Node.js", "Laravel", "PostgreSQL", "Docker", "AWS"],
    process: [
      { step: "01", title: "Discovery", desc: "Goals, constraints and success metrics captured in a written proposal." },
      { step: "02", title: "Design", desc: "Architecture, data model and UX flows reviewed with stakeholders." },
      { step: "03", title: "Build", desc: "Two-week sprints with weekly demos and a public progress board." },
      { step: "04", title: "Operate", desc: "Warranty period, monitoring and an optional improvement retainer." },
    ],
    faqs: [
      { q: "Do you offer fixed-price engagements?", a: "Yes — for well-defined scope. For evolving products we recommend Time & Materials." },
      { q: "Who owns the source code?", a: "You do, fully. We deliver to your repository with documentation and training." },
      { q: "Can you work with our existing team?", a: "Yes — we frequently embed alongside in-house engineers and follow your conventions." },
    ],
  },
  {
    slug: "web-design",
    icon: Palette,
    title: "Web Design",
    desc: "Visually appealing, functional websites combining layout, colour, typography and user experience.",
    bullets: ["Brand-aligned UI design", "UX research & prototyping", "Design systems"],
    pricing: { from: "৳ 75,000", model: "Design sprint", timeline: "2–4 weeks" },
    cta: { label: "Book a design sprint", sub: "Kick-off within a week" },
    intro:
      "Design sprints that turn brand strategy into shippable interfaces — research, prototypes and a reusable design system in 2–4 weeks.",
    capabilities: [
      { title: "UX research", desc: "User interviews, journey mapping and usability testing with measurable insight." },
      { title: "Interface design", desc: "High-fidelity Figma designs, motion specs and interactive prototypes." },
      { title: "Design systems", desc: "Tokens, components and documentation that scale across products and teams." },
      { title: "Accessibility", desc: "WCAG 2.2 AA built in from day one, validated with assistive tech." },
    ],
    deliverables: [
      "Research synthesis report",
      "Interactive Figma prototype",
      "Production-ready design system",
      "Engineering handover with specs",
      "Brand and motion guidelines",
    ],
    techStack: ["Figma", "FigJam", "Maze", "Lottie", "Storybook"],
    process: [
      { step: "01", title: "Understand", desc: "Stakeholder workshop, audit and competitive landscape." },
      { step: "02", title: "Explore", desc: "Concept directions and rapid iteration with the client team." },
      { step: "03", title: "Refine", desc: "High-fidelity design, prototype and usability testing." },
      { step: "04", title: "Hand off", desc: "Engineering specs, tokens and a working design system." },
    ],
    faqs: [
      { q: "Do you redesign existing products?", a: "Yes — we run heuristic audits and usability tests before proposing a redesign scope." },
      { q: "Can we work directly with the designer?", a: "Yes — every engagement has a named lead designer with weekly working sessions." },
      { q: "Will the design work for low-end devices?", a: "Yes — we design for the median Bangladeshi device and connection profile." },
    ],
  },
  {
    slug: "yess-bangla-shop",
    icon: ShoppingBag,
    title: "Yess Bangla Shop",
    desc: "End-to-end e-commerce — websites, mobile apps, secure payments and doorstep delivery for retailers across Bangladesh.",
    bullets: ["Storefront + mobile apps", "Local payment gateways", "Inventory & logistics"],
    pricing: { from: "৳ 2,50,000", model: "Fixed-price + GMV %", timeline: "6–12 weeks" },
    cta: { label: "Launch your store", sub: "Free e-commerce audit" },
    intro:
      "A complete commerce stack — storefront, mobile apps, local payments, inventory and last-mile delivery — built for retailers serving all 64 districts.",
    capabilities: [
      { title: "Storefront & apps", desc: "Responsive web storefront plus native iOS and Android apps with shared catalogue." },
      { title: "Local payments", desc: "bKash, Nagad, Rocket, cards and cash-on-delivery with reconciliation tooling." },
      { title: "Inventory & OMS", desc: "Real-time stock, multi-warehouse, returns and replenishment workflows." },
      { title: "Last-mile delivery", desc: "Hybrid model with in-house riders and 3PL integrations across districts." },
    ],
    deliverables: [
      "Storefront, admin and mobile apps",
      "Payment, OMS and 3PL integrations",
      "Marketing automation and CRM",
      "Operational dashboards",
      "Launch + 90-day growth plan",
    ],
    techStack: ["Next.js", "React Native", "Node.js", "PostgreSQL", "Redis", "Cloudflare"],
    process: [
      { step: "01", title: "Audit", desc: "Free audit of catalogue, fulfilment and unit economics." },
      { step: "02", title: "Design", desc: "Customer journeys, payments and logistics blueprint signed off." },
      { step: "03", title: "Build", desc: "Storefront, apps and back-office delivered in parallel sprints." },
      { step: "04", title: "Grow", desc: "Performance marketing, CRO and merchandising for 90 days post-launch." },
    ],
    faqs: [
      { q: "Can you work with an existing Shopify or WooCommerce store?", a: "Yes — we either extend your current platform or migrate to a custom stack, depending on scale." },
      { q: "Do you support cash on delivery?", a: "Yes — with reconciliation, fraud rules and partial-payment handling." },
      { q: "Can you handle deliveries outside Dhaka?", a: "Yes — through our 3PL partners we cover all 64 districts with tracked delivery." },
    ],
  },
];

export const getService = (slug: string) => services.find((s) => s.slug === slug);
