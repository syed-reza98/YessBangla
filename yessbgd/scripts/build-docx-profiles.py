#!/usr/bin/env python3
"""
Yess Bangla — DOCX generator for the company profile and all active venture
project profiles (English + Bangla).

Purpose: the PDFs are the polished, print-ready versions; these .docx files
are the *editable* twins so management can change wording in Word / Google
Docs / LibreOffice and re-export.

Every document paints the official letterhead pad as a full-page background
(floating image anchored to the page, behind the text, driven from the
section header so it repeats on every page — the same chrome the PDFs use).

Reuses the SAME content sources as the PDF generators, so both formats stay
in sync:
  - Company profile EN/BN ...... SECTIONS from build-company-profile[-bn].py
  - Venture profiles ............ VENTURES from build-venture-profiles.py

Output:
  public/yess-bangla-company-profile.docx
  public/yess-bangla-company-profile-bn.docx
  public/profiles/<slug>-profile.docx        (x8)
  public/profiles/<slug>-profile-bn.docx     (x8)

Requires: pip install python-docx
"""

import html
import importlib.util
import json
import os
import sys

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Mm, Pt, RGBColor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROFILES_DIR = os.path.join(ROOT, "public", "profiles")
LETTERHEAD = os.path.join(ROOT, "public", "yess-bangla-letterhead.jpeg")

NAVY = RGBColor(0x0F, 0x23, 0x50)
GOLD = RGBColor(0xB9, 0x89, 0x2F)
INK = RGBColor(0x2B, 0x2B, 0x2B)
MUTED = RGBColor(0x5A, 0x5A, 0x5A)

FONT_EN = "Calibri"
FONT_BN = "Noto Sans Bengali"


def _load_module(name: str, path: str):
    """Import a hyphenated script filename as a module without running main()."""
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def _letterhead_background(sec) -> bool:
    """
    Float the official letterhead pad behind the body text on every page.

    Implemented as a page-anchored floating image inside the section header
    with behindDoc="1" (Word repeats header art on every page of the section).
    Widens margins so body text clears the printed header band and the navy
    contact band, mirroring the PDF generators (L/R 22mm, top 47mm, bottom 32mm).
    Returns False (and keeps plain margins) when the pad asset is missing.
    """
    if not os.path.exists(LETTERHEAD):
        return False

    sec.left_margin = sec.right_margin = Mm(22)
    sec.top_margin = Mm(48)
    sec.bottom_margin = Mm(33)

    header = sec.header
    header.is_linked_to_previous = False
    rId, _img = header.part.get_or_add_image(LETTERHEAD)
    cx, cy = Mm(210), Mm(297)  # full A4 page, in EMU

    anchor = parse_xml(
        f'<w:r {nsdecls("w", "wp", "a", "pic", "r")}>'
        "<w:drawing>"
        '<wp:anchor behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1"'
        ' relativeHeight="0" simplePos="0">'
        '<wp:simplePos x="0" y="0"/>'
        '<wp:positionH relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionH>'
        '<wp:positionV relativeFrom="page"><wp:posOffset>0</wp:posOffset></wp:positionV>'
        f'<wp:extent cx="{cx}" cy="{cy}"/>'
        '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
        "<wp:wrapNone/>"
        '<wp:docPr id="1" name="YessLetterhead" descr="Yess Bangla official letterhead pad"/>'
        "<wp:cNvGraphicFramePr/>"
        '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        "<pic:pic>"
        "<pic:nvPicPr>"
        '<pic:cNvPr id="0" name="yess-bangla-letterhead.jpeg"/>'
        "<pic:cNvPicPr/>"
        "</pic:nvPicPr>"
        f'<pic:blipFill><a:blip r:embed="{rId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        "<pic:spPr>"
        f'<a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        "</pic:spPr>"
        "</pic:pic>"
        "</a:graphicData></a:graphic>"
        "</wp:anchor>"
        "</w:drawing>"
        "</w:r>"
    )
    header.paragraphs[0]._p.append(anchor)
    return True


