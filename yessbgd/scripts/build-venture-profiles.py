"""
Yess Bangla — per-venture Project Profile generator (EN + BN).

Builds an international-quality A4 project profile PDF for each ACTIVE
venture, in two editions:

* English  -> public/profiles/{slug}-profile.pdf      (ReportLab, letterhead bg)
* Bangla   -> public/profiles/{slug}-profile-bn.pdf   (HTML -> headless Chromium,
                                                       Noto Sans Bengali shaping)

Content mirrors src/data/ventures.ts for the eight live ventures:
Shondhaan, Yess Organic Haat, Yess Soft, Akash OTT, The Daily Akash,
Yess Legal Advice, Yess Host, Yess Event.
"""
from __future__ import annotations
import datetime
import json
import os
import tempfile

PUBLIC = "/dev-server/public"
OUT_DIR = f"{PUBLIC}/profiles"
LETTERHEAD = f"{PUBLIC}/yess-bangla-letterhead.jpeg"

with open("/dev-server/src/data/company-contact.json", encoding="utf-8") as _f:
    CONTACT = json.load(_f)
PHONE = CONTACT["phone"]["display"]
EMAIL = CONTACT["email"]
WEB = CONTACT["web"]
OFFICE = CONTACT["office"]
CORP = CONTACT["corporateOffice"]

VERSION = "v1.0"
_today = datetime.date.today()
GENERATED = _today.strftime("%d %B %Y")
BN_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
             "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"]


def bn_digits(s: str) -> str:
    return str(s).translate(str.maketrans("0123456789", "০১২৩৪৫৬৭৮৯"))


GENERATED_BN = f"{bn_digits(_today.day)} {BN_MONTHS[_today.month - 1]} {bn_digits(_today.year)}"

# ---------------------------------------------------------------------------
# Shared i18n labels
# ---------------------------------------------------------------------------
EN_L = {
    "edition": "International English Edition",
    "confidential": "Confidential · For intended recipient",
    "at_glance": "At a glance",
    "founded": "Founded",
    "reach": "Reach",
    "web_label": "Web",
    "parent": "Parent group",
    "category": "Category",
    "audience": "Audience",
    "sections": [
        ("Overview", "The venture"),
        ("Highlights", "What we deliver"),
        ("Services", "Offerings"),
        ("Signature strengths", "Why clients choose us"),
        ("In practice", "Case study"),
        ("Capabilities & stack", "Tooling"),
        ("Measured outcomes", "Results"),
        ("Client voice", "Testimonial"),
        ("Talk to us", "Next steps"),
    ],
    "challenge": "Challenge",
    "solution": "Our solution",
    "phases": "Delivery phases",
    "talk": ("Reach out to our enterprise desk for a tailored proposal, references "
             "on request, and NDA-ready discovery."),
    "doc_label": "Project Profile",
    "group": "Yess Bangla Private Limited",
    "page": "Page",
}
BN_L = {
    "edition": "বাংলা সংস্করণ",
    "confidential": "গোপনীয় · প্রাপকের জন্য",
    "at_glance": "এক নজরে",
    "founded": "প্রতিষ্ঠা",
    "reach": "ব্যাপ্তি",
    "web_label": "ওয়েব",
    "parent": "মূল গ্রুপ",
    "category": "খাত",
    "audience": "লক্ষ্য গ্রাহক",
    "sections": [
        ("সংক্ষিপ্ত বিবরণ", "ভেঞ্চার পরিচিতি"),
        ("মূল বৈশিষ্ট্য", "আমরা যা দিই"),
        ("সেবাসমূহ", "অফার"),
        ("স্বাতন্ত্র্য", "ক্লায়েন্টরা কেন আমাদের বেছে নেয়"),
        ("বাস্তব প্রয়োগ", "কেস স্টাডি"),
        ("সক্ষমতা ও প্রযুক্তি", "টুলিং"),
        ("পরিমাপযোগ্য ফলাফল", "ফলাফল"),
        ("ক্লায়েন্টের মতামত", "সাক্ষ্য"),
        ("যোগাযোগ করুন", "পরবর্তী পদক্ষেপ"),
    ],
    "challenge": "চ্যালেঞ্জ",
    "solution": "আমাদের সমাধান",
    "phases": "বাস্তবায়নের ধাপ",
    "talk": ("কাস্টমাইজড প্রস্তাব, অনুরোধে রেফারেন্স এবং এনডিএ-প্রস্তুত "
             "আলোচনার জন্য আমাদের এন্টারপ্রাইজ ডেস্কে যোগাযোগ করুন।"),
    "doc_label": "প্রজেক্ট প্রোফাইল",
    "group": "ইয়েস বাংলা প্রাইভেট লিমিটেড",
    "page": "পৃষ্ঠা",
}

