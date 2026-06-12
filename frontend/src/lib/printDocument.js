export function printDocument(filename = "document") {
  const previousTitle = document.title;
  document.title = filename.replace(/\.pdf$/i, "");

  const restoreTitle = () => {
    document.title = previousTitle;
    window.removeEventListener("afterprint", restoreTitle);
  };

  window.addEventListener("afterprint", restoreTitle);
  window.print();
}
