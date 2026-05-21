import { CollectionPageClient } from "@/components/features/catalog/collection-page-client";

type CollectionPageProps = {
  params: Promise<{ collectionSlug: string }>;
};

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { collectionSlug } = await params;
  return <CollectionPageClient collectionSlug={collectionSlug} />;
}