def _base_document(font: str, bn: bool) -> Document:
    doc = Document()
    # Page setup: A4 with comfortable margins.
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Mm(210), Mm(297)
    sec.top_margin = sec.bottom_margin = Mm(22)
    sec.left_margin = sec.right_margin = Mm(20)
    # Letterhead background swaps in wider margins itself.
    doc._has_letterhead = _letterhead_background(sec)

    normal = doc.styles["Normal"]
    normal.font.name = font
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = INK
    # Complex-script font so Bangla shaping works in Word.
    rpr = normal.element.get_or_add_rPr()
    rfonts = rpr.get_or_add_rFonts()
    rfonts.set(qn("w:ascii"), font)
    rfonts.set(qn("w:hAnsi"), font)
    rfonts.set(qn("w:cs"), FONT_BN if bn else font)
    if bn:
        rfonts.set(qn("w:eastAsia"), font)

    for style_name, size, color in (("Heading 1", 20, NAVY), ("Heading 2", 15, NAVY), ("Heading 3", 12, GOLD)):
        st = doc.styles[style_name]
        st.font.name = font
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = color
        rpr = st.element.get_or_add_rPr()
        rf = rpr.get_or_add_rFonts()
        rf.set(qn("w:ascii"), font)
        rf.set(qn("w:hAnsi"), font)
        rf.set(qn("w:cs"), FONT_BN if bn else font)

    return doc


def _footer(doc: Document, text: str):
    # The letterhead pad already carries the full contact band at the bottom
    # of the page, so when it is present we close with a small endnote in the
    # body instead of a footer line (which would print over the navy band).
    if getattr(doc, "_has_letterhead", False):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.font.size = Pt(8)
        run.font.color.rgb = MUTED
        return
    p = doc.sections[0].footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.font.size = Pt(8)
    run.font.color.rgb = MUTED


def _title_block(doc: Document, kicker: str, title: str, subtitle: str):
    p = doc.add_paragraph()
    run = p.add_run(kicker.upper())
    run.font.size = Pt(9)
    run.font.bold = True
    run.font.color.rgb = GOLD
    doc.add_heading(title, level=1)
    if subtitle:
        p = doc.add_paragraph()
        run = p.add_run(subtitle)
        run.font.size = Pt(11.5)
        run.font.color.rgb = MUTED
    doc.add_paragraph()


def _clean(text: str) -> str:
    return html.unescape(str(text))


def _emit_blocks(doc: Document, blocks):
    """Shared renderer for the SECTIONS block tuples used by both company scripts."""
    for kind, payload in blocks:
        if kind == "p":
            doc.add_paragraph(_clean(payload))
        elif kind == "sig":
            p = doc.add_paragraph()
            run = p.add_run(_clean(payload))
            run.italic = True
            run.font.color.rgb = MUTED
        elif kind == "h3":
            doc.add_heading(_clean(payload), level=3)
        elif kind == "ul":
            for item in payload:
                doc.add_paragraph(_clean(item), style="List Bullet")
        elif kind == "dl":
            for term, definition in payload:
                p = doc.add_paragraph()
                run = p.add_run(_clean(term))
                run.bold = True
                run.font.color.rgb = NAVY
                dp = doc.add_paragraph(_clean(definition))
                dp.paragraph_format.left_indent = Mm(5)
        elif kind == "kv":
            table = doc.add_table(rows=0, cols=2)
            table.style = "Table Grid"
            table.alignment = WD_TABLE_ALIGNMENT.LEFT
            for k, v in payload:
                cells = table.add_row().cells
                r = cells[0].paragraphs[0].add_run(_clean(k))
                r.bold = True
                r.font.color.rgb = NAVY
                cells[1].paragraphs[0].add_run(_clean(v))
            doc.add_paragraph()
        elif kind == "table":
            header = payload.get("header") or payload.get("head") or []
            rows = payload.get("rows") or []
            table = doc.add_table(rows=1, cols=len(header) if header else len(rows[0]))
            table.style = "Table Grid"
            if header:
                for i, h in enumerate(header):
                    r = table.rows[0].cells[i].paragraphs[0].add_run(_clean(h))
                    r.bold = True
                    r.font.color.rgb = NAVY
            for row in rows:
                cells = table.add_row().cells
                for i, val in enumerate(row):
                    cells[i].paragraphs[0].add_run(_clean(val))
            doc.add_paragraph()


