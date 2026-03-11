"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "ai_golf_search_visited";

export default function WelcomeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  function close() {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "true");
  }

  return (
    <div
      className={`fixed inset-0 z-[10000] flex items-center justify-center transition-all duration-300 ${
        show
          ? "bg-black/60 opacity-100 visible"
          : "opacity-0 invisible pointer-events-none"
      }`}
      onClick={(e) => e.target === e.currentTarget && close()}
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <div
        className={`bg-white rounded-xl max-w-[550px] w-[90%] mx-5 shadow-[0_10px_40px_rgba(0,0,0,0.3)] max-h-[90vh] overflow-y-auto transition-transform duration-300 ${
          show ? "translate-y-0" : "-translate-y-5"
        }`}
      >
        {/* Header */}
        <div className="px-8 pt-6 pb-4 border-b border-grey-100 flex justify-between items-start gap-4">
          <h2
            id="modal-title"
            className="font-headline font-semibold italic text-2xl text-brand-500 m-0 leading-tight uppercase"
          >
            Introducing AI Golf Club Search (Beta)
          </h2>
          <button
            onClick={close}
            className="bg-transparent border-none text-2xl text-grey-600 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded shrink-0 hover:bg-grey-50 hover:text-grey-800 transition-colors"
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <p className="text-base leading-relaxed text-grey-800 mb-6">
            AI Golf Club Search is the fastest way to find exactly what you&apos;re looking for.
            Simply enter your search in natural language—like{" "}
            <strong>&quot;Ping right-handed stiff flex drivers under $300&quot;</strong>—and
            our AI will return matching results in seconds.
          </p>
          <ul className="m-0 p-0 list-none space-y-3">
            {[
              <>
                <strong>Select club type first:</strong> Choose the club type from the dropdown
                near the search bar before searching
              </>,
              <>
                <strong>Shaft flex filtering:</strong> Currently, we can filter by shaft flex
                options but not specific shaft models
              </>,
              <>
                <strong>Beta version:</strong> This feature is in beta and results may not always
                be perfect—we&apos;re continuously improving!
              </>,
            ].map((item, i) => (
              <li
                key={i}
                className="relative pl-6 text-[0.95rem] leading-relaxed text-grey-600 before:content-['•'] before:absolute before:left-2 before:text-brand-500 before:font-bold before:text-xl"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 pt-4 text-center">
          <button
            onClick={close}
            className="bg-brand-500 text-white border-none px-8 py-3 rounded-lg text-base font-semibold cursor-pointer shadow-[0_2px_8px_rgba(183,28,28,0.3)] hover:bg-brand-700 active:bg-brand-700 active:translate-y-px transition-all"
          >
            Got it, let&apos;s search!
          </button>
        </div>
      </div>
    </div>
  );
}