# ---------------------------------------------------------------------------
# Venture content — EN mirrors src/data/ventures.ts; BN is its translation.
# ---------------------------------------------------------------------------
VENTURES = [
    {
        "slug": "yess-service",
        "order": 1,
        "en": {
            "title": "Shondhaan",
            "category": "Home & Professional Services",
            "tagline": "Trusted experts, just a tap away.",
            "overview": ("Shondhaan brings the country's best home and professional service "
                         "providers onto a single, dependable booking platform. Every technician "
                         "is background-checked, trained and rated by customers — with a written "
                         "service guarantee on every job."),
            "highlights": [
                "Home repair, cleaning and maintenance",
                "Vetted, background-checked professionals",
                "Transparent pricing and instant booking",
                "Service guarantee on every job",
            ],
            "services": ["Home Repair", "Deep Cleaning", "AC & Appliance Service",
                         "Professional Consultation"],
            "audience": "Homeowners, tenants and businesses needing reliable on-demand services.",
            "founded": "2022",
            "reach": "Dhaka, Chittagong, Sylhet",
            "domain": "shondhaan.com",
            "features": [
                ("Vetted professionals", "ID checks, skill assessments and ongoing training on safety and etiquette."),
                ("Upfront pricing", "See the price before you book — no surprises, no haggling, no hidden fees."),
                ("Service guarantee", "If you're not satisfied, we send a second professional or refund — your call."),
            ],
            "challenge": ("Booking a trustworthy electrician, AC tech or deep-cleaner meant scrolling "
                          "Facebook groups and praying — pricing was opaque and quality wildly inconsistent."),
            "solution": ("Shondhaan launched an instant-booking app with vetted, in-house-trained "
                         "professionals, upfront pricing and a written satisfaction guarantee on every job."),
            "phases": [
                ("Discover", "Customer & technician interviews, complaint mining and a service-catalogue blueprint."),
                ("Design", "3-tap booking flow, transparent price cards, live ETA and a post-job rating loop."),
                ("Build", "Customer + pro apps, dispatch engine, payments, training LMS and a QA dashboard."),
                ("Launch & grow", "Pilot in 3 zones, weekly NPS reviews and a re-training programme for low-rated pros."),
            ],
            "stack": ["React Native", "Node.js", "PostgreSQL", "Mapbox", "bKash", "Stripe"],
            "results": [
                ("Avg. arrival time", "47 min"),
                ("Customer NPS", "72"),
                ("Repeat bookings", "61%"),
                ("Pros onboarded", "1,200+"),
            ],
            "quote": ("We manage 140 apartments across Dhaka and Shondhaan is now our default for AC, "
                      "plumbing and deep-clean. Upfront pricing and the satisfaction guarantee ended the "
                      "haggling — and the complaints."),
            "quote_by": "Tanvir Ahmed · Operations Director, Bproperty Facilities",
        },
        "bn": {
            "title": "সন্ধান",
            "category": "হোম ও পেশাদার সেবা",
            "tagline": "বিশ্বস্ত বিশেষজ্ঞ, মাত্র এক ট্যাপ দূরে।",
            "overview": ("সন্ধান দেশের সেরা হোম ও পেশাদার সেবা প্রদানকারীদের একটি নির্ভরযোগ্য বুকিং "
                         "প্ল্যাটফর্মে একত্রিত করে। প্রতিটি টেকনিশিয়ান ব্যাকগ্রাউন্ড-চেককৃত, প্রশিক্ষিত "
                         "এবং গ্রাহকদের দ্বারা রেটেড — প্রতিটি কাজে লিখিত সেবা গ্যারান্টিসহ।"),
            "highlights": [
                "হোম রিপেয়ার, ক্লিনিং ও রক্ষণাবেক্ষণ",
                "যাচাইকৃত, ব্যাকগ্রাউন্ড-চেককৃত পেশাদার",
                "স্বচ্ছ মূল্য ও তাৎক্ষণিক বুকিং",
                "প্রতিটি কাজে সেবা গ্যারান্টি",
            ],
            "services": ["হোম রিপেয়ার", "ডিপ ক্লিনিং", "এসি ও অ্যাপ্লায়েন্স সার্ভিস",
                         "পেশাদার পরামর্শ"],
            "audience": "নির্ভরযোগ্য অন-ডিম্যান্ড সেবা প্রয়োজন এমন বাড়ির মালিক, ভাড়াটিয়া ও ব্যবসা প্রতিষ্ঠান।",
            "founded": "২০২২",
            "reach": "ঢাকা, চট্টগ্রাম, সিলেট",
            "domain": "shondhaan.com",
            "features": [
                ("যাচাইকৃত পেশাদার", "পরিচয় যাচাই, দক্ষতা মূল্যায়ন এবং নিরাপত্তা ও শিষ্টাচার বিষয়ে ধারাবাহিক প্রশিক্ষণ।"),
                ("আগাম মূল্য", "বুক করার আগেই মূল্য দেখুন — কোনো চমক নেই, দর-কষাকষি নেই, লুকানো ফি নেই।"),
                ("সেবা গ্যারান্টি", "সন্তুষ্ট না হলে আমরা দ্বিতীয় পেশাদার পাঠাই অথবা রিফান্ড দিই — সিদ্ধান্ত আপনার।"),
            ],
            "challenge": ("বিশ্বস্ত ইলেকট্রিশিয়ান, এসি টেকনিশিয়ান বা ডিপ-ক্লিনার বুক করতে হলে ফেসবুক "
                          "গ্রুপ ঘাঁটতে হতো আর ভাগ্যের ওপর ভরসা করতে হতো — মূল্য ছিল অস্বচ্ছ আর মান ছিল অসামঞ্জস্যপূর্ণ।"),
            "solution": ("সন্ধান চালু করেছে তাৎক্ষণিক-বুকিং অ্যাপ — যাচাইকৃত ও অভ্যন্তরীণভাবে প্রশিক্ষিত "
                         "পেশাদার, আগাম মূল্য এবং প্রতিটি কাজে লিখিত সন্তুষ্টি গ্যারান্টিসহ।"),
            "phases": [
                ("আবিষ্কার", "গ্রাহক ও টেকনিশিয়ান ইন্টারভিউ, অভিযোগ বিশ্লেষণ এবং সেবা-ক্যাটালগ ব্লুপ্রিন্ট।"),
                ("নকশা", "৩-ট্যাপ বুকিং ফ্লো, স্বচ্ছ মূল্য কার্ড, লাইভ ইটিএ ও কাজ-পরবর্তী রেটিং লুপ।"),
                ("নির্মাণ", "গ্রাহক ও প্রো অ্যাপ, ডিসপ্যাচ ইঞ্জিন, পেমেন্ট, প্রশিক্ষণ এলএমএস ও কিউএ ড্যাশবোর্ড।"),
                ("লঞ্চ ও প্রবৃদ্ধি", "৩টি জোনে পাইলট, সাপ্তাহিক এনপিএস পর্যালোচনা ও নিম্ন-রেটেড প্রোদের পুনঃপ্রশিক্ষণ কর্মসূচি।"),
            ],
            "stack": ["React Native", "Node.js", "PostgreSQL", "Mapbox", "bKash", "Stripe"],
            "results": [
                ("গড় আগমনের সময়", "৪৭ মিনিট"),
                ("গ্রাহক এনপিএস", "৭২"),
                ("পুনরায় বুকিং", "৬১%"),
                ("অনবোর্ডেড প্রো", "১,২০০+"),
            ],
            "quote": ("আমরা ঢাকাজুড়ে ১৪০টি অ্যাপার্টমেন্ট পরিচালনা করি এবং এসি, প্লাম্বিং ও ডিপ-ক্লিনের "
                      "জন্য সন্ধান এখন আমাদের ডিফল্ট। আগাম মূল্য ও সন্তুষ্টি গ্যারান্টি দর-কষাকষি — "
                      "এবং অভিযোগ — দুটোই শেষ করে দিয়েছে।"),
            "quote_by": "তানভীর আহমেদ · অপারেশনস ডিরেক্টর, বিপ্রপার্টি ফ্যাসিলিটিজ",
        },
    },
    {
        "slug": "yess-organic-haat",
        "order": 2,
        "en": {
            "title": "Yess Organic Haat",
            "category": "Organic Marketplace",
            "tagline": "Pure. Local. Delivered to your door.",
            "overview": ("Yess Organic Haat is a farm-to-fork marketplace that connects verified "
                         "Bangladeshi farmers directly to urban households. Cold-chain logistics, "
                         "lab-tested produce and a transparent grading system mean what you order is "
                         "what arrives — fresh, traceable and fair to the grower."),
            "highlights": [
                "Verified organic produce and groceries",
                "Direct sourcing from local farmers",
                "Cold-chain logistics and quality control",
                "Subscription and one-time delivery",
            ],
            "services": ["Fresh Produce", "Pantry & Groceries", "Wellness Products", "Corporate Supply"],
            "audience": "Health-conscious households, restaurants and corporate offices.",
            "founded": "2021",
            "reach": "200+ partner farms",
            "domain": "organichaat.top",
            "features": [
                ("Lab-tested produce", "Random batch testing for pesticides and heavy metals at an accredited lab."),
                ("Fair-trade pricing", "Farmers receive a published floor price plus a quality bonus on every harvest."),
                ("Cold-chain delivery", "Temperature-controlled vans and same-day fulfilment across major cities."),
            ],
            "challenge": ("Urban families wanted truly organic groceries but couldn't trust the labels — "
                          "and small farmers had no fair route to high-value urban buyers."),
            "solution": ("We built a verified-supplier marketplace with lab testing, cold-chain logistics "
                         "and a transparent grading & pricing system that protects both shopper and farmer."),
            "phases": [
                ("Discover", "On-farm visits across 6 districts, soil and supply audits and a household demand study."),
                ("Design", "Trust-first storefront, traceability cards on each product and a subscription flow."),
                ("Build", "Marketplace, route-optimised cold-chain ops, lab integration and a farmer-payout module."),
                ("Launch & grow", "Pilot in 3 zones, weekly farmer onboarding and SLA-driven delivery scale-up."),
            ],
            "stack": ["Next.js", "Supabase", "Mapbox", "Stripe", "Twilio", "Cloudflare R2"],
            "results": [
                ("Partner farms", "200+"),
                ("On-time delivery", "98.6%"),
                ("Avg. farmer income", "+34%"),
                ("Subscription retention", "71%"),
            ],
            "quote": ("Yess Organic Haat is the only supplier that gives us lab reports with every batch. "
                      "Our pantry team has cut audit time by 60% and our chefs finally trust the 'organic' "
                      "label on the box."),
            "quote_by": "Farzana Rahman · Group Procurement Lead, Le Méridien Dhaka",
        },
        "bn": {
            "title": "ইয়েস অর্গানিক হাট",
            "category": "অর্গানিক মার্কেটপ্লেস",
            "tagline": "বিশুদ্ধ। স্থানীয়। আপনার দরজায় পৌঁছে যায়।",
            "overview": ("ইয়েস অর্গানিক হাট একটি খামার-থেকে-থালা মার্কেটপ্লেস, যা যাচাইকৃত বাংলাদেশি "
                         "কৃষকদের সরাসরি শহুরে পরিবারের সঙ্গে সংযুক্ত করে। কোল্ড-চেইন লজিস্টিকস, "
                         "ল্যাব-টেস্টকৃত পণ্য ও স্বচ্ছ গ্রেডিং ব্যবস্থা নিশ্চিত করে যা অর্ডার করেন তাই "
                         "পৌঁছে যায় — তাজা, ট্রেসযোগ্য এবং উৎপাদকের জন্য ন্যায্য।"),
            "highlights": [
                "যাচাইকৃত অর্গানিক উৎপাদন ও মুদি পণ্য",
                "স্থানীয় কৃষকদের কাছ থেকে সরাসরি সংগ্রহ",
                "কোল্ড-চেইন লজিস্টিকস ও মান নিয়ন্ত্রণ",
                "সাবস্ক্রিপশন ও এককালীন ডেলিভারি",
            ],
            "services": ["তাজা উৎপাদন", "প্যান্ট্রি ও মুদি", "সুস্থতা পণ্য", "কর্পোরেট সরবরাহ"],
            "audience": "স্বাস্থ্যসচেতন পরিবার, রেস্তোরাঁ ও কর্পোরেট অফিস।",
            "founded": "২০২১",
            "reach": "২০০+ পার্টনার খামার",
            "domain": "organichaat.top",
            "features": [
                ("ল্যাব-টেস্টকৃত পণ্য", "স্বীকৃত ল্যাবে কীটনাশক ও ভারী ধাতুর জন্য এলোমেলো ব্যাচ পরীক্ষা।"),
                ("ন্যায্য-বাণিজ্য মূল্য", "প্রতিটি ফসলে কৃষকরা পান প্রকাশিত সর্বনিম্ন মূল্য ও মান বোনাস।"),
                ("কোল্ড-চেইন ডেলিভারি", "তাপমাত্রা-নিয়ন্ত্রিত ভ্যান ও প্রধান শহরগুলোতে একই দিনে ডেলিভারি।"),
            ],
            "challenge": ("শহুরে পরিবারগুলো সত্যিকারের অর্গানিক মুদি চেয়েছিল কিন্তু লেবেল বিশ্বাস করতে "
                          "পারছিল না — আর ক্ষুদ্র কৃষকদের উচ্চ-মূল্যের শহুরে ক্রেতাদের কাছে পৌঁছানোর ন্যায্য পথ ছিল না।"),
            "solution": ("আমরা তৈরি করেছি যাচাইকৃত-সরবরাহকারী মার্কেটপ্লেস — ল্যাব টেস্টিং, কোল্ড-চেইন "
                         "লজিস্টিকস এবং স্বচ্ছ গ্রেডিং ও মূল্য ব্যবস্থাসহ, যা ক্রেতা ও কৃষক উভয়কেই রক্ষা করে।"),
            "phases": [
                ("আবিষ্কার", "৬টি জেলায় খামার পরিদর্শন, মাটি ও সরবরাহ অডিট এবং পরিবার চাহিদা গবেষণা।"),
                ("নকশা", "আস্থা-প্রথম স্টোরফ্রন্ট, প্রতিটি পণ্যে ট্রেসেবিলিটি কার্ড ও সাবস্ক্রিপশন ফ্লো।"),
                ("নির্মাণ", "মার্কেটপ্লেস, রুট-অপ্টিমাইজড কোল্ড-চেইন অপারেশন, ল্যাব ইন্টিগ্রেশন ও কৃষক-পেআউট মডিউল।"),
                ("লঞ্চ ও প্রবৃদ্ধি", "৩টি জোনে পাইলট, সাপ্তাহিক কৃষক অনবোর্ডিং ও এসএলএ-চালিত ডেলিভারি সম্প্রসারণ।"),
            ],
            "stack": ["Next.js", "Supabase", "Mapbox", "Stripe", "Twilio", "Cloudflare R2"],
            "results": [
                ("পার্টনার খামার", "২০০+"),
                ("সময়মতো ডেলিভারি", "৯৮.৬%"),
                ("কৃষকের গড় আয়", "+৩৪%"),
                ("সাবস্ক্রিপশন রিটেনশন", "৭১%"),
            ],
            "quote": ("ইয়েস অর্গানিক হাট একমাত্র সরবরাহকারী যারা প্রতিটি ব্যাচের সঙ্গে ল্যাব রিপোর্ট দেয়। "
                      "আমাদের প্যান্ট্রি টিম অডিট সময় ৬০% কমিয়েছে এবং আমাদের শেফরা অবশেষে বাক্সের "
                      "'অর্গানিক' লেবেলটি বিশ্বাস করেন।"),
            "quote_by": "ফারজানা রহমান · গ্রুপ প্রকিউরমেন্ট লিড, ল্য মেরিদিয়েন ঢাকা",
        },
    },
    {
        "slug": "yess-soft",
        "order": 3,
        "en": {
            "title": "Yess Soft",
            "category": "Software & IT Solutions",
            "tagline": "Engineering software that scales with your ambition.",
            "overview": ("Yess Soft is the engineering core of the YESS Bangla group — a product studio "
                         "that ships secure, observable, cloud-native software for ambitious teams. From "
                         "single-screen MVPs to multi-tenant ERP platforms, every release is built with "
                         "TypeScript, automated tests, and a relentless focus on time-to-value."),
            "highlights": [
                "Web & mobile application development",
                "ERP, CRM & inventory management systems",
                "UI/UX design and product strategy",
                "Cloud-native, secure and scalable architectures",
            ],
            "services": ["Web Development", "Mobile Apps", "ERP Systems", "Cloud Solutions", "UI/UX Design"],
            "audience": "Startups, SMEs, enterprises and government agencies seeking digital transformation.",
            "founded": "2018",
            "reach": "Clients across BD, UAE & UK",
            "domain": "yessbangla.top",
            "features": [
                ("Senior-only delivery pods", "Every project is led by a tech lead, designer and PM — no hand-offs."),
                ("Production-ready in 90 days", "Discovery, design and a working v1 inside a single quarter."),
                ("Long-term partnership", "Quarterly roadmap reviews, dedicated success manager and 24/5 support."),
            ],
            "challenge": ("A national distributor was running 11 disconnected spreadsheets and three legacy "
                          "desktop apps — orders were being missed, inventory was wrong by 18%, and finance "
                          "closed the books two weeks late."),
            "solution": ("Yess Soft replaced the legacy stack with a single multi-tenant ERP — orders, "
                         "inventory, fleet and finance — wired into a real-time analytics layer and mobile "
                         "apps for the field team."),
            "phases": [
                ("Discover", "Process mapping with 14 stakeholders, KPI baselining and an executive scorecard."),
                ("Design", "Role-based UX, design system and clickable prototype validated with end-users."),
                ("Build", "Two-week sprints, automated test suite, weekly demos and zero-downtime deploys."),
                ("Launch & grow", "Phased rollout across 7 depots, training videos and a 90-day improvement retainer."),
            ],
            "stack": ["TypeScript", "React", "Node.js", "PostgreSQL", "Redis", "AWS", "Cloudflare"],
            "results": [
                ("Inventory accuracy", "99.4%"),
                ("Order cycle time", "−61%"),
                ("Finance close", "3 days"),
                ("Uptime", "99.97%"),
            ],
            "quote": ("Yess Soft replaced eleven spreadsheets and three legacy apps with one ERP. Our depots "
                      "now close the books in three days instead of two weeks — and our field team finally "
                      "trusts the inventory numbers."),
            "quote_by": "Sharif Anwar · Chief Operating Officer, Meghna Distribution Ltd.",
        },
        "bn": {
            "title": "ইয়েস সফট",
            "category": "সফটওয়্যার ও আইটি সমাধান",
            "tagline": "আপনার উচ্চাকাঙ্ক্ষার সঙ্গে তাল মিলিয়ে এগিয়ে চলা সফটওয়্যার প্রকৌশল।",
            "overview": ("ইয়েস সফট ইয়েস বাংলা গ্রুপের প্রকৌশল প্রাণ — একটি প্রোডাক্ট স্টুডিও যা "
                         "উচ্চাকাঙ্ক্ষী দলগুলোর জন্য নিরাপদ, পর্যবেক্ষণযোগ্য, ক্লাউড-নেটিভ সফটওয়্যার "
                         "তৈরি করে। এক-স্ক্রিনের এমভিপি থেকে মাল্টি-টেন্যান্ট ইআরপি প্ল্যাটফর্ম পর্যন্ত "
                         "প্রতিটি রিলিজ তৈরি হয় টাইপস্ক্রিপ্ট, স্বয়ংক্রিয় টেস্ট এবং দ্রুত মূল্য পৌঁছে "
                         "দেওয়ার অটল মনোযোগ নিয়ে।"),
            "highlights": [
                "ওয়েব ও মোবাইল অ্যাপ্লিকেশন ডেভেলপমেন্ট",
                "ইআরপি, সিআরএম ও ইনভেন্টরি ম্যানেজমেন্ট সিস্টেম",
                "ইউআই/ইউএক্স ডিজাইন ও প্রোডাক্ট কৌশল",
                "ক্লাউড-নেটিভ, নিরাপদ ও স্কেলেবল আর্কিটেকচার",
            ],
            "services": ["ওয়েব ডেভেলপমেন্ট", "মোবাইল অ্যাপ", "ইআরপি সিস্টেম", "ক্লাউড সমাধান", "ইউআই/ইউএক্স ডিজাইন"],
            "audience": "ডিজিটাল রূপান্তর প্রত্যাশী স্টার্টআপ, এসএমই, এন্টারপ্রাইজ ও সরকারি সংস্থা।",
            "founded": "২০১৮",
            "reach": "বাংলাদেশ, সংযুক্ত আরব আমিরাত ও যুক্তরাজ্যজুড়ে ক্লায়েন্ট",
            "domain": "yessbangla.top",
            "features": [
                ("সিনিয়র-অনলি ডেলিভারি পড", "প্রতিটি প্রকল্প পরিচালনা করেন একজন টেক লিড, ডিজাইনার ও প্রজেক্ট ম্যানেজার — কোনো হ্যান্ড-অফ নেই।"),
                ("৯০ দিনে প্রোডাকশন-রেডি", "একটিমাত্র কোয়ার্টারের মধ্যে ডিসকভারি, ডিজাইন ও কার্যকর প্রথম সংস্করণ।"),
                ("দীর্ঘমেয়াদি অংশীদারিত্ব", "ত্রৈমাসিক রোডম্যাপ পর্যালোচনা, নিবেদিত সাকসেস ম্যানেজার ও ২৪/৫ সহায়তা।"),
            ],
            "challenge": ("একটি জাতীয় ডিস্ট্রিবিউটর ১১টি বিচ্ছিন্ন স্প্রেডশিট ও তিনটি লিগ্যাসি ডেস্কটপ অ্যাপে "
                          "কাজ করছিল — অর্ডার হারিয়ে যাচ্ছিল, ইনভেন্টরি ১৮% ভুল ছিল, আর অর্থ বিভাগের হিসাব "
                          "সমাপ্ত হতে লাগত দুই সপ্তাহ।"),
            "solution": ("ইয়েস সফট লিগ্যাসি স্ট্যাক প্রতিস্থাপন করেছে একটি একক মাল্টি-টেন্যান্ট ইআরপি দিয়ে — "
                         "অর্ডার, ইনভেন্টরি, ফ্লিট ও ফাইন্যান্স — রিয়েল-টাইম অ্যানালিটিক্স লেয়ার ও ফিল্ড টিমের "
                         "জন্য মোবাইল অ্যাপসহ।"),
            "phases": [
                ("আবিষ্কার", "১৪ জন স্টেকহোল্ডারের সঙ্গে প্রক্রিয়া ম্যাপিং, কেপিআই বেসলাইনিং ও নির্বাহী স্কোরকার্ড।"),
                ("নকশা", "ভূমিকাভিত্তিক ইউএক্স, ডিজাইন সিস্টেম ও শেষ ব্যবহারকারীদের সঙ্গে যাচাইকৃত ক্লিকযোগ্য প্রোটোটাইপ।"),
                ("নির্মাণ", "দুই সপ্তাহের স্প্রিন্ট, স্বয়ংক্রিয় টেস্ট স্যুট, সাপ্তাহিক ডেমো ও জিরো-ডাউনটাইম ডিপ্লয়।"),
                ("লঞ্চ ও প্রবৃদ্ধি", "৭টি ডিপোতে ধাপে ধাপে রোলআউট, প্রশিক্ষণ ভিডিও ও ৯০ দিনের উন্নয়ন রিটেইনার।"),
            ],
            "stack": ["TypeScript", "React", "Node.js", "PostgreSQL", "Redis", "AWS", "Cloudflare"],
            "results": [
                ("ইনভেন্টরি নির্ভুলতা", "৯৯.৪%"),
                ("অর্ডার চক্রের সময়", "−৬১%"),
                ("হিসাব সমাপ্তি", "৩ দিন"),
                ("আপটাইম", "৯৯.৯৭%"),
            ],
            "quote": ("ইয়েস সফট এগারোটি স্প্রেডশিট ও তিনটি লিগ্যাসি অ্যাপ প্রতিস্থাপন করেছে একটি ইআরপি দিয়ে। "
                      "আমাদের ডিপোগুলো এখন দুই সপ্তাহের বদলে তিন দিনে হিসাব সমাপ্ত করে — এবং আমাদের ফিল্ড টিম "
                      "অবশেষে ইনভেন্টরির সংখ্যাগুলো বিশ্বাস করে।"),
            "quote_by": "শরিফ আনোয়ার · চীফ অপারেটিং অফিসার, মেঘনা ডিস্ট্রিবিউশন লি.",
        },
    },
    {
        "slug": "akash-ott",
        "order": 4,
        "en": {
            "title": "Akash OTT",
            "category": "Streaming Platform",
            "tagline": "Your favourite shows, anytime — on any screen.",
            "overview": ("Akash OTT is the digital home for Bangla storytelling — feature films, web series, "
                         "live TV simulcasts and exclusive premieres, available on mobile, web and smart TV "
                         "with personalised recommendations and offline downloads."),
            "highlights": [
                "On-demand films, series and originals",
                "Live TV streaming across devices",
                "Personalised recommendations",
                "Multi-device support — mobile, web, smart TV",
            ],
            "services": ["Subscription Streaming", "Original Content", "Live TV", "Brand Partnerships"],
            "audience": "Households, content fans and brands seeking digital reach.",
            "founded": "2022",
            "reach": "Available in 40+ countries",
            "domain": "akash.tv",
            "features": [
                ("Adaptive streaming", "DRM-protected delivery from 144p to 4K with sub-2s start times."),
                ("Originals studio", "A pipeline of platform-exclusive series and films across genres."),
                ("Smart discovery", "ML-driven recommendations, watch-party mode and continue-watching across devices."),
            ],
            "challenge": ("Bangla-speaking audiences worldwide were stitching together piracy sites, social "
                          "clips and regional apps — there was no premium, legal, mobile-first home for "
                          "Bangla content."),
            "solution": ("Akash OTT shipped a DRM-protected, multi-CDN streaming platform with a curated "
                         "library, exclusive originals and a recommendation engine tuned for Bangla viewing "
                         "patterns."),
            "phases": [
                ("Discover", "Diaspora research across 6 markets, content licensing audit and a pricing study."),
                ("Design", "Cross-device UX (mobile, web, smart TV) with offline-first flows and family profiles."),
                ("Build", "Multi-CDN delivery, Widevine/FairPlay DRM, payments in BDT/USD/AED and analytics."),
                ("Launch & grow", "Hero original premiere, performance marketing in 12 markets and weekly cohort tuning."),
            ],
            "stack": ["React Native", "Next.js", "Shaka Player", "AWS MediaConvert", "Cloudflare Stream", "Stripe"],
            "results": [
                ("Countries served", "40+"),
                ("Avg. start time", "1.6s"),
                ("Day-30 retention", "48%"),
                ("Originals shipped", "20+"),
            ],
            "quote": ("We premiered our feature on Akash OTT and saw 1.4M unique viewers in the first ten "
                      "days — across Bangladesh, the Gulf and the UK. Their distribution and DRM stack "
                      "just works."),
            "quote_by": "Imran Hossain · Executive Producer, Goldfish Films",
        },
        "bn": {
            "title": "আকাশ ওটিটি",
            "category": "স্ট্রিমিং প্ল্যাটফর্ম",
            "tagline": "আপনার প্রিয় অনুষ্ঠান, যেকোনো সময় — যেকোনো স্ক্রিনে।",
            "overview": ("আকাশ ওটিটি বাংলা গল্প বলার ডিজিটাল ঠিকানা — ফিচার ফিল্ম, ওয়েব সিরিজ, লাইভ টিভি "
                         "সিমালকাস্ট ও এক্সক্লুসিভ প্রিমিয়ার, মোবাইল, ওয়েব ও স্মার্ট টিভিতে ব্যক্তিগতকৃত "
                         "রিকমেন্ডেশন ও অফলাইন ডাউনলোডসহ উপলব্ধ।"),
            "highlights": [
                "অন-ডিম্যান্ড সিনেমা, সিরিজ ও অরিজিনাল",
                "সব ডিভাইসে লাইভ টিভি স্ট্রিমিং",
                "ব্যক্তিগতকৃত রিকমেন্ডেশন",
                "মাল্টি-ডিভাইস সাপোর্ট — মোবাইল, ওয়েব, স্মার্ট টিভি",
            ],
            "services": ["সাবস্ক্রিপশন স্ট্রিমিং", "অরিজিনাল কনটেন্ট", "লাইভ টিভি", "ব্র্যান্ড পার্টনারশিপ"],
            "audience": "ডিজিটাল বিনোদন ও পৌঁছানো খোঁজে এমন পরিবার, কনটেন্ট প্রেমী ও ব্র্যান্ড।",
            "founded": "২০২২",
            "reach": "৪০+ দেশে উপলব্ধ",
            "domain": "akash.tv",
            "features": [
                ("অ্যাডাপটিভ স্ট্রিমিং", "১৪৪পি থেকে ৪কে পর্যন্ত ডিআরএম-সুরক্ষিত ডেলিভারি, ২ সেকেন্ডের কম স্টার্ট টাইমে।"),
                ("অরিজিনালস স্টুডিও", "সব ধরনের ঘরানার প্ল্যাটফর্ম-এক্সক্লুসিভ সিরিজ ও সিনেমার পাইপলাইন।"),
                ("স্মার্ট ডিসকভারি", "এমএল-চালিত রিকমেন্ডেশন, ওয়াচ-পার্টি মোড ও ডিভাইসজুড়ে কনটিনিউ-ওয়াচিং।"),
            ],
            "challenge": ("বিশ্বজুড়ে বাংলাভাষী দর্শকরা পাইরেসি সাইট, সোশ্যাল ক্লিপ ও আঞ্চলিক অ্যাপ জুড়ে "
                          "কনটেন্ট খুঁজছিলেন — বাংলা কনটেন্টের জন্য কোনো প্রিমিয়াম, বৈধ, মোবাইল-ফার্স্ট ঠিকানা ছিল না।"),
            "solution": ("আকাশ ওটিটি তৈরি করেছে ডিআরএম-সুরক্ষিত, মাল্টি-সিডিএন স্ট্রিমিং প্ল্যাটফর্ম — "
                         "কিউরেটেড লাইব্রেরি, এক্সক্লুসিভ অরিজিনাল এবং বাংলা দর্শন-অভ্যাসের জন্য টিউন করা "
                         "রিকমেন্ডেশন ইঞ্জিনসহ।"),
            "phases": [
                ("আবিষ্কার", "৬টি বাজারে ডায়াস্পোরা গবেষণা, কনটেন্ট লাইসেন্সিং অডিট ও মূল্য গবেষণা।"),
                ("নকশা", "ক্রস-ডিভাইস ইউএক্স (মোবাইল, ওয়েব, স্মার্ট টিভি) — অফলাইন-ফার্স্ট ফ্লো ও ফ্যামিলি প্রোফাইলসহ।"),
                ("নির্মাণ", "মাল্টি-সিডিএন ডেলিভারি, ওয়াইডভাইন/ফেয়ারপ্লে ডিআরএম, টাকা/ডলার/দিরহামে পেমেন্ট ও অ্যানালিটিক্স।"),
                ("লঞ্চ ও প্রবৃদ্ধি", "প্রধান অরিজিনাল প্রিমিয়ার, ১২টি বাজারে পারফরম্যান্স মার্কেটিং ও সাপ্তাহিক কোহর্ট টিউনিং।"),
            ],
            "stack": ["React Native", "Next.js", "Shaka Player", "AWS MediaConvert", "Cloudflare Stream", "Stripe"],
            "results": [
                ("সেবা প্রদানকৃত দেশ", "৪০+"),
                ("গড় স্টার্ট টাইম", "১.৬ সে."),
                ("৩০-দিনের রিটেনশন", "৪৮%"),
                ("প্রকাশিত অরিজিনাল", "২০+"),
            ],
            "quote": ("আমরা আমাদের ফিচার ফিল্মটি আকাশ ওটিটিতে প্রিমিয়ার করি এবং প্রথম দশ দিনে ১৪ লাখ ইউনিক "
                      "দর্শক পাই — বাংলাদেশ, উপসাগর ও যুক্তরাজ্যজুড়ে। তাদের ডিস্ট্রিবিউশন ও ডিআরএম স্ট্যাক "
                      "নির্ভুলভাবে কাজ করে।"),
            "quote_by": "ইমরান হোসাইন · এক্সিকিউটিভ প্রডিউসার, গোল্ডফিশ ফিল্মস",
        },
    },
    {
        "slug": "the-daily-akash",
        "order": 5,
        "en": {
            "title": "The Daily Akash",
            "category": "Digital Newspaper",
            "tagline": "Trusted journalism for a modern Bangladesh.",
            "overview": ("The Daily Akash is an independent, digital-first newsroom. Our reporters cover "
                         "politics, business, sports, technology and culture with an editorial code that "
                         "puts accuracy and accountability ahead of speed."),
            "highlights": [
                "Breaking news and investigative reporting",
                "Business, politics, sports and lifestyle coverage",
                "Multimedia storytelling — video, audio, long-reads",
                "Mobile-first digital experience",
            ],
            "services": ["News Reporting", "Editorial & Opinion", "Display & Native Ads", "Sponsored Content"],
            "audience": "Readers, advertisers and PR partners who value credible journalism.",
            "founded": "2020",
            "reach": "Millions of monthly readers",
            "domain": "akash.news",
            "features": [
                ("Independent newsroom", "Editorial firewall, source protection and a published corrections policy."),
                ("Long-form & investigations", "A dedicated desk for multi-week investigations and data journalism."),
                ("Native ad studio", "Brand storytelling that respects readers — clearly labelled, beautifully crafted."),
            ],
            "challenge": ("Readers were drowning in unverified social posts and clickbait — credible "
                          "journalism existed, but it was buried under slow sites and intrusive ads."),
            "solution": ("We launched a mobile-first newsroom on a fast headless CMS, with a published code "
                         "of ethics, structured beats, and a native ad studio that funds independent "
                         "reporting."),
            "phases": [
                ("Discover", "Reader interviews, beat mapping and an ethics charter co-written with senior editors."),
                ("Design", "Reader-first article template, dark mode, distraction-free reading and rich media embeds."),
                ("Build", "Headless CMS, edge caching, AMP/Web Stories, push subs and a sponsored-content workflow."),
                ("Launch & grow", "Beat-by-beat rollout, newsletter loops and a weekly editorial scorecard."),
            ],
            "stack": ["Next.js", "Sanity CMS", "Algolia", "Cloudflare", "OneSignal", "Plausible"],
            "results": [
                ("Monthly readers", "5M+"),
                ("Median load time", "0.9s"),
                ("Newsletter open rate", "42%"),
                ("Investigations / yr", "30+"),
            ],
            "quote": ("The Daily Akash is one of the few Bangla newsrooms we trust to fact-check before "
                      "publishing. Their corrections policy and source protection are genuinely best-in-class "
                      "for the region."),
            "quote_by": "Dr. Asif Saleh · Senior Fellow, Media Integrity, South Asia Press Institute",
        },
        "bn": {
            "title": "দ্য ডেইলি আকাশ",
            "category": "ডিজিটাল সংবাদপত্র",
            "tagline": "আধুনিক বাংলাদেশের জন্য বিশ্বস্ত সাংবাদিকতা।",
            "overview": ("দ্য ডেইলি আকাশ একটি স্বাধীন, ডিজিটাল-ফার্স্ট নিউজরুম। আমাদের প্রতিবেদকরা রাজনীতি, "
                         "ব্যবসা, খেলা, প্রযুক্তি ও সংস্কৃতি কভার করেন এমন একটি সম্পাদকীয় নীতিমালায়, যা "
                         "গতির চেয়ে নির্ভুলতা ও দায়বদ্ধতাকে অগ্রাধিকার দেয়।"),
            "highlights": [
                "ব্রেকিং নিউজ ও অনুসন্ধানী প্রতিবেদন",
                "ব্যবসা, রাজনীতি, খেলা ও লাইফস্টাইল কভারেজ",
                "মাল্টিমিডিয়া স্টোরিটেলিং — ভিডিও, অডিও, দীর্ঘ প্রতিবেদন",
                "মোবাইল-ফার্স্ট ডিজিটাল অভিজ্ঞতা",
            ],
            "services": ["সংবাদ প্রতিবেদন", "সম্পাদকীয় ও মতামত", "ডিসপ্লে ও নেটিভ বিজ্ঞাপন", "স্পনসরড কনটেন্ট"],
            "audience": "বিশ্বাসযোগ্য সাংবাদিকতাকে মূল্য দেন এমন পাঠক, বিজ্ঞাপনদাতা ও পিআর পার্টনার।",
            "founded": "২০২০",
            "reach": "মাসিক লক্ষ লক্ষ পাঠক",
            "domain": "akash.news",
            "features": [
                ("স্বাধীন নিউজরুম", "সম্পাদকীয় ফায়ারওয়াল, সূত্র সুরক্ষা ও প্রকাশিত সংশোধনী নীতি।"),
                ("দীর্ঘ প্রতিবেদন ও অনুসন্ধান", "একাধিক সপ্তাহব্যাপী অনুসন্ধান ও ডেটা সাংবাদিকতার জন্য নিবেদিত ডেস্ক।"),
                ("নেটিভ অ্যাড স্টুডিও", "পাঠকদের সম্মান করে এমন ব্র্যান্ড স্টোরিটেলিং — স্পষ্টভাবে চিহ্নিত, নিপুণভাবে নির্মিত।"),
            ],
            "challenge": ("পাঠকরা অযাচাইকৃত সোশ্যাল পোস্ট আর ক্লিকবেইটে ডুবে যাচ্ছিলেন — বিশ্বাসযোগ্য "
                          "সাংবাদিকতা ছিল, কিন্তু তা ধীর ওয়েবসাইট আর অনুপ্রবেশকারী বিজ্ঞাপনের নিচে চাপা পড়ে ছিল।"),
            "solution": ("আমরা একটি দ্রুত হেডলেস সিএমএস-এ মোবাইল-ফার্স্ট নিউজরুম চালু করি — প্রকাশিত "
                         "নৈতিকতা বিধি, কাঠামোবদ্ধ বিট এবং স্বাধীন সাংবাদিকতার অর্থায়নে নেটিভ অ্যাড স্টুডিওসহ।"),
            "phases": [
                ("আবিষ্কার", "পাঠক ইন্টারভিউ, বিট ম্যাপিং এবং জ্যেষ্ঠ সম্পাদকদের সঙ্গে যৌথভাবে রচিত নৈতিকতা সনদ।"),
                ("নকশা", "পাঠক-প্রথম আর্টিকেল টেমপ্লেট, ডার্ক মোড, বিভ্রান্তিমুক্ত পাঠ ও সমৃদ্ধ মিডিয়া এমবেড।"),
                ("নির্মাণ", "হেডলেস সিএমএস, এজ ক্যাশিং, এএমপি/ওয়েব স্টোরিজ, পুশ সাবস্ক্রিপশন ও স্পনসরড-কনটেন্ট ওয়ার্কফ্লো।"),
                ("লঞ্চ ও প্রবৃদ্ধি", "বিট-অনুযায়ী রোলআউট, নিউজলেটার লুপ ও সাপ্তাহিক সম্পাদকীয় স্কোরকার্ড।"),
            ],
            "stack": ["Next.js", "Sanity CMS", "Algolia", "Cloudflare", "OneSignal", "Plausible"],
            "results": [
                ("মাসিক পাঠক", "৫০ লাখ+"),
                ("মাঝারি লোড টাইম", "০.৯ সে."),
                ("নিউজলেটার ওপেন রেট", "৪২%"),
                ("বার্ষিক অনুসন্ধান", "৩০+"),
            ],
            "quote": ("দ্য ডেইলি আকাশ অন্তত কয়েকটি বাংলা নিউজরুমের মধ্যে একটি, যাদের আমরা প্রকাশের আগে "
                      "ফ্যাক্ট-চেক করতে বিশ্বাস করি। তাদের সংশোধনী নীতি ও সূত্র সুরক্ষা এই অঞ্চলের জন্য "
                      "সত্যিকার অর্থে শ্রেষ্ঠ মানের।"),
            "quote_by": "ড. আসিফ সালেহ · সিনিয়র ফেলো, মিডিয়া ইন্টেগ্রিটি, সাউথ এশিয়া প্রেস ইনস্টিটিউট",
        },
    },
    {
        "slug": "yess-legal-advice",
        "order": 6,
        "en": {
            "title": "Yess Legal Advice",
            "category": "Legal Advisory",
            "tagline": "Trusted counsel for every stage of business.",
            "overview": ("Yess Legal Advice is the group's counsel desk — a panel of barristers, advocates "
                         "and company secretaries who handle everything from RJSC incorporation and trade "
                         "licences to contract drafting, IP filings and regulatory compliance, so founders "
                         "can build with confidence."),
            "highlights": [
                "Company formation, RJSC & trade licence support",
                "Contract drafting, review and negotiation",
                "Trademark, copyright and IP protection",
                "Regulatory compliance and dispute resolution",
            ],
            "services": ["Company Formation", "Contracts & Agreements", "IP & Trademark", "Compliance & Disputes"],
            "audience": "Startups, SMEs, enterprises and individuals seeking dependable legal counsel.",
            "founded": "2024",
            "reach": "Clients across BD & the diaspora",
            "domain": None,
            "features": [
                ("Fixed-fee packages", "Transparent pricing for formation, contracts and filings — quoted before work begins."),
                ("Senior advocates only", "Every matter is led by a bar enrolled advocate — no juniors learning on your file."),
                ("Business-first counsel", "Advice written for operators, not academics — risk flagged, options ranked, next steps clear."),
            ],
            "challenge": ("A fast-growing e-commerce group was signing supplier contracts without review, had "
                          "no trademark on its own brand, and faced a regulatory notice it didn't understand."),
            "solution": ("Yess Legal Advice ran a 360° legal audit, registered the group's trademarks, "
                         "rebuilt its contract library and took over regulator correspondence under a "
                         "monthly retainer."),
            "phases": [
                ("Discover", "Full legal audit — entity structure, licences, contracts, IP and pending notices."),
                ("Design", "A remediation roadmap ranked by risk, plus a standard contract and policy library."),
                ("Build", "Trademark filings, redrafted agreements, compliance calendar and board resolutions."),
                ("Launch & grow", "Monthly retainer counsel, quarterly compliance reviews and on-call dispute support."),
            ],
            "stack": ["RJSC e-Filing", "DPDT IP Portal", "Contract Lifecycle Mgmt", "e-Court Services"],
            "results": [
                ("Contracts reviewed", "120+"),
                ("Trademarks secured", "9"),
                ("Regulatory exposure", "−100%"),
                ("Advisory turnaround", "<48h"),
            ],
            "quote": ("Yess Legal Advice rebuilt our entire contract library and had our trademarks filed "
                      "within weeks. For the first time, legal feels like a growth partner — not a cost "
                      "centre."),
            "quote_by": "Farhana Karim · Managing Director, Nabanna Commerce Ltd.",
        },
        "bn": {
            "title": "ইয়েস লিগ্যাল অ্যাডভাইস",
            "category": "আইনি পরামর্শ",
            "tagline": "ব্যবসার প্রতিটি ধাপে বিশ্বস্ত আইনি সহযোগী।",
            "overview": ("ইয়েস লিগ্যাল অ্যাডভাইস গ্রুপের আইনি ডেস্ক — ব্যারিস্টার, অ্যাডভোকেট ও কোম্পানি "
                         "সেক্রেটারিদের একটি প্যানেল, যারা আরজেএসসি নিবন্ধন ও ট্রেড লাইসেন্স থেকে চুক্তি "
                         "প্রণয়ন, আইপি ফাইলিং ও নিয়ন্ত্রক সম্মতি পর্যন্ত সবকিছু সামলান, যাতে উদ্যোক্তারা "
                         "আত্মবিশ্বাসের সঙ্গে এগিয়ে যেতে পারেন।"),
            "highlights": [
                "কোম্পানি গঠন, আরজেএসসি ও ট্রেড লাইসেন্স সহায়তা",
                "চুক্তি প্রণয়ন, পর্যালোচনা ও আলোচনা",
                "ট্রেডমার্ক, কপিরাইট ও আইপি সুরক্ষা",
                "নিয়ন্ত্রক সম্মতি ও বিরোধ নিষ্পত্তি",
            ],
            "services": ["কোম্পানি গঠন", "চুক্তি ও সমঝোতা", "আইপি ও ট্রেডমার্ক", "কমপ্লায়েন্স ও বিরোধ"],
            "audience": "নির্ভরযোগ্য আইনি পরামর্শ প্রত্যাশী স্টার্টআপ, এসএমই, এন্টারপ্রাইজ ও ব্যক্তি।",
            "founded": "২০২৪",
            "reach": "বাংলাদেশ ও ডায়াস্পোরাজুড়ে ক্লায়েন্ট",
            "domain": None,
            "features": [
                ("নির্ধারিত-ফি প্যাকেজ", "গঠন, চুক্তি ও ফাইলিংয়ের জন্য স্বচ্ছ মূল্য — কাজ শুরুর আগেই উদ্ধৃতি।"),
                ("শুধু সিনিয়র অ্যাডভোকেট", "প্রতিটি বিষয় পরিচালনা করেন বারে তালিকাভুক্ত অ্যাডভোকেট — আপনার ফাইলে জুনিয়রদের শেখা নয়।"),
                ("ব্যবসা-প্রথম পরামর্শ", "পরিচালকদের জন্য লেখা পরামর্শ — ঝুঁকি চিহ্নিত, বিকল্প র‍্যাংক করা, পরবর্তী পদক্ষেপ স্পষ্ট।"),
            ],
            "challenge": ("একটি দ্রুতবর্ধনশীল ই-কমার্স গ্রুপ পর্যালোচনা ছাড়াই সরবরাহকারী চুক্তি সই করছিল, "
                          "নিজের ব্র্যান্ডের ট্রেডমার্ক ছিল না, এবং এমন একটি নিয়ন্ত্রক নোটিশের মুখোমুখি "
                          "হয়েছিল যা তারা বোঝেনি।"),
            "solution": ("ইয়েস লিগ্যাল অ্যাডভাইস পরিচালনা করেছে ৩৬০° আইনি অডিট, গ্রুপের ট্রেডমার্ক নিবন্ধন "
                         "করেছে, চুক্তি লাইব্রেরি পুনর্গঠন করেছে এবং মাসিক রিটেইনারের অধীনে নিয়ন্ত্রক "
                         "সংস্থার চিঠিপত্র দেখভাল গ্রহণ করেছে।"),
            "phases": [
                ("আবিষ্কার", "পূর্ণ আইনি অডিট — সত্তা কাঠামো, লাইসেন্স, চুক্তি, আইপি ও মুলতুবি নোটিশ।"),
                ("নকশা", "ঝুঁকি অনুযায়ী সাজানো প্রতিকার রোডম্যাপ, সঙ্গে প্রমিত চুক্তি ও নীতি লাইব্রেরি।"),
                ("নির্মাণ", "ট্রেডমার্ক ফাইলিং, পুনঃপ্রণীত চুক্তি, কমপ্লায়েন্স ক্যালেন্ডার ও বোর্ড রেজোলিউশন।"),
                ("লঞ্চ ও প্রবৃদ্ধি", "মাসিক রিটেইনার কাউন্সেল, ত্রৈমাসিক কমপ্লায়েন্স পর্যালোচনা ও অন-কল বিরোধ সহায়তা।"),
            ],
            "stack": ["RJSC e-Filing", "DPDT IP Portal", "Contract Lifecycle Mgmt", "e-Court Services"],
            "results": [
                ("পর্যালোচিত চুক্তি", "১২০+"),
                ("সুরক্ষিত ট্রেডমার্ক", "৯"),
                ("নিয়ন্ত্রক ঝুঁকি", "−১০০%"),
                ("পরামর্শ প্রদানের সময়", "<৪৮ ঘণ্টা"),
            ],
            "quote": ("ইয়েস লিগ্যাল অ্যাডভাইস আমাদের পুরো চুক্তি লাইব্রেরি পুনর্গঠন করেছে এবং কয়েক সপ্তাহের "
                      "মধ্যে আমাদের ট্রেডমার্ক ফাইল করেছে। প্রথমবারের মতো আইনি সেবা মনে হচ্ছে প্রবৃদ্ধির "
                      "অংশীদার — খরচের খাতা নয়।"),
            "quote_by": "ফারহানা করিম · ব্যবস্থাপনা পরিচালক, নবান্ন কমার্স লি.",
        },
    },
    {
        "slug": "yess-host",
        "order": 7,
        "en": {
            "title": "Yess Host",
            "category": "Hosting & Cloud Infrastructure",
            "tagline": "Fast, secure hosting built for growth.",
            "overview": ("Yess Host is enterprise-grade infrastructure for everyone — from a first portfolio "
                         "site to a multi-region SaaS. NVMe storage, isolated containers, automated backups "
                         "and a tier-3 support desk that actually answers."),
            "highlights": [
                "Shared, VPS and cloud hosting",
                "Domain registration and SSL",
                "Managed servers with 99.9% uptime",
                "24/7 technical support",
            ],
            "services": ["Web Hosting", "Cloud VPS", "Domains & SSL", "Managed Servers"],
            "audience": "Developers, agencies and businesses building online.",
            "founded": "2019",
            "reach": "Multi-region, BD-first",
            "domain": None,
            "features": [
                ("NVMe everywhere", "Every plan runs on NVMe storage with HTTP/3 and global caching out of the box."),
                ("One-click stacks", "WordPress, Laravel, Next.js, Node, n8n and 30+ apps in under a minute."),
                ("Real humans, 24/7", "Median first-response under 4 minutes — by chat, ticket or phone."),
            ],
            "challenge": ("Local hosting was slow, oversold and unsupported — agencies were forced to send "
                          "clients to overseas providers and absorb the latency and billing complexity."),
            "solution": ("Yess Host built a BD-first, multi-region cloud with NVMe storage, one-click app "
                         "stacks, automated backups and a tier-3 support desk staffed in-country."),
            "phases": [
                ("Discover", "Workload audit with 40 agencies, baseline benchmarks and an SLA design workshop."),
                ("Design", "Plan ladder, control panel UX, migration tooling and a transparent status page."),
                ("Build", "Multi-region nodes, automated backups, WAF, DDoS shield and a 30+ app marketplace."),
                ("Launch & grow", "Free migrations, partner programme for agencies and quarterly capacity expansion."),
            ],
            "stack": ["KVM", "LiteSpeed", "Cloudflare", "Acronis Backup", "Imunify360", "Prometheus"],
            "results": [
                ("Network uptime", "99.99%"),
                ("Avg. TTFB (BD)", "82ms"),
                ("Sites hosted", "18,000+"),
                ("Support response", "<4 min"),
            ],
            "quote": ("We migrated 230 client sites from a US provider to Yess Host in a weekend. TTFB "
                      "dropped from 480ms to under 100ms in Bangladesh and our support tickets to clients "
                      "fell by half."),
            "quote_by": "Rifat Mahmud · Founder & CTO, Codemen Solutions",
        },
        "bn": {
            "title": "ইয়েস হোস্ট",
            "category": "হোস্টিং ও ক্লাউড পরিকাঠামো",
            "tagline": "প্রবৃদ্ধির জন্য নির্মিত দ্রুত, নিরাপদ হোস্টিং।",
            "overview": ("ইয়েস হোস্ট সবার জন্য এন্টারপ্রাইজ-গ্রেড পরিকাঠামো — প্রথম পোর্টফোলিও সাইট থেকে "
                         "মাল্টি-রিজিয়ন এসএএস পর্যন্ত। এনভিএমই স্টোরেজ, আইসোলেটেড কন্টেইনার, স্বয়ংক্রিয় "
                         "ব্যাকআপ এবং এমন একটি টায়ার-৩ সাপোর্ট ডেস্ক যা সত্যিই উত্তর দেয়।"),
            "highlights": [
                "শেয়ারড, ভিপিএস ও ক্লাউড হোস্টিং",
                "ডোমেইন রেজিস্ট্রেশন ও এসএসএল",
                "৯৯.৯% আপটাইমসহ ম্যানেজড সার্ভার",
                "২৪/৭ প্রযুক্তিগত সহায়তা",
            ],
            "services": ["ওয়েব হোস্টিং", "ক্লাউড ভিপিএস", "ডোমেইন ও এসএসএল", "ম্যানেজড সার্ভার"],
            "audience": "অনলাইনে কিছু গড়তে চান এমন ডেভেলপার, এজেন্সি ও ব্যবসা।",
            "founded": "২০১৯",
            "reach": "মাল্টি-রিজিয়ন, বাংলাদেশ-প্রথম",
            "domain": None,
            "features": [
                ("সর্বত্র এনভিএমই", "প্রতিটি প্ল্যান চলে এনভিএমই স্টোরেজে — এইচটিটিপি/৩ ও গ্লোবাল ক্যাশিং অন্তর্নির্মিত।"),
                ("ওয়ান-ক্লিক স্ট্যাক", "ওয়ার্ডপ্রেস, লারাভেল, নেক্সট.জেএস, নোড, এন৮এন ও ৩০+ অ্যাপ — এক মিনিটের কমে।"),
                ("প্রকৃত মানুষ, ২৪/৭", "চ্যাট, টিকিট বা ফোনে মাঝারি প্রথম উত্তর ৪ মিনিটের কম।"),
            ],
            "challenge": ("স্থানীয় হোস্টিং ছিল ধীর, ওভারসোল্ড ও সহায়তাহীন — এজেন্সিগুলো বাধ্য হয়ে ক্লায়েন্টদের "
                          "বিদেশি প্রদানকারীদের কাছে পাঠাতো এবং ল্যাটেন্সি ও বিলিং জটিলতা ভুগতো।"),
            "solution": ("ইয়েস হোস্ট তৈরি করেছে বাংলাদেশ-প্রথম, মাল্টি-রিজিয়ন ক্লাউড — এনভিএমই স্টোরেজ, "
                         "ওয়ান-ক্লিক অ্যাপ স্ট্যাক, স্বয়ংক্রিয় ব্যাকআপ এবং দেশেই কর্মরত টায়ার-৩ সাপোর্ট ডেস্কসহ।"),
            "phases": [
                ("আবিষ্কার", "৪০টি এজেন্সির সঙ্গে ওয়ার্কলোড অডিট, বেসলাইন বেঞ্চমার্ক ও এসএলএ ডিজাইন ওয়ার্কশপ।"),
                ("নকশা", "প্ল্যান ল্যাডার, কন্ট্রোল প্যানেল ইউএক্স, মাইগ্রেশন টুলিং ও স্বচ্ছ স্ট্যাটাস পেজ।"),
                ("নির্মাণ", "মাল্টি-রিজিয়ন নোড, স্বয়ংক্রিয় ব্যাকআপ, ডাব্লিউএএফ, ডিডস শিল্ড ও ৩০+ অ্যাপ মার্কেটপ্লেস।"),
                ("লঞ্চ ও প্রবৃদ্ধি", "বিনামূল্যে মাইগ্রেশন, এজেন্সিদের জন্য পার্টনার প্রোগ্রাম ও ত্রৈমাসিক ক্যাপাসিটি সম্প্রসারণ।"),
            ],
            "stack": ["KVM", "LiteSpeed", "Cloudflare", "Acronis Backup", "Imunify360", "Prometheus"],
            "results": [
                ("নেটওয়ার্ক আপটাইম", "৯৯.৯৯%"),
                ("গড় টিটিএফবি (বাংলাদেশ)", "৮২ মি.সে."),
                ("হোস্টকৃত সাইট", "১৮,০০০+"),
                ("সাপোর্ট উত্তর", "<৪ মিনিট"),
            ],
            "quote": ("আমরা এক সপ্তাহান্তে একটি যুক্তরাষ্ট্রীয় প্রদানকারী থেকে ইয়েস হোস্টে ২৩০টি ক্লায়েন্ট "
                      "সাইট মাইগ্রেট করি। বাংলাদেশে টিটিএফবি ৪৮০ মি.সে. থেকে ১০০ মি.সে.-এর নিচে নেমেছে এবং "
                      "ক্লায়েন্টদের সাপোর্ট টিকিট অর্ধেকে নেমেছে।"),
            "quote_by": "রিফাত মাহমুদ · প্রতিষ্ঠাতা ও সিটিও, কোডমেন সলিউশনস",
        },
    },
    {
        "slug": "yess-event",
        "order": 8,
        "en": {
            "title": "Yess Event",
            "category": "Event Management",
            "tagline": "Unforgettable experiences, expertly delivered.",
            "overview": ("Yess Event designs and produces moments people remember — corporate conferences, "
                         "brand launches, music festivals and private celebrations. Strategy, creative, "
                         "production and logistics under one roof."),
            "highlights": [
                "Corporate conferences and product launches",
                "Concerts, festivals and brand activations",
                "Weddings and private celebrations",
                "Full production — stage, sound, lighting, AV",
            ],
            "services": ["Corporate Events", "Brand Activation", "Concerts & Festivals", "Wedding Planning"],
            "audience": "Brands, corporates and individuals planning memorable occasions.",
            "founded": "2017",
            "reach": "300+ events delivered",
            "domain": None,
            "features": [
                ("Creative-led production", "Concept, script, set design and AV — engineered around the audience moment."),
                ("Owned equipment", "Stage, sound, lighting, LED walls and broadcast kit — owned, not rented."),
                ("Single accountable lead", "One producer owns budget, timeline and quality from kick-off to wrap."),
            ],
            "challenge": ("Brands juggling 4–5 vendors per event were paying twice and still getting "
                          "inconsistent stages, AV gaps and last-minute panics on show day."),
            "solution": ("Yess Event delivers strategy, creative, production and logistics under one "
                         "accountable producer — with owned stage, sound, lighting and broadcast kit."),
            "phases": [
                ("Discover", "Audience-moment workshop, success metrics and a written creative brief."),
                ("Design", "Concept boards, run-of-show, set design and a fully costed production plan."),
                ("Build", "Vendor-free production with owned kit, rehearsals and a live show-control room."),
                ("Launch & grow", "Show day execution, multi-cam capture, social cut-downs and a post-event report."),
            ],
            "stack": ["d&b Audiotechnik", "Robe Lighting", "ROE LED Walls", "grandMA3", "Blackmagic ATEM"],
            "results": [
                ("Events delivered", "300+"),
                ("On-time show start", "100%"),
                ("Client repeat rate", "78%"),
                ("Avg. CSAT", "4.9/5"),
            ],
            "quote": ("Yess Event delivered our 4,000-guest annual conference end-to-end — stage, AV, "
                      "broadcast, the lot. One producer, one budget, zero last-minute panic. We've already "
                      "booked them for next year."),
            "quote_by": "Kamrul Hasan · VP, Marketing, Robi Axiata Limited",
        },
        "bn": {
            "title": "ইয়েস ইভেন্ট",
            "category": "ইভেন্ট ম্যানেজমেন্ট",
            "tagline": "অবিস্মরণীয় অভিজ্ঞতা, দক্ষতার সঙ্গে বাস্তবায়িত।",
            "overview": ("ইয়েস ইভেন্ট ডিজাইন ও প্রযোজনা করে এমন মুহূর্ত যা মানুষ মনে রাখে — কর্পোরেট "
                         "সম্মেলন, ব্র্যান্ড লঞ্চ, মিউজিক ফেস্টিভাল ও ব্যক্তিগত উদ্যাপন। কৌশল, সৃজনশীলতা, "
                         "প্রোডাকশন ও লজিস্টিকস — সব এক ছাদের নিচে।"),
            "highlights": [
                "কর্পোরেট সম্মেলন ও পণ্য লঞ্চ",
                "কনসার্ট, উৎসব ও ব্র্যান্ড অ্যাক্টিভেশন",
                "বিবাহ ও ব্যক্তিগত উদ্যাপন",
                "সম্পূর্ণ প্রোডাকশন — মঞ্চ, সাউন্ড, লাইটিং, এভি",
            ],
            "services": ["কর্পোরেট ইভেন্ট", "ব্র্যান্ড অ্যাক্টিভেশন", "কনসার্ট ও উৎসব", "বিবাহ পরিকল্পনা"],
            "audience": "স্মরণীয় অনুষ্ঠান আয়োজনকারী ব্র্যান্ড, কর্পোরেট ও ব্যক্তি।",
            "founded": "২০১৭",
            "reach": "৩০০+ ইভেন্ট সফলভাবে সম্পন্ন",
            "domain": None,
            "features": [
                ("সৃজনশীলতা-নেতৃত্বাধীন প্রোডাকশন", "কনসেপ্ট, স্ক্রিপ্ট, সেট ডিজাইন ও এভি — দর্শকের মুহূর্তকে কেন্দ্র করে প্রকৌশল।"),
                ("নিজস্ব সরঞ্জাম", "মঞ্চ, সাউন্ড, লাইটিং, এলইডি ওয়াল ও ব্রডকাস্ট কিট — ভাড়া নয়, নিজস্ব।"),
                ("একক দায়িত্বশীল লিড", "একজন প্রডিউসার কিক-অফ থেকে সমাপ্তি পর্যন্ত বাজেট, সময়সীমা ও মানের দায়িত্ব নেন।"),
            ],
            "challenge": ("প্রতিটি ইভেন্টে ৪–৫টি ভেন্ডর নিয়োগ করা ব্র্যান্ডগুলো দ্বিগুণ খরচ করেও পেত "
                          "অসামঞ্জস্যপূর্ণ মঞ্চ, এভি ঘাটতি এবং শো-দিবসে শেষ মুহূর্তের হতোদম।"),
            "solution": ("ইয়েস ইভেন্ট একক দায়িত্বশীল প্রডিউসারের অধীনে কৌশল, সৃজনশীলতা, প্রোডাকশন ও "
                         "লজিস্টিকস সরবরাহ করে — নিজস্ব মঞ্চ, সাউন্ড, লাইটিং ও ব্রডকাস্ট কিটসহ।"),
            "phases": [
                ("আবিষ্কার", "দর্শক-মুহূর্ত ওয়ার্কশপ, সাফল্যের মাত্রা ও লিখিত সৃজনশীল ব্রিফ।"),
                ("নকশা", "কনসেপ্ট বোর্ড, রান-অফ-শো, সেট ডিজাইন ও সম্পূর্ণ বাজেটযুক্ত প্রোডাকশন পরিকল্পনা।"),
                ("নির্মাণ", "নিজস্ব কিটে ভেন্ডরমুক্ত প্রোডাকশন, রিহার্সাল ও লাইভ শো-কন্ট্রোল রুম।"),
                ("লঞ্চ ও প্রবৃদ্ধি", "শো-দিবসের বাস্তবায়ন, মাল্টি-ক্যাম ক্যাপচার, সোশ্যাল কাট-ডাউন ও ইভেন্ট-পরবর্তী প্রতিবেদন।"),
            ],
            "stack": ["d&b Audiotechnik", "Robe Lighting", "ROE LED Walls", "grandMA3", "Blackmagic ATEM"],
            "results": [
                ("সম্পন্ন ইভেন্ট", "৩০০+"),
                ("সময়মতো শো শুরু", "১০০%"),
                ("ক্লায়েন্ট পুনরাবৃত্তি হার", "৭৮%"),
                ("গড় সিএসএটি", "৪.৯/৫"),
            ],
            "quote": ("ইয়েস ইভেন্ট আমাদের ৪,০০০ অতিথির বার্ষিক সম্মেলন শুরু থেকে শেষ পর্যন্ত পরিচালনা "
                      "করেছে — মঞ্চ, এভি, ব্রডকাস্ট, সবকিছু। একজন প্রডিউসার, একটি বাজেট, শূন্য শেষ-মুহূর্তের "
                      "তাড়াহুড়ো। আগামী বছরের জন্যও আমরা তাদের বুক করেছি।"),
            "quote_by": "কামরুল হাসান · ভিপি, মার্কেটিং, রবি আজিয়াটা লিমিটেড",
        },
    },
]

