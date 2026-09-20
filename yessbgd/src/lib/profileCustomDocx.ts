// Client-side custom venture-profile DOCX export.
//
// Builds an editable Word document containing ONLY the sections the user
// picked, with the exact same wording as the official generated profiles
// (src/data/ventureProfiles.json is dumped from the same Python dataset
// that builds the PDF/DOCX files). The official letterhead pad floats
// behind the text on every page, mirroring the server-built documents.

import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import profilesData from "@/data/ventureProfiles.json";

export type ProfileLang = "en" | "bn";

export type ProfileSectionKey =
  | "overview"
  | "highlights"
  | "facts"
  | "audience"
  | "services"
  | "strengths"
  | "case"
  | "phases"
  | "stack"
  | "results"
  | "quote"
  | "contact";

export interface ProfileSectionDef {
  key: ProfileSectionKey;
  en: string;
  bn: string;
}

export const PROFILE_SECTIONS: ProfileSectionDef[] = [
  { key: "overview", en: "Overview", bn: "সংক্ষিপ্ত বিবরণ" },
  { key: "highlights", en: "Highlights", bn: "মূল বৈশিষ্ট্য" },
  { key: "facts", en: "At a glance", bn: "এক নজরে" },
  { key: "audience", en: "Audience", bn: "লক্ষ্য দর্শক" },
  { key: "services", en: "Services", bn: "সেবাসমূহ" },
  { key: "strengths", en: "Signature strengths", bn: "স্বাক্ষর শক্তি" },
  { key: "case", en: "Case study", bn: "কেস স্টাডি" },
  { key: "phases", en: "Delivery phases", bn: "ডেলিভারি ধাপ" },
  { key: "stack", en: "Technology stack", bn: "প্রযুক্তি স্ট্যাক" },
  { key: "results", en: "Measured outcomes", bn: "প্রমাণিত ফলাফল" },
  { key: "quote", en: "What clients say", bn: "ক্লায়েন্ট মতামত" },
  { key: "contact", en: "Talk to us", bn: "যোগাযোগ" },
];

interface VentureProfileContent {
  category: string;
  title: string;
  tagline: string;
  overview: string;
  highlights: string[];
  founded: string;
  reach: string;
  domain: string;
  audience: string;
  services: string[];
  features: [string, string][];
  challenge: string;
  solution: string;
  phases: [string, string][];
  stack: string[];
  results: [string, string][];
  quote?: string;
  quote_by?: string;
}

interface ProfilesDataset {
  contact: {
    legalName: string;
    phone: string;
    email: string;
    web: string;
    office: string;
  };
  ventures: Record<string, { en: VentureProfileContent; bn: VentureProfileContent }>;
}

const DATA = profilesData as unknown as ProfilesDataset;

export function hasProfileData(slug: string): boolean {
  return Boolean(DATA.ventures[slug]);
}

const NAVY = "0F2350";
const GOLD = "B9892F";
const INK = "2B2B2B";
const MUTED = "5A5A5A";

async function fetchPadBytes(): Promise<Uint8Array | null> {
  if (typeof fetch !== "function") return null;
  try {
    const res = await fetch("/yess-bangla-letterhead.jpeg");
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Full-page letterhead pad behind the body text on every page. */
function makeLetterheadHeader(pad: Uint8Array | null): Header | undefined {
  if (!pad) return undefined;
  return new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            type: "jpg",
            data: pad,
            // A4 portrait at 96 DPI: 794 x 1123 px ≈ 8.27 x 11.69 in.
            transformation: { width: 794, height: 1123 },
            floating: {
              horizontalPosition: { relative: "page", align: "center" } as never,
              verticalPosition: { relative: "page", align: "center" } as never,
              behindDocument: true,
              zIndex: 0,
            } as never,
            altText: {
              title: "Yess Bangla letterhead",
              description: "Official Yess Bangla letterhead pad — logo, watermark and contact band.",
              name: "letterhead",
            },
          }),
        ],
      }),
    ],
  });
}

function makePageFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({ text: "Page ", color: "808080", size: 14 }),
          new TextRun({ children: [PageNumber.CURRENT], color: "808080", size: 14 }),
          new TextRun({ text: " of ", color: "808080", size: 14 }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], color: "808080", size: 14 }),
        ],
      }),
    ],
  });
}

export interface CustomProfileOptions {
  slug: string;
  lang: ProfileLang;
  sections: ProfileSectionKey[];
}

export async function buildCustomProfileDocx(opts: CustomProfileOptions): Promise<Blob> {
  const { slug, lang } = opts;
  const entry = DATA.ventures[slug];
  if (!entry) throw new Error(`No profile dataset for venture "${slug}"`);
  const c = entry[lang];
  const bn = lang === "bn";
  const font = bn ? "Noto Sans Bengali" : "Calibri";
  const selected = new Set(opts.sections);
  const ordered = PROFILE_SECTIONS.filter((s) => selected.has(s.key));

  const pad = await fetchPadBytes();

  const p = (text: string, o: { bold?: boolean; size?: number; color?: string; italic?: boolean } = {}) =>
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({
          text,
          bold: o.bold,
          italics: o.italic,
          size: o.size ?? 21,
          color: o.color ?? INK,
          font: { ascii: font, hAnsi: font, cs: bn ? "Noto Sans Bengali" : font },
        }),
      ],
    });

  const h2 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 1 } },
      children: [
        new TextRun({
          text,
          bold: true,
          color: NAVY,
          size: 28,
          font: { ascii: font, hAnsi: font, cs: bn ? "Noto Sans Bengali" : font },
        }),
      ],
    });

  const h3 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 160, after: 60 },
      children: [
        new TextRun({
          text,
          bold: true,
          color: GOLD,
          size: 24,
          font: { ascii: font, hAnsi: font, cs: bn ? "Noto Sans Bengali" : font },
        }),
      ],
    });

  const bullet = (text: string) =>
    new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: "•  " + text,
          color: "373737",
          size: 21,
          font: { ascii: font, hAnsi: font, cs: bn ? "Noto Sans Bengali" : font },
        }),
      ],
    });

  const kvTable = (rows: [string, string][]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: rows.map(
        ([k, v]) =>
          new TableRow({
            children: [
              new TableCell({
                width: { size: 32, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: k,
                        bold: true,
                        color: NAVY,
                        size: 21,
                        font: { ascii: font, hAnsi: font, cs: bn ? "Noto Sans Bengali" : font },
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 68, type: WidthType.PERCENTAGE },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: v ?? "—",
                        size: 21,
                        color: INK,
                        font: { ascii: font, hAnsi: font, cs: bn ? "Noto Sans Bengali" : font },
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
      ),
    });

  const label = (def: ProfileSectionDef) => (bn ? def.bn : def.en);

  const body: (Paragraph | Table)[] = [];

  // Title block — always included so a partial export still identifies itself.
  body.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: c.category.toUpperCase(),
          bold: true,
          color: GOLD,
          size: 18,
          font: { ascii: font, hAnsi: font, cs: bn ? "Noto Sans Bengali" : font },
        }),
      ],
    }),
  );
  body.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: c.title,
          bold: true,
          color: "141414",
          size: 40,
          font: { ascii: font, hAnsi: font, cs: bn ? "Noto Sans Bengali" : font },
        }),
      ],
    }),
  );
  if (c.tagline) body.push(p(c.tagline, { size: 23, color: MUTED }));
  body.push(new Paragraph({ children: [] }));

  for (const def of ordered) {
    switch (def.key) {
      case "overview":
        body.push(h2(label(def)), p(c.overview));
        break;
      case "highlights":
        body.push(h2(label(def)));
        c.highlights.forEach((h) => body.push(bullet(h)));
        break;
      case "facts": {
        body.push(h2(label(def)));
        const rows: [string, string][] = [
          [bn ? "প্রতিষ্ঠিত" : "Founded", c.founded],
          [bn ? "কার্যক্রম এলাকা" : "Reach", c.reach],
        ];
        if (c.domain) rows.push([bn ? "ওয়েব" : "Web", c.domain]);
        body.push(kvTable(rows), new Paragraph({ children: [] }));
        break;
      }
      case "audience":
        body.push(h2(label(def)), p(c.audience));
        break;
      case "services":
        body.push(h2(label(def)));
        c.services.forEach((s) => body.push(bullet(s)));
        break;
      case "strengths":
        body.push(h2(label(def)));
        c.features.forEach(([term, desc]) => {
          body.push(p(term, { bold: true, color: NAVY }));
          body.push(p(desc));
        });
        break;
      case "case":
        body.push(h2(label(def)));
        body.push(h3(bn ? "চ্যালেঞ্জ" : "The challenge"), p(c.challenge));
        body.push(h3(bn ? "আমাদের সমাধান" : "Our solution"), p(c.solution));
        break;
      case "phases":
        body.push(h2(label(def)));
        c.phases.forEach(([title, desc], i) => {
          body.push(p(`${i + 1}. ${title}`, { bold: true }));
          body.push(p(desc));
        });
        break;
      case "stack":
        body.push(h2(label(def)), p(c.stack.join(" · ")));
        break;
      case "results":
        body.push(h2(label(def)));
        body.push(
          kvTable(c.results.map(([lbl, val]) => [lbl, val]) as [string, string][]),
          new Paragraph({ children: [] }),
        );
        break;
      case "quote":
        if (c.quote) {
          body.push(h2(label(def)));
          body.push(p(`“${c.quote}”`, { italic: true }));
          if (c.quote_by) body.push(p(`— ${c.quote_by}`, { color: MUTED }));
        }
        break;
      case "contact": {
        body.push(h2(label(def)));
        const ct = DATA.contact;
        const phone = bn ? "ফোন" : "Phone";
        const email = bn ? "ইমেইল" : "Email";
        const web = bn ? "ওয়েব" : "Web";
        const addr = bn ? "ঠিকানা" : "Address";
        body.push(p(`${phone}: ${ct.phone} · ${email}: ${ct.email} · ${web}: ${ct.web}`));
        body.push(p(`${addr}: ${ct.office}`));
        break;
      }
    }
  }

  // Editable-version endnote (the pad carries the footer contact band).
  body.push(new Paragraph({ children: [] }));
  body.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: bn
            ? `${c.title} — প্রজেক্ট প্রোফাইল (কাস্টম নির্বাচন, সম্পাদনাযোগ্য সংস্করণ)`
            : `${c.title} — Project Profile (custom selection, editable version)`,
          color: MUTED,
          size: 16,
          font: { ascii: font, hAnsi: font, cs: bn ? "Noto Sans Bengali" : font },
        }),
      ],
    }),
  );

  const header = makeLetterheadHeader(pad);

  const doc = new Document({
    creator: DATA.contact.legalName,
    title: `${c.title} — Project Profile (custom)`,
    description: c.tagline,
    styles: {
      default: {
        document: {
          run: {
            font: { ascii: font, hAnsi: font, cs: bn ? "Noto Sans Bengali" : font },
            size: 21,
            color: INK,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: {
              // Mirror the server-built profiles so text clears the printed
              // letterhead band (top) and navy contact band (bottom).
              top: 2721, // ~48mm
              right: 1247, // ~22mm
              bottom: 1871, // ~33mm
              left: 1247,
              header: 360,
              footer: 360,
            },
          },
        },
        headers: header ? { default: header } : undefined,
        footers: { default: makePageFooter() },
        children: body,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export async function downloadCustomProfileDocx(opts: CustomProfileOptions): Promise<void> {
  const blob = await buildCustomProfileDocx(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${opts.slug}-project-profile-custom-${opts.lang}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
