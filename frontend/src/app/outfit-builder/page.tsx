"use client";

import dynamic from "next/dynamic";

const ConstructorEditor = dynamic(
  () =>
    import("@/components/constructor-editor").then(
      (module) => module.ConstructorEditor,
    ),
  {
    ssr: false,
    loading: () => <p>Загрузка конструктора...</p>,
  },
);

export default function OutfitBuilderPage() {
  return <ConstructorEditor />;
}
