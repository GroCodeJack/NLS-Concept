"use client";

export default function SkeletonGrid() {
  return (
    <>
      {/* Skeleton CTA bar */}
      <div className="w-full max-w-[1300px] mx-auto my-3 p-4 bg-grey-50 border border-grey-100 rounded-[10px]">
        <div className="flex justify-between items-center gap-4">
          <div className="h-10 w-[180px] rounded bg-gradient-to-r from-grey-50 via-grey-100 to-grey-50 bg-[length:200%_100%] animate-[shimmer_1.3s_linear_infinite]" />
          <div className="h-4 w-[120px] rounded bg-gradient-to-r from-grey-50 via-grey-100 to-grey-50 bg-[length:200%_100%] animate-[shimmer_1.3s_linear_infinite]" />
        </div>
      </div>

      {/* Skeleton product grid */}
      <div className="w-full max-w-[1300px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-md bg-white border border-grey-100 shadow-[0_2px_6px_rgba(0,0,0,0.06)] flex flex-col gap-3"
          >
            <div className="h-[140px] rounded bg-gradient-to-r from-grey-50 via-grey-100 to-grey-50 bg-[length:200%_100%] animate-[shimmer_1.3s_linear_infinite]" />
            <div className="h-3.5 w-full rounded bg-gradient-to-r from-grey-50 via-grey-100 to-grey-50 bg-[length:200%_100%] animate-[shimmer_1.3s_linear_infinite]" />
            <div className="h-3.5 w-3/5 rounded bg-gradient-to-r from-grey-50 via-grey-100 to-grey-50 bg-[length:200%_100%] animate-[shimmer_1.3s_linear_infinite]" />
          </div>
        ))}
      </div>
    </>
  );
}
