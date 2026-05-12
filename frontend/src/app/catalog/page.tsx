import Link from "next/link";
import { categoryToSlug } from "@/lib/catalog-categories";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getCategories(): Promise<string[]> {
  const response = await fetch(`${API_URL}/catalog/categories`, {
    // Categories change rarely, so cache them for faster repeated opens.
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
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Каталог</h1>
      <p className="text-sm text-muted-foreground">
        Выберите категорию, чтобы посмотреть товары.
      </p>
      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      <div className="grid gap-3">
        {categories.map((category) => (
          <Link key={category} href={`/catalog/${categoryToSlug(category)}`} className="block">
            <Card className="h-full transition-colors hover:bg-accent/40">
              <CardHeader className="p-2">
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
             
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
