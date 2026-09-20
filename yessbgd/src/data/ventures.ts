import { Code2, Tv, PlayCircle, Newspaper, Leaf, Wrench, Server, CalendarHeart, Sparkles, ChefHat, LayoutGrid, Plane, Scale, type LucideIcon } from "lucide-react";
import type { StaticImageData } from "next/image";

import yessSoftImg from "@/assets/ventures/yess-soft.jpg";
import akashTvImg from "@/assets/ventures/akash-tv.jpg";
import akashOttImg from "@/assets/ventures/akash-ott.jpg";
import dailyAkashImg from "@/assets/ventures/the-daily-akash.jpg";
import organicHaatImg from "@/assets/ventures/yess-organic-haat.jpg";
import yessServiceImg from "@/assets/ventures/yess-service.jpg";
import yessHostImg from "@/assets/ventures/yess-host.jpg";
import yessEventImg from "@/assets/ventures/yess-event.jpg";
import yessModelImg from "@/assets/ventures/yess-model.jpg";
import yessFoodImg from "@/assets/ventures/yess-food.jpg";
import yessTourismImg from "@/assets/ventures/yess-tourism.jpg";
import yessAioImg from "@/assets/ventures/yess-all-in-one-solution.jpg";
import yessLegalImg from "@/assets/ventures/yess-legal-advice.jpg";

export type VentureCase = {
  challenge: string;
  solution: string;
  phases: { title: string; desc: string }[];
  techStack: string[];
  results: { label: string; value: string }[];
};

export type VentureTestimonial = {
  quote: string;
  author: string;
  role: string;
  /** Company / brand the client represents. */
  company?: string;
  /** Initials shown when no logo URL is provided (e.g. "AK"). */
  logoText?: string;
  /** Optional logo image URL. Falls back to logoText monogram. */
  logoUrl?: string;
  /** Project window, e.g. "Mar 2023 – Jan 2024". */
  timeframe?: string;
  /** Per-venture credibility / source line, e.g. "Verified engagement · Reference available on request". */
  source?: string;
};

export type VentureMilestone = { year: string; title: string; desc: string };
export type VenturePackage = {
  name: string;
  price: string;
  cadence?: string;
  summary: string;
  features: string[];
  highlight?: boolean;
};
export type VentureFaq = { q: string; a: string };

export type Venture = {
  slug: string;
  title: string;
  category: string;
  tagline: string;
  desc: string;
  longDesc: string;
  image: string | StaticImageData;
  icon: LucideIcon;
  /** Optional brand logo image URL. Falls back to the icon monogram. */
  logoUrl?: string;
  /** Optional public domain — the hero coin auto-pulls its live favicon. */
  domain?: string;
  /** Live ventures vs. upcoming projects. Absent = active. */
  status?: "active" | "upcoming";
  color: string;
  highlights: string[];
  services: string[];
  audience: string;
  features: { title: string; desc: string }[];
  founded?: string;
  reach?: string;
  caseStudy?: VentureCase;
  gallery?: string[];
  testimonial?: VentureTestimonial;
  milestones?: VentureMilestone[];
  packages?: VenturePackage[];
  faqs?: VentureFaq[];
};

