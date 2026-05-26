"use client";

import { Outfit, Product } from "@/lib/api";
import { OutfitPreview } from "@/components/features/outfits/outfit-preview";

type SavedOutfitsGridProps = {
  mode: "user" | "adminStylist";
  outfits: Outfit[];
  productsById: Record<string, Product>;
  pendingCartOutfitId: string | null;
  onEditOutfit: (outfit: Outfit) => void;
  onDeleteOutfit: (outfitId: string) => void;
  onAddToCart: (outfitId: string) => void;
};

export function SavedOutfitsGrid({
  mode,
  outfits,
  productsById,
  pendingCartOutfitId,
  onEditOutfit,
  onDeleteOutfit,
  onAddToCart,
}: SavedOutfitsGridProps) {
  return (
    <div className="grid gap-6">
      <div className="flex items-end justify-between border-b pb-4">
        <h2 className="text-3xl font-light italic" style={{ fontFamily: "var(--font-serif)" }}>
          {mode === "adminStylist" ? "Образы стилиста" : "Мои образы"}
        </h2>
        <span className="text-xs text-muted-foreground">{outfits.length} образов</span>
      </div>

      {outfits.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {mode === "adminStylist" ? "Пока нет образов стилиста." : "Пока нет сохранённых образов."}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {outfits.map((outfit) => (
          <article key={outfit.id} className="group grid gap-3 border p-4">
            <OutfitPreview items={outfit.items} productsById={productsById} width={160} height={220} />
            <div className="grid gap-1">
              <p className="text-xs font-medium uppercase tracking-wide">{outfit.name}</p>
              <p className="text-xs text-muted-foreground">{outfit.description || "Без описания"}</p>
              <p className="text-xs text-muted-foreground">{outfit.items.length} поз.</p>
            </div>
            <div className="flex items-center justify-between gap-2 border-t pt-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="border px-3 py-1.5 text-xs uppercase tracking-wide transition-colors hover:bg-muted"
                  onClick={() => onEditOutfit(outfit)}
                >
                  Изменить
                </button>
                {mode === "user" ? (
                  <button
                    type="button"
                    className="border border-black bg-black px-3 py-1.5 text-xs uppercase tracking-wide text-white transition-opacity hover:opacity-80"
                    onClick={() => onAddToCart(outfit.id)}
                    disabled={pendingCartOutfitId === outfit.id}
                  >
                    {pendingCartOutfitId === outfit.id ? "Добавляем..." : "В корзину"}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="shrink-0 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                onClick={() => onDeleteOutfit(outfit.id)}
              >
                Удалить
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
