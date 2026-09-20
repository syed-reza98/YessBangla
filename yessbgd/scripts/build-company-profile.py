"""
Yess Bangla — Company Profile generator (PDF only).

Produces an international-quality 17-section corporate profile in A4
portrait, with the official letterhead JPEG painted as a full-page
background on every page.

Design notes
------------
* Cover: editorial display title, kicker, document classification strip,
  and a structured "at-a-glance" card.
* Section headings: large numbered chip (01, 02, …) paired with the title
  and a thin gold rule for clear visual hierarchy.
* Table of Contents: rendered with dot leaders and right-aligned page
  numbers using ReportLab's `TableOfContents` flowable + `multiBuild`
  (two-pass) so page numbers are accurate.
* Accessibility: PDF carries `/Lang`, `/DisplayDocTitle` and a bookmark
  outline tree built from section anchors.
"""
from __future__ import annotations
import datetime
import json
import os

# Single source of truth — mirrors src/lib/companyContact.ts.
with open("/dev-server/src/data/company-contact.json", encoding="utf-8") as _f:
    CONTACT = json.load(_f)
PHONE = CONTACT["phone"]["display"]
EMAIL = CONTACT["email"]
WEB = CONTACT["web"]
OFFICE = CONTACT["office"]
CORP_OFFICE = CONTACT["corporateOffice"]

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether, FrameBreak,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfgen import canvas as _canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

LETTERHEAD = "/dev-server/public/yess-bangla-letterhead.jpeg"
PDF_OUT = "/dev-server/public/yess-bangla-company-profile.pdf"

VERSION = "v2.0"
GENERATED = datetime.date.today().strftime("%d %B %Y")
DOC_TITLE = "Yess Bangla — Company Profile"
DOC_AUTHOR = "Yess Bangla Private Limited"
EDITION = "International English Edition"

# ---------------------------------------------------------------------------
# Font registration — embed real TTFs (with subsetting) so the document
# looks identical on every reader / OS, instead of relying on the base-14
# Helvetica metrics that are NOT embedded.
# ---------------------------------------------------------------------------
LIBERATION_DIR = (
    "/nix/store/0hdgmcjy7q8zn7h3amz8nf96l9qh7wv0-liberation-fonts-2.1.5/"
    "share/fonts/truetype"
)
BODY_FONT = "YBSans"
BODY_BOLD = "YBSans-Bold"
BODY_ITALIC = "YBSans-Italic"
BODY_BOLDITALIC = "YBSans-BoldItalic"

def _register_fonts():
    pdfmetrics.registerFont(TTFont(BODY_FONT,
        f"{LIBERATION_DIR}/LiberationSans-Regular.ttf", subfontIndex=0))
    pdfmetrics.registerFont(TTFont(BODY_BOLD,
        f"{LIBERATION_DIR}/LiberationSans-Bold.ttf", subfontIndex=0))
    pdfmetrics.registerFont(TTFont(BODY_ITALIC,
        f"{LIBERATION_DIR}/LiberationSans-Italic.ttf", subfontIndex=0))
    pdfmetrics.registerFont(TTFont(BODY_BOLDITALIC,
        f"{LIBERATION_DIR}/LiberationSans-BoldItalic.ttf", subfontIndex=0))
    from reportlab.pdfbase.pdfmetrics import registerFontFamily
    registerFontFamily(BODY_FONT, normal=BODY_FONT, bold=BODY_BOLD,
                       italic=BODY_ITALIC, boldItalic=BODY_BOLDITALIC)

_register_fonts()

# ---------------------------------------------------------------------------
# Content model
# ---------------------------------------------------------------------------

