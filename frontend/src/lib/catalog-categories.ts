"use client";

const CATEGORY_SLUG_OVERRIDES: Record<string, string> = {
  "верхняя одежда": "outerwear",
  платья: "dresses",
  брюки: "pants",
  обувь: "shoes",
  сумки: "bags",
};

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function normalizeCategoryName(category: string): string {
  return category.trim().toLowerCase();
}

export function categoryToSlug(category: string): string {
  const normalized = normalizeCategoryName(category);
  const override = CATEGORY_SLUG_OVERRIDES[normalized];
  if (override) return override;

  return normalized
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function findCategoryBySlug(categories: string[], slug: string): string | null {
  const match = categories.find((category) => categoryToSlug(category) === slug);
  return match ?? null;
}
