"use client";

import { Button } from "@/components/ui-legacy/button";

type CsvRow = Record<string, string | number | null | undefined>;

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function CsvExportButton({
  rows,
  fileName = "relatorio.csv",
}: {
  rows: CsvRow[];
  fileName?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        if (rows.length === 0) return;

        const headers = Object.keys(rows[0]);
        const csv = [
          headers.map(escapeCsv).join(","),
          ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
      }}
      disabled={rows.length === 0}
    >
      Exportar CSV
    </Button>
  );
}