SECTIONS = [
    {"id": "sec01", "number": "01", "title": "Message from the Management",
     "kicker": "Foreword",
     "body": [
        ("p", "At Yess Bangla, we believe a modern Bangladesh deserves a modern enterprise group — one that combines the discipline of international business with deep local insight. Over the past several years we have built a portfolio of complementary ventures spanning software, OTT streaming, digital journalism, legal advisory, organic commerce, hosting, on-demand services and events — with satellite television, travel, food and talent brands in development — all engineered to operate to international standards while remaining rooted in the communities we serve."),
        ("p", "Our promise to clients, partners, regulators and audiences is simple: integrity in every transaction, craft in every product, and responsibility in every public action. We invest in our people, in our technology stack and in long-term relationships because that is how durable companies are built."),
        ("p", "Whether you are a multinational evaluating a partner in South Asia, a Bangladeshi enterprise modernising your operations, or an investor considering long-term collaboration, this document offers a faithful account of who we are, what we do, and the standards we hold ourselves to."),
        ("sig", "— The Board of Directors, Yess Bangla Private Limited"),
     ]},
    {"id": "sec02", "number": "02", "title": "About Yess Bangla",
     "kicker": "The group",
     "body": [
        ("p", "Yess Bangla Private Limited is a Bangladesh-incorporated private company headquartered in Mirpur, Dhaka. The group operates eight active ventures and a development pipeline of five more brands spanning four strategic domains: Technology &amp; Digital, Media &amp; News, Commerce &amp; Lifestyle, and Professional Services."),
        ("p", "We design, build and operate digital products and services for enterprise clients, government bodies, broadcasters, advertisers and consumers. The group&#8217;s combined infrastructure — engineering teams, broadcast facilities, editorial newsroom, cloud platform, logistics network and event production capability — gives us the unusual ability to take an idea from concept to nationwide rollout entirely in-house."),
        ("h3", "At a glance"),
        ("kv", [
            ("Headquarters", "Dhaka, Bangladesh"),
            ("Group ventures", "8 operating · 5 in development"),
            ("Domains", "Technology · Media · Commerce · Services"),
            ("Engagement model", "Project, retainer, managed services, partnership"),
            ("Reach", "Nationwide Bangladesh, with diaspora &amp; export channels"),
            ("Languages", "Bangla · English"),
        ]),
     ]},
    {"id": "sec03", "number": "03", "title": "Vision, Mission &amp; Values",
     "kicker": "What we stand for",
     "body": [
        ("h3", "Vision"),
        ("p", "To be South Asia&#8217;s most trusted integrated enterprise group — building products, media and services that improve everyday life and earn international respect for Bangladeshi craftsmanship."),
        ("h3", "Mission"),
        ("ul", [
            "Deliver world-class technology and media to Bangladeshi clients and audiences.",
            "Operate every venture with full legal, ethical and editorial integrity.",
            "Invest continuously in our people, processes and platforms.",
            "Create durable economic value for clients, employees, partners and shareholders.",
        ]),
        ("h3", "Core values"),
        ("dl", [
            ("Integrity", "We say what we mean, deliver what we promise, and disclose what we know."),
            ("Craft", "We hold ourselves to international standards in engineering, journalism and design."),
            ("Responsibility", "We weigh the social and editorial consequences of every public action."),
            ("Service", "Clients, audiences and partners are the centre of every operating decision."),
            ("Innovation", "We back disciplined experimentation, not slogans."),
        ]),
     ]},
    {"id": "sec04", "number": "04", "title": "Corporate Structure",
     "kicker": "How the group is organised",
     "body": [
        ("p", "Yess Bangla Private Limited is the parent holding company. Each venture is operated as a focused business unit with its own brand, leadership, P&amp;L and editorial or product roadmap, while sharing central finance, HR, legal, infrastructure and brand governance functions at group level."),
        ("table", {
            "header": ["Domain", "Ventures", "Function"],
            "rows": [
                ["Technology &amp; Digital", "Yess Soft · Yess Host · Shondhaan", "Software engineering, web/mobile, ERP/CRM, cloud hosting, service marketplace"],
                ["Media &amp; News", "Akash OTT · The Daily Akash · Akash TV (upcoming)", "OTT streaming, digital newspaper, satellite TV (in development)"],
                ["Commerce &amp; Lifestyle", "Yess Organic Haat · Yess Tourism (upcoming) · Yess Food (upcoming)", "Organic marketplace, curated travel, F&amp;B"],
                ["Professional Services", "Yess Legal Advice · Yess Event · Yess Model (upcoming)", "Legal counsel, event management, talent agency"],
            ],
        }),
     ]},
    {"id": "sec05", "number": "05", "title": "Business Verticals &amp; Ventures",
     "kicker": "Eight brands live, five more coming",
     "body": [
        ("p", "Each Yess Bangla venture is a stand-alone brand with its own clients, products and editorial or product roadmap. Together they form an integrated portfolio that can address almost any modern business or consumer need. Eight brands are live today; five more are in active development."),
        ("dl", [
            ("Yess Soft — Software &amp; IT Solutions", "Custom software, web and mobile applications, ERP, CRM and enterprise systems built for modern businesses across Bangladesh and beyond."),
            ("Shondhaan — On-Demand Home &amp; Professional Services", "Bangladesh&#8217;s trusted on-demand services platform connecting vetted electricians, plumbers, technicians, cleaners and tutors with households and businesses — backed by service guarantees and instant digital booking."),
            ("Akash OTT — Streaming Platform", "A multi-device streaming service offering on-demand entertainment, originals, live channels and curated catalogues for Bangladeshi audiences worldwide."),
            ("The Daily Akash — Digital Newspaper", "An independent, digital-first national daily covering politics, business, sport, culture and technology with verified journalism and original reporting."),
            ("Yess Legal Advice — Legal &amp; Business Counsel", "Accessible legal advisory for individuals, startups and enterprises — company formation, contracts, compliance and dispute support from qualified counsel."),
            ("Yess Organic Haat — Organic Marketplace", "A direct-to-consumer organic marketplace connecting verified Bangladeshi farmers with urban households through cold-chain logistics and quality assurance."),
                        ("Yess Host — Hosting &amp; Cloud Infrastructure", "Managed shared, VPS, cloud and dedicated hosting with local data residency, 24/7 monitoring and enterprise-grade security."),
            ("Yess Event — Event Management", "Full-service event production for corporate launches, conferences, broadcast events, weddings and government programmes."),
        ]),
        ("pagebreak", None),
        ("h3", "Upcoming brands — in development"),
        ("dl", [
            ("Akash TV — Satellite Television", "A Bangla-language satellite channel in development, set to deliver news, entertainment, talk shows and cultural programming to millions of viewers."),
            ("Yess Tourism — Travel &amp; Hospitality", "Curated domestic and international travel packages with transparent pricing, guided experiences and doorstep service."),
            ("Yess Model — Modeling &amp; Talent Agency", "A talent agency representing models, presenters and creators across advertising, broadcast, fashion and digital campaigns."),
            ("Yess Food — Food &amp; Beverage", "An F&amp;B brand bringing authentic Bangladeshi flavours to modern outlets and packaged formats, with rigorous quality and hygiene standards."),
            ("Yess All in One Solution — Integrated Business Solutions", "A single point of contact for clients who want to combine multiple Yess Bangla services into a coordinated programme of work."),
        ]),
     ]},
    {"id": "sec06", "number": "06", "title": "Capabilities &amp; Service Lines",
     "kicker": "What we deliver",
     "body": [
        ("dl", [
            ("Software engineering", "Custom enterprise software, ERP, CRM, e-commerce, fintech, EdTech and bespoke web/mobile apps."),
            ("On-demand services", "Vetted home and business services, digital booking, service guarantees and workforce quality assurance."),
            ("Digital streaming", "OTT platform engineering, content packaging, DRM, monetisation, multi-device playback and subscriber operations."),
            ("Editorial &amp; journalism", "National digital newsroom, investigative reporting, multimedia storytelling and editorial standards aligned with international press codes."),
            ("Cloud &amp; infrastructure", "Managed hosting, cloud architecture, DevOps, cybersecurity, SLA-backed monitoring and disaster recovery."),
            ("E-commerce &amp; logistics", "Direct-to-consumer marketplaces, supplier onboarding, cold-chain handling, last-mile delivery and digital payments."),
            ("Professional &amp; legal services", "Legal advisory, event production, talent management and integrated cross-venture programmes."),
            ("Brand, design &amp; content", "Identity systems, art direction, photography, video, motion graphics and integrated campaigns across earned and paid media."),
        ]),
     ]},
    {"id": "sec07", "number": "07", "title": "Technology &amp; Quality Standards",
     "kicker": "How we engineer and operate",
     "body": [
        ("p", "We engineer and operate to international standards. Our platforms are built on modern, supported technology with documented architecture, automated testing, code review and continuous deployment. Our broadcast and editorial operations follow internationally recognised codes for accuracy, fairness and source protection."),
        ("h3", "Engineering"),
        ("ul", [
            "TypeScript / Node.js · React · Next.js · TanStack · Tailwind for product engineering.",
            "PostgreSQL · Redis · S3-compatible storage · serverless and container workloads.",
            "Cloud-native deployments on AWS, GCP and on-prem with infrastructure-as-code.",
            "Mandatory code review, unit + integration tests, accessibility (WCAG 2.2 AA) and Lighthouse performance budgets.",
            "Security: OWASP ASVS-aligned reviews, secrets management, RBAC and audited access logs.",
        ]),
        ("h3", "Broadcast &amp; editorial"),
        ("ul", [
            "Editorial standards based on internationally recognised press codes.",
            "Two-source verification policy for original reporting; corrections issued transparently.",
            "Source protection, contributor safety and on-call legal review for sensitive stories.",
            "Broadcast technical standards: HD ingest, redundant playout, captioned content where required.",
        ]),
        ("h3", "Operations"),
        ("ul", [
            "Documented Standard Operating Procedures across finance, HR, IT and editorial.",
            "Quarterly internal review and continuous improvement cycle.",
            "Vendor due-diligence and KYC for all material counterparties.",
        ]),
     ]},
    {"id": "sec08", "number": "08", "title": "Clients, Audience &amp; Market Reach",
     "kicker": "Who we serve",
     "body": [
        ("p", "Our clients and audiences span enterprise, government, SME, consumer and diaspora segments. The combined Yess Bangla ecosystem reaches Bangladeshi viewers, readers, shoppers and professionals every day, in every major division of the country and across the Bengali-speaking diaspora."),
        ("table", {
            "header": ["Segment", "Examples", "Engagement"],
            "rows": [
                ["Enterprise", "Banks, telcos, manufacturers, conglomerates", "Custom platforms, managed services, retainers"],
                ["Government &amp; NGO", "Public agencies, development partners", "RFP delivery, civic media, infrastructure"],
                ["SME &amp; startups", "Growth-stage Bangladeshi businesses", "Web, mobile, hosting, brand, content"],
                ["Consumers", "Urban and peri-urban households", "OTT, news, organic groceries, on-demand services"],
                ["Advertisers", "Local and global brands", "Digital media inventory across Akash OTT and The Daily Akash"],
            ],
        }),
     ]},
    {"id": "sec09", "number": "09", "title": "Track Record &amp; Milestones",
     "kicker": "Our journey so far",
     "body": [
        ("dl", [
            ("Foundation", "Yess Bangla Private Limited incorporated in Dhaka with a long-term vision of building an integrated Bangladeshi enterprise group."),
            ("Technology launch", "Yess Soft and Yess Host established to deliver enterprise software and managed hosting to Bangladeshi clients."),
            ("Media expansion", "Akash OTT streaming platform and The Daily Akash digital newspaper launched; Akash TV satellite channel enters development."),
            ("Commerce &amp; lifestyle", "Yess Organic Haat launched to bring verified organic products to urban households; Yess Tourism, Yess Food and Yess Model enter development."),
            ("Service network", "Shondhaan, Yess Event and Yess Legal Advice rolled out to deliver on-demand services, events and legal counsel across Bangladesh."),
            ("Group consolidation", "All ventures unified under a single brand governance framework with shared standards in finance, IT, legal and HR."),
        ]),
     ]},
    {"id": "sec10", "number": "10", "title": "Corporate Social Responsibility",
     "kicker": "Responsibility as operating principle",
     "body": [
        ("p", "Yess Bangla treats responsible business as a core operating principle, not an afterthought. We invest a portion of group revenue into long-term programmes that strengthen the communities we serve."),
        ("dl", [
            ("Digital literacy", "Free workshops and training material to help students, women entrepreneurs and small business owners adopt digital tools."),
            ("Public-interest journalism", "The Daily Akash and Akash OTT commit column space and screen time to under-reported stories of national importance."),
            ("Farmer livelihoods", "Yess Organic Haat works directly with smallholder farmers, paying transparent prices and investing in cold-chain training."),
            ("Workforce inclusion", "Equal-opportunity recruitment, on-the-job training and pathways for fresh graduates from outside the capital."),
            ("Environment", "Energy-efficient infrastructure, paperless operations and active reduction of single-use packaging across our supply chain."),
        ]),
     ]},
    {"id": "sec11", "number": "11", "title": "Compliance, Governance &amp; Confidentiality",
     "kicker": "Standards we hold ourselves to",
     "body": [
        ("h3", "Corporate governance"),
        ("ul", [
            "Board of Directors with formally documented roles and meeting cadence.",
            "Annual statutory audit by an independent chartered accountancy firm.",
            "Conflict-of-interest, anti-bribery and gifts &amp; hospitality policies.",
            "Whistleblower channel for confidential reporting of misconduct.",
        ]),
        ("h3", "Regulatory compliance"),
        ("ul", [
            "Registered with the Registrar of Joint Stock Companies and Firms (RJSC), Bangladesh.",
            "Tax-registered (TIN, VAT) and compliant with annual filing obligations.",
            "Broadcast operations follow the licensing and content rules of relevant national authorities.",
            "Editorial output adheres to the Press Council of Bangladesh code of conduct.",
        ]),
        ("h3", "Data protection &amp; confidentiality"),
        ("ul", [
            "Documented information-security policy covering access, storage and incident response.",
            "Mutual NDA available for all client engagements; client data is not used for internal training without explicit consent.",
            "Right-of-correction and data-removal requests handled by a named Data Protection contact.",
        ]),
     ]},
    {"id": "sec12", "number": "12", "title": "Leadership Team",
     "kicker": "How we are led",
     "body": [
        ("p", "The group is led by a small, accountable executive team supported by venture-level managing directors and functional heads across finance, operations, technology, editorial and brand."),
        ("table", {
            "header": ["Function", "Responsibility"],
            "rows": [
                ["Board of Directors", "Strategy, capital allocation, governance, risk oversight"],
                ["Group Managing Director", "Operating performance and cross-venture coordination"],
                ["Chief Operating Officer", "Day-to-day operations, SLAs, vendor management"],
                ["Chief Technology Officer", "Engineering standards, security, platform roadmap"],
                ["Editor-in-Chief (Media)", "Editorial integrity across Akash OTT and The Daily Akash"],
                ["Head of Finance", "Treasury, audit, statutory compliance"],
                ["Head of People &amp; Culture", "Recruitment, training, welfare, diversity"],
                ["Head of Brand &amp; Communications", "Group identity, PR, partnership marketing"],
            ],
        }),
        ("p", "Detailed CVs of named officers are available on request, subject to mutual NDA."),
     ]},
    {"id": "sec13", "number": "13", "title": "Why Choose Yess Bangla",
     "kicker": "Our differentiators",
     "body": [
        ("dl", [
            ("One partner, many capabilities", "Software, OTT, journalism, legal counsel, e-commerce, hosting, services and events under a single brand and contract framework."),
            ("Local depth, international standards", "Deep Bangladeshi market knowledge combined with internationally recognised engineering, editorial and operational practices."),
            ("Accountable governance", "Documented policies, statutory audit, named functional leads and a board that meets regularly."),
            ("End-to-end delivery", "From discovery and architecture through build, launch, operation and continuous improvement — all in-house."),
            ("Long-term relationships", "We design for durability — clients, employees and partners stay with us because we treat the relationship as the product."),
        ]),
     ]},
    {"id": "sec14", "number": "14", "title": "Contact &amp; Engagement",
     "kicker": "Talk to us",
     "body": [
        ("p", "We welcome enquiries from enterprise clients, government and development partners, advertisers, investors and prospective employees. Initial discussions are confidential and obligation-free."),
        ("h3", "Yess Bangla Private Limited"),
        ("kv", [
            ("Office", OFFICE),
            ("Corporate office", CORP_OFFICE),
            ("Cell", PHONE),
            ("Email", EMAIL),
            ("Web", WEB),
        ]),
        ("p", "<i>This document is the property of Yess Bangla Private Limited. It is provided in confidence for evaluation purposes only and may not be reproduced, redistributed or quoted in part or whole without prior written consent.</i>"),
     ]},
]

