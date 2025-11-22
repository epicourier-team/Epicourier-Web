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
        className="border-2 border-black bg-sky-300 px-5 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Prev
      </button>
      <div className="flex items-center border-2 border-black bg-white px-5 py-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
        <span className="font-bold">
          Page {page} of {totalPages}
        </span>
      </div>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="border-2 border-black bg-sky-300 px-5 py-2 font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-0 active:translate-y-0 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}