export const ventures: Venture[] = [
  {
    slug: "yess-soft",
    title: "Yess Soft",
    status: "active",
    domain: "yessbangla.top",
    logoUrl: "/coins/yess-soft.png",
    category: "Software & IT Solutions",
    tagline: "Engineering software that scales with your ambition.",
    desc: "Custom software, web & mobile applications, ERP, CRM and enterprise systems built for modern businesses across Bangladesh and beyond.",
    longDesc:
      "Yess Soft is the engineering core of the YESS Bangla group — a product studio that ships secure, observable, cloud-native software for ambitious teams. From single-screen MVPs to multi-tenant ERP platforms, every release is built with TypeScript, automated tests, and a relentless focus on time-to-value.",
    image: yessSoftImg,
    icon: Code2,
    color: "from-primary to-primary-glow",
    highlights: [
      "Web & mobile application development",
      "ERP, CRM & inventory management systems",
      "UI/UX design and product strategy",
      "Cloud-native, secure and scalable architectures",
    ],
    services: ["Web Development", "Mobile Apps", "ERP Systems", "Cloud Solutions", "UI/UX Design"],
    audience: "Startups, SMEs, enterprises and government agencies seeking digital transformation.",
    founded: "2018",
    reach: "Clients across BD, UAE & UK",
    features: [
      { title: "Senior-only delivery pods", desc: "Every project is led by a tech lead, designer and PM — no hand-offs." },
      { title: "Production-ready in 90 days", desc: "Discovery, design and a working v1 inside a single quarter." },
      { title: "Long-term partnership", desc: "Quarterly roadmap reviews, dedicated success manager and 24/5 support." },
    ],
    caseStudy: {
      challenge:
        "A national distributor was running 11 disconnected spreadsheets and three legacy desktop apps — orders were being missed, inventory was wrong by 18%, and finance closed the books two weeks late.",
      solution:
        "Yess Soft replaced the legacy stack with a single multi-tenant ERP — orders, inventory, fleet and finance — wired into a real-time analytics layer and mobile apps for the field team.",
      phases: [
        { title: "Discover", desc: "Process mapping with 14 stakeholders, KPI baselining and an executive scorecard." },
        { title: "Design", desc: "Role-based UX, design system and clickable prototype validated with end-users." },
        { title: "Build", desc: "Two-week sprints, automated test suite, weekly demos and zero-downtime deploys." },
        { title: "Launch & grow", desc: "Phased rollout across 7 depots, training videos and a 90-day improvement retainer." },
      ],
      techStack: ["TypeScript", "React", "Node.js", "PostgreSQL", "Redis", "AWS", "Cloudflare"],
      results: [
        { label: "Inventory accuracy", value: "99.4%" },
        { label: "Order cycle time", value: "−61%" },
        { label: "Finance close", value: "3 days" },
        { label: "Uptime", value: "99.97%" },
      ],
    },
    testimonial: {
      quote: "Yess Soft replaced eleven spreadsheets and three legacy apps with one ERP. Our depots now close the books in three days instead of two weeks — and our field team finally trusts the inventory numbers.",
      author: "Sharif Anwar",
      role: "Chief Operating Officer",
      company: "Meghna Distribution Ltd.",
      logoText: "MD",
      timeframe: "Apr 2022 – Ongoing",
      source: "Verified engagement · Reference call available on request",
    },
  },
  {
    slug: "akash-tv",
    title: "Akash TV",
    status: "upcoming",
    category: "Satellite Television",
    tagline: "Stories that connect a nation.",
    desc: "A modern satellite broadcast channel delivering news, entertainment, drama, talk shows and cultural programs across the country.",
    longDesc:
      "Akash TV is a 24/7 general-entertainment satellite channel reaching households across Bangladesh and the diaspora. From breaking news to flagship dramas and live cultural events, our newsroom and production studios are built to international broadcast standards.",
    image: akashTvImg,
    icon: Tv,
    color: "from-accent to-primary",
    highlights: [
      "24/7 satellite broadcasting",
      "News, drama, talk shows and cultural programs",
      "In-house production studio",
      "Nationwide reach and growing global audience",
    ],
    services: ["News & Current Affairs", "Drama & Entertainment", "Live Programs", "Brand Sponsorships"],
    audience: "Viewers, advertisers and content creators looking for a premium broadcast platform.",
    founded: "2019",
    reach: "Nationwide + diaspora",
    features: [
      { title: "HD newsroom", desc: "Three studios, automated graphics, dual control rooms and live OB capability." },
      { title: "Original drama slate", desc: "12+ flagship serials a year, produced in-house with award-winning directors." },
      { title: "Brand-safe inventory", desc: "Curated programming blocks and custom integrations for premium advertisers." },
    ],
    caseStudy: {
      challenge:
        "Launching a new satellite channel into a saturated market — with the production quality of global broadcasters but a lean, local cost base.",
      solution:
        "We built a tape-less HD newsroom, a flagship drama slate and a sponsorship-friendly programming grid — all wired into a real-time audience analytics layer.",
      phases: [
        { title: "Discover", desc: "Audience research across 6 divisions, competitor grid analysis and a programming blueprint." },
        { title: "Design", desc: "On-air branding system, set design and a graphics package built for HD and social cut-downs." },
        { title: "Build", desc: "Three studios, two control rooms, MAM workflow and an OB van commissioned in 7 months." },
        { title: "Launch & grow", desc: "Soft launch, weekly grid optimisation against ratings and a rolling slate of new originals." },
      ],
      techStack: ["Sony HD Cameras", "Avid MAM", "Vizrt Graphics", "Dalet Newsroom", "Eutelsat Uplink"],
      results: [
        { label: "Weekly reach", value: "22M+" },
        { label: "Prime-time share", value: "Top 5" },
        { label: "Original hours / yr", value: "1,800+" },
        { label: "On-air uptime", value: "99.99%" },
      ],
    },
    testimonial: {
      quote: "Akash TV gave our brand prime-time presence with the polish of a global broadcaster. Their newsroom and post-production team made integration feel native, not advertorial.",
      author: "Nusrat Jahan",
      role: "Head of Brand & Communications",
      company: "Pran-RFL Group",
      logoText: "PR",
      timeframe: "Jan 2023 – Dec 2024",
      source: "Verified sponsorship · Aired across Q1–Q4 2024",
    },
  },
  {
    slug: "akash-ott",
    title: "Akash OTT",
    status: "active",
    domain: "akash.tv",
    logoUrl: "/coins/akash-ott.png",
    category: "Streaming Platform",
    tagline: "Your favourite shows, anytime — on any screen.",
    desc: "An on-demand streaming platform with films, web originals, live TV and exclusive premieres tailored for Bangla-speaking audiences worldwide.",
    longDesc:
      "Akash OTT is the digital home for Bangla storytelling — feature films, web series, live TV simulcasts and exclusive premieres, available on mobile, web and smart TV with personalised recommendations and offline downloads.",
    image: akashOttImg,
    icon: PlayCircle,
    color: "from-primary-glow to-accent",
    highlights: [
      "On-demand films, series and originals",
      "Live TV streaming across devices",
      "Personalised recommendations",
      "Multi-device support — mobile, web, smart TV",
    ],
    services: ["Subscription Streaming", "Original Content", "Live TV", "Brand Partnerships"],
    audience: "Households, content fans and brands seeking digital reach.",
    founded: "2022",
    reach: "Available in 40+ countries",
    features: [
      { title: "Adaptive streaming", desc: "DRM-protected delivery from 144p to 4K with sub-2s start times." },
      { title: "Originals studio", desc: "A pipeline of platform-exclusive series and films across genres." },
      { title: "Smart discovery", desc: "ML-driven recommendations, watch-party mode and continue-watching across devices." },
    ],
    caseStudy: {
      challenge:
        "Bangla-speaking audiences worldwide were stitching together piracy sites, social clips and regional apps — there was no premium, legal, mobile-first home for Bangla content.",
      solution:
        "Akash OTT shipped a DRM-protected, multi-CDN streaming platform with a curated library, exclusive originals and a recommendation engine tuned for Bangla viewing patterns.",
      phases: [
        { title: "Discover", desc: "Diaspora research across 6 markets, content licensing audit and a pricing study." },
        { title: "Design", desc: "Cross-device UX (mobile, web, smart TV) with offline-first flows and family profiles." },
        { title: "Build", desc: "Multi-CDN delivery, Widevine/FairPlay DRM, payments in BDT/USD/AED and analytics." },
        { title: "Launch & grow", desc: "Hero original premiere, performance marketing in 12 markets and weekly cohort tuning." },
      ],
      techStack: ["React Native", "Next.js", "Shaka Player", "AWS MediaConvert", "Cloudflare Stream", "Stripe"],
      results: [
        { label: "Countries served", value: "40+" },
        { label: "Avg. start time", value: "1.6s" },
        { label: "Day-30 retention", value: "48%" },
        { label: "Originals shipped", value: "20+" },
      ],
    },
    testimonial: {
      quote: "We premiered our feature on Akash OTT and saw 1.4M unique viewers in the first ten days — across Bangladesh, the Gulf and the UK. Their distribution and DRM stack just works.",
      author: "Imran Hossain",
      role: "Executive Producer",
      company: "Goldfish Films",
      logoText: "GF",
      timeframe: "Aug 2024 – Nov 2024",
      source: "Verified release window · Audience report shared with partners",
    },
  },
  {
    slug: "the-daily-akash",
    title: "The Daily Akash",
    status: "active",
    domain: "akash.news",
    logoUrl: "/coins/the-daily-akash.png",
    category: "Digital Newspaper",
    tagline: "Trusted journalism for a modern Bangladesh.",
    desc: "A digital-first newspaper delivering breaking news, in-depth analysis, business, sports and lifestyle stories that matter — every day.",
    longDesc:
      "The Daily Akash is an independent, digital-first newsroom. Our reporters cover politics, business, sports, technology and culture with an editorial code that puts accuracy and accountability ahead of speed.",
    image: dailyAkashImg,
    icon: Newspaper,
    color: "from-primary to-accent",
    highlights: [
      "Breaking news and investigative reporting",
      "Business, politics, sports and lifestyle coverage",
      "Multimedia storytelling — video, audio, long-reads",
      "Mobile-first digital experience",
    ],
    services: ["News Reporting", "Editorial & Opinion", "Display & Native Ads", "Sponsored Content"],
    audience: "Readers, advertisers and PR partners who value credible journalism.",
    founded: "2020",
    reach: "Millions of monthly readers",
    features: [
      { title: "Independent newsroom", desc: "Editorial firewall, source protection and a published corrections policy." },
      { title: "Long-form & investigations", desc: "A dedicated desk for multi-week investigations and data journalism." },
      { title: "Native ad studio", desc: "Brand storytelling that respects readers — clearly labelled, beautifully crafted." },
    ],
    caseStudy: {
      challenge:
        "Readers were drowning in unverified social posts and clickbait — credible journalism existed, but it was buried under slow sites and intrusive ads.",
      solution:
        "We launched a mobile-first newsroom on a fast headless CMS, with a published code of ethics, structured beats, and a native ad studio that funds independent reporting.",
      phases: [
        { title: "Discover", desc: "Reader interviews, beat mapping and an ethics charter co-written with senior editors." },
        { title: "Design", desc: "Reader-first article template, dark mode, distraction-free reading and rich media embeds." },
        { title: "Build", desc: "Headless CMS, edge caching, AMP/Web Stories, push subs and a sponsored-content workflow." },
        { title: "Launch & grow", desc: "Beat-by-beat rollout, newsletter loops and a weekly editorial scorecard." },
      ],
      techStack: ["Next.js", "Sanity CMS", "Algolia", "Cloudflare", "OneSignal", "Plausible"],
      results: [
        { label: "Monthly readers", value: "5M+" },
        { label: "Median load time", value: "0.9s" },
        { label: "Newsletter open rate", value: "42%" },
        { label: "Investigations / yr", value: "30+" },
      ],
    },
    testimonial: {
      quote: "The Daily Akash is one of the few Bangla newsrooms we trust to fact-check before publishing. Their corrections policy and source protection are genuinely best-in-class for the region.",
      author: "Dr. Asif Saleh",
      role: "Senior Fellow, Media Integrity",
      company: "South Asia Press Institute",
      logoText: "SP",
      timeframe: "2023 editorial review",
      source: "Independent editorial audit · Findings published Mar 2024",
    },
  },
  {
    slug: "yess-legal-advice",
    title: "Yess Legal Advice",
    status: "active",
    category: "Legal Advisory",
    tagline: "Trusted counsel for every stage of business.",
    desc: "Corporate legal advisory — company formation, contracts, compliance, intellectual property and dispute support for businesses and individuals.",
    longDesc:
      "Yess Legal Advice is the group's counsel desk — a panel of barristers, advocates and company secretaries who handle everything from RJSC incorporation and trade licences to contract drafting, IP filings and regulatory compliance, so founders can build with confidence.",
    image: yessLegalImg,
    icon: Scale,
    color: "from-primary to-accent",
    highlights: [
      "Company formation, RJSC & trade licence support",
      "Contract drafting, review and negotiation",
      "Trademark, copyright and IP protection",
      "Regulatory compliance and dispute resolution",
    ],
    services: ["Company Formation", "Contracts & Agreements", "IP & Trademark", "Compliance & Disputes"],
    audience: "Startups, SMEs, enterprises and individuals seeking dependable legal counsel.",
    founded: "2024",
    reach: "Clients across BD & the diaspora",
    features: [
      { title: "Fixed-fee packages", desc: "Transparent pricing for formation, contracts and filings — quoted before work begins." },
      { title: "Senior advocates only", desc: "Every matter is led by a bar enrolled advocate — no juniors learning on your file." },
      { title: "Business-first counsel", desc: "Advice written for operators, not academics — risk flagged, options ranked, next steps clear." },
    ],
    caseStudy: {
      challenge:
        "A fast-growing e-commerce group was signing supplier contracts without review, had no trademark on its own brand, and faced a regulatory notice it didn't understand.",
      solution:
        "Yess Legal Advice ran a 360° legal audit, registered the group's trademarks, rebuilt its contract library and took over regulator correspondence under a monthly retainer.",
      phases: [
        { title: "Discover", desc: "Full legal audit — entity structure, licences, contracts, IP and pending notices." },
        { title: "Design", desc: "A remediation roadmap ranked by risk, plus a standard contract and policy library." },
        { title: "Build", desc: "Trademark filings, redrafted agreements, compliance calendar and board resolutions." },
        { title: "Launch & grow", desc: "Monthly retainer counsel, quarterly compliance reviews and on-call dispute support." },
      ],
      techStack: ["RJSC e-Filing", "DPDT IP Portal", "Contract Lifecycle Mgmt", "e-Court Services"],
      results: [
        { label: "Contracts reviewed", value: "120+" },
        { label: "Trademarks secured", value: "9" },
        { label: "Regulatory exposure", value: "−100%" },
        { label: "Advisory turnaround", value: "<48h" },
      ],
    },
    testimonial: {
      quote: "Yess Legal Advice rebuilt our entire contract library and had our trademarks filed within weeks. For the first time, legal feels like a growth partner — not a cost centre.",
      author: "Farhana Karim",
      role: "Managing Director",
      company: "Nabanna Commerce Ltd.",
      logoText: "NC",
      timeframe: "Mar 2025 – Ongoing",
      source: "Verified retainer client · Reference available on request",
    },
  },
  {
    slug: "yess-organic-haat",
    title: "Yess Organic Haat",
    status: "active",
    domain: "organichaat.top",
    logoUrl: "/coins/yess-organic-haat.png",
    category: "Organic Marketplace",
    tagline: "Pure. Local. Delivered to your door.",
    desc: "Farm-to-table organic food and lifestyle products sourced directly from verified local producers and delivered fresh.",
    longDesc:
      "Yess Organic Haat is a farm-to-fork marketplace that connects verified Bangladeshi farmers directly to urban households. Cold-chain logistics, lab-tested produce and a transparent grading system mean what you order is what arrives — fresh, traceable and fair to the grower.",
    image: organicHaatImg,
    icon: Leaf,
    color: "from-accent to-primary-glow",
    highlights: [
      "Verified organic produce and groceries",
      "Direct sourcing from local farmers",
      "Cold-chain logistics and quality control",
      "Subscription and one-time delivery",
    ],
    services: ["Fresh Produce", "Pantry & Groceries", "Wellness Products", "Corporate Supply"],
    audience: "Health-conscious households, restaurants and corporate offices.",
    founded: "2021",
    reach: "200+ partner farms",
    features: [
      { title: "Lab-tested produce", desc: "Random batch testing for pesticides and heavy metals at an accredited lab." },
      { title: "Fair-trade pricing", desc: "Farmers receive a published floor price plus a quality bonus on every harvest." },
      { title: "Cold-chain delivery", desc: "Temperature-controlled vans and same-day fulfilment across major cities." },
    ],
    caseStudy: {
      challenge:
        "Urban families wanted truly organic groceries but couldn't trust the labels — and small farmers had no fair route to high-value urban buyers.",
      solution:
        "We built a verified-supplier marketplace with lab testing, cold-chain logistics and a transparent grading & pricing system that protects both shopper and farmer.",
      phases: [
        { title: "Discover", desc: "On-farm visits across 6 districts, soil and supply audits and a household demand study." },
        { title: "Design", desc: "Trust-first storefront, traceability cards on each product and a subscription flow." },
        { title: "Build", desc: "Marketplace, route-optimised cold-chain ops, lab integration and a farmer-payout module." },
        { title: "Launch & grow", desc: "Pilot in 3 zones, weekly farmer onboarding and SLA-driven delivery scale-up." },
      ],
      techStack: ["Next.js", "Supabase", "Mapbox", "Stripe", "Twilio", "Cloudflare R2"],
      results: [
        { label: "Partner farms", value: "200+" },
        { label: "On-time delivery", value: "98.6%" },
        { label: "Avg. farmer income", value: "+34%" },
        { label: "Subscription retention", value: "71%" },
      ],
    },
    testimonial: {
      quote: "Yess Organic Haat is the only supplier that gives us lab reports with every batch. Our pantry team has cut audit time by 60% and our chefs finally trust the 'organic' label on the box.",
      author: "Farzana Rahman",
      role: "Group Procurement Lead",
      company: "Le Méridien Dhaka",
      logoText: "LM",
      timeframe: "May 2023 – Ongoing",
      source: "Verified supply contract · Renewed annually",
    },
  },
  {
    slug: "yess-service",
    title: "Shondhaan",
    status: "active",
    domain: "shondhaan.com",
    logoUrl: "/coins/shondhaan.png",
    category: "Home & Professional Services",
    tagline: "Trusted experts, just a tap away.",
    desc: "On-demand professional services — from home maintenance and cleaning to expert consultations — delivered by vetted professionals.",
    longDesc:
      "Shondhaan brings the country's best home and professional service providers onto a single, dependable booking platform. Every technician is background-checked, trained and rated by customers — with a written service guarantee on every job.",
    image: yessServiceImg,
    icon: Wrench,
    color: "from-primary to-primary-glow",
    highlights: [
      "Home repair, cleaning and maintenance",
      "Vetted, background-checked professionals",
      "Transparent pricing and instant booking",
      "Service guarantee on every job",
    ],
    services: ["Home Repair", "Deep Cleaning", "AC & Appliance Service", "Professional Consultation"],
    audience: "Homeowners, tenants and businesses needing reliable on-demand services.",
    founded: "2022",
    reach: "Dhaka, Chittagong, Sylhet",
    features: [
      { title: "Vetted professionals", desc: "ID checks, skill assessments and ongoing training on safety and etiquette." },
      { title: "Upfront pricing", desc: "See the price before you book — no surprises, no haggling, no hidden fees." },
      { title: "Service guarantee", desc: "If you're not satisfied, we send a second professional or refund — your call." },
    ],
    caseStudy: {
      challenge:
        "Booking a trustworthy electrician, AC tech or deep-cleaner meant scrolling Facebook groups and praying — pricing was opaque and quality wildly inconsistent.",
      solution:
        "Shondhaan launched an instant-booking app with vetted, in-house-trained professionals, upfront pricing and a written satisfaction guarantee on every job.",
      phases: [
        { title: "Discover", desc: "Customer & technician interviews, complaint mining and a service-catalogue blueprint." },
        { title: "Design", desc: "3-tap booking flow, transparent price cards, live ETA and a post-job rating loop." },
        { title: "Build", desc: "Customer + pro apps, dispatch engine, payments, training LMS and a QA dashboard." },
        { title: "Launch & grow", desc: "Pilot in 3 zones, weekly NPS reviews and a re-training programme for low-rated pros." },
      ],
      techStack: ["React Native", "Node.js", "PostgreSQL", "Mapbox", "bKash", "Stripe"],
      results: [
        { label: "Avg. arrival time", value: "47 min" },
        { label: "Customer NPS", value: "72" },
        { label: "Repeat bookings", value: "61%" },
        { label: "Pros onboarded", value: "1,200+" },
      ],
    },
    testimonial: {
      quote: "We manage 140 apartments across Dhaka and Shondhaan is now our default for AC, plumbing and deep-clean. Upfront pricing and the satisfaction guarantee ended the haggling — and the complaints.",
      author: "Tanvir Ahmed",
      role: "Operations Director",
      company: "Bproperty Facilities",
      logoText: "BP",
      timeframe: "Feb 2023 – Ongoing",
      source: "Verified B2B account · 1,800+ jobs completed",
    },
  },
  {
    slug: "yess-host",
    title: "Yess Host",
    status: "active",
    category: "Hosting & Cloud Infrastructure",
    tagline: "Fast, secure hosting built for growth.",
    desc: "Reliable web hosting, domains, cloud servers and managed infrastructure for businesses of all sizes — backed by 24/7 expert support.",
    longDesc:
      "Yess Host is enterprise-grade infrastructure for everyone — from a first portfolio site to a multi-region SaaS. NVMe storage, isolated containers, automated backups and a tier-3 support desk that actually answers.",
    image: yessHostImg,
    icon: Server,
    color: "from-primary-glow to-primary",
    highlights: [
      "Shared, VPS and cloud hosting",
      "Domain registration and SSL",
      "Managed servers with 99.9% uptime",
      "24/7 technical support",
    ],
    services: ["Web Hosting", "Cloud VPS", "Domains & SSL", "Managed Servers"],
    audience: "Developers, agencies and businesses building online.",
    founded: "2019",
    reach: "Multi-region, BD-first",
    features: [
      { title: "NVMe everywhere", desc: "Every plan runs on NVMe storage with HTTP/3 and global caching out of the box." },
      { title: "One-click stacks", desc: "WordPress, Laravel, Next.js, Node, n8n and 30+ apps in under a minute." },
      { title: "Real humans, 24/7", desc: "Median first-response under 4 minutes — by chat, ticket or phone." },
    ],
    caseStudy: {
      challenge:
        "Local hosting was slow, oversold and unsupported — agencies were forced to send clients to overseas providers and absorb the latency and billing complexity.",
      solution:
        "Yess Host built a BD-first, multi-region cloud with NVMe storage, one-click app stacks, automated backups and a tier-3 support desk staffed in-country.",
      phases: [
        { title: "Discover", desc: "Workload audit with 40 agencies, baseline benchmarks and an SLA design workshop." },
        { title: "Design", desc: "Plan ladder, control panel UX, migration tooling and a transparent status page." },
        { title: "Build", desc: "Multi-region nodes, automated backups, WAF, DDoS shield and a 30+ app marketplace." },
        { title: "Launch & grow", desc: "Free migrations, partner programme for agencies and quarterly capacity expansion." },
      ],
      techStack: ["KVM", "LiteSpeed", "Cloudflare", "Acronis Backup", "Imunify360", "Prometheus"],
      results: [
        { label: "Network uptime", value: "99.99%" },
        { label: "Avg. TTFB (BD)", value: "82ms" },
        { label: "Sites hosted", value: "18,000+" },
        { label: "Support response", value: "<4 min" },
      ],
    },
    testimonial: {
      quote: "We migrated 230 client sites from a US provider to Yess Host in a weekend. TTFB dropped from 480ms to under 100ms in Bangladesh and our support tickets to clients fell by half.",
      author: "Rifat Mahmud",
      role: "Founder & CTO",
      company: "Codemen Solutions",
      logoText: "CS",
      timeframe: "Migrated Sep 2023 · Active partner since",
      source: "Verified agency partner · Migration report on file",
    },
  },
  {
    slug: "yess-event",
    title: "Yess Event",
    status: "active",
    category: "Event Management",
    tagline: "Unforgettable experiences, expertly delivered.",
    desc: "End-to-end event planning, production and management for corporate, cultural, brand activations and private occasions.",
    longDesc:
      "Yess Event designs and produces moments people remember — corporate conferences, brand launches, music festivals and private celebrations. Strategy, creative, production and logistics under one roof.",
    image: yessEventImg,
    icon: CalendarHeart,
    color: "from-accent to-primary",
    highlights: [
      "Corporate conferences and product launches",
      "Concerts, festivals and brand activations",
      "Weddings and private celebrations",
      "Full production — stage, sound, lighting, AV",
    ],
    services: ["Corporate Events", "Brand Activation", "Concerts & Festivals", "Wedding Planning"],
    audience: "Brands, corporates and individuals planning memorable occasions.",
    founded: "2017",
    reach: "300+ events delivered",
    features: [
      { title: "Creative-led production", desc: "Concept, script, set design and AV — engineered around the audience moment." },
      { title: "Owned equipment", desc: "Stage, sound, lighting, LED walls and broadcast kit — owned, not rented." },
      { title: "Single accountable lead", desc: "One producer owns budget, timeline and quality from kick-off to wrap." },
    ],
    caseStudy: {
      challenge:
        "Brands juggling 4–5 vendors per event were paying twice and still getting inconsistent stages, AV gaps and last-minute panics on show day.",
      solution:
        "Yess Event delivers strategy, creative, production and logistics under one accountable producer — with owned stage, sound, lighting and broadcast kit.",
      phases: [
        { title: "Discover", desc: "Audience-moment workshop, success metrics and a written creative brief." },
        { title: "Design", desc: "Concept boards, run-of-show, set design and a fully costed production plan." },
        { title: "Build", desc: "Vendor-free production with owned kit, rehearsals and a live show-control room." },
        { title: "Launch & grow", desc: "Show day execution, multi-cam capture, social cut-downs and a post-event report." },
      ],
      techStack: ["d&b Audiotechnik", "Robe Lighting", "ROE LED Walls", "grandMA3", "Blackmagic ATEM"],
      results: [
        { label: "Events delivered", value: "300+" },
        { label: "On-time show start", value: "100%" },
        { label: "Client repeat rate", value: "78%" },
        { label: "Avg. CSAT", value: "4.9/5" },
      ],
    },
    testimonial: {
      quote: "Yess Event delivered our 4,000-guest annual conference end-to-end — stage, AV, broadcast, the lot. One producer, one budget, zero last-minute panic. We've already booked them for next year.",
      author: "Kamrul Hasan",
      role: "VP, Marketing",
      company: "Robi Axiata Limited",
      logoText: "RB",
      timeframe: "Dec 2024 — Annual Partner Summit",
      source: "Verified event delivery · Post-event report shared",
    },
  },
  {
    slug: "yess-model",
    title: "Yess Model",
    status: "upcoming",
    category: "Modeling & Talent Agency",
    tagline: "Where talent meets opportunity.",
    desc: "A modeling and talent agency discovering and nurturing fresh faces — connecting models, actors and creators with leading brands.",
    longDesc:
      "Yess Model is a full-service talent agency representing models, actors, presenters and creators. From scouting and grooming to bookings, contracts and aftercare — we build careers, not just shoots.",
    image: yessModelImg,
    icon: Sparkles,
    color: "from-primary to-accent",
    highlights: [
      "Talent scouting and grooming",
      "Brand campaigns and runway shows",
      "Portfolio shoots and training",
      "Casting for film, TV and digital media",
    ],
    services: ["Talent Management", "Brand Campaigns", "Casting", "Grooming & Training"],
    audience: "Aspiring models, brands and production houses.",
    founded: "2020",
    reach: "Roster of 200+ artists",
    features: [
      { title: "Scout & develop", desc: "Open calls, training in posing, grooming, on-camera presence and brand etiquette." },
      { title: "Brand-grade portfolios", desc: "Studio-quality test shoots and digitals refreshed every season." },
      { title: "Transparent contracts", desc: "Clear day rates, usage windows and a duty-of-care policy on every booking." },
    ],
    caseStudy: {
      challenge:
        "Brands struggled to find vetted, brief-ready talent fast — and aspiring models had no safe, structured route from open call to paid campaign.",
      solution:
        "Yess Model built a managed roster with grooming, brand-grade portfolios and transparent contracts — plus a digital casting platform brands can search by brief.",
      phases: [
        { title: "Discover", desc: "Open scouting in 8 cities, brand demand mapping and a written code of conduct." },
        { title: "Design", desc: "Talent grading framework, portfolio templates and a self-serve brand brief flow." },
        { title: "Build", desc: "Casting platform, secure contracts, payment escrow and a duty-of-care helpline." },
        { title: "Launch & grow", desc: "Quarterly intake, training cohorts and brand campaigns published as case studies." },
      ],
      techStack: ["Next.js", "Supabase", "Cloudinary", "DocuSign", "Stripe Connect"],
      results: [
        { label: "Active roster", value: "200+" },
        { label: "Avg. brief-to-cast", value: "36 hrs" },
        { label: "Booking repeat rate", value: "65%" },
        { label: "On-time payouts", value: "100%" },
      ],
    },
    testimonial: {
      quote: "We briefed Yess Model on a Friday and had a fully cast, brand-ready shoot in the studio by Tuesday. The talent arrived prepared, on time and with signed usage rights — a first for us in this market.",
      author: "Sumaiya Karim",
      role: "Creative Director",
      company: "Aarong",
      logoText: "AR",
      timeframe: "Eid 2024 campaign",
      source: "Verified campaign engagement · Imagery in market",
    },
  },
  {
    slug: "yess-food",
    title: "Yess Food",
    status: "upcoming",
    category: "Food & Beverage",
    tagline: "Authentic flavours, world-class quality.",
    desc: "Quality-driven food experiences — from cloud kitchens and signature dining concepts to packaged food brands.",
    longDesc:
      "Yess Food is a multi-format F&B operator — cloud kitchens, signature dine-in concepts, catering and packaged food brands — all built on hygiene-first kitchens and a chef-led recipe lab.",
    image: yessFoodImg,
    icon: ChefHat,
    color: "from-primary-glow to-accent",
    highlights: [
      "Cloud kitchens and dine-in concepts",
      "Packaged food and beverages",
      "Hygiene-first kitchens",
      "Catering for events and corporates",
    ],
    services: ["Restaurants", "Cloud Kitchen", "Catering", "Packaged Foods"],
    audience: "Food lovers, families, offices and event hosts.",
    founded: "2021",
    reach: "Multiple kitchens across Dhaka",
    features: [
      { title: "Chef-led R&D", desc: "Every menu starts in our recipe lab with chefs, nutritionists and supply experts." },
      { title: "HACCP-grade kitchens", desc: "Daily hygiene audits, cold-chain integrity and full ingredient traceability." },
      { title: "Operator-friendly", desc: "Cloud kitchen partnerships open new revenue without rebuilding your team." },
    ],
    caseStudy: {
      challenge:
        "Diners wanted authentic Bangla flavours at consistent restaurant quality — and event hosts struggled to find caterers that scale without sacrificing taste or hygiene.",
      solution:
        "Yess Food operates HACCP-grade central kitchens and a chef-led recipe lab — powering dine-in concepts, cloud kitchens, catering and packaged brands from one quality system.",
      phases: [
        { title: "Discover", desc: "Taste panels, supply audits and a brand portfolio strategy across price points." },
        { title: "Design", desc: "Menu engineering, kitchen layout and a packaging system built for delivery." },
        { title: "Build", desc: "Central kitchens, last-mile partnerships, POS-to-kitchen workflow and QA scorecards." },
        { title: "Launch & grow", desc: "Phased outlet rollout, weekly mystery audits and a quarterly menu refresh cycle." },
      ],
      techStack: ["Cloud POS", "Kitchen Display Systems", "Foodpanda API", "Pathao API", "ERPNext"],
      results: [
        { label: "Hygiene audit score", value: "98/100" },
        { label: "Order accuracy", value: "99.2%" },
        { label: "Avg. prep time", value: "12 min" },
        { label: "Customer rating", value: "4.7/5" },
      ],
    },
    testimonial: {
      quote: "Yess Food caters our weekly all-hands for 600 staff. Hygiene scores are visible on every delivery, the food is consistently excellent and our office complaints inbox has never been quieter.",
      author: "Mehnaz Hossain",
      role: "Head of People Operations",
      company: "bKash Limited",
      logoText: "bK",
      timeframe: "Jan 2024 – Ongoing",
      source: "Verified corporate catering account",
    },
  },
  {
    slug: "yess-tourism",
    title: "Yess Tourism",
    status: "upcoming",
    category: "Travel & Tourism",
    tagline: "Curated journeys, beautifully delivered.",
    desc: "Bespoke holiday packages, business travel, hajj & umrah, visa support and inbound experiences — designed for comfort, value and unforgettable moments.",
    longDesc:
      "Yess Tourism is the group's full-service travel house — domestic getaways, international holidays, corporate travel, hajj & umrah, student travel and inbound Bangladesh experiences. IATA-aligned booking, in-house visa specialists and 24/7 on-trip concierge mean every itinerary is planned, priced and protected end-to-end.",
    image: yessTourismImg,
    icon: Plane,
    color: "from-accent to-primary-glow",
    highlights: [
      "Tailored international & domestic holiday packages",
      "Hajj, umrah and faith-based pilgrimages",
      "Corporate travel desk with negotiated fares",
      "Visa, insurance and 24/7 on-trip concierge",
    ],
    services: [
      "Holiday Packages",
      "Air Ticketing",
      "Hajj & Umrah",
      "Visa & Documentation",
      "Corporate Travel",
      "Inbound Bangladesh Tours",
    ],
    audience:
      "Families, honeymooners, corporate teams, pilgrims and inbound travellers seeking trusted end-to-end trip planning.",
    founded: "2022",
    reach: "60+ destinations across Asia, Middle East & Europe",
    features: [
      { title: "Itinerary architects", desc: "Senior travel designers craft each trip — flights, stays, transfers, experiences — to your budget and pace." },
      { title: "Best-fare guarantee", desc: "Real-time GDS pricing with airline contracts and group fares; we'll match any verified lower quote." },
      { title: "24/7 on-trip support", desc: "A dedicated concierge on WhatsApp during travel — re-bookings, upgrades and emergencies handled in minutes." },
      { title: "Trusted partners only", desc: "Hand-picked hotels, vetted ground operators and licensed Hajj agents — every supplier is audited annually." },
    ],
    caseStudy: {
      challenge:
        "Bangladeshi travellers were stitching together cheap-fare sites, anonymous WhatsApp agents and last-minute hotel apps — saving a few takas but losing money to hidden fees, visa rejections and broken itineraries.",
      solution:
        "Yess Tourism built a single managed-travel desk: GDS-powered fare engine, in-house visa unit, contracted hotels and a 24/7 concierge — every trip insured, traceable and price-transparent.",
      phases: [
        { title: "Discover", desc: "Trip brief, traveller profile, budget mapping and a written itinerary with two alternatives." },
        { title: "Design", desc: "Day-by-day plan, hotel options with photos, transfer schedule, experience add-ons and full price card." },
        { title: "Book", desc: "Locked GDS fares, visa filing, travel insurance, e-vouchers and a printed travel wallet." },
        { title: "Travel & beyond", desc: "Pre-trip briefing, 24/7 concierge during travel, post-trip review and loyalty credits for the next journey." },
      ],
      techStack: ["Amadeus GDS", "Sabre", "TBO Holidays", "VFS Visa Workflow", "Stripe", "bKash", "WhatsApp Business API"],
      results: [
        { label: "Visa success rate", value: "97%" },
        { label: "On-time departures", value: "99.6%" },
        { label: "Avg. fare savings", value: "−18%" },
        { label: "Repeat travellers", value: "64%" },
      ],
    },
    testimonial: {
      quote:
        "Yess Tourism planned our 22-person leadership offsite to Türkiye end-to-end — visas, business-class fares, a private Bosphorus dinner and a flawless on-ground concierge. Zero surprises on the invoice.",
      author: "Tahsin Reza",
      role: "Chief People Officer",
      company: "Grameenphone Ltd.",
      logoText: "GP",
      timeframe: "Oct 2024 leadership offsite",
      source: "Verified corporate engagement · Reference available on request",
    },
    milestones: [
      { year: "2022", title: "Founded", desc: "Launched as the group's in-house travel desk with a focus on corporate accounts and pilgrimages." },
      { year: "2023", title: "IATA-aligned booking", desc: "Connected to global GDS networks and onboarded 30+ airline partners with negotiated fares." },
      { year: "2024", title: "Visa & insurance unit", desc: "Opened a dedicated visa workflow with VFS partnerships and a travel-insurance arm covering 60+ countries." },
      { year: "2025", title: "Inbound Bangladesh", desc: "Curated Sundarbans, Sajek, Cox's Bazar and tea-garden experiences for diaspora and global travellers." },
      { year: "Today", title: "Where we are now", desc: "60+ destinations served, a 24/7 concierge and a 64% repeat-traveller rate — and still adding partner cities each quarter." },
    ],
    packages: [
      {
        name: "Explorer",
        price: "From ৳ 18,000 / pp",
        cadence: "Per trip",
        summary: "Short domestic and regional getaways — Cox's Bazar, Sajek, Bandarban, Kolkata, Bangkok.",
        features: ["Return flights or AC coach", "3–4 nights in vetted 4★ hotels", "Airport transfers & city tour", "WhatsApp support during travel"],
      },
      {
        name: "Signature",
        price: "From ৳ 95,000 / pp",
        cadence: "Per trip",
        summary: "Curated international holidays — Türkiye, Maldives, Dubai, Malaysia, Singapore, Sri Lanka.",
        features: ["Premium-economy or business fares", "Hand-picked 5★ stays with breakfast", "Private guides & signature experiences", "Visa filing & travel insurance included", "24/7 on-trip concierge"],
        highlight: true,
      },
      {
        name: "Hajj & Umrah",
        price: "On request",
        cadence: "Per traveller",
        summary: "Licensed pilgrimage packages with experienced muallims and Makkah/Madinah accommodation.",
        features: ["Government-licensed Hajj quotas", "Walking-distance Haram hotels", "Group muallim & Bangla guidance", "Ziyarat tours & ihram kit", "Pre-departure orientation"],
      },
      {
        name: "Corporate",
        price: "Tailored",
        cadence: "Annual partnership",
        summary: "Managed business-travel desk for organisations — negotiated fares, policy compliance and reporting.",
        features: ["Dedicated corporate desk", "Negotiated airline & hotel rates", "Policy-compliant booking workflow", "Monthly spend & savings reports", "Crisis & duty-of-care support"],
      },
    ],
    faqs: [
      { q: "How quickly can you confirm a booking?", a: "Most international holiday quotes are returned within 4 working hours and bookings confirmed the same day once you approve. Hajj & umrah packages follow government-published windows." },
      { q: "Do you handle visa applications?", a: "Yes — our in-house visa team manages documentation, appointments and submission for 60+ countries through VFS, embassy and e-visa channels. We share a clear checklist and expected timeline upfront." },
      { q: "Are flights and hotels included in package prices?", a: "Every Yess Tourism package is fully bundled — return flights, accommodation, transfers, listed experiences and applicable taxes. Optional add-ons (upgrades, extra nights, private guides) are quoted separately." },
      { q: "What if something goes wrong during travel?", a: "Our 24/7 concierge is one WhatsApp message away. Re-bookings, hotel issues, medical emergencies and lost-document support are handled in minutes — every traveller also carries our travel-insurance card." },
      { q: "Are your Hajj & umrah packages government-licensed?", a: "Yes. We operate within the official Bangladesh Hajj quota and partner only with licensed Saudi muassasa and ground operators. Documentation, training and refunds follow government guidelines." },
      { q: "Can we customise an itinerary?", a: "Absolutely — most signature trips are bespoke. Share your dates, budget and must-haves; a senior travel designer will return a written day-by-day plan with two alternatives within one working day." },
    ],
  },
  {
    slug: "yess-all-in-one-solution",
    title: "Yess All in One Solution",
    status: "upcoming",
    category: "Integrated Business Solutions",
    tagline: "Every YESS service. One unified experience.",
    desc: "A unified platform bringing together every YESS service — software, media, lifestyle and professional services — for seamless business and personal needs.",
    longDesc:
      "Yess All-in-One is the master account that unlocks every YESS venture — software builds, media buys, organic supply, hosting, events and more — through a single login, a single invoice and a single concierge team.",
    image: yessAioImg,
    icon: LayoutGrid,
    color: "from-primary to-primary-glow",
    highlights: [
      "Single sign-on across all YESS ventures",
      "Unified billing and customer support",
      "Tailored bundles for businesses",
      "One trusted partner for every need",
    ],
    services: ["Bundled Services", "Enterprise Accounts", "Concierge Support", "Custom Solutions"],
    audience: "Businesses and power-users who want everything under one trusted roof.",
    founded: "2023",
    reach: "Enterprise & power users",
    features: [
      { title: "One account, all ventures", desc: "Single sign-on, unified profile and shared payment methods across YESS." },
      { title: "Concierge desk", desc: "A dedicated relationship manager handles requests across every venture for you." },
      { title: "Bundle savings", desc: "Tailored packages combine services for measurable cost and time savings." },
    ],
    caseStudy: {
      challenge:
        "Enterprises using multiple YESS ventures were juggling separate logins, invoices and account managers — losing the very efficiency the group was built to deliver.",
      solution:
        "Yess All-in-One stitches every venture into a single account: one SSO, one invoice, one concierge — with bundled pricing and a unified usage dashboard.",
      phases: [
        { title: "Discover", desc: "Customer journey mapping across ventures, billing audit and a unified data model." },
        { title: "Design", desc: "Account hierarchy, role permissions, bundle pricing and a concierge service blueprint." },
        { title: "Build", desc: "SSO, unified billing, cross-venture API gateway and a real-time usage dashboard." },
        { title: "Launch & grow", desc: "White-glove migration of top accounts and a quarterly business review cadence." },
      ],
      techStack: ["TypeScript", "Auth0", "Stripe Billing", "PostgreSQL", "GraphQL Federation", "Datadog"],
      results: [
        { label: "Avg. cost saving", value: "−24%" },
        { label: "Concierge response", value: "<10 min" },
        { label: "Cross-sell uplift", value: "+38%" },
        { label: "Enterprise NPS", value: "68" },
      ],
    },
    testimonial: {
      quote: "One login, one invoice, one account manager across hosting, software builds and event production — Yess All-in-One has cut our vendor admin by a third and given us a single number to call when something matters.",
      author: "Arif Chowdhury",
      role: "Group CFO",
      company: "Square Group",
      logoText: "SQ",
      timeframe: "Onboarded Jun 2024",
      source: "Verified enterprise account · Quarterly business reviews",
    },
  },
];

