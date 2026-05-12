import { ProductPageClient } from "@/components/features/catalog/product-page-client";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  return <ProductPageClient productSlug={id} />;
}
