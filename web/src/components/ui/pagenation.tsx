"use client";

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex justify-center gap-3">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="brutalism-button-secondary px-5 py-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Prev
      </button>
      <div className="brutalism-border brutalism-shadow flex items-center bg-white px-5 py-2">
        <span className="brutalism-text-bold">
          Page {page} of {totalPages}
        </span>
      </div>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="brutalism-button-secondary px-5 py-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}