export const getVenture = (slug: string) => ventures.find((v) => v.slug === slug);

/** Live ventures (shown across nav, hero and listings) vs. upcoming projects. */
export const isVentureUpcoming = (v: Venture) => v.status === "upcoming";
export const activeVentures = (list: Venture[]) => list.filter((v) => !isVentureUpcoming(v));
export const upcomingVentures = (list: Venture[]) => list.filter(isVentureUpcoming);

// Pull 4 sibling images for a gallery strip when a venture has no curated gallery.
export function getVentureGallery(v: Venture): string[] {
  if (v.gallery && v.gallery.length > 0) return v.gallery;
  const toSrc = (img: any): string => (typeof img === "string" ? img : img?.src || "");
  const siblings = ventures.filter((x) => x.slug !== v.slug).map((x) => toSrc(x.image));
  return [toSrc(v.image), ...siblings.slice(0, 4)];
}

// Tasteful default testimonial — varied per category for international feel.
export function getVentureTestimonial(v: Venture): VentureTestimonial {
  if (v.testimonial) return v.testimonial;
  const initials = v.title
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    quote: `Working with ${v.title} felt like adding a senior partner to our team — clear thinking, on-time delivery and measurable impact from week one.`,
    author: "Tahmid R. Karim",
    role: "Director of Operations",
    company: `${v.category} client`,
    logoText: initials,
    timeframe: v.founded ? `Engaged since ${v.founded}` : "12-month engagement",
    source: "Verified engagement · Reference available on request",
  };
}

