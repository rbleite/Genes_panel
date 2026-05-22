export function buildCsv(rows) {
  const esc = (value) => `"${String(value).replace(/"/g, '""')}"`;
  return rows.map((row) => row.map(esc).join(",")).join("\n");
}

export function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