VENTURES.sort(key=lambda v: v["order"])


# ===========================================================================
# English edition — ReportLab, letterhead background
# ===========================================================================
def build_en(v):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor
    from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
    from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame, Paragraph,
                                    Spacer, Table, TableStyle, KeepTogether)
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfbase.pdfmetrics import registerFontFamily

    LIB = ("/nix/store/0hdgmcjy7q8zn7h3amz8nf96l9qh7wv0-liberation-fonts-2.1.5/"
           "share/fonts/truetype")
    try:
        pdfmetrics.getFont("YBSans")
    except KeyError:
        pdfmetrics.registerFont(TTFont("YBSans", f"{LIB}/LiberationSans-Regular.ttf", subfontIndex=0))
        pdfmetrics.registerFont(TTFont("YBSans-Bold", f"{LIB}/LiberationSans-Bold.ttf", subfontIndex=0))
        pdfmetrics.registerFont(TTFont("YBSans-Italic", f"{LIB}/LiberationSans-Italic.ttf", subfontIndex=0))
        pdfmetrics.registerFont(TTFont("YBSans-BoldItalic", f"{LIB}/LiberationSans-BoldItalic.ttf", subfontIndex=0))
        registerFontFamily("YBSans", normal="YBSans", bold="YBSans-Bold",
                           italic="YBSans-Italic", boldItalic="YBSans-BoldItalic")

    NAVY = HexColor("#0F2350")
    GOLD = HexColor("#B9892F")
    TEAL = HexColor("#155E63")
    INK = HexColor("#2B2B2B")
    MUTED = HexColor("#5A5A5A")
    RULE = HexColor("#D6D9DC")
    SURFACE = HexColor("#F4F1EA")

    PAGE_W, PAGE_H = A4
    M_LEFT = M_RIGHT = 22 * mm
    M_TOP, M_BOTTOM = 47 * mm, 32 * mm

    d = v["en"]
    L = EN_L
    doc_title = f"{d['title']} — Project Profile"

    ss = getSampleStyleSheet()

    def st(name, **kw):
        ss.add(ParagraphStyle(name=name, parent=ss["BodyText"], **kw))

    st("Body", fontName="YBSans", fontSize=10.5, leading=15.5, textColor=INK,
       spaceAfter=6, alignment=TA_JUSTIFY)
    st("BodyLeft", fontName="YBSans", fontSize=10.5, leading=15.5, textColor=INK,
       spaceAfter=4, alignment=TA_LEFT)
    st("H3", fontName="YBSans-Bold", fontSize=11.5, leading=15, textColor=TEAL,
       spaceBefore=10, spaceAfter=4)
    st("VBullet", fontName="YBSans", fontSize=10.5, leading=15.5, textColor=INK,
       leftIndent=14, bulletIndent=2, spaceAfter=2, alignment=TA_LEFT)
    st("DLTerm", fontName="YBSans-Bold", fontSize=10.5, leading=14, textColor=NAVY, spaceAfter=1)
    st("DLDef", fontName="YBSans", fontSize=10.5, leading=15.5, textColor=INK,
       spaceAfter=8, alignment=TA_JUSTIFY)
    st("Eyebrow", fontName="YBSans-Bold", fontSize=9, leading=12, textColor=GOLD, spaceAfter=8)
    st("CoverTitle", fontName="YBSans-Bold", fontSize=38, leading=42, textColor=NAVY,
       spaceAfter=8, alignment=TA_LEFT)
    st("Tagline", fontName="YBSans-Italic", fontSize=14, leading=20, textColor=INK,
       spaceAfter=12, alignment=TA_LEFT)
    st("Meta", fontName="YBSans", fontSize=9, leading=13, textColor=MUTED)
    st("SecKicker", fontName="YBSans-Bold", fontSize=8.5, leading=11, textColor=GOLD, spaceAfter=3)
    st("SecTitle", fontName="YBSans-Bold", fontSize=20, leading=24, textColor=NAVY, spaceAfter=10)
    st("Quote", fontName="YBSans-Italic", fontSize=11.5, leading=17, textColor=NAVY,
       leftIndent=10, rightIndent=10, alignment=TA_LEFT)
    st("QuoteBy", fontName="YBSans", fontSize=9, leading=13, textColor=MUTED,
       leftIndent=10, spaceBefore=4)

    class VentureDoc(BaseDocTemplate):
        def _on_page(self, canv, doc_):
            canv.saveState()
            if doc_.page > 1:
                canv.setFillAlpha(0.16)
                canv.setStrokeAlpha(0.16)
            try:
                canv.drawImage(LETTERHEAD, 0, 0, width=PAGE_W, height=PAGE_H,
                               preserveAspectRatio=False, mask="auto")
            except Exception:
                pass
            canv.restoreState()
            canv.saveState()
            meta_y = M_BOTTOM - 6 * mm
            canv.setFont("YBSans", 7.5)
            canv.setFillColor(MUTED)
            canv.drawString(M_LEFT, meta_y, L["confidential"])
            canv.drawCentredString(PAGE_W / 2, meta_y,
                                   f"{doc_title} · {VERSION} · {GENERATED}")
            canv.drawRightString(PAGE_W - M_RIGHT, meta_y, f"{L['page']} {doc_.page}")
            canv.restoreState()

    out = f"{OUT_DIR}/{v['slug']}-profile.pdf"
    doc = VentureDoc(out, pagesize=A4, leftMargin=M_LEFT, rightMargin=M_RIGHT,
                     topMargin=M_TOP, bottomMargin=M_BOTTOM,
                     title=doc_title, author=L["group"],
                     subject=f"{d['title']} project profile",
                     creator="Yess Bangla document engine",
                     keywords=f"{d['title']}, Yess Bangla, {d['category']}")
    frame = Frame(M_LEFT, M_BOTTOM, PAGE_W - M_LEFT - M_RIGHT,
                  PAGE_H - M_TOP - M_BOTTOM, id="content",
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=doc._on_page)])

    def heading(num, kicker, title):
        inner = Table(
            [[Paragraph(f'<font color="#B9892F"><b>{num}</b></font>', ss["SecTitle"]),
              [Paragraph(kicker.upper(), ss["SecKicker"]), Paragraph(title, ss["SecTitle"])]]],
            colWidths=[16 * mm, None])
        inner.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
            ("LINEBELOW", (0, 0), (-1, 0), 1.1, GOLD),
        ]))
        return KeepTogether([inner, Spacer(1, 8)])

    def kv_card(rows):
        data = [[Paragraph(k, ss["DLTerm"]), Paragraph(val, ss["BodyLeft"])] for k, val in rows]
        t = Table(data, colWidths=[42 * mm, None])
        t.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
            ("BOX", (0, 0), (-1, -1), 0.8, RULE),
            ("LINEBELOW", (0, 0), (-1, -2), 0.5, RULE),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        return t

    story = []

    # --- Cover block ---
    story.append(Spacer(1, 26))
    story.append(Paragraph(f"{L['doc_label'].upper()} · {d['category'].upper()}", ss["Eyebrow"]))
    story.append(Paragraph(d["title"], ss["CoverTitle"]))
    story.append(Paragraph(d["tagline"], ss["Tagline"]))
    story.append(Paragraph(f"{L['edition']} · {VERSION} · {GENERATED}", ss["Meta"]))
    story.append(Spacer(1, 14))
    glance = [
        (L["parent"], L["group"]),
        (L["category"], d["category"]),
        (L["founded"], d["founded"]),
        (L["reach"], d["reach"]),
        (L["audience"], d["audience"]),
    ]
    if d.get("domain"):
        glance.append((L["web_label"], f"www.{d['domain']}"))
    story.append(kv_card(glance))
    story.append(Spacer(1, 18))

    S = L["sections"]
    # 01 Overview
    story.append(heading("01", S[0][1], S[0][0]))
    story.append(Paragraph(d["overview"], ss["Body"]))
    story.append(Spacer(1, 8))

    # 02 Highlights
    story.append(heading("02", S[1][1], S[1][0]))
    for h in d["highlights"]:
        story.append(Paragraph(h, ss["VBullet"], bulletText="•"))
    story.append(Spacer(1, 8))

    # 03 Services
    story.append(heading("03", S[2][1], S[2][0]))
    story.append(Paragraph(" &nbsp;·&nbsp; ".join(d["services"]), ss["BodyLeft"]))
    story.append(Spacer(1, 8))

    # 04 Signature strengths
    story.append(heading("04", S[3][1], S[3][0]))
    for t_, d_ in d["features"]:
        story.append(Paragraph(t_, ss["DLTerm"]))
        story.append(Paragraph(d_, ss["DLDef"]))
    story.append(Spacer(1, 8))

    # 05 In practice
    story.append(heading("05", S[4][1], S[4][0]))
    story.append(Paragraph(L["challenge"], ss["H3"]))
    story.append(Paragraph(d["challenge"], ss["Body"]))
    story.append(Paragraph(L["solution"], ss["H3"]))
    story.append(Paragraph(d["solution"], ss["Body"]))
    story.append(Paragraph(L["phases"], ss["H3"]))
    for i, (pt, pd_) in enumerate(d["phases"], 1):
        story.append(Paragraph(f"{i}. {pt}", ss["DLTerm"]))
        story.append(Paragraph(pd_, ss["DLDef"]))
    story.append(Spacer(1, 8))

    # 06 Capabilities
    story.append(heading("06", S[5][1], S[5][0]))
    story.append(Paragraph(", ".join(d["stack"]), ss["BodyLeft"]))
    story.append(Spacer(1, 8))

    # 07 Outcomes
    story.append(heading("07", S[6][1], S[6][0]))
    res = [[Paragraph(lbl, ss["BodyLeft"]),
            Paragraph(f'<font color="#0F2350"><b>{val}</b></font>', ss["BodyLeft"])]
           for lbl, val in d["results"]]
    rt = Table(res, colWidths=[None, 34 * mm])
    rt.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, RULE),
        ("BACKGROUND", (0, 0), (-1, 0), SURFACE),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(rt)
    story.append(Spacer(1, 8))

    # 08 Client voice
    story.append(heading("08", S[7][1], S[7][0]))
    story.append(Paragraph(f"&ldquo;{d['quote']}&rdquo;", ss["Quote"]))
    story.append(Paragraph(f"— {d['quote_by']}", ss["QuoteBy"]))
    story.append(Spacer(1, 8))

    # 09 Talk to us
    story.append(heading("09", S[8][1], S[8][0]))
    story.append(Paragraph(L["talk"], ss["Body"]))
    story.append(Paragraph(
        f"<b>{L['group']}</b><br/>{OFFICE}<br/>{CORP}<br/>"
        f"{PHONE} &nbsp;·&nbsp; {EMAIL} &nbsp;·&nbsp; {WEB}", ss["BodyLeft"]))

    doc.build(story)
    print(f"[en] {out} ({os.path.getsize(out):,} bytes)")


