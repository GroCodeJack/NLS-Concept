import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { CLASSIFICATION_MODEL, URL_BUILDING_MODEL } from "./config";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CLUB_TYPE_KEYWORDS: Record<string, string[]> = {
  Driver: ["driver", "drivers", "drive"],
  "Fairway Woods": [
    "fairway", "fairways", "wood", "woods",
    "3w", "4w", "5w", "6w", "7w", "8w", "9w", "10w", "11w",
  ],
  Hybrids: ["hybrid", "hybrids"],
  "Iron Sets": ["irons", "ironset", "ironsets"],
  "Single Irons": [
    "iron", "single iron", "single irons",
    "1 iron", "2 iron", "3 iron", "4 iron", "5 iron",
    "6 iron", "7 iron", "8 iron", "9 iron",
  ],
  Wedges: ["wedge", "wedges", "gw", "pw", "aw", "lw", "sw"],
  "Utility Irons": ["utility", "udi", "crossover"],
  Putters: ["putter", "putters", "mallet", "putt", "scotty", "putting"],
};

export async function classifyQuery(userQuery: string, selectedClubType: string) {
  let brandList = "";
  try {
    brandList = fs.readFileSync(
      path.join(process.cwd(), "textdocs", "brandlist.txt"),
      "utf-8"
    ).trim();
  } catch (e) {
    console.error("Error reading brandlist.txt:", e);
  }

  const systemPrompt =
    "You are the first step in a natural-language golf-search tool. " +
    "Reply with '1' if the query is model-specific or '0' if generic. " +
    "Never output anything except '1' or '0'.\n\n" +
    "EXAMPLES  respond ONLY with 1 or 0\n" +
    'User: "ping irons"                   0\n' +
    'User: "titleist drivers"             0\n' +
    'User: "ping g430 driver"             1\n' +
    'User: "taylormade spider putters"    1\n' +
    'User: "mizuno jpx 923 forged"        1\n\n' +
    "These names are BRANDS, not models  do *not* treat them as models:\n" +
    brandList;

  let isModelSpecific = false;
  try {
    const resp = await client.chat.completions.create({
      model: CLASSIFICATION_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userQuery },
      ],
      temperature: 0,
      max_tokens: 2,
    });
    const result = (resp.choices[0].message.content || "").trim()[0];
    isModelSpecific = result === "1";
  } catch (e) {
    console.error("OpenAI classification error:", e);
  }

  // Club type mismatch detection
  let potentialMismatch = false;
  let intendedClubType: string | null = null;

  if (selectedClubType !== "Utility Irons") {
    const queryLc = userQuery.toLowerCase();
    for (const [ctype, keywords] of Object.entries(CLUB_TYPE_KEYWORDS)) {
      if (ctype === "Utility Irons") continue;
      for (const kw of keywords) {
        if (queryLc.includes(kw) && ctype !== selectedClubType) {
          potentialMismatch = true;
          intendedClubType = ctype;
          break;
        }
      }
      if (potentialMismatch) break;
    }
  }

  return {
    is_model_specific: isModelSpecific,
    potential_clubtype_mismatch: potentialMismatch,
    intended_club_type: intendedClubType,
  };
}

export async function buildUrlWithLlm(
  userQuery: string,
  systemPrompt: string
): Promise<string> {
  const llmPrompt =
    systemPrompt +
    "\n\nDo NOT include any g2_model parameters; they will be appended later.";

  try {
    const resp = await client.chat.completions.create({
      model: URL_BUILDING_MODEL,
      messages: [
        { role: "system", content: llmPrompt },
        { role: "user", content: userQuery },
      ],
      temperature: 0,
      max_tokens: 400,
    });
    return (resp.choices[0].message.content || "").trim();
  } catch (e) {
    console.error("OpenAI URL-building error:", e);
    return "";
  }
}
