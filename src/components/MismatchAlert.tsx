"use client";

import { useState } from "react";

interface Props {
  clubType: string;
  intendedClubType: string;
  onRetry: (intendedClubType: string) => void;
}

export default function MismatchAlert({ clubType, intendedClubType, onRetry }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="max-w-[1300px] w-full mx-auto py-4 flex items-center gap-4 animate-[slideDown_0.4s_ease-out] max-md:flex-col max-md:text-center max-md:p-4">
      <div className="shrink-0 w-8 h-8 flex items-center justify-center">
        <svg
          className="w-8 h-8 stroke-brand-500"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 2L2 20h20L12 2z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 9v4M12 17h.01"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex-1">
        <p className="mb-3 text-base text-grey-800 leading-relaxed">
          It looks like you were looking for{" "}
          <strong className="text-brand-500 font-semibold">{intendedClubType}</strong> but you
          had <strong className="text-brand-500 font-semibold">{clubType}</strong> selected.
          Would you like to search again using{" "}
          <strong className="text-brand-500 font-semibold">{intendedClubType}</strong>?
        </p>
        <div className="flex gap-3 flex-wrap max-md:justify-center max-md:w-full">
          <button
            onClick={() => onRetry(intendedClubType)}
            className="px-5 py-2 border-none rounded-md text-[0.95rem] font-semibold cursor-pointer bg-brand-500 text-white shadow-[0_2px_6px_rgba(183,28,28,0.3)] hover:bg-brand-700 hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(183,28,28,0.4)] transition-all inline-flex items-center gap-2 max-md:flex-1 max-md:min-w-[100px] max-md:justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Yes, search with {intendedClubType}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-5 py-2 rounded-md text-[0.95rem] font-semibold cursor-pointer bg-white text-grey-600 border-2 border-grey-200 hover:bg-grey-50 hover:text-grey-800 hover:border-grey-300 transition-all inline-flex items-center gap-2 max-md:flex-1 max-md:min-w-[100px] max-md:justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            No, keep current results
          </button>
        </div>
      </div>
    </div>
  );
}
