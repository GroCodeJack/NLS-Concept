import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CLUB_PROMPT_FILES } from "@/lib/config";
import { classifyQuery, buildUrlWithLlm } from "@/lib/llm-service";
import { scrape2ndSwing } from "@/lib/scraper";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userQuery: string = body.user_query || "";
    const clubType: string = body.club_type || "Driver";

    // Step 1: Classify query
    const classification = await classifyQuery(userQuery, clubType);

    // Step 2: Load system prompt
    const promptFile = CLUB_PROMPT_FILES[clubType] || "driver.txt";
    const promptPath = path.join(process.cwd(), "textdocs", "prompts_v2", promptFile);
    let systemPrompt: string;
    try {
      systemPrompt = fs.readFileSync(promptPath, "utf-8");
    } catch {
      systemPrompt = "Build a URL for the chosen club type.";
    }

    // Prepend classification
    const prefix =
      `CLASSIFICATION: ${classification.is_model_specific ? "MODEL_SPECIFIC" : "GENERIC"}\n` +
      `CLUB_TYPE: ${clubType}\n`;
    systemPrompt = prefix + systemPrompt;

    // Step 3: Build URL
    const generatedUrl = await buildUrlWithLlm(userQuery, systemPrompt);

    // Step 4: Scrape
    const { products, totalCount, appliedFilters, nextPageUrl, noResults } =
      await scrape2ndSwing(generatedUrl);

    return NextResponse.json({
      products,
      generated_url: generatedUrl,
      total_count: totalCount,
      applied_filters: appliedFilters,
      next_page_url: nextPageUrl,
      no_results: noResults,
      potential_clubtype_mismatch: classification.potential_clubtype_mismatch,
      intended_club_type: classification.intended_club_type,
    });
  } catch (e) {
    console.error("Search error:", e);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