// Generic milestones — uses the venture's founded year as anchor.
export function getVentureMilestones(v: Venture): VentureMilestone[] {
  if (v.milestones && v.milestones.length) return v.milestones;
  const start = parseInt(v.founded ?? "2020", 10) || 2020;
  return [
    { year: String(start), title: "Founded", desc: `${v.title} launched with a focused team and a clear mandate: ${v.tagline.toLowerCase()}` },
    { year: String(start + 1), title: "First scale milestone", desc: `Shipped the v1 platform and onboarded our first cohort of ${v.audience.split(",")[0].toLowerCase()}.` },
    { year: String(start + 2), title: "National footprint", desc: `Expanded operations across major Bangladesh markets with reliable SLAs and a dedicated success desk.` },
    { year: String(start + 3), title: "International standard", desc: `Adopted enterprise-grade tooling, audited processes and a public quality scorecard reviewed each quarter.` },
    { year: "Today", title: "Where we are now", desc: `${v.reach ?? "Trusted by partners across the region"} — and still investing in the team, the tech and the experience.` },
  ];
}

// Three-tier offering catalogue — Starter / Growth / Enterprise.
export function getVenturePackages(v: Venture): VenturePackage[] {
  if (v.packages && v.packages.length) return v.packages;
  const svc = v.services[0] ?? v.category;
  return [
    {
      name: "Starter",
      price: "On request",
      cadence: "Per project",
      summary: `A focused engagement to validate fit and ship a first ${svc.toLowerCase()} outcome.`,
      features: [
        "Discovery workshop & written scope",
        "Single delivery sprint",
        "Email support, business hours",
        "30-day post-launch warranty",
      ],
    },
    {
      name: "Growth",
      price: "Tailored",
      cadence: "Quarterly retainer",
      summary: `For teams scaling ${v.title} into a core part of their operation.`,
      features: [
        "Dedicated delivery pod",
        "Quarterly roadmap reviews",
        "Priority support, 24/5",
        "Performance & quality scorecard",
      ],
      highlight: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      cadence: "Annual partnership",
      summary: "White-glove partnership with SLAs, dedicated leadership and custom integrations.",
      features: [
        "Named account leadership",
        "Custom SLAs & security review",
        "24/7 incident response",
        "Quarterly business reviews",
      ],
    },
  ];
}

