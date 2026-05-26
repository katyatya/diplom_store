type ProductLike = {
  id: string;
  slug?: string | null;
};

export function getProductHref(product: ProductLike): string {
  return `/catalog/product/${product.slug || product.id}`;
}

type Identifiable = {
  id: string;
};

export function buildProductsById<T extends Identifiable>(products: T[]): Record<string, T> {
  return products.reduce<Record<string, T>>((acc, product) => {
    acc[product.id] = product;
    return acc;
  }, {});
}
