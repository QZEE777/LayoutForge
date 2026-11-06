export interface CheckerPrintOptions {
  bookType: "paperback" | "hardcover";
  bleedMode: "no-bleed" | "bleed";
  colorMode: "bw" | "color";
  paperType: "white" | "cream" | "groundwood" | "standard-color" | "premium-color";
}

export function parseCheckerPrintOptions(value: unknown): CheckerPrintOptions {
  if (!value || typeof value !== "object") throw new Error("Choose your book, bleed and ink options before scanning.");
  const v = value as Record<string, unknown>;
  if (v.bookType !== "paperback" && v.bookType !== "hardcover") throw new Error("Invalid print options.");
  if (v.bleedMode !== "no-bleed" && v.bleedMode !== "bleed") throw new Error("Invalid print options.");
  if (v.colorMode !== "bw" && v.colorMode !== "color") throw new Error("Invalid print options.");
  if (v.paperType !== "white" && v.paperType !== "cream" && v.paperType !== "groundwood" && v.paperType !== "standard-color" && v.paperType !== "premium-color") throw new Error("Invalid print options.");
  if (v.colorMode === "bw" && v.paperType !== "white" && v.paperType !== "cream" && v.paperType !== "groundwood") throw new Error("Choose white, cream or groundwood paper for black-and-white books.");
  if (v.bookType === "hardcover" && (v.paperType === "groundwood" || v.paperType === "standard-color")) throw new Error("KDP hardcovers can't use groundwood paper or standard color. Choose white, cream or premium color.");
  if (v.colorMode === "color" && v.paperType !== "standard-color" && v.paperType !== "premium-color") throw new Error("Choose standard or premium color paper.");
  return { bookType: v.bookType, bleedMode: v.bleedMode, colorMode: v.colorMode, paperType: v.paperType };
}