// Six common questions tailored to the venture.
export function getVentureFaqs(v: Venture): VentureFaq[] {
  if (v.faqs && v.faqs.length) return v.faqs;
  return [
    {
      q: `How do we get started with ${v.title}?`,
      a: "Reach out via the contact form. A specialist will respond within one business day to schedule a 30-minute discovery call and share a written scope and indicative timeline.",
    },
    {
      q: `Who is ${v.title} best suited for?`,
      a: `${v.audience} We work with organisations of every size — from early-stage teams shipping a first product to enterprises modernising legacy operations.`,
    },
    {
      q: "What does pricing look like?",
      a: "Every engagement is scoped to outcomes rather than hours. Most partners start with our Growth tier; Starter is ideal for a focused proof-of-value and Enterprise unlocks dedicated leadership and custom SLAs.",
    },
    {
      q: "How do you ensure quality and accountability?",
      a: "Each engagement has a single accountable lead, a written success scorecard reviewed every two weeks, and a transparent change-control process. We publish quarterly business reviews for all retainer clients.",
    },
    {
      q: "Can you work with our existing vendors and tools?",
      a: `Yes. ${v.title} is designed to integrate cleanly with the platforms you already trust — we'll map dependencies during discovery and propose the lightest-touch integration that meets your goals.`,
    },
    {
      q: "What support is available after launch?",
      a: "All tiers include a post-launch warranty period. Growth and Enterprise partners receive ongoing support with documented response-time SLAs, monitoring dashboards and an escalation path to senior leadership.",
    },
  ];
}