# ---------------------------------------------------------------------------
# Brand palette
# ---------------------------------------------------------------------------
NAVY = HexColor("#0E2A3A")
NAVY_DEEP = HexColor("#081B26")
TEAL = HexColor("#0F4C5C")
GOLD = HexColor("#C9A24A")
INK = HexColor("#1A1A1A")
MUTED = HexColor("#5A5A5A")
RULE = HexColor("#D6D9DC")
SURFACE = HexColor("#F4F1EA")  # warm cream that complements navy/gold

# ---------------------------------------------------------------------------
# PDF
# ---------------------------------------------------------------------------
PAGE_W, PAGE_H = A4
M_LEFT = 22 * mm
M_RIGHT = 22 * mm
M_TOP = 47 * mm   # below the printed letterhead band
M_BOTTOM = 32 * mm  # above the navy footer band

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="Body", parent=styles["BodyText"], fontName=BODY_FONT,
    fontSize=10.5, leading=15.5, textColor=INK, spaceAfter=6,
    alignment=TA_JUSTIFY))
styles.add(ParagraphStyle(
    name="BodyLeft", parent=styles["BodyText"], fontName=BODY_FONT,
    fontSize=10.5, leading=15.5, textColor=INK, spaceAfter=4,
    alignment=TA_LEFT))
