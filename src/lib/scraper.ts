import * as cheerio from "cheerio";
import type { Product, AppliedFilter } from "./types";

export async function scrape2ndSwing(url: string): Promise<{
  products: Product[];
  totalCount: number | null;
  appliedFilters: AppliedFilter[];
  nextPageUrl: string | null;
  noResults: boolean;
}> {
  try {
    const tFetch0 = performance.now();
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await resp.text();
    const tFetch = performance.now() - tFetch0;

    const tParse0 = performance.now();
    const $ = cheerio.load(html);

    let noResults = false;
    let totalCount: number | null = null;
    const appliedFilters: AppliedFilter[] = [];
    let nextPageUrl: string | null = null;

    // Check for no results
    const noResultsEl = $("div.message.info.empty");
    if (
      noResultsEl.length &&
      noResultsEl.text().includes("We can't find products matching the selection")
    ) {
      noResults = true;
    }
    const searchNoResults = $(
      "#maincontent > div.columns > div.column.main > div.message.notice"
    );
    if (searchNoResults.length) noResults = true;

    // Parse applied filters
    $("ol.items li.item").each((_, li) => {
      const labelEl = $(li).find(".filter-label");
      const valueEl = $(li).find(".filter-value");
      if (labelEl.length && valueEl.length) {
        const label = labelEl.text().trim();
        const value = valueEl.text().trim();
        if (label && value) appliedFilters.push({ label, value });
      }
    });

    if (noResults) {
      return { products: [], totalCount: null, appliedFilters, nextPageUrl: null, noResults: true };
    }

    // Total count — use .first() since toolbar appears in both top and bottom pagination
    const countTag = $("p.toolbar-amount span.toolbar-number:last-child").first();
    if (countTag.length) {
      const parsed = parseInt(countTag.text().trim().replace(/,/g, ""), 10);
      if (!isNaN(parsed)) totalCount = parsed;
    }

    // Next page URL
    let nextLink = $("ul.pages-items li.pages-item-next a.next");
    if (!nextLink.length) {
      nextLink = $('ul.pages-items li.item a[href*="p=2"]');
    }
    if (nextLink.length) {
      let href = nextLink.attr("href") || "";
      // Fix HTML entity encoding
      href = href.replace(/&amp;/g, "&");
      if (href.startsWith("/")) {
        nextPageUrl = "https://www.2ndswing.com" + href;
      } else if (href.startsWith("http")) {
        nextPageUrl = href;
      }
    }

    // Parse product cards
    const products: Product[] = [];
    $("div.product-box.product-item-info").each((_, card) => {
      const $card = $(card);

      const brand = $card.find("div.product-brand").text().trim() || "N/A";
      const modelTag =
        $card.find("div.pmp-product-category").text().trim() ||
        $card.find("div.p-title").text().trim() ||
        "N/A";
      const imgTag = $card.find("img.product-image-photo");
      const imgUrl = imgTag.attr("src") || "";
      const linkTag = $card.find("a.product.photo.product-item-photo");
      const productUrl = linkTag.attr("href") || "";

      const hasNewVariants = $card.attr("data-hasnewvariants") === "1";
      const hasUsedVariants = $card.attr("data-itemhasused") === "1";
      const hasVariantLinks = $card.find("a.new-used-listing-link").length > 0;
      const parentModel = !!(hasNewVariants || (hasUsedVariants && hasNewVariants) || hasVariantLinks);

      // Parse attributes
      const attrs: Record<string, string> = {};
      $card.find("div.pmp-attribute span.pmp-attribute-label").each((_, lbl) => {
        const key = $(lbl).text().trim().replace(/:$/, "").toLowerCase();
        const nextNode = lbl.nextSibling;
        if (nextNode) {
          const val = nextNode.type === "text"
            ? (nextNode as unknown as Text).data?.trim() || ""
            : $(nextNode).text().trim();
          if (val) attrs[key] = val;
        }
      });

      let price = "N/A";
      let condition = "N/A";
      let newPrice: string | null = null;
      let newUrl: string | null = null;
      let usedPrice: string | null = null;
      let usedUrl: string | null = null;

      if (!parentModel) {
        price = $card.find("div.current-price").text().trim() || "N/A";
        condition = $card.find("div.pmp-product-condition").text().trim() || "N/A";
      } else {
        $card.find("a.new-used-listing-link").each((_, link) => {
          const $link = $(link);
          const href = $link.attr("href") || "";
          const priceSpan = $link.find("span.price, span.old-price");
          const labelText = $link.text().toLowerCase();

          const isNew =
            href.includes("new_used_filter=New") ||
            (labelText.includes("new") && !labelText.includes("used"));
          const isUsed =
            href.includes("new_used_filter=Used") || labelText.includes("used");

          if (isNew && priceSpan.length) {
            newPrice = priceSpan.first().text().trim();
            newUrl = href;
          } else if (isUsed && priceSpan.length) {
            usedPrice = priceSpan.first().text().trim();
            usedUrl = href;
          }
        });

        if (!newPrice) {
          const fallbackPrice =
            $card.find("div.current-price").text().trim() ||
            $card.find("span.price").first().text().trim();
          if (fallbackPrice) {
            newPrice = fallbackPrice;
            newUrl = productUrl;
          }
        }
      }

      products.push({
        brand,
        model: modelTag,
        img_url: imgUrl,
        url: productUrl,
        price,
        condition,
        parent_model: parentModel,
        new_price: newPrice,
        new_url: newUrl,
        used_price: usedPrice,
        used_url: usedUrl,
        attrs,
      });
    });

    const tParse = performance.now() - tParse0;
    console.log(`  Scrape sub-timing → fetch: ${Math.round(tFetch)} ms, parse: ${Math.round(tParse)} ms, html size: ${(html.length / 1024).toFixed(1)} KB`);

    return { products, totalCount, appliedFilters, nextPageUrl, noResults };
  } catch (e) {
    console.error("Scrape error:", e);
    return { products: [], totalCount: null, appliedFilters: [], nextPageUrl: null, noResults: false };
  }
}