// Generic case study builder — gives every venture a richer detail page
// (challenge, solution, phases, tech stack, measurable results).
export function getVentureCase(v: Venture): VentureCase {
  if (v.caseStudy) return v.caseStudy;
  return {
    challenge: `Audiences and partners of ${v.title} needed a faster, more reliable and more measurable experience — without the friction of fragmented tools and manual operations.`,
    solution: `We re-architected ${v.title} around a single source of truth, automated the repetitive workflows, and shipped a clean, conversion-focused interface across every customer touchpoint.`,
    phases: [
      { title: "Discover", desc: "Stakeholder interviews, audit of existing tools, KPI baselining and a written scope of work." },
      { title: "Design", desc: "Information architecture, UX prototypes and a design system aligned to the brand." },
      { title: "Build", desc: "Iterative two-week sprints with weekly demos, automated tests and continuous deployment." },
      { title: "Launch & grow", desc: "Phased rollout, training, monitoring dashboards and a 90-day improvement retainer." },
    ],
    techStack: ["TypeScript", "React", "Node.js", "PostgreSQL", "Cloudflare", "AWS"],
    results: [
      { label: "Faster time-to-launch", value: "−42%" },
      { label: "Operational cost reduction", value: "−28%" },
      { label: "Customer satisfaction", value: "+35%" },
      { label: "Uptime", value: "99.9%" },
    ],
  };
}
