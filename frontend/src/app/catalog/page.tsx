import Link from "next/link";
import { categoryToSlug } from "@/lib/catalog-categories";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getCategories(): Promise<string[]> {
  const response = await fetch(`${API_URL}/catalog/categories`, {
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error("Failed to load categories");
  }
  return (await response.json()) as string[];
}

export default async function CatalogPage() {
  let categories: string[] = [];
  let status = "";

  try {
    categories = await getCategories();
  } catch {
    status = "Не удалось загрузить категории.";
  }

  return (
    <section className="grid gap-10">
      <div className="border-b pb-6">
        <p className="mb-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">Каталог</p>
        <h1
          className="text-5xl font-light italic"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Все категории
        </h1>
      </div>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}

      <div className="grid gap-px">
        {categories.map((category) => (
          <Link
            key={category}
            href={`/catalog/${categoryToSlug(category)}`}
            className="group flex items-center justify-between border-b px-2 py-5 transition-colors hover:bg-muted/30"
          >
            <h2 className="text-lg font-light tracking-wide transition-colors group-hover:translate-x-1 duration-200">
              {category}
            </h2>
            <span className="text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-1 group-hover:text-foreground">
              →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