styles.add(ParagraphStyle(
    name="H3", parent=styles["Heading3"], fontName=BODY_BOLD,
    fontSize=11.5, leading=15, textColor=TEAL,
    spaceBefore=10, spaceAfter=4))
styles.add(ParagraphStyle(
    name="Bullet2", parent=styles["BodyText"], fontName=BODY_FONT,
    fontSize=10.5, leading=15.5, textColor=INK,
    leftIndent=14, bulletIndent=2, spaceAfter=2, alignment=TA_LEFT))
styles.add(ParagraphStyle(
    name="DLTerm", parent=styles["BodyText"], fontName=BODY_BOLD,
    fontSize=10.5, leading=14, textColor=NAVY, spaceAfter=1))
styles.add(ParagraphStyle(
    name="DLDef", parent=styles["BodyText"], fontName=BODY_FONT,
    fontSize=10.5, leading=15.5, textColor=INK, spaceAfter=8,
    alignment=TA_JUSTIFY))

# Cover styles
styles.add(ParagraphStyle(
    name="CoverEyebrow", parent=styles["BodyText"], fontName=BODY_BOLD,
    fontSize=9, leading=12, textColor=GOLD, spaceAfter=10,
    alignment=TA_LEFT))
styles.add(ParagraphStyle(
    name="CoverTitle", parent=styles["Title"], fontName=BODY_BOLD,
    fontSize=44, leading=48, textColor=NAVY, alignment=TA_LEFT,
    spaceAfter=8))
