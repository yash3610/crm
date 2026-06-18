import { execFile } from "node:child_process";
import fs from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const browserCandidates = [
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function findBrowser() {
  return browserCandidates.find((candidate) => fs.existsSync(candidate));
}

export async function createBrowserPdf(html) {
  const executablePath = findBrowser();
  if (!executablePath) {
    throw new Error(
      "Chrome or Edge is required for PDF generation. Set PUPPETEER_EXECUTABLE_PATH.",
    );
  }

  const workspace = await mkdtemp(path.join(os.tmpdir(), "billpro-pdf-"));
  const htmlPath = path.join(workspace, "document.html");
  const pdfPath = path.join(workspace, "document.pdf");
  const profilePath = path.join(workspace, "browser-profile");

  try {
    await writeFile(htmlPath, html, "utf8");
    await execFileAsync(
      executablePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--no-first-run",
        "--no-default-browser-check",
        `--user-data-dir=${profilePath}`,
        "--print-to-pdf-no-header",
        `--print-to-pdf=${pdfPath}`,
        pathToFileURL(htmlPath).href,
      ],
      {
        timeout: 30000,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      },
    );

    return await readFile(pdfPath);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
