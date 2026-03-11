import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { CLUB_PROMPT_FILES } from "@/lib/config";
import { classifyQuery, buildUrlWithLlm } from "@/lib/llm-service";
import { scrape2ndSwing } from "@/lib/scraper";

export async function POST(request: NextRequest) {
  try {
    const t0 = performance.now();

    const body = await request.json();
    const userQuery: string = body.user_query || "";
    const clubType: string = body.club_type || "Driver";

    // Step 1: Classify query
    const tClassify0 = performance.now();
    const classification = await classifyQuery(userQuery, clubType);
    const tClassify = performance.now() - tClassify0;

    // Step 2: Load system prompt
    const tPrompt0 = performance.now();
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
    const tPrompt = performance.now() - tPrompt0;

    // Step 3: Build URL
    const tUrl0 = performance.now();
    const generatedUrl = await buildUrlWithLlm(userQuery, systemPrompt);
    const tUrl = performance.now() - tUrl0;

    // Step 4: Scrape
    const tScrape0 = performance.now();
    const { products, totalCount, appliedFilters, nextPageUrl, noResults } =
      await scrape2ndSwing(generatedUrl);
    const tScrape = performance.now() - tScrape0;

    const tTotal = performance.now() - t0;

    const timing = {
      classify_ms: Math.round(tClassify),
      prompt_load_ms: Math.round(tPrompt),
      url_build_ms: Math.round(tUrl),
      scrape_ms: Math.round(tScrape),
      total_server_ms: Math.round(tTotal),
    };

    console.log("\n--- Search Latency Breakdown ---");
    console.log(`  Query classification (LLM):  ${timing.classify_ms} ms`);
    console.log(`  Prompt file load:            ${timing.prompt_load_ms} ms`);
    console.log(`  URL generation (LLM):        ${timing.url_build_ms} ms`);
    console.log(`  Scrape 2ndSwing:             ${timing.scrape_ms} ms`);
    console.log(`  Total server time:           ${timing.total_server_ms} ms`);
    console.log(`  Generated URL: ${generatedUrl}`);
    console.log(`  Products returned: ${products.length}`);
    console.log("--------------------------------\n");

    return NextResponse.json({
      products,
      generated_url: generatedUrl,
      total_count: totalCount,
      applied_filters: appliedFilters,
      next_page_url: nextPageUrl,
      no_results: noResults,
      potential_clubtype_mismatch: classification.potential_clubtype_mismatch,
      intended_club_type: classification.intended_club_type,
      _timing: timing,
    });
  } catch (e) {
    console.error("Search error:", e);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
