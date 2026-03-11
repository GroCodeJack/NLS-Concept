import fs from "fs";
import path from "path";
import { PLACEHOLDER_SLUGS } from "./config";

let _cache: Record<string, string[]> | null = null;

export function loadPlaceholders(): Record<string, string[]> {
  if (_cache) return _cache;

  const bank: Record<string, string[]> = {};
  const dir = path.join(process.cwd(), "textdocs", "placeholder-text");

  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (!file.endsWith(".txt")) continue;
      const slug = file.replace(".txt", "");
      const lines = fs
        .readFileSync(path.join(dir, file), "utf-8")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      bank[slug] = lines;
    }
  } catch (e) {
    console.error("Error loading placeholders:", e);
  }

  _cache = bank;
  return bank;
}
