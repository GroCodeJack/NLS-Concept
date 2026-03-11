import { NextRequest, NextResponse } from "next/server";
import { scrape2ndSwing } from "@/lib/scraper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url: string = body.url || "";

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    const { products, totalCount, appliedFilters, nextPageUrl, noResults } =
      await scrape2ndSwing(url);

    return NextResponse.json({
      products,
      generated_url: url,
      total_count: totalCount,
      applied_filters: appliedFilters,
      next_page_url: nextPageUrl,
      no_results: noResults,
      potential_clubtype_mismatch: false,
      intended_club_type: null,
    });
  } catch (e) {
    console.error("Search with URL error:", e);
    return NextResponse.json({ error: "Failed to search with URL" }, { status: 500 });
  }
}