# ===========================================================================
# Bangla edition — HTML -> headless Chromium (Noto Sans Bengali shaping)
# ===========================================================================
import base64

SETTINGS_PATH = "/dev-server/scripts/page-settings.json"


def _load_settings():
    with open(SETTINGS_PATH, encoding="utf-8") as f:
        return json.load(f)


def _data_uri(path: str) -> str:
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    ext = "png" if path.lower().endswith(".png") else "jpeg"
    return f"data:image/{ext};base64,{b64}"


def _header_template(settings) -> str:
    img = _data_uri(os.path.join("/dev-server", settings["header"]["image"]))
    h = settings["header"]["heightMm"]
    return f"""
    <div style="margin:0;padding:0;width:100%;-webkit-print-color-adjust:exact;">
      <img src="{img}" style="display:block;width:100%;height:{h}mm;object-fit:cover;object-position:top;" />
    </div>
    """


def _footer_template(settings) -> str:
    img = _data_uri(os.path.join("/dev-server", settings["footer"]["image"]))
    fh = settings["footer"]["heightMm"]
    pn = settings["footer"].get("pageNumber", {})
    size = pn.get("fontSizePt", 8)
    span_style = ("font-size:%spt;color:%s;font-family:Helvetica,Arial,sans-serif;"
                  "font-weight:600;letter-spacing:0.06em;line-height:1;"
                  % (size, pn.get("color", "#FFFFFF")))
    fmt = (pn.get("format", "Page {page} / {total}")
           .replace("{page}", f"<span class='pageNumber' style=\"{span_style}\"></span>")
           .replace("{total}", f"<span class='totalPages' style=\"{span_style}\"></span>"))
    return f"""
    <div style="margin:0;padding:0;width:100%;height:{fh}mm;position:relative;
                -webkit-print-color-adjust:exact;print-color-adjust:exact;">
      <img src="{img}" style="display:block;width:100%;height:{fh}mm;object-fit:cover;object-position:bottom;position:absolute;inset:0;" />
      <div style="position:absolute;right:{pn.get('marginRightMm', 14)}mm;bottom:{pn.get('marginBottomMm', 6)}mm;
                  {span_style}background:rgba(255,255,255,0.18);
                  border:0.5pt solid rgba(255,255,255,0.55);
                  padding:1.6pt 8pt;border-radius:99pt;">
        {fmt}
      </div>
    </div>
    """


