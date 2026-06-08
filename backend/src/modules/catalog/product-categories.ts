import { BadRequestException } from "@nestjs/common";

export const PRODUCT_CATEGORIES = [
  "Верхняя одежда",
  "Платья",
  "Топы",
  "Брюки",
  "Обувь",
  "Сумки",
  "Аксессуары",
  "Юбки",
  "Толстовки",
  "Джинсы",
  "Блейзеры",
  "Блузки",
  "Рубашки",
  "Шорты",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const DEFAULT_PRODUCT_CATEGORY: ProductCategory = "Верхняя одежда";

export function resolveProductCategory(input: string): ProductCategory | null {
  const trimmed = input.trim();
  return PRODUCT_CATEGORIES.find((category) => category.toLowerCase() === trimmed.toLowerCase()) ?? null;
}

export function assertProductCategory(input: string): ProductCategory {
  const resolved = resolveProductCategory(input);
  if (!resolved) {
    throw new BadRequestException(
      `Недопустимая категория. Доступные: ${PRODUCT_CATEGORIES.join(", ")}`,
    );
  }
  return resolved;
}

export function getSizeLabelsByCategory(category: string): string[] {
  const resolved = resolveProductCategory(category);
  const normalized = (resolved ?? category).trim().toLowerCase();

  if (normalized === "обувь") {
    return ["35", "36", "37", "38", "39", "40", "41"];
  }
  if (normalized === "сумки") {
    return ["ONE_SIZE"];
  }
  return ["XS", "S", "M", "L", "XL"];
}
