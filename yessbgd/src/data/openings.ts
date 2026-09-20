export type JobLevel = "Internship" | "Entry" | "Mid" | "Senior" | "Lead";

export type Opening = {
  slug: string;
  title: string;
  type: string;
  location: string;
  dept: string;
  level: JobLevel;
  summary: string;
  responsibilities: string[];
  requirements: string[];
};

export const openings: Opening[] = [
  {
    slug: "senior-full-stack-engineer",
    title: "Senior Full-Stack Engineer",
    type: "Full-time",
    location: "Dhaka / Remote",
    dept: "Engineering",
    level: "Senior",
    summary:
      "Build production-grade web platforms across our OTT, e-commerce and consulting products.",
    responsibilities: [
      "Design and ship features across React, Node and PHP/Laravel stacks.",
      "Own services end-to-end: schema, API, UI, deploy, monitor.",
      "Mentor engineers through code reviews and architecture sessions.",
    ],
    requirements: [
      "5+ years of full-stack experience with TypeScript and a server framework.",
      "Comfort with relational databases, queues and CI/CD.",
      "Strong written and verbal communication in English.",
    ],
  },
  {
    slug: "product-designer",
    title: "Product Designer (UI/UX)",
    type: "Full-time",
    location: "Dhaka",
    dept: "Design",
    level: "Mid",
    summary:
      "Shape the look, feel and interaction model of our consumer and enterprise products.",
    responsibilities: [
      "Lead design for major product surfaces from research to handoff.",
      "Maintain and evolve our design system in Figma.",
      "Partner closely with engineers and PMs throughout delivery.",
    ],
    requirements: [
      "Portfolio of shipped product work across web and mobile.",
      "Fluency in Figma, prototyping and design-system thinking.",
      "Bias for clarity, accessibility and motion.",
    ],
  },
  {
    slug: "business-analyst",
    title: "Business Analyst",
    type: "Full-time",
    location: "Dhaka",
    dept: "Consulting",
    level: "Mid",
    summary:
      "Translate client problems into structured analysis, recommendations and roadmaps.",
    responsibilities: [
      "Run discovery workshops and interviews with client stakeholders.",
      "Build models, dashboards and decks that drive decisions.",
      "Support delivery teams with clear requirements and acceptance criteria.",
    ],
    requirements: [
      "3+ years in consulting, strategy or product analysis.",
      "Strong Excel/Sheets, SQL basics and slide-craft.",
      "Comfort presenting to senior stakeholders.",
    ],
  },
  {
    slug: "digital-marketing-specialist",
    title: "Digital Marketing Specialist",
    type: "Full-time",
    location: "Dhaka / Hybrid",
    dept: "Marketing",
    level: "Mid",
    summary:
      "Plan and execute multi-channel campaigns that grow our brand and ventures.",
    responsibilities: [
      "Run paid campaigns across Meta, Google and emerging channels.",
      "Own SEO, content calendar and email lifecycle programs.",
      "Report on funnel performance with clear next actions.",
    ],
    requirements: [
      "3+ years in performance or growth marketing.",
      "Hands-on with GA4, ad managers and a CMS.",
      "Strong analytical and copywriting skills.",
    ],
  },
  {
    slug: "customer-success-executive",
    title: "Customer Success Executive",
    type: "Full-time",
    location: "Dhaka",
    dept: "Operations",
    level: "Entry",
    summary:
      "Be the trusted partner clients rely on through onboarding, adoption and renewal.",
    responsibilities: [
      "Own a portfolio of accounts and their success plans.",
      "Coordinate with delivery, support and product on client outcomes.",
      "Identify expansion opportunities and reduce churn risk.",
    ],
    requirements: [
      "2+ years in customer success, account management or operations.",
      "Excellent communication and follow-through.",
      "Comfort with CRM tools and basic reporting.",
    ],
  },
  {
    slug: "mobile-engineer-react-native",
    title: "Mobile Engineer (React Native)",
    type: "Full-time",
    location: "Dhaka / Remote",
    dept: "Engineering",
    level: "Mid",
    summary:
      "Ship delightful, performant mobile apps for our consumer ventures across iOS and Android.",
    responsibilities: [
      "Build and maintain cross-platform apps in React Native and TypeScript.",
      "Optimize startup time, memory and frame rate on mid-range devices.",
      "Own release pipelines, crash reporting and OTA updates.",
    ],
    requirements: [
      "3+ years shipping production React Native apps to App Store and Play Store.",
      "Solid grasp of native modules, navigation and offline patterns.",
      "Care for accessibility, localization and edge-case UX.",
    ],
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    type: "Full-time",
    location: "Dhaka / Hybrid",
    dept: "Data",
    level: "Mid",
    summary:
      "Turn raw product, marketing and operations data into decisions leadership can act on.",
    responsibilities: [
      "Build trusted dashboards and self-serve metrics across teams.",
      "Run deep-dive analyses on funnels, retention and unit economics.",
      "Partner with engineering on event tracking and data quality.",
    ],
    requirements: [
      "2+ years in analytics with strong SQL and a BI tool (Looker, Metabase, Power BI).",
      "Working knowledge of Python or R for ad-hoc analysis.",
      "Clear storytelling — charts and narratives non-analysts understand.",
    ],
  },
  {
    slug: "content-strategist",
    title: "Content Strategist",
    type: "Full-time",
    location: "Dhaka / Remote",
    dept: "Marketing",
    level: "Mid",
    summary:
      "Own the editorial voice across our brand, ventures and thought-leadership channels.",
    responsibilities: [
      "Plan and produce long-form articles, case studies and launch narratives.",
      "Brief designers and video producers on supporting assets.",
      "Optimize content for SEO, distribution and lead capture.",
    ],
    requirements: [
      "3+ years in B2B or tech content with published, link-shareable work.",
      "Editorial eye for structure, tone and source quality.",
      "Comfort with CMS workflows and basic on-page SEO.",
    ],
  },
  {
    slug: "finance-operations-associate",
    title: "Finance & Operations Associate",
    type: "Full-time",
    location: "Dhaka",
    dept: "Finance",
    level: "Entry",
    summary:
      "Keep the engine running — billing, vendor payments, reporting and compliance across entities.",
    responsibilities: [
      "Own monthly close, reconciliations and management reporting.",
      "Coordinate with auditors, banks and tax advisors.",
      "Improve internal controls and finance tooling as we scale.",
    ],
    requirements: [
      "2+ years in finance ops, accounting or audit (CA part-qualified a plus).",
      "Strong Excel/Sheets and a modern accounting platform.",
      "High accuracy, discretion and ownership.",
    ],
  },
  {
    slug: "enterprise-sales-manager",
    title: "Enterprise Sales Manager",
    type: "Full-time",
    location: "Dhaka",
    dept: "Sales",
    level: "Senior",
    summary:
      "Lead consultative B2B sales for our consulting, software and platform engagements.",
    responsibilities: [
      "Build a qualified pipeline of mid-market and enterprise accounts.",
      "Run discovery, scoping and proposal cycles end-to-end.",
      "Partner with delivery on smooth handover and account growth.",
    ],
    requirements: [
      "5+ years in B2B sales with a track record of six-figure deals.",
      "Confident speaking with founders, CXOs and procurement.",
      "Disciplined CRM hygiene and forecasting.",
    ],
  },
  {
    slug: "qa-automation-engineer",
    title: "QA Automation Engineer",
    type: "Full-time",
    location: "Dhaka / Remote",
    dept: "Engineering",
    level: "Mid",
    summary:
      "Raise the quality bar across our products with smart manual testing and robust automation.",
    responsibilities: [
      "Design test plans for new features and regression suites.",
      "Build and maintain end-to-end automation (Playwright or Cypress).",
      "Triage production issues with clear, reproducible reports.",
    ],
    requirements: [
      "3+ years in QA with both manual and automation experience.",
      "Solid understanding of REST APIs, browser dev tools and Git.",
      "Bonus: performance testing or mobile QA exposure.",
    ],
  },
  {
    slug: "graphic-motion-designer",
    title: "Graphic & Motion Designer",
    type: "Full-time",
    location: "Dhaka",
    dept: "Design",
    level: "Mid",
    summary:
      "Craft on-brand visuals and short-form motion for campaigns, social and product launches.",
    responsibilities: [
      "Design key visuals, social creatives and pitch decks.",
      "Produce short motion pieces in After Effects or equivalent.",
      "Steward brand consistency across teams and partners.",
    ],
    requirements: [
      "Portfolio with both static and motion work.",
      "Fluency in Figma plus Adobe CC (Illustrator, Photoshop, After Effects).",
      "Strong typography, layout and timing instincts.",
    ],
  },
  {
    slug: "hr-people-operations-lead",
    title: "HR & People Operations Lead",
    type: "Full-time",
    location: "Dhaka",
    dept: "People",
    level: "Lead",
    summary:
      "Build the systems, rituals and culture that help a high-performing team do their best work.",
    responsibilities: [
      "Own end-to-end recruiting, onboarding and performance cycles.",
      "Partner with leaders on org design, comp bands and progression.",
      "Champion learning, well-being and an inclusive workplace.",
    ],
    requirements: [
      "5+ years in HR or people ops, ideally in tech or services.",
      "Working knowledge of Bangladesh labour law and HRIS tools.",
      "Empathetic communicator with strong judgment.",
    ],
  },
  {
    slug: "devops-cloud-engineer",
    title: "DevOps / Cloud Engineer",
    type: "Full-time",
    location: "Dhaka / Remote",
    dept: "Engineering",
    level: "Senior",
    summary:
      "Own the platform our engineers ship on — reliable, secure and cost-aware by default.",
    responsibilities: [
      "Manage CI/CD, infrastructure-as-code and environment parity.",
      "Run observability: logs, metrics, alerts and incident response.",
      "Harden security posture across cloud accounts and secrets.",
    ],
    requirements: [
      "4+ years with AWS, GCP or Azure in production.",
      "Hands-on with Docker, Terraform and a major CI system.",
      "On-call mindset with a bias for automation.",
    ],
  },
  {
    slug: "engineering-internship",
    title: "Engineering Internship (6 months)",
    type: "Internship",
    location: "Dhaka",
    dept: "Engineering",
    level: "Internship",
    summary:
      "A paid, structured internship for final-year students or recent grads ready to ship real product work.",
    responsibilities: [
      "Pair with senior engineers on live features and bug fixes.",
      "Write tests, docs and small services from day one.",
      "Present learnings in weekly engineering reviews.",
    ],
    requirements: [
      "Strong fundamentals in JavaScript/TypeScript or Python.",
      "Familiarity with Git and at least one web framework.",
      "Curiosity, ownership and openness to feedback.",
    ],
  },
  {
    slug: "brand-promoter",
    title: "Brand Promoter",
    type: "Part-time",
    location: "Dhaka / Field",
    dept: "Marketing",
    level: "Entry",
    summary:
      "Be the friendly face of YESS Bangla at activations, campuses and partner events — drive awareness, sign-ups and conversations.",
    responsibilities: [
      "Represent the brand at on-ground activations, campuses and pop-ups.",
      "Engage prospects, demo our products and capture qualified leads.",
      "Report daily activity, learnings and field feedback to the marketing team.",
    ],
    requirements: [
      "Confident, friendly communicator in Bangla and English.",
      "Comfortable on your feet for full-day events; flexible weekends.",
      "Bonus: prior promotion, sales-floor or campus ambassador experience.",
    ],
  },
];

export function getOpening(slug: string): Opening | undefined {
  return openings.find((o) => o.slug === slug);
}
