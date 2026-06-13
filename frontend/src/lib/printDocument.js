async function waitForPrintAssets() {
  if (document.fonts?.ready) await document.fonts.ready;

  const images = [...document.querySelectorAll(".print-document img")];
  await Promise.all(
    images.map((image) => {
      if (image.complete) return image.decode?.().catch(() => {});
      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }),
  );
}

export async function printDocument(filename = "document") {
  const previousTitle = document.title;
  document.title = "";
  document.documentElement.dataset.printFilename = filename.replace(
    /\.pdf$/i,
    "",
  );

  const restoreTitle = () => {
    document.title = previousTitle;
    delete document.documentElement.dataset.printFilename;
    window.removeEventListener("afterprint", restoreTitle);
  };

  window.addEventListener("afterprint", restoreTitle);
  await waitForPrintAssets();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  window.print();
}
