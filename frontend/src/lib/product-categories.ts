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

export function isProductCategory(value: string): value is ProductCategory {
  return PRODUCT_CATEGORIES.includes(value as ProductCategory);
}
