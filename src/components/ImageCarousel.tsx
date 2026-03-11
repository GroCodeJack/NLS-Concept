"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface Props {
  primarySrc: string;
  alt: string;
  children?: React.ReactNode;
  productUrl: string;
}

// We always assume at least 1 extra image exists so we show dots/chevrons by default.
// Once probed, we know the real count.
const ASSUMED_TOTAL = 7;
const SNAP_THRESHOLD = 0.3; // drag 30% of width to commit to next slide

// Swap low-res dimensions for high-res in 2ndswing image URLs
function toHighRes(url: string): string {
  return url
    .replace(/width=\d+/, "width=1280")
    .replace(/height=\d+/, "height=1280");
}

export default function ImageCarousel({ primarySrc, alt, children, productUrl }: Props) {
  const [images, setImages] = useState<string[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dragOffset, setDragOffset] = useState(0); // px offset while dragging
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const directionLocked = useRef<"h" | "v" | null>(null);
  const probePromiseRef = useRef<Promise<string[]> | null>(null);

  const [fullyProbed, setFullyProbed] = useState(false);
  const fullProbeStarted = useRef(false);
  // Maps low-res URL → high-res URL once preloaded
  const [hiResReady, setHiResReady] = useState<Record<string, string>>({});
  const hiResStarted = useRef<Set<string>>(new Set());

  // Don't trust the count until full probe is done
  const totalSlides = fullyProbed ? (images?.length ?? ASSUMED_TOTAL) : Math.max(images?.length ?? 0, ASSUMED_TOTAL);

  // Phase 1: Quick probe — only fetch _2 for instant display
  const probeQuick = useCallback(async (): Promise<string[]> => {
    if (images) return images;
    setLoading(true);
    try {
      const resp = await fetch("/api/probe-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primary_url: primarySrc, quick: true }),
      });
      const data = await resp.json();
      const result: string[] = data.images?.length ? data.images : [primarySrc];
      setImages(result);
      setLoading(false);
      return result;
    } catch {
      const fallback = [primarySrc];
      setImages(fallback);
      setLoading(false);
      return fallback;
    }
  }, [primarySrc, images]);

  // Phase 2: Full probe — fetch all remaining images in background, merge in
  // IMPORTANT: never shrink the images array below what quick probe found,
  // because Vercel's IPs can get rate-limited on sequential HEAD requests
  // causing the full probe to return fewer results than the quick probe.
  const probeFull = useCallback(async () => {
    if (fullProbeStarted.current) return;
    fullProbeStarted.current = true;
    try {
      const resp = await fetch("/api/probe-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primary_url: primarySrc }),
      });
      const data = await resp.json();
      if (data.images?.length) {
        setImages(prev => {
          if (!prev || data.images.length >= prev.length) return data.images;
          return prev; // keep quick-probe result if full probe found fewer
        });
      }
    } catch {
      // silent — quick probe already gave us something
    }
    setFullyProbed(true);
  }, [primarySrc]);

  // Preload high-res for the primary image immediately (always visible)
  useEffect(() => {
    if (hiResStarted.current.has(primarySrc)) return;
    hiResStarted.current.add(primarySrc);
    const hiUrl = toHighRes(primarySrc);
    if (hiUrl === primarySrc) return;
    const img = new Image();
    img.onload = () => {
      setHiResReady((prev) => ({ ...prev, [primarySrc]: hiUrl }));
    };
    img.src = hiUrl;
  }, [primarySrc]);

  // Preload high-res for remaining images after full probe
  // Prioritizes: current slide, then adjacent, then the rest
  useEffect(() => {
    if (!fullyProbed || !images || images.length === 0) return;

    // Build priority order: current, adjacent, then rest
    const order: number[] = [currentIndex];
    // Add neighbors outward
    for (let d = 1; d < images.length; d++) {
      if (currentIndex - d >= 0) order.push(currentIndex - d);
      if (currentIndex + d < images.length) order.push(currentIndex + d);
    }

    for (const idx of order) {
      const lowRes = images[idx];
      if (!lowRes || hiResStarted.current.has(lowRes)) continue;
      hiResStarted.current.add(lowRes);

      const hiUrl = toHighRes(lowRes);
      if (hiUrl === lowRes) continue; // no change (no width/height params)

      const img = new Image();
      img.onload = () => {
        setHiResReady((prev) => ({ ...prev, [lowRes]: hiUrl }));
      };
      // Silent fail — low-res stays as fallback
      img.src = hiUrl;
    }
  }, [fullyProbed, images, currentIndex]);

  // Safety net: if images array shrinks below currentIndex, clamp back
  useEffect(() => {
    if (images && images.length > 0 && currentIndex >= images.length) {
      setIsTransitioning(true);
      setDragOffset(0);
      setCurrentIndex(images.length - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [images, currentIndex]);

  // Navigate to a specific index with smooth transition
  const goToIndex = useCallback((idx: number) => {
    setIsTransitioning(true);
    setDragOffset(0);
    setCurrentIndex(idx);
    // Remove transition class after animation completes
    setTimeout(() => setIsTransitioning(false), 300);
  }, []);

  // Desktop chevron: next
  const goNext = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      let imgs = images;
      if (!imgs) {
        imgs = await probeQuick();
        probeFull(); // fire full probe in background
      }
      if (currentIndex + 1 < imgs.length) goToIndex(currentIndex + 1);
    },
    [images, probeQuick, probeFull, currentIndex, goToIndex]
  );

  // Desktop chevron: prev
  const goPrev = useCallback(
    (e?: React.MouseEvent) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (currentIndex > 0) goToIndex(currentIndex - 1);
    },
    [currentIndex, goToIndex]
  );

  // --- Touch handling: drag-following ---
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (isTransitioning) return;
    if (e.touches.length >= 2) return; // pinch-to-zoom — don't start drag
    dragging.current = true;
    directionLocked.current = null;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setDragOffset(0);
  }, [isTransitioning]);

  // Refs for latest values accessible from imperative touchmove handler
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const totalSlidesRef = useRef(totalSlides);
  totalSlidesRef.current = totalSlides;
  const imagesRef = useRef(images);
  imagesRef.current = images;

  // Attach touchmove imperatively with { passive: false } so preventDefault() works
  useEffect(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current) return;
      // Second finger arrived — cancel drag, let browser handle zoom
      if (e.touches.length >= 2) {
        dragging.current = false;
        directionLocked.current = null;
        setDragOffset(0);
        return;
      }
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;

      // Lock direction after 10px of movement
      if (!directionLocked.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        directionLocked.current = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";

        // Eagerly start probing as soon as we know it's a horizontal swipe
        if (directionLocked.current === "h" && !imagesRef.current && !probePromiseRef.current) {
          probePromiseRef.current = probeQuick();
          probeFull(); // full probe in background
        }
      }

      if (directionLocked.current === "v") {
        dragging.current = false;
        setDragOffset(0);
        return;
      }

      if (directionLocked.current === "h") {
        e.preventDefault();

        let offset = dx;
        const atStart = currentIndexRef.current === 0 && dx > 0;
        const atEnd = currentIndexRef.current >= totalSlidesRef.current - 1 && dx < 0;
        if (atStart || atEnd) {
          offset = dx * 0.3;
        }

        setDragOffset(offset);
      }
    };

    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [probeQuick, probeFull]);

  const snapBack = useCallback(() => {
    setIsTransitioning(true);
    setDragOffset(0);
    setTimeout(() => setIsTransitioning(false), 300);
  }, []);

  const onTouchEnd = useCallback(
    async () => {
      if (!dragging.current && directionLocked.current !== "h") return;
      dragging.current = false;
      directionLocked.current = null;

      const width = containerRef.current?.offsetWidth || 300;
      const ratio = dragOffset / width;

      if (ratio < -SNAP_THRESHOLD) {
        // Swiped left → go next
        // Await the quick probe (started during touchmove) so we know the real count
        // before allowing forward navigation — prevents navigating to blank slides
        let maxIndex = totalSlides - 1;
        if (probePromiseRef.current) {
          const imgs = await probePromiseRef.current;
          maxIndex = imgs.length - 1;
        }
        if (currentIndex + 1 <= maxIndex) {
          goToIndex(currentIndex + 1);
        } else {
          snapBack();
        }
      } else if (ratio > SNAP_THRESHOLD) {
        // Swiped right → go prev
        if (currentIndex > 0) {
          goToIndex(currentIndex - 1);
        } else {
          snapBack();
        }
      } else {
        snapBack();
      }
    },
    [dragOffset, currentIndex, totalSlides, goToIndex, snapBack]
  );

  // Build slide sources
  const slides: (string | null)[] = images
    ? images
    : [primarySrc, ...Array(ASSUMED_TOTAL - 1).fill(null)];

  // Calculate transform: base position + drag offset
  const translateX = -(currentIndex * 100); // percentage
  const stripStyle: React.CSSProperties = {
    transform: `translateX(calc(${translateX}% + ${dragOffset}px))`,
    transition: isTransitioning ? "transform 0.3s ease-out" : "none",
  };

  return (
    <div
      className="relative aspect-square bg-grey-50 group/carousel overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Transform-based slide strip */}
      <div
        ref={containerRef}
        className="flex w-full h-full"
        style={stripStyle}
      >
        {slides.map((src, i) => {
          // Use high-res version if preloaded, otherwise low-res
          const displaySrc = src ? (hiResReady[src] || src) : null;
          return (
          <div key={i} className="w-full h-full shrink-0">
            {displaySrc ? (
              <a href={productUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displaySrc} alt={alt} className="w-full h-full object-cover" draggable={false} />
              </a>
            ) : (
              <div className="w-full h-full bg-grey-100 flex items-center justify-center">
                {loading && (
                  <div className="w-6 h-6 border-2 border-grey-300 border-t-grey-600 rounded-full animate-spin" />
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {/* Desktop chevrons */}
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity cursor-pointer border-none"
          aria-label="Previous image"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}
      {currentIndex < totalSlides - 1 && (
        <button
          onClick={goNext}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity cursor-pointer border-none"
          aria-label="Next image"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-grey-300 border-t-grey-700 rounded-full animate-spin" />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
        </button>
      )}

      {/* Mobile dot indicators — sliding window with directional fade */}
      <div className="flex sm:hidden absolute bottom-2.5 left-1/2 -translate-x-1/2 gap-1.5">
        {(() => {
          const count = totalSlides;
          const MAX_DOTS = 7;
          // Sliding window: keep active dot roughly centered
          let start = 0;
          let end = count;
          if (count > MAX_DOTS) {
            const half = Math.floor(MAX_DOTS / 2);
            start = Math.max(0, currentIndex - half);
            end = start + MAX_DOTS;
            if (end > count) {
              end = count;
              start = end - MAX_DOTS;
            }
          }
          const hasMoreLeft = start > 0;
          const hasMoreRight = end < count;

          return Array.from({ length: end - start }).map((_, vi) => {
            const i = start + vi;
            const isActive = i === currentIndex;

            // Fade dots near edges when there are more beyond
            let opacity = 1;
            if (!isActive) {
              const distFromLeft = vi; // 0-based position in visible window
              const distFromRight = (end - start - 1) - vi;

              if (hasMoreLeft && distFromLeft < 3) {
                opacity = Math.max(0.15, 0.25 + distFromLeft * 0.25);
              }
              if (hasMoreRight && distFromRight < 3) {
                const rightOpacity = Math.max(0.15, 0.25 + distFromRight * 0.25);
                opacity = Math.min(opacity, rightOpacity);
              }
            }

            return (
              <span
                key={i}
                className={`w-[6px] h-[6px] rounded-full transition-all duration-200 ${
                  isActive
                    ? "bg-brand-500 shadow-[0_0_3px_rgba(0,0,0,0.4)]"
                    : "bg-brand-500/40"
                }`}
                style={opacity < 1 ? { opacity } : undefined}
              />
            );
          });
        })()}
      </div>

      {/* Overlay children (condition badge etc.) */}
      {children}
    </div>
  );
}
