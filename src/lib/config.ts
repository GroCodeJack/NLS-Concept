export const VISIBLE_ATTRS: Record<string, string[]> = {
  Driver: ["dexterity", "loft", "flex", "shaft"],
  "Fairway Woods": ["dexterity", "type", "loft", "flex", "shaft"],
  Hybrids: ["dexterity", "type", "loft", "flex", "shaft"],
  "Iron Sets": ["dexterity", "makeup", "material", "flex", "shaft"],
  Wedges: ["dexterity", "type", "loft", "bounce", "flex", "shaft"],
  "Single Irons": ["dexterity", "type", "material", "flex", "shaft"],
  "Utility Irons": ["dexterity", "type", "loft", "flex", "shaft"],
  Putters: ["dexterity", "length"],
};

export const CLUB_TYPES = Object.keys(VISIBLE_ATTRS);

export const CLUB_PROMPT_FILES: Record<string, string> = {
  Driver: "driver.txt",
  "Fairway Woods": "fairway.txt",
  Hybrids: "hybrid.txt",
  "Iron Sets": "ironset.txt",
  Wedges: "wedge.txt",
  Putters: "putter.txt",
  "Single Irons": "singleiron.txt",
  "Utility Irons": "utility.txt",
};

export const PLACEHOLDER_SLUGS: Record<string, string> = {
  Driver: "driver",
  "Fairway Woods": "fairway",
  Hybrids: "hybrid",
  "Iron Sets": "ironset",
  Wedges: "wedge",
  Putters: "putter",
  "Single Irons": "singleiron",
  "Utility Irons": "utility",
};

export const CLASSIFICATION_MODEL = "gpt-4.1";
export const URL_BUILDING_MODEL = "gpt-4.1";
