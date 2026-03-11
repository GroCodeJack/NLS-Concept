"use client";

import { useState } from "react";
import type { AppliedFilter } from "@/lib/types";

interface Props {
  generatedUrl: string;
  appliedFilters: AppliedFilter[];
}

export default function FiltersBar({ generatedUrl, appliedFilters }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full max-w-[1300px] mx-auto my-3 p-4 bg-grey-50 border border-grey-100 rounded-[10px] transition-opacity duration-300">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <a
          href={generatedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-brand-500 text-white px-4 py-2.5 rounded-lg no-underline font-semibold hover:bg-[#a01818] transition-colors"
        >
          <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42 9.3-9.29H14V3z" />
            <path d="M5 5h6V3H3v8h2V5zm14 14h-6v2h8v-8h-2v6z" />
          </svg>
          <span>View listing page</span>
        </a>
      </div>

      {appliedFilters.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="bg-transparent border-none text-grey-600 text-sm cursor-pointer py-2 px-0 flex items-center gap-1.5 mt-2 hover:text-grey-800"
          >
            <span>Applied Filters ({appliedFilters.length})</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>

          <div
            className={`flex flex-wrap gap-2 mt-2 overflow-hidden transition-[max-height] duration-300 ${
              expanded ? "max-h-[200px]" : "max-h-0"
            }`}
          >
            {appliedFilters.map((f, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-1.5 bg-white border border-grey-100 rounded-2xl px-2.5 py-1.5 text-sm text-grey-800"
              >
                <span className="text-grey-600 font-semibold">{f.label}:</span>
                <span>{f.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
