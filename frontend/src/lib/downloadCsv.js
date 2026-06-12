export function downloadCsv(filename, rows) {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]).filter(
    (key) => !["mongoId", "createdAt", "updatedAt"].includes(key),
  );
  const escape = (value) => {
    const text =
      value == null
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [
    headers.map(escape).join(","),
    ...rows.map((row) =>
      headers.map((header) => escape(row[header])).join(","),
    ),
  ].join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