styles.add(ParagraphStyle(
    name="CoverSubtitle", parent=styles["BodyText"], fontName=BODY_FONT,
    fontSize=13.5, leading=20, textColor=INK, alignment=TA_LEFT,
    spaceAfter=12))
styles.add(ParagraphStyle(
    name="CoverMeta", parent=styles["BodyText"], fontName=BODY_FONT,
    fontSize=9, leading=13, textColor=MUTED, alignment=TA_LEFT))

# Section heading styles
styles.add(ParagraphStyle(
    name="SecKicker", parent=styles["BodyText"], fontName=BODY_BOLD,
    fontSize=8.5, leading=11, textColor=GOLD, spaceAfter=4,
    alignment=TA_LEFT))
styles.add(ParagraphStyle(
    name="SecTitle", parent=styles["Title"], fontName=BODY_BOLD,
    fontSize=22, leading=26, textColor=NAVY, alignment=TA_LEFT,
    spaceAfter=12))

# TOC styles (used by TableOfContents flowable)
styles.add(ParagraphStyle(
    name="TOCHeading", parent=styles["Title"], fontName=BODY_BOLD,
    fontSize=22, leading=26, textColor=NAVY, alignment=TA_LEFT,
    spaceAfter=18))
TOC_ENTRY = ParagraphStyle(
    name="TOCEntry", parent=styles["BodyText"], fontName=BODY_FONT,
    fontSize=11, leading=22, textColor=NAVY, leftIndent=0, firstLineIndent=0)


