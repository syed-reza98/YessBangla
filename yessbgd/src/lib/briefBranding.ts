// Shared branding model for PDF + DOCX brief exports.
// Persisted in localStorage; supports multiple named presets so users
// can switch between company templates without retyping details.

import { COMPANY_CONTACT } from "@/lib/companyContact";

export interface BriefBranding {
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  web: string;
  copyrightHolder: string;
  /** Header right-side label (e.g., "ENTERPRISE BRIEF"). */
  documentLabel: string;
  /** Confidentiality strap shown on header right column. */
  confidentialityNote: string;
}

export interface BrandingPreset {
  id: string;
  name: string;
  branding: BriefBranding;
}

export const DEFAULT_BRANDING: BriefBranding = {
  companyName: COMPANY_CONTACT.legalName,
  tagline: "Enterprise Solutions · Media · Technology",
  address: COMPANY_CONTACT.combinedAddress,
  phone: COMPANY_CONTACT.phone.display,
  email: COMPANY_CONTACT.email,
  web: COMPANY_CONTACT.web,
  copyrightHolder: COMPANY_CONTACT.legalName,
  documentLabel: "ENTERPRISE BRIEF",
  confidentialityNote: "Confidential · For intended recipient",
};

const LEGACY_KEY = "yess-brief-branding-v1";
const STORE_KEY = "yess-brief-branding-store-v1";

interface PresetStore {
  activeId: string;
  presets: BrandingPreset[];
}

const DEFAULT_PRESET: BrandingPreset = {
  id: "default",
  name: "YESS Bangla (default)",
  branding: DEFAULT_BRANDING,
};

function readStore(): PresetStore {
  if (typeof localStorage === "undefined") {
    return { activeId: DEFAULT_PRESET.id, presets: [DEFAULT_PRESET] };
  }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PresetStore;
      if (parsed?.presets?.length) {
        // Ensure default preset always exists.
        if (!parsed.presets.find((p) => p.id === DEFAULT_PRESET.id)) {
          parsed.presets.unshift(DEFAULT_PRESET);
        }
        if (!parsed.presets.find((p) => p.id === parsed.activeId)) {
          parsed.activeId = DEFAULT_PRESET.id;
        }
        return parsed;
      }
    }
    // Migrate legacy single branding object into a "Custom" preset.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const partial = JSON.parse(legacy) as Partial<BriefBranding>;
      const migrated: BrandingPreset = {
        id: "custom",
        name: "Custom",
        branding: { ...DEFAULT_BRANDING, ...partial },
      };
      return { activeId: migrated.id, presets: [DEFAULT_PRESET, migrated] };
    }
  } catch {
    /* fall through */
  }
  return { activeId: DEFAULT_PRESET.id, presets: [DEFAULT_PRESET] };
}

function writeStore(store: PresetStore) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

export function listPresets(): BrandingPreset[] {
  return readStore().presets;
}

export function getActivePresetId(): string {
  return readStore().activeId;
}

export function setActivePreset(id: string): BriefBranding {
  const store = readStore();
  if (store.presets.find((p) => p.id === id)) {
    store.activeId = id;
    writeStore(store);
  }
  return loadBranding();
}

export function loadBranding(): BriefBranding {
  const store = readStore();
  const preset =
    store.presets.find((p) => p.id === store.activeId) ?? DEFAULT_PRESET;
  return { ...DEFAULT_BRANDING, ...preset.branding };
}

/**
 * Persist edits against the active preset. Editing the immutable
 * "default" preset spawns a new "Custom" preset and switches to it
 * so the original defaults are preserved.
 */
export function saveBranding(b: BriefBranding): BrandingPreset {
  const store = readStore();
  let active = store.presets.find((p) => p.id === store.activeId);
  if (!active || active.id === DEFAULT_PRESET.id) {
    active = {
      id: `custom-${Date.now().toString(36)}`,
      name: "Custom",
      branding: b,
    };
    store.presets.push(active);
    store.activeId = active.id;
  } else {
    active.branding = b;
  }
  writeStore(store);
  return active;
}

export function createPreset(name: string, branding: BriefBranding): BrandingPreset {
  const store = readStore();
  const preset: BrandingPreset = {
    id: `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || "Untitled preset",
    branding,
  };
  store.presets.push(preset);
  store.activeId = preset.id;
  writeStore(store);
  return preset;
}

export function renamePreset(id: string, name: string) {
  const store = readStore();
  const p = store.presets.find((x) => x.id === id);
  if (p && p.id !== DEFAULT_PRESET.id) {
    p.name = name.trim() || p.name;
    writeStore(store);
  }
}

export function deletePreset(id: string) {
  if (id === DEFAULT_PRESET.id) return;
  const store = readStore();
  store.presets = store.presets.filter((p) => p.id !== id);
  if (store.activeId === id) store.activeId = DEFAULT_PRESET.id;
  writeStore(store);
}

export function resolveBranding(
  partial?: Partial<BriefBranding>,
): BriefBranding {
  return { ...DEFAULT_BRANDING, ...(partial ?? {}) };
}