def _contact_lines(lang: str):
    data = json.load(open(os.path.join(ROOT, "src", "data", "company-contact.json"), encoding="utf-8"))
    phone = data.get("phone", {}).get("display") or data.get("phone") or ""
    email = data.get("email", "")
    web = data.get("web", "")
    addr = data.get("office", "")
    if lang == "bn":
        return [
            ("যোগাযোগ", f"ফোন: {phone} · ইমেইল: {email} · ওয়েব: {web}"),
            ("ঠিকানা", addr),
        ]
    return [
        ("Contact", f"Phone: {phone} · Email: {email} · Web: {web}"),
        ("Address", addr),
    ]


# ---------------------------------------------------------------- company ---

def build_company(lang: str, out_path: str):
    bn = lang == "bn"
    mod = _load_module(
        "cp_bn" if bn else "cp_en",
        "scripts/build-company-profile-bn.py" if bn else "scripts/build-company-profile.py",
    )
    doc = _base_document(FONT_BN if bn else FONT_EN, bn)

    if bn:
        _title_block(doc, "গ্রুপ কোম্পানি প্রোফাইল", "ইয়েস বাংলা প্রাইভেট লিমিটেড",
                     "এন্টারপ্রাইজ সলিউশনস · মিডিয়া · প্রযুক্তি")
    else:
        _title_block(doc, "Group Company Profile", "Yess Bangla Private Limited",
                     "Enterprise Solutions · Media · Technology")

    for s in mod.SECTIONS:
        number = s.get("number") or s.get("n") or ""
        heading_text = f"{number} · {html.unescape(s['title'])}" if number else html.unescape(s["title"])
        doc.add_heading(_clean(heading_text), level=2)
        _emit_blocks(doc, s.get("body") or s.get("blocks") or [])

    # Contact block
    doc.add_heading("যোগাযোগ" if bn else "Contact", level=2)
    for term, line in _contact_lines(lang):
        p = doc.add_paragraph()
        r = p.add_run(term + ": " if term != "ঠিকানা" and term != "Address" else "")
        r.bold = True
        p.add_run(line)

    foot = ("ইয়েস বাংলা প্রাইভেট লিমিটেড — কোম্পানি প্রোফাইল (সম্পাদনাযোগ্য সংস্করণ)"
            if bn else "Yess Bangla Private Limited — Company Profile (editable version)")
    _footer(doc, foot)
    doc.save(out_path)
    print(f"[docx] wrote {os.path.relpath(out_path, ROOT)} ({os.path.getsize(out_path):,} bytes)")


# ---------------------------------------------------------------- ventures ---

