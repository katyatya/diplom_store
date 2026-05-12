"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const ConstructorEditor = dynamic(
  () =>
    import("@/components/features/outfits/constructor-editor").then(
      (module) => module.ConstructorEditor,
    ),
  {
    ssr: false,
    loading: () => <p className="text-sm text-muted-foreground">Загрузка конструктора...</p>,
  },
);

export default function OutfitBuilderPage() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId") ?? undefined;

  return <ConstructorEditor initialProductId={initialProductId} />;
}
