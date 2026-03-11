import { NextRequest, NextResponse } from "next/server";

/**
 * Probes 2ndswing image URLs server-side to find which _2, _3, ... variants exist.
 *
 * Modes:
 *   quick=true  → Only check _2 (fast, for immediate display)
 *   quick=false → Check _2 through _20 (full probe)
 *
 * Expects: POST { primary_url: "...", quick?: boolean }
 * Returns: { images: [...] }
 */

function parseImageUrl(primary_url: string) {
  return primary_url.match(/^(.*\/)([\w-]+)(\.jpg)(\?.*)?$/i);
}

function buildVariantUrl(base: string, sku: string, n: number, ext: string, query: string | undefined) {
  return `${base}${sku}_${n}${ext}${query || ""}`;
}

async function probeUrl(url: string): Promise<boolean> {
  try {
    const resp = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(3000),
    });
    return resp.status === 200;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { primary_url, quick } = await request.json();
    if (!primary_url) {
      return NextResponse.json({ images: [] });
    }

    const match = parseImageUrl(primary_url);
    if (!match) {
      return NextResponse.json({ images: [primary_url] });
    }

    const [, base, sku, ext, query] = match;
    const images: string[] = [primary_url];

    if (quick) {
      // Only check _2 for fast first response
      const url2 = buildVariantUrl(base, sku, 2, ext, query);
      if (await probeUrl(url2)) {
        images.push(url2);
      }
    } else {
      // Full probe: _2 through _20, stop at first miss
      for (let i = 2; i <= 20; i++) {
        const url = buildVariantUrl(base, sku, i, ext, query);
        if (await probeUrl(url)) {
          images.push(url);
        } else {
          break;
        }
      }
    }

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