def build_venture(v, lang: str, out_path: str):
    bn = lang == "bn"
    c = v["bn" if bn else "en"]
    doc = _base_document(FONT_BN if bn else FONT_EN, bn)

    _title_block(doc, c["category"], c["title"], c["tagline"])

    L = {
        "overview": "সংক্ষিপ্ত বিবরণ" if bn else "Overview",
        "highlights": "মূল বৈশিষ্ট্য" if bn else "Highlights",
        "facts": "এক নজরে" if bn else "At a glance",
        "founded": "প্রতিষ্ঠিত" if bn else "Founded",
        "reach": "কার্যক্রম এলাকা" if bn else "Reach",
        "domain": "ওয়েব" if bn else "Web",
        "audience": "লক্ষ্য দর্শক" if bn else "Audience",
        "services": "সেবাসমূহ" if bn else "Services",
        "strengths": "স্বাক্ষর শক্তি" if bn else "Signature strengths",
        "case": "কেস স্টাডি" if bn else "Case study",
        "challenge": "চ্যালেঞ্জ" if bn else "The challenge",
        "solution": "আমাদের সমাধান" if bn else "Our solution",
        "phases": "ডেলিভারি ধাপ" if bn else "Delivery phases",
        "stack": "প্রযুক্তি স্ট্যাক" if bn else "Technology stack",
        "results": "প্রমাণিত ফলাফল" if bn else "Measured outcomes",
        "client": "ক্লায়েন্ট মতামত" if bn else "What clients say",
        "contact": "যোগাযোগ" if bn else "Talk to us",
    }

    doc.add_heading(L["overview"], level=2)
    doc.add_paragraph(c["overview"])

    doc.add_heading(L["highlights"], level=2)
    for h in c["highlights"]:
        doc.add_paragraph(h, style="List Bullet")

    doc.add_heading(L["facts"], level=2)
    table = doc.add_table(rows=0, cols=2)
    table.style = "Table Grid"
    for k, val in ((L["founded"], c["founded"]), (L["reach"], c["reach"]), (L["domain"], c["domain"])):
        cells = table.add_row().cells
        r = cells[0].paragraphs[0].add_run(k)
        r.bold = True
        r.font.color.rgb = NAVY
        cells[1].paragraphs[0].add_run(val)
    doc.add_paragraph()

    doc.add_heading(L["audience"], level=2)
    doc.add_paragraph(c["audience"])

    doc.add_heading(L["services"], level=2)
    for s in c["services"]:
        doc.add_paragraph(s, style="List Bullet")

    doc.add_heading(L["strengths"], level=2)
    for term, desc in c["features"]:
        p = doc.add_paragraph()
        r = p.add_run(term)
        r.bold = True
        r.font.color.rgb = NAVY
        dp = doc.add_paragraph(desc)
        dp.paragraph_format.left_indent = Mm(5)

    doc.add_heading(L["case"], level=2)
    doc.add_heading(L["challenge"], level=3)
    doc.add_paragraph(c["challenge"])
    doc.add_heading(L["solution"], level=3)
    doc.add_paragraph(c["solution"])

    doc.add_heading(L["phases"], level=2)
    for i, (title, desc) in enumerate(c["phases"], 1):
        p = doc.add_paragraph()
        r = p.add_run(f"{i}. {title}")
        r.bold = True
        doc.add_paragraph(desc).paragraph_format.left_indent = Mm(5)

    doc.add_heading(L["stack"], level=2)
    doc.add_paragraph(" · ".join(c["stack"]))

    doc.add_heading(L["results"], level=2)
    table = doc.add_table(rows=1, cols=2)
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    for i, htxt in enumerate((L["results"], "মান" if bn else "Value")):
        r = hdr[i].paragraphs[0].add_run(htxt)
        r.bold = True
        r.font.color.rgb = NAVY
    for label, value in c["results"]:
        cells = table.add_row().cells
        cells[0].paragraphs[0].add_run(label)
        cells[1].paragraphs[0].add_run(value)
    doc.add_paragraph()

    if c.get("quote"):
        doc.add_heading(L["client"], level=2)
        p = doc.add_paragraph()
        r = p.add_run(f"“{c['quote']}”")
        r.italic = True
        by = doc.add_paragraph(f"— {c['quote_by']}")
        by.runs[0].font.color.rgb = MUTED

    doc.add_heading(L["contact"], level=2)
    for _, line in _contact_lines(lang):
        doc.add_paragraph(line)

    _footer(doc, f"{c['title']} — " + ("প্রজেক্ট প্রোফাইল (সম্পাদনাযোগ্য সংস্করণ)" if bn else "Project Profile (editable version)"))
    doc.save(out_path)
    print(f"[docx] wrote {os.path.relpath(out_path, ROOT)} ({os.path.getsize(out_path):,} bytes)")


def main():
    os.makedirs(PROFILES_DIR, exist_ok=True)
    build_company("en", os.path.join(ROOT, "public", "yess-bangla-company-profile.docx"))
    build_company("bn", os.path.join(ROOT, "public", "yess-bangla-company-profile-bn.docx"))
    vp = _load_module("venture_profiles", "scripts/build-venture-profiles.py")
    for v in vp.VENTURES:
        build_venture(v, "en", os.path.join(PROFILES_DIR, f"{v['slug']}-profile.docx"))
        build_venture(v, "bn", os.path.join(PROFILES_DIR, f"{v['slug']}-profile-bn.docx"))
    print(f"Done — {2 + len(vp.VENTURES) * 2} DOCX files generated.")


if __name__ == "__main__":
    main()