BN_CSS = """
@page { size: A4; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Noto Sans Bengali', 'Noto Sans', sans-serif;
  color: #2B2B2B; font-size: 10.5pt; line-height: 1.62;
}
h1 { font-size: 30pt; line-height: 1.15; color: #0F2350; margin: 0 0 6pt; font-weight: 700; }
.kicker { color: #B9892F; font-weight: 700; font-size: 9pt; letter-spacing: 0.14em; margin: 0 0 8pt; }
.tagline { font-size: 13pt; color: #2B2B2B; font-style: italic; margin: 0 0 8pt; }
.meta { color: #5A5A5A; font-size: 8.5pt; margin: 0 0 14pt; }
.kv { background: #F4F1EA; border: 0.8pt solid #D6D9DC; border-radius: 6pt; padding: 8pt 12pt; margin: 0 0 16pt; }
.kv-row { display: flex; gap: 10pt; padding: 3.5pt 0; border-bottom: 0.5pt solid #D6D9DC; }
.kv-row:last-child { border-bottom: none; }
.kv-k { width: 32mm; font-weight: 700; color: #0F2350; flex: none; }
.kv-v { flex: 1; }
.sec { margin: 0 0 14pt; page-break-inside: avoid; }
.sec-head { display: flex; gap: 10pt; align-items: flex-start; border-bottom: 1.1pt solid #B9892F; padding-bottom: 4pt; margin-bottom: 8pt; }
.sec-num { color: #B9892F; font-size: 20pt; font-weight: 700; line-height: 1; }
.sec-titles { }
.sec-k { color: #B9892F; font-size: 8pt; font-weight: 700; letter-spacing: 0.14em; margin: 0; }
.sec-t { color: #0F2350; font-size: 17pt; font-weight: 700; line-height: 1.2; margin: 1pt 0 0; }
p { margin: 0 0 7pt; text-align: justify; }
ul { margin: 0 0 7pt; padding-left: 16pt; }
li { margin: 0 0 3pt; }
h3 { color: #155E63; font-size: 11pt; margin: 9pt 0 4pt; }
.dl-t { color: #0F2350; font-weight: 700; margin: 6pt 0 1pt; }
.dl-d { margin: 0 0 7pt; text-align: justify; }
table.res { width: 100%; border-collapse: collapse; }
table.res td { padding: 5pt 8pt; border-bottom: 0.5pt solid #D6D9DC; }
table.res tr:first-child td { background: #F4F1EA; }
table.res td.v { text-align: right; color: #0F2350; font-weight: 700; width: 32mm; }
.quote { border-left: 2.5pt solid #B9892F; padding: 4pt 0 4pt 12pt; margin: 4pt 0 8pt; }
.quote p { color: #0F2350; font-style: italic; font-size: 11pt; margin: 0; }
.quote .by { color: #5A5A5A; font-size: 8.5pt; font-style: normal; margin-top: 4pt; }
.chips { margin: 0 0 4pt; }
.contact { background: #F4F1EA; border: 0.8pt solid #D6D9DC; border-radius: 6pt; padding: 8pt 12pt; font-size: 9.5pt; }
"""


