"use client";

import { Download } from "lucide-react";

type ExportActionsProps = {
  exporting: boolean;
  onExport: (format: "csv" | "pdf") => void;
};

const buttonClass =
  "brutalism-button inline-flex items-center gap-2 rounded-none px-4 py-2 font-bold uppercase";

export function ExportActions({ exporting, onExport }: ExportActionsProps) {
  return (
    <>
      <button
        className={buttonClass}
        onClick={() => onExport("csv")}
        disabled={exporting}
        data-testid="export-csv"
      >
        <Download className="size-4" />
        {exporting ? "Exporting..." : "Export CSV"}
      </button>
      <button
        className={buttonClass}
        onClick={() => onExport("pdf")}
        disabled={exporting}
        data-testid="export-report"
      >
        <Download className="size-4" />
        {exporting ? "Exporting..." : "Export Report"}
      </button>
    </>
  );
}
