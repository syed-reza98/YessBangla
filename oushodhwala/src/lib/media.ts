import {
  listMediaAssetsAction,
  uploadMediaAssetAction,
  addMediaByUrlAction,
  deleteMediaAssetAction,
} from "@/actions/admin-entities";

export const MEDIA_BUCKET = "media";
export const mediaQueryKey = ["media-assets"] as const;

export const MEDIA_KINDS = [
  { id: "box", t: "পণ্যের বক্স" },
  { id: "medicine", t: "ঔষধের ছবি" },
  { id: "banner", t: "ব্যানার" },
  { id: "category", t: "ক্যাটাগরি" },
  { id: "site", t: "ওয়েবসাইট" },
  { id: "other", t: "অন্যান্য" },
] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number]["id"];

export type MediaAsset = {
  id: string;
  url: string;
  path: string;
  name: string;
  kind: string;
  tags: string[];
  size: number;
  created_at: string;
};

export async function listMedia(kind?: string, q?: string): Promise<MediaAsset[]> {
  const res = await listMediaAssetsAction(kind, q);
  if (!res.ok) throw new Error(res.error);
  return res.data as MediaAsset[];
}

export async function uploadMedia(file: File, kind: MediaKind, _tags: string[] = []): Promise<MediaAsset> {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("kind", kind);
  const res = await uploadMediaAssetAction(fd);
  if (!res.ok) throw new Error(res.error);
  return res.data as MediaAsset;
}

export async function addMediaByUrl(url: string, name: string, kind: MediaKind, _tags: string[] = []) {
  const res = await addMediaByUrlAction({ url, name, kind });
  if (!res.ok) throw new Error(res.error);
  return res.data as MediaAsset;
}

export async function deleteMedia(asset: MediaAsset) {
  const res = await deleteMediaAssetAction(asset.id, asset.path);
  if (!res.ok) throw new Error(res.error);
}
