import { CategoryPageClient } from "@/components/features/catalog/category-page-client";

type CategoryPageProps = {
  params: Promise<{ categorySlug: string }>;
};

export default async function CatalogCategoryPage({ params }: CategoryPageProps) {
  const { categorySlug } = await params;
  return <CategoryPageClient categorySlug={categorySlug} />;
}
