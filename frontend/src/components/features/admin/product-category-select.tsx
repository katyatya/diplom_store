import {
  DEFAULT_PRODUCT_CATEGORY,
  PRODUCT_CATEGORIES,
  isProductCategory,
} from "@/lib/product-categories";
import { cn } from "@/lib/utils";

type ProductCategorySelectProps = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
};

export function ProductCategorySelect({
  value,
  onChange,
  className,
  required,
}: ProductCategorySelectProps) {
  const safeValue = isProductCategory(value) ? value : DEFAULT_PRODUCT_CATEGORY;

  return (
    <select
      value={safeValue}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {PRODUCT_CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
  );
}