def render_html_bn(v) -> str:
    d = v["bn"]
    L = BN_L
    S = L["sections"]

    def sec(i, body):
        n = bn_digits(f"{i + 1:02d}")
        kicker, title = S[i][1], S[i][0]
        return f"""
        <div class="sec">
          <div class="sec-head">
            <div class="sec-num">{n}</div>
            <div class="sec-titles"><p class="sec-k">{kicker}</p><p class="sec-t">{title}</p></div>
          </div>
          {body}
        </div>"""

    glance = [
        (L["parent"], L["group"]),
        (L["category"], d["category"]),
        (L["founded"], d["founded"]),
        (L["reach"], d["reach"]),
        (L["audience"], d["audience"]),
    ]
    if d.get("domain"):
        glance.append((L["web_label"], f"www.{d['domain']}"))
    glance_html = "".join(
        f'<div class="kv-row"><div class="kv-k">{k}</div><div class="kv-v">{val}</div></div>'
        for k, val in glance)

    body = f"""
    <div style="margin-top:8mm;">
      <p class="kicker">{L['doc_label']} · {d['category']}</p>
      <h1>{d['title']}</h1>
      <p class="tagline">{d['tagline']}</p>
      <p class="meta">{L['edition']} · {VERSION} · {GENERATED_BN}</p>
      <div class="kv">{glance_html}</div>
    </div>
    {sec(0, f"<p>{d['overview']}</p>")}
    {sec(1, "<ul>" + "".join(f"<li>{h}</li>" for h in d["highlights"]) + "</ul>")}
    {sec(2, f'<p class="chips">{" &nbsp;·&nbsp; ".join(d["services"])}</p>')}
    {sec(3, "".join(f'<p class="dl-t">{t}</p><p class="dl-d">{dd}</p>' for t, dd in d["features"]))}
    {sec(4, f"""<h3>{L['challenge']}</h3><p>{d['challenge']}</p>
        <h3>{L['solution']}</h3><p>{d['solution']}</p>
        <h3>{L['phases']}</h3>""" + "".join(
        f'<p class="dl-t">{bn_digits(i)}. {t}</p><p class="dl-d">{dd}</p>'
        for i, (t, dd) in enumerate(d["phases"], 1)))}
    {sec(5, f"<p>{', '.join(d['stack'])}</p>")}
    {sec(6, '<table class="res">' + "".join(
        f'<tr><td>{lbl}</td><td class="v">{val}</td></tr>' for lbl, val in d["results"]) + "</table>")}
    {sec(7, f"""<div class="quote"><p>&ldquo;{d['quote']}&rdquo;</p>
        <p class="by">— {d['quote_by']}</p></div>""")}
    {sec(8, f"""<p>{L['talk']}</p>
        <div class="contact"><b>{L['group']}</b><br/>{OFFICE}<br/>{CORP}<br/>
        {bn_digits(PHONE)} &nbsp;·&nbsp; {EMAIL} &nbsp;·&nbsp; {WEB}</div>""")}
    """
    return f"""<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8"/>
<title>{d['title']} — প্রজেক্ট প্রোফাইল ({VERSION})</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap"/>
<style>{BN_CSS}</style>
</head>
<body>
{body}
</body>
</html>"""


def build_bn(v):
    from playwright.sync_api import sync_playwright
    settings = _load_settings()
    html = render_html_bn(v)
    out = f"{OUT_DIR}/{v['slug']}-profile-bn.pdf"
    with tempfile.TemporaryDirectory() as td:
        html_path = os.path.join(td, "profile.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html)
        m = settings["margins"]
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path="/bin/chromium",
                                        args=["--no-sandbox", "--disable-gpu"])
            page = browser.new_context().new_page()
            page.goto(f"file://{html_path}", wait_until="networkidle")
            page.pdf(
                path=out,
                format=settings.get("format", "A4"),
                landscape=(settings.get("orientation") == "landscape"),
                print_background=True,
                display_header_footer=True,
                header_template=_header_template(settings),
                footer_template=_footer_template(settings),
                margin={"top": m["top"], "right": m["right"],
                        "bottom": m["bottom"], "left": m["left"]},
                prefer_css_page_size=False,
            )
            browser.close()
    print(f"[bn] {out} ({os.path.getsize(out):,} bytes)")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for v in VENTURES:
        build_en(v)
    for v in VENTURES:
        build_bn(v)
    print(f"Done — {len(VENTURES) * 2} PDFs in {OUT_DIR}")


if __name__ == "__main__":
    main()
