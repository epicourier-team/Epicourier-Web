"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="brutalism-border mb-6 flex items-center gap-2 bg-white px-4 py-2 text-sm font-bold transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}
