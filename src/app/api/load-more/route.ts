import { NextRequest, NextResponse } from "next/server";
import { scrape2ndSwing } from "@/lib/scraper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nextUrl: string = body.next_url || "";

    if (!nextUrl) {
      return NextResponse.json({ error: "No next URL provided" }, { status: 400 });
    }

    // Fix HTML entity encoding
    const decodedUrl = nextUrl.replace(/&amp;/g, "&");
    const { products, nextPageUrl } = await scrape2ndSwing(decodedUrl);

    return NextResponse.json({
      products,
      next_page_url: nextPageUrl,
    });
  } catch (e) {
    console.error("Load more error:", e);
    return NextResponse.json({ error: "Failed to load more products" }, { status: 500 });
  }
}
