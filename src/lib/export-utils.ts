import * as XLSX from "xlsx";

export function generateCsv(headers: string[], rows: (string | number)[][], filename: string): Response {
  const quote = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(quote).join(";")).join("\n")}`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

export function generateExcel(headers: string[], rows: (string | number)[][], filename: string, sheetName = "Données"): Response {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}

export function generatePdfHtml(title: string, companyHtml: string, tableHeaders: string[], tableRows: string[][], summaryHtml = ""): string {
  const rows = tableRows.map((row) => `<tr>${row.map((cell) => `<td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:12px">${cell}</td>`).join("")}</tr>`).join("");
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body{font-family:Arial,sans-serif;color:#3e2723;padding:40px;max-width:900px;margin:auto;line-height:1.5}
  h1{font-family:Georgia,serif;font-size:32px;margin:0;color:#4a3027}
  table{width:100%;border-collapse:collapse;margin-top:20px}
  th{text-align:left;padding:10px 14px;border-bottom:2px solid #6f4e37;font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#7b675d}
  .summary{text-align:right;margin-top:24px;font-size:18px}
  .muted{color:#88756b;font-size:12px}
  @media print{body{padding:20px}}
</style></head><body>
${companyHtml}
<table><thead><tr>${tableHeaders.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>
${summaryHtml}
<script>window.onload=()=>window.print()</script>
</body></html>`;
}

export const money = (value: number) => `${new Intl.NumberFormat("fr-DZ").format(value)} DA`;
