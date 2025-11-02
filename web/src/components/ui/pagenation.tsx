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
    <div className="mt-6 flex justify-center gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded border px-3 py-1 disabled:opacity-50"
      >
        Prev
      </button>
      <span className="mt-1 text-sm">
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded border px-3 py-1 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
