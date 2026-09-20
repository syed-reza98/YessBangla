/** Local disk storage helpers — local disk uploads */

import { uploadLocalFileAction } from "@/actions/uploads";

export function isExternalUrl(ref: string | null | undefined) {
  return !!ref && /^https?:\/\//i.test(ref);
}

export async function resolveFileUrl(
  _bucket: string,
  ref: string | null | undefined,
  _expiresIn = 60 * 60
) {
  if (!ref) return "";
  if (isExternalUrl(ref)) return ref;
  if (ref.startsWith("/uploads/")) return ref;
  return `/uploads/${ref.replace(/^\//, "")}`;
}

export async function resolveDownloadUrl(
  bucket: string,
  ref: string | null | undefined,
  _fileName?: string
) {
  return resolveFileUrl(bucket, ref);
}

export async function uploadFile(
  bucket: string,
  filePath: string,
  file: Blob,
  _contentType?: string
) {
  const fd = new FormData();
  fd.set("bucket", bucket);
  fd.set("path", filePath);
  fd.set("file", file);
  const res = await uploadLocalFileAction(fd);
  if (!res.ok) throw new Error(res.error);
  return res.path;
}

export function safeName(name: string) {
  return name.replace(/[^\w.-]+/g, "_").slice(-80);
}
