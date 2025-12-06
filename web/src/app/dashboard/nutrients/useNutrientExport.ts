"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

type ExportFormat = "csv" | "pdf";

type ExportOptions = {
  startDate?: Date;
  endDate?: Date;
};

const buildDateRange = ({ startDate, endDate }: ExportOptions) => {
  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end);
  start.setDate(start.getDate() - 30);

  const startParam = start.toISOString().split("T")[0];
  const endParam = end.toISOString().split("T")[0];

  return { startParam, endParam };
};

export function useNutrientExport() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const exportData = useCallback(
    async (format: ExportFormat, options: ExportOptions = {}) => {
      try {
        setExporting(true);

        const { startParam, endParam } = buildDateRange(options);
        const url = `/api/nutrients/export?format=${format}&start=${startParam}&end=${endParam}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Export failed");
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;

        const contentDisposition = response.headers.get("Content-Disposition");
        const filenameMatch = contentDisposition?.match(/filename=\"?([^\";]+)\"?/);
        const fallbackName =
          format === "pdf"
            ? `nutrition-report-${startParam}-to-${endParam}.txt`
            : `nutrition-${startParam}-to-${endParam}.csv`;
        const filename = filenameMatch ? filenameMatch[1] : fallbackName;

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);

        toast({
          title: "Export Successful",
          description: `Your nutrition data has been exported as ${format.toUpperCase()}.`,
        });
      } catch (err) {
        console.error("Export error:", err);
        toast({
          variant: "destructive",
          title: "Export Failed",
          description: err instanceof Error ? err.message : "Failed to export data",
        });
      } finally {
        setExporting(false);
      }
    },
    [toast]
  );

  return { exporting, exportData };
}
