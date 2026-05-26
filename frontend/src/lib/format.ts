export function formatPrice(
  value: number | string,
  currency: "symbol" | "word" = "symbol",
): string {
  const amount = Number(value);
  const normalized = Number.isFinite(amount) ? amount : 0;
  const formatted = normalized.toLocaleString("ru-RU");
  return currency === "word" ? `${formatted} руб` : `${formatted} ₽`;
}

export function formatSizeLabel(sizeLabel: string): string {
  return sizeLabel === "ONE_SIZE" ? "ONE SIZE" : sizeLabel;
}
