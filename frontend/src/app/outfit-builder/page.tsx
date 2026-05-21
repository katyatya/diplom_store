"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
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
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Загрузка конструктора...</p>}>
      <OutfitBuilderPageInner />
    </Suspense>
  );
}

function OutfitBuilderPageInner() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("productId") ?? undefined;

  return <ConstructorEditor initialProductId={initialProductId} />;
}
