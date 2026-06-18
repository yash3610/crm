import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { downloadPdf } from "@/lib/downloadPdf";

export function usePdfDownload() {
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const downloadLock = useRef(false);

  const startPdfDownload = useCallback(async (filename, selector) => {
    if (downloadLock.current) return;

    const toastId = toast.loading("Preparing high-quality PDF...");
    downloadLock.current = true;
    setPdfDownloading(true);

    try {
      await downloadPdf(filename, selector);
      toast.success("PDF downloaded", { id: toastId });
    } catch (error) {
      toast.error(error.message || "Unable to download PDF", {
        id: toastId,
      });
    } finally {
      downloadLock.current = false;
      setPdfDownloading(false);
    }
  }, []);

  return { pdfDownloading, startPdfDownload };
}
