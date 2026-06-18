import { asyncHandler } from "../utils/asyncHandler.js";
import { createBrowserPdf } from "../utils/browserPdf.js";
import { ApiError } from "../utils/ApiError.js";

function sanitizeFilename(value) {
  const clean = String(value || "document")
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .trim();

  return `${clean || "document"}.pdf`;
}

export const generatePdf = asyncHandler(async (req, res) => {
  const { html, filename } = req.body || {};
  if (typeof html !== "string" || !html.trim()) {
    throw new ApiError(400, "PDF content is required");
  }
  if (Buffer.byteLength(html, "utf8") > 4 * 1024 * 1024) {
    throw new ApiError(413, "PDF content is too large");
  }

  const pdf = Buffer.from(await createBrowserPdf(html));
  const safeFilename = sanitizeFilename(filename);

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${safeFilename}"`,
    "Content-Length": pdf.length,
    "Cache-Control": "no-store",
  });
  res.send(pdf);
});
