#!/usr/bin/env python3
"""
Dump the venture profile dataset (English + Bangla) used by the PDF/DOCX
generators into src/data/ventureProfiles.json, so the web app can build
*custom* (user-selected sections) DOCX exports client-side with the exact
same wording as the official profiles.

Run after editing build-venture-profiles.py:
    python3 scripts/dump-profile-data.py
"""

import importlib.util
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "data", "ventureProfiles.json")


def _load_module(name: str, path: str):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, path))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    vp = _load_module("venture_profiles", "scripts/build-venture-profiles.py")
    contact = json.load(
        open(os.path.join(ROOT, "src", "data", "company-contact.json"), encoding="utf-8")
    )
    phone = contact.get("phone", {})
    payload = {
        "contact": {
            "legalName": contact.get("legalName", "Yess Bangla Private Limited"),
            "phone": phone.get("display") if isinstance(phone, dict) else phone,
            "email": contact.get("email", ""),
            "web": contact.get("web", ""),
            "office": contact.get("office", ""),
        },
        "ventures": {v["slug"]: {"en": v["en"], "bn": v["bn"]} for v in vp.VENTURES},
    }
    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, ensure_ascii=False, indent=2)
    print(f"[dump] wrote {os.path.relpath(OUT, ROOT)} — {len(payload['ventures'])} ventures")


if __name__ == "__main__":
    main()
