"use client";

import { useState, useCallback } from "react";
import type { AppliedFilter } from "@/lib/types";

const FILTER_TO_PARAM: Record<string, string> = {
  Brand: "g2_brand",
  "Club Loft": "g2_club_loft",
  "Shaft Flex": "g2_shaft_flex",
  Dexterity: "g2_dexterity",
  Location: "g2_locations",
  Locations: "g2_locations",
  Price: "price",
  Condition: "g2_condition",
  "Shaft Material": "g2_shaft_material",
  "Lie Angle": "g2_lie_angle",
  "Club Length": "g2_club_length",
};

interface Props {
  filters: AppliedFilter[];
  generatedUrl: string;
  onRetrySearch: (url: string) => void;
}

export default function NoResults({ filters, generatedUrl, onRetrySearch }: Props) {
  const [removed, setRemoved] = useState<Set<string>>(new Set());

  const toggleRemove = useCallback((key: string) => {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  function buildModifiedUrl() {
    try {
      const url = new URL(generatedUrl);
      const params = new URLSearchParams(url.search);

      removed.forEach((filterKey) => {
        const [label] = filterKey.split(":");
        const paramName = FILTER_TO_PARAM[label];
        if (!paramName) return;

        const keys = Array.from(params.keys());
        keys.forEach((key) => {
          if (key.startsWith(paramName)) {
            params.delete(key);
          }
        });
        if (params.has(paramName)) params.delete(paramName);
      });

      url.search = params.toString();
      return url.toString();
    } catch {
      return null;
    }
  }

  function handleRetry() {
    const url = buildModifiedUrl();
    if (url) onRetrySearch(url);
  }

  return (
    <div className="max-w-[800px] mx-auto my-8 p-8 bg-grey-50 rounded-xl border border-grey-100 text-center">
      <h3 className="text-grey-700 mb-2 text-2xl">No products found matching your search</h3>
      <p className="text-grey-500 mb-6 text-base">
        Try removing some filters to expand your search:
      </p>

      <div className="flex flex-wrap gap-3 justify-center mb-6">
        {filters.map((f) => {
          const key = `${f.label}:${f.value}`;
          const isRemoved = removed.has(key);
          return (
            <div
              key={key}
              className={`flex items-center bg-white border-2 border-grey-200 rounded-full px-3 py-2 text-sm shadow-sm transition-all ${
                isRemoved
                  ? "opacity-30 scale-90 pointer-events-none"
                  : "hover:border-brand-400 hover:-translate-y-px hover:shadow-md"
              }`}
            >
              <span className="text-grey-700 mr-2 font-medium">
                {f.label}: {f.value}
              </span>
              <button
                onClick={() => toggleRemove(key)}
                className="bg-transparent border-none text-grey-500 cursor-pointer p-0.5 rounded-full flex items-center justify-center hover:bg-brand-400 hover:text-white hover:scale-110 transition-all"
                aria-label={`Remove ${f.label} filter`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      {removed.size > 0 && (
        <button
          onClick={handleRetry}
          className="bg-brand-500 text-white border-none px-6 py-3 rounded-full text-base font-semibold cursor-pointer inline-flex items-center gap-2 shadow-[0_4px_12px_rgba(183,28,28,0.3)] hover:bg-brand-700 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(183,28,28,0.4)] active:translate-y-0 transition-all"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Search Again
        </button>
      )}
    </div>
  );
}