# ---------------------------------------------------------------------------
# Doc template — paints the letterhead background + meta strap on each page
# ---------------------------------------------------------------------------
class ProfileDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kw):
        super().__init__(
            filename, pagesize=A4,
            leftMargin=M_LEFT, rightMargin=M_RIGHT,
            topMargin=M_TOP, bottomMargin=M_BOTTOM,
            title=DOC_TITLE, author=DOC_AUTHOR,
            subject="Company profile",
            creator="Yess Bangla document engine",
            keywords="Yess Bangla, company profile, Bangladesh, enterprise group")
        frame = Frame(self.leftMargin, self.bottomMargin,
                      self.width, self.height, id="content",
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([
            PageTemplate(id="main", frames=[frame], onPage=self._on_page),
        ])
        # Pages that should keep the letterhead at full strength.
        # Page 1 (cover) is always included; TOC + section heading pages are
        # discovered during multiBuild via afterFlowable and persist across
        # passes so the final pass paints them at full opacity.
        self.full_color_pages: set[int] = {1}
        # Faded watermark opacity for inner content pages.
        self.watermark_alpha: float = 0.18

    def _on_page(self, canvas: _canvas.Canvas, doc):
        canvas.saveState()
        full = doc.page in self.full_color_pages
        # Letterhead background — full colour on cover/TOC/section openers,
        # faded on every other (inner) page so body copy reads cleanly.
        try:
            if not full:
                canvas.setFillAlpha(self.watermark_alpha)
                canvas.setStrokeAlpha(self.watermark_alpha)
            canvas.drawImage(LETTERHEAD, 0, 0, width=PAGE_W, height=PAGE_H,
                             preserveAspectRatio=False, mask="auto")
        except Exception:
            pass
        canvas.restoreState()
        # Meta strap above the navy footer band — always at full opacity.
        canvas.saveState()
        meta_y = M_BOTTOM - 6 * mm
        canvas.setFont(BODY_FONT, 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(M_LEFT, meta_y, "Confidential · For intended recipient")
        canvas.drawCentredString(PAGE_W / 2, meta_y,
                                 f"{DOC_TITLE} · {VERSION} · {GENERATED}")
        canvas.drawRightString(PAGE_W - M_RIGHT, meta_y, f"Page {doc.page}")
        canvas.restoreState()

    def afterFlowable(self, flowable):
        # Bookmark + outline tree
        if hasattr(flowable, "_bookmarkName"):
            self.canv.bookmarkPage(flowable._bookmarkName)
            self.canv.addOutlineEntry(
                getattr(flowable, "_outlineText", flowable._bookmarkName),
                flowable._bookmarkName,
                level=getattr(flowable, "_outlineLevel", 0),
                closed=False)
            # Cover, Contents, and each top-level section opener should keep
            # the letterhead at full strength. Track the page they land on.
            if getattr(flowable, "_outlineLevel", 0) == 0:
                self.full_color_pages.add(self.page)
        # Notify TOC
        if hasattr(flowable, "_tocEntry"):
            level, text, anchor = flowable._tocEntry
            self.notify("TOCEntry", (level, text, self.page, anchor))
            if level == 0:
                self.full_color_pages.add(self.page)


# ---------------------------------------------------------------------------
# Cover-only template — no top margin offset for letterhead, full-page art
# ---------------------------------------------------------------------------
class CoverDocTemplate(ProfileDocTemplate):
    """Same as ProfileDocTemplate but the first page uses a cover frame
    that starts higher on the page to allow the editorial title block."""


# ---------------------------------------------------------------------------
# Flowable helpers
# ---------------------------------------------------------------------------
class AnchorPara(Paragraph):
    """Paragraph that registers itself as a bookmark + TOC entry."""
    def __init__(self, text, style, anchor: str, outline_level: int = 0,
                 outline_text: str | None = None, toc_entry=None):
        super().__init__(text, style)
        self._bookmarkName = anchor
        self._outlineLevel = outline_level
        self._outlineText = outline_text or text
        if toc_entry is not None:
            self._tocEntry = toc_entry  # (level, text, anchor)


from reportlab.platypus import Flowable


class TocAnchor(Flowable):
    """Zero-height top-level flowable that emits a bookmark + TOC entry.

    Placed BEFORE composite section headings (which wrap content in a Table,
    hiding inner Paragraph afterFlowable callbacks from the doc template).
    """
    def __init__(self, anchor: str, toc_text: str, outline_text: str,
                 outline_level: int = 0):
        super().__init__()
        self._bookmarkName = anchor
        self._outlineText = outline_text
        self._outlineLevel = outline_level
        self._tocEntry = (outline_level, toc_text, anchor)

    def wrap(self, w, h):
        return (0, 0)

    def draw(self):
        pass


def kv_table(rows):
    data = [[Paragraph(f"{k}", styles["DLTerm"]),
             Paragraph(v, styles["BodyLeft"])] for k, v in rows]
    t = Table(data, colWidths=[55 * mm, None])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.25, RULE),
    ]))
    return t


