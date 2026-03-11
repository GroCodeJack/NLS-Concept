"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { Product, AppliedFilter, SearchResult } from "@/lib/types";
import { VISIBLE_ATTRS, CLUB_TYPES, PLACEHOLDER_SLUGS } from "@/lib/config";
import WelcomeModal from "./WelcomeModal";
import SkeletonGrid from "./SkeletonGrid";
import ProductTile from "./ProductTile";
import FiltersBar from "./FiltersBar";
import NoResults from "./NoResults";
import MismatchAlert from "./MismatchAlert";

export default function SearchPage() {
  // Form state
  const [clubType, setClubType] = useState("Driver");
  const [userQuery, setUserQuery] = useState("");

  // Result state
  const [searching, setSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilter[]>([]);
  const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [mismatch, setMismatch] = useState<{ show: boolean; intended: string | null }>({
    show: false,
    intended: null,
  });

  // Placeholder rotation
  const [placeholders, setPlaceholders] = useState<Record<string, string[]>>({});
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [phOpacity, setPhOpacity] = useState(1);
  const phIndexRef = useRef(0);

  // Textarea ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Infinite scroll
  const isLoadingMore = useRef(false);

  // Load placeholders
  useEffect(() => {
    fetch("/api/placeholders")
      .then((r) => r.json())
      .then((data) => setPlaceholders(data))
      .catch(console.error);
  }, []);

  // Placeholder rotation
  useEffect(() => {
    const slug = PLACEHOLDER_SLUGS[clubType] || "driver";
    const arr = placeholders[slug] || [];
    if (!arr.length) return;

    function rotatePh() {
      const s = PLACEHOLDER_SLUGS[clubType] || "driver";
      const a = placeholders[s] || [];
      if (!a.length) return;
      setPhOpacity(0);
      setTimeout(() => {
        setCurrentPlaceholder(a[phIndexRef.current % a.length]);
        setPhOpacity(1);
        phIndexRef.current = (phIndexRef.current + 1) % a.length;
      }, 250);
    }

    rotatePh();
    const interval = setInterval(rotatePh, 5000);
    return () => clearInterval(interval);
  }, [clubType, placeholders]);

  // Reset placeholder index on club type change
  function handleClubTypeChange(val: string) {
    setClubType(val);
    phIndexRef.current = 0;
  }

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.max(ta.scrollHeight, 20) + "px";
  }, [userQuery]);

  // Search
  async function handleSearch(overrideClubType?: string) {
    const ct = overrideClubType || clubType;
    if (overrideClubType) setClubType(overrideClubType);

    setSearching(true);
    setHasResults(false);
    setMismatch({ show: false, intended: null });

    try {
      const tStart = performance.now();
      const resp = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_query: userQuery, club_type: ct }),
      });
      const tNetwork = performance.now() - tStart;
      const data: SearchResult = await resp.json();

      const tRender0 = performance.now();
      setProducts(data.products);
      setGeneratedUrl(data.generated_url);
      setTotalCount(data.total_count);
      setAppliedFilters(data.applied_filters);
      setNextPageUrl(data.next_page_url);
      setNoResults(data.no_results);
      setHasResults(true);

      if (data.potential_clubtype_mismatch && data.intended_club_type) {
        setMismatch({ show: true, intended: data.intended_club_type });
      }

      // Log full round-trip diagnostic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const timing = (data as any)._timing;
      const tTotal = performance.now() - tStart;
      console.log("\n%c=== Search Round-Trip Diagnostic ===", "color: #b71c1c; font-weight: bold; font-size: 14px");
      if (timing) {
        console.log(`  🔍 Query classification (LLM):  ${timing.classify_ms} ms`);
        console.log(`  📄 Prompt file load:             ${timing.prompt_load_ms} ms`);
        console.log(`  🔗 URL generation (LLM):         ${timing.url_build_ms} ms`);
        console.log(`  🌐 Scrape 2ndSwing:              ${timing.scrape_ms} ms`);
        console.log(`  ⚙️  Total server processing:      ${timing.total_server_ms} ms`);
      }
      console.log(`  📡 Network round-trip (fetch):   ${Math.round(tNetwork)} ms`);
      console.log(`  🖥️  Client overhead:              ${Math.round(tNetwork - (timing?.total_server_ms || 0))} ms`);
      console.log(`  📦 Products returned:            ${data.products.length}`);
      console.log(`  ⏱️  Total click-to-data:          ${Math.round(tTotal)} ms`);
      console.log("%c====================================", "color: #b71c1c; font-weight: bold");
    } catch (err) {
      console.error("Search failed:", err);
      alert("Something went wrong performing the search. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  // Search with modified URL (for filter removal)
  async function handleSearchWithUrl(url: string) {
    setSearching(true);
    setHasResults(false);

    try {
      const resp = await fetch("/api/search-with-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, club_type: clubType, user_query: userQuery }),
      });
      const data: SearchResult = await resp.json();

      setProducts(data.products);
      setGeneratedUrl(data.generated_url);
      setTotalCount(data.total_count);
      setAppliedFilters(data.applied_filters);
      setNextPageUrl(data.next_page_url);
      setNoResults(data.no_results);
      setHasResults(true);
      setMismatch({ show: false, intended: null });
    } catch (err) {
      console.error("Search with URL failed:", err);
      alert("Something went wrong with the search. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  // Infinite scroll: load more
  const loadMore = useCallback(async () => {
    if (isLoadingMore.current || !nextPageUrl) return;
    isLoadingMore.current = true;

    try {
      const resp = await fetch("/api/load-more", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next_url: nextPageUrl, club_type: clubType }),
      });
      const data = await resp.json();
      if (data.error) {
        console.error("Load more error:", data.error);
        return;
      }

      setProducts((prev) => [...prev, ...data.products]);
      setNextPageUrl(data.next_page_url);
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      isLoadingMore.current = false;
    }
  }, [nextPageUrl, clubType]);

  // Scroll listener for infinite scroll
  useEffect(() => {
    if (!hasResults || !nextPageUrl) return;

    function onScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollTop + windowHeight >= documentHeight - 200) {
        loadMore();
      }
    }

    const timer = setTimeout(() => {
      window.addEventListener("scroll", onScroll);
    }, 1000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [hasResults, nextPageUrl, loadMore]);

  // Keyboard shortcut
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  const MAX_CHARS = 170;
  const isInitialState = !searching && !hasResults;

  return (
    <>
      <WelcomeModal />

      <div className="min-h-screen py-[min(6vw,48px)] px-[15px] flex flex-col items-center gap-4 font-body transition-[padding-top] duration-[0.6s] ease-in-out">
        {/* Hero / Search */}
        <header
          className={`w-full max-w-[1300px] mt-5 flex flex-col items-center gap-3 transition-transform duration-[0.6s] ease-in-out ${
            isInitialState ? "translate-y-[calc(12vh-50%)]" : "translate-y-0"
          }`}
        >
          <h1 className="font-headline italic font-bold uppercase text-[clamp(1.92rem,4.8vw,65.28px)] leading-none text-black text-center m-0 tracking-tight flex items-center justify-center gap-3 flex-wrap">
            <span>AI SEARCH</span>
            <span className="font-body text-sm font-semibold not-italic uppercase bg-brand-500 text-white px-2 py-1 rounded tracking-wider">
              Beta
            </span>
          </h1>

          <form
            className="w-full"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <div className="flex items-stretch gap-2.5 w-full max-md:flex-col">
              {/* Club type dropdown */}
              <select
                value={clubType}
                onChange={(e) => handleClubTypeChange(e.target.value)}
                className="p-4 pr-10 border border-grey-400 bg-white text-base cursor-pointer outline-none rounded-lg min-w-[120px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] appearance-none text-center bg-no-repeat bg-[right_0.75em_center] bg-[length:16px] text-black focus:border-brand-500 focus:shadow-[0_4px_12px_rgba(183,28,28,0.15)] max-md:order-[-1] max-md:min-w-0 max-md:max-w-[185px] max-md:mx-auto max-md:p-2.5 max-md:pr-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%23333' d='M4 6l4 4 4-4z'/%3E%3C/svg%3E")`,
                }}
              >
                {CLUB_TYPES.map((ct) => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>

              {/* Search input container */}
              <div className="relative flex-1 bg-white border border-grey-400 rounded-lg overflow-hidden shadow-[0_2px_4px_rgba(0,0,0,0.1)] flex items-stretch focus-within:border-brand-500 focus-within:shadow-[0_4px_12px_rgba(183,28,28,0.15)] max-md:order-1">
                <textarea
                  ref={textareaRef}
                  value={userQuery}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, MAX_CHARS);
                    setUserQuery(val);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={currentPlaceholder}
                  rows={1}
                  className="flex-1 p-4 pr-[60px] border-none text-base resize-none outline-none min-h-5 overflow-y-hidden leading-relaxed font-body transition-[height] duration-200"
                  style={
                    {
                      "--ph-opacity": phOpacity,
                    } as React.CSSProperties
                  }
                />
                {userQuery.length >= MAX_CHARS && (
                  <div className="absolute bottom-1 left-4 text-brand-500 text-xs" aria-live="polite">
                    Max {MAX_CHARS} characters.
                  </div>
                )}
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-500 text-white border-none p-2 cursor-pointer rounded w-10 h-10 flex items-center justify-center hover:bg-[#8f1616] active:bg-brand-700 transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </header>

        {/* Mismatch alert */}
        {mismatch.show && mismatch.intended && (
          <MismatchAlert
            clubType={clubType}
            intendedClubType={mismatch.intended}
            onRetry={(intended) => handleSearch(intended)}
          />
        )}

        {/* Loading skeleton */}
        {searching && <SkeletonGrid />}

        {/* Results area */}
        {!searching && hasResults && (
          <>
            {/* CTA & Filters */}
            {generatedUrl && (
              <FiltersBar generatedUrl={generatedUrl} appliedFilters={appliedFilters} />
            )}

            {/* No results with filter removal */}
            {noResults && appliedFilters.length > 0 && (
              <NoResults
                filters={appliedFilters}
                generatedUrl={generatedUrl}
                onRetrySearch={handleSearchWithUrl}
              />
            )}

            {/* Result count */}
            {totalCount != null && (
              <div className="font-semibold my-2 mx-auto max-w-[1300px] w-full text-left px-4 transition-opacity duration-300">
                Total products found: {Number(totalCount).toLocaleString()}
              </div>
            )}

            {/* Product grid */}
            {products.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-[1300px] mx-auto w-full transition-opacity duration-300">
                {products.map((product, i) => (
                  <ProductTile
                    key={`${product.url}-${i}`}
                    product={product}
                    visibleAttrs={VISIBLE_ATTRS[clubType] || []}
                    index={i}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
