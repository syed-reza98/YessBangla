import {
  Target, Eye, Heart, Users, ShieldCheck, Award, Trophy, Building2, Globe2, Search, PenTool, Rocket, LifeBuoy, Zap,
} from "lucide-react";

export const aboutPillars = [
  {
    slug: "mission",
    icon: Target,
    title: "Our Mission",
    short: "Empower organisations across Bangladesh with strategic consulting and technology that drives measurable growth.",
    long: "Our mission is to be the most accountable consulting and technology partner for ambitious Bangladeshi organisations. We translate strategy into shipped product, measure outcomes in your operating metrics, and stay engaged long after launch. Every engagement is anchored in three commitments: clarity of scope, transparency of progress and ownership of outcomes.",
    pillars: [
      { title: "Strategy with operators", desc: "Senior consultants who have built and run businesses, not just advised them." },
      { title: "Technology with conviction", desc: "Modern, secure architectures built to outlast trends and scale with you." },
      { title: "Measurable outcomes", desc: "Every deliverable tied to a metric that matters to your business." },
    ],
  },
  {
    slug: "vision",
    icon: Eye,
    title: "Our Vision",
    short: "To become the most trusted partner for businesses transitioning into the digital era — locally and globally.",
    long: "We see Bangladesh in the next decade as a digitally-native economy, exporting software, media and services to the world. Our vision is to be the partner of choice for the businesses leading that transition — from family-owned conglomerates digitising their operations to founders building the next generation of platforms.",
    pillars: [
      { title: "Digitally-native Bangladesh", desc: "Helping every sector — from retail to broadcasting — operate digitally end-to-end." },
      { title: "Globally competitive delivery", desc: "Quality and process that meet international benchmarks, delivered from Dhaka." },
      { title: "Long-term partnerships", desc: "Multi-year relationships, not one-off engagements." },
    ],
  },
  {
    slug: "values",
    icon: Heart,
    title: "Our Values",
    short: "Integrity, craftsmanship, customer focus and a relentless pursuit of quality in every engagement.",
    long: "Our values guide every hiring decision, every architecture review and every client conversation. They are not posters on a wall — they are the criteria we use to say yes or no.",
    pillars: [
      { title: "Integrity", desc: "We tell clients what they need to hear, not what they want to hear." },
      { title: "Craftsmanship", desc: "We take pride in code, copy and pixels — the details compound." },
      { title: "Customer focus", desc: "Your operating metrics are our scoreboard." },
      { title: "Quality", desc: "We ship work we are proud to put our name on." },
    ],
  },
];

export const leadership = [
  { name: "Md Enamul Hayder", role: "Managing Director", initials: "EH", bio: "Founder of YESS Bangla with over 15 years of consulting experience across media, retail and government." },
  { name: "Sadia Rahman", role: "Chief Operating Officer", initials: "SR", bio: "Operations leader who has scaled delivery teams from 10 to 100+ across Dhaka and Chattogram." },
  { name: "Arif Khan", role: "Head of Engineering", initials: "AK", bio: "Engineering lead with deep experience in OTT, fintech and large-scale e-commerce platforms." },
  { name: "Mahfuza Akter", role: "Head of Design", initials: "MA", bio: "Product designer with a track record of award-winning interfaces across consumer and enterprise products." },
];

export const methodology = [
  { n: "01", icon: Search, title: "Discover", desc: "Free 30-min discovery call. We map goals, constraints and the metrics that define success — before any proposal is written." },
  { n: "02", icon: PenTool, title: "Design", desc: "Architecture, UX flows and a written proposal with scope, timeline and price within 1–3 business days." },
  { n: "03", icon: Rocket, title: "Deliver", desc: "Two-week sprints with weekly demos. You see real progress, not slideware, every Friday." },
  { n: "04", icon: LifeBuoy, title: "Support", desc: "Warranty period, monitoring and a long-term improvement retainer keep your platform sharp." },
];

export const awards = [
  { icon: Trophy, title: "BASIS Member", desc: "Member of Bangladesh Association of Software & Information Services." },
  { icon: Award, title: "ISO-aligned QMS", desc: "Internal quality processes aligned with ISO 9001 principles." },
  { icon: ShieldCheck, title: "GDPR-aware delivery", desc: "Privacy-by-design for clients with EU and global obligations." },
  { icon: Globe2, title: "Cross-border partner", desc: "Delivery partner for agencies in UK, UAE, Singapore and US." },
  { icon: Building2, title: "Enterprise vendor", desc: "Empanelled with leading banks, telcos and government bodies." },
  { icon: Heart, title: "Best place to work 2024", desc: "Internal recognition for engineering culture & retention." },
];

export const standards = [
  { icon: ShieldCheck, label: "ISO-aligned processes", desc: "Documented processes covering project management, code review, security and incident response." },
  { icon: Award, label: "Quality assured", desc: "Independent QA on every release with test coverage and Core Web Vitals tracked." },
  { icon: Users, label: "Senior-led team", desc: "Every engagement is led by a senior with 8+ years of experience — no junior-only teams." },
  { icon: Globe2, label: "Global delivery", desc: "Working hours that overlap with EU, UK and US clients with clear escalation paths." },
  { icon: Zap, label: "24/5 support", desc: "Standard SLA includes 24/5 support; 24/7 available on managed retainers." },
  { icon: Heart, label: "NPS 60+", desc: "Average client NPS sustained above 60 across the last 12 months." },
];

export const getPillar = (slug: string) => aboutPillars.find((p) => p.slug === slug);