def data_table(spec):
    header = spec["header"]
    rows = spec["rows"]
    data = [[Paragraph(c, ParagraphStyle(
                "h", parent=styles["BodyLeft"], fontName=BODY_BOLD,
                textColor=HexColor("#FFFFFF"), fontSize=9.5, leading=12))
             for c in header]]
    for r in rows:
        data.append([Paragraph(c, styles["BodyLeft"]) for c in r])
    n = len(header)
    if n == 3:
        widths = [38 * mm, 60 * mm, None]
    else:
        widths = [60 * mm, None]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), HexColor("#FFFFFF")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [HexColor("#FFFFFF"), HexColor("#F8F6F1")]),
        ("LINEBELOW", (0, 0), (-1, -1), 0.25, RULE),
        ("BOX", (0, 0), (-1, -1), 0.5, NAVY),
    ]))
    return t


# Section heading: numbered chip (NN) + kicker + title + gold rule
def section_heading(num: str, kicker: str, title: str, anchor: str):
    # Build a 2-col table: left = navy chip with the number; right = kicker + title
    chip = Table(
        [[Paragraph(f'<font color="#FFFFFF">{num}</font>',
                    ParagraphStyle("chipNum", fontName=BODY_BOLD,
                                   fontSize=20, leading=22,
                                   alignment=TA_CENTER, textColor=HexColor("#FFFFFF")))]],
        colWidths=[20 * mm], rowHeights=[20 * mm])
    chip.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
    ]))

    title_block = [
        Paragraph(kicker.upper(), styles["SecKicker"]),
        Paragraph(title, styles["SecTitle"]),
    ]

    head = Table([[chip, title_block]],
                 colWidths=[24 * mm, None])
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    # Gold rule below
    rule = Table([[""]], colWidths=[None], rowHeights=[2])
    rule.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))

    marker = TocAnchor(
        anchor=anchor,
        toc_text=f"{num}  ·  {title}",
        outline_text=f"{num} · {title.replace('&amp;', '&')}",
        outline_level=0,
    )
    return [marker, KeepTogether([head, Spacer(1, 6), rule, Spacer(1, 12)])]


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------
def build_pdf():
    doc = ProfileDocTemplate(PDF_OUT)
    story = []

    # ---- Cover ---------------------------------------------------------
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        f"YESS BANGLA PRIVATE LIMITED · DHAKA &nbsp;·&nbsp; {EDITION.upper()}",
        styles["CoverEyebrow"]))
    story.append(AnchorPara("Company Profile",
                            styles["CoverTitle"], anchor="cover",
                            outline_level=0, outline_text="Cover"))
    story.append(Paragraph(
        "An integrated enterprise group delivering software, digital streaming, "
        "journalism, legal counsel, organic commerce, hosting, on-demand "
        "services and events across Bangladesh and beyond.",
        styles["CoverSubtitle"]))
    story.append(Spacer(1, 6 * mm))

    # Classification strip
    strip = Table(
        [[Paragraph(f'<font color="#FFFFFF"><b>CONFIDENTIAL</b> · '
                    f'For intended recipient · {EDITION} · {VERSION} · {GENERATED}</font>',
                    ParagraphStyle("strip", fontName=BODY_FONT,
                                   fontSize=8.5, leading=11,
                                   textColor=HexColor("#FFFFFF"),
                                   alignment=TA_LEFT))]],
        colWidths=[None])
    strip.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), NAVY),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    story.append(strip)
    story.append(Spacer(1, 8 * mm))

    # At-a-glance card
    glance_inner = kv_table([
        ("Legal name", "Yess Bangla Private Limited"),
        ("Incorporation", "Private Limited Company, Bangladesh"),
        ("Registered office", OFFICE),
        ("Corporate office", CORP_OFFICE),
        ("Cell", PHONE),
        ("Email", EMAIL),
        ("Web", WEB),
        ("Sector", "Technology · Media · News · E-commerce · Professional services"),
        ("Operating ventures", "8 operating brands · 5 in development"),
        ("Languages", "Bangla &amp; English (this edition: English)"),
        ("Document version", f"{VERSION} · Generated {GENERATED} · {EDITION}"),
    ])
    glance_card = Table([[glance_inner]], colWidths=[None])
    glance_card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#FFFFFF")),
        ("BOX", (0, 0), (-1, -1), 0.5, RULE),
        ("LINEABOVE", (0, 0), (-1, 0), 2, GOLD),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
    ]))
    story.append(glance_card)
    story.append(PageBreak())

    # ---- Contents (auto-paginated TOC, 2-pass build) -------------------
    story.append(AnchorPara("Contents", styles["TOCHeading"], anchor="contents",
                            outline_level=0, outline_text="Contents"))
    toc = TableOfContents()
    toc.dotsMinLevel = 0
    toc.levelStyles = [TOC_ENTRY]
    story.append(toc)
    story.append(PageBreak())

    # ---- Sections ------------------------------------------------------
    for s in SECTIONS:
        story.extend(section_heading(s["number"], s["kicker"], s["title"], s["id"]))
        for kind, payload in s["body"]:
            if kind == "p":
                story.append(Paragraph(payload, styles["Body"]))
            elif kind == "h3":
                story.append(Paragraph(payload, styles["H3"]))
            elif kind == "ul":
                for item in payload:
                    story.append(Paragraph(item, styles["Bullet2"], bulletText="•"))
            elif kind == "dl":
                for k, v in payload:
                    story.append(Paragraph(k, styles["DLTerm"]))
                    story.append(Paragraph(v, styles["DLDef"]))
            elif kind == "kv":
                story.append(kv_table(payload))
            elif kind == "table":
                story.append(data_table(payload))
            elif kind == "sig":
                story.append(Spacer(1, 8))
                story.append(Paragraph(
                    f'<font color="#0E2A3A"><b>{payload}</b></font>',
                    styles["BodyLeft"]))
            elif kind == "pagebreak":
                story.append(PageBreak())
        story.append(PageBreak())

    if story and isinstance(story[-1], PageBreak):
        story.pop()

    # multiBuild for accurate TOC page numbers
    doc.multiBuild(story)

    # Patch /Lang into the PDF catalog for screen readers.
    _add_lang_to_pdf(PDF_OUT, "en-GB")
    print(f"[pdf] wrote {PDF_OUT} ({os.path.getsize(PDF_OUT):,} bytes)")


def _add_lang_to_pdf(path, lang):
    from pypdf import PdfReader, PdfWriter
    from pypdf.generic import (NameObject, TextStringObject,
                                BooleanObject, DictionaryObject)
    reader = PdfReader(path)
    writer = PdfWriter(clone_from=reader)
    writer._root_object[NameObject("/Lang")] = TextStringObject(lang)
    vp = DictionaryObject()
    vp[NameObject("/DisplayDocTitle")] = BooleanObject(True)
    writer._root_object[NameObject("/ViewerPreferences")] = vp
    with open(path, "wb") as f:
        writer.write(f)


if __name__ == "__main__":
    build_pdf()
