const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const PDF_WIDTH_PX = 794;
const PDF_HEIGHT_PX = Math.floor((PDF_WIDTH_PX * 297) / 210);

function getToken() {
  return (
    sessionStorage.getItem("billpro_token") ||
    localStorage.getItem("billpro_token")
  );
}

function sanitizeFilename(filename) {
  const clean = String(filename || "document")
    .replace(/\.pdf$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .trim();

  return `${clean || "document"}.pdf`;
}

async function waitForAssets(element) {
  if (document.fonts?.ready) await document.fonts.ready;

  await Promise.all(
    [...element.querySelectorAll("img")].map((image) => {
      if (image.complete) return image.decode?.().catch(() => {});
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }),
  );
}

function inlineComputedStyles(element) {
  [element, ...element.querySelectorAll("*")].forEach((node) => {
    const computed = getComputedStyle(node);
    let styles = "";

    for (const property of computed) {
      styles += `${property}:${computed.getPropertyValue(property)};`;
    }

    node.setAttribute("style", styles);
  });
}

function normalizeBusinessDocument(documentElement) {
  if (!documentElement.classList.contains("business-document")) return;

  Object.assign(documentElement.style, {
    display: "block",
    width: `${PDF_WIDTH_PX}px`,
    maxWidth: "none",
    minHeight: `${PDF_HEIGHT_PX}px`,
    margin: "0",
    padding: "48px",
    overflow: "visible",
    background: "#ffffff",
  });

  const header = documentElement.querySelector(".document-header");
  if (header) {
    Object.assign(header.style, {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr) 280px",
      alignItems: "start",
      gap: "40px",
      marginBottom: "32px",
    });
  }

  const business = documentElement.querySelector(".document-business");
  if (business) {
    Object.assign(business.style, {
      width: "280px",
      maxWidth: "280px",
      textAlign: "right",
      overflowWrap: "anywhere",
      lineHeight: "1.5",
    });
  }

  const meta = documentElement.querySelector(".document-meta");
  if (meta) {
    const columns = Math.max(1, meta.children.length);
    Object.assign(meta.style, {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: "24px",
      paddingBottom: "24px",
    });
  }

  const table = documentElement.querySelector(".document-items");
  if (table) {
    Object.assign(table.style, {
      width: "100%",
      minWidth: "0",
      tableLayout: "auto",
      marginTop: "24px",
    });
  }

  const totals = documentElement.querySelector(".document-totals");
  if (totals) {
    Object.assign(totals.style, {
      width: "320px",
      maxWidth: "320px",
      marginTop: "32px",
      marginLeft: "auto",
    });
  }

  documentElement.querySelectorAll("th, td").forEach((cell) => {
    cell.style.padding = "12px 8px";
    cell.style.verticalAlign = "middle";
  });
}

async function createPdfHtml(source) {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  Object.assign(host.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${PDF_WIDTH_PX}px`,
    background: "#ffffff",
    zIndex: "-1",
  });

  const clone = source.cloneNode(true);
  clone.classList.remove("hidden");
  Object.assign(clone.style, {
    display: "block",
    boxSizing: "border-box",
    width: `${PDF_WIDTH_PX}px`,
    maxWidth: "none",
    height: "auto",
    maxHeight: "none",
    margin: "0",
    overflow: "visible",
    background: "#ffffff",
  });

  const invoice = clone.matches(".invoice-document")
    ? clone
    : clone.querySelector(".invoice-document");
  if (invoice) {
    Object.assign(invoice.style, {
      boxSizing: "border-box",
      width: `${PDF_WIDTH_PX}px`,
      maxWidth: "none",
      minHeight: `${PDF_HEIGHT_PX}px`,
      height: "auto",
      margin: "0",
      padding: "48px",
      overflow: "visible",
      background: "#ffffff",
    });
  }

  clone.querySelectorAll("img").forEach((image) => {
    image.src = image.currentSrc || image.src;
  });

  host.appendChild(invoice || clone);
  document.body.appendChild(host);

  try {
    const documentElement = invoice || clone;
    await waitForAssets(documentElement);
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
    normalizeBusinessDocument(documentElement);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    inlineComputedStyles(documentElement);

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=${PDF_WIDTH_PX}" />
    <style>
      @page { size: A4; margin: 0; }
      html, body {
        margin: 0;
        padding: 0;
        background: white;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      *, *::before, *::after { box-sizing: border-box; }
      tr, .print-avoid-break, .invoice-totals, .invoice-payment-history,
      .invoice-footer, .document-header, .document-meta, .document-totals,
      .document-notes { break-inside: avoid; page-break-inside: avoid; }
    </style>
  </head>
  <body>${documentElement.outerHTML}</body>
</html>`;
  } finally {
    host.remove();
  }
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = sanitizeFilename(filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPdf(
  filename = "document",
  selector = ".print-document",
) {
  const source = document.querySelector(selector);
  if (!source) throw new Error("PDF document is not available");

  const html = await createPdfHtml(source);
  const token = getToken();
  const response = await fetch(`${API_URL}/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      filename: sanitizeFilename(filename),
      html,
    }),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.message || "Unable to generate PDF");
  }

  saveBlob(await response.blob(), filename);
}
