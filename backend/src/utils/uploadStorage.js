import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export const uploadRoot = path.join(backendDirectory, "uploads");

const extensionsByMimeType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
};

export async function saveUploadedFile({ tenantId, field, mimeType, data }) {
  const extension = extensionsByMimeType[mimeType];
  if (!extension) throw new Error("Unsupported upload type");

  const tenantDirectory = path.join(uploadRoot, String(tenantId));
  await mkdir(tenantDirectory, { recursive: true });

  const filename = `${field}-${randomUUID()}${extension}`;
  await writeFile(path.join(tenantDirectory, filename), data, { flag: "wx" });

  return `/uploads/${tenantId}/${filename}`;
}

export async function deleteUploadedFile(fileUrl, tenantId) {
  const tenantPrefix = `/uploads/${tenantId}/`;
  if (typeof fileUrl !== "string" || !fileUrl.startsWith(tenantPrefix)) return;

  const filename = path.basename(fileUrl);
  const filePath = path.join(uploadRoot, String(tenantId), filename);

  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
