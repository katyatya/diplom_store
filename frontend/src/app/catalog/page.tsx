"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCategories } from "@/lib/api";
import { categoryToSlug } from "@/lib/catalog-categories";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function CatalogPage() {
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void fetchCategories()
      .then(setCategories)
      .catch(() => {
        setCategories([]);
        setStatus("Не удалось загрузить категории.");
      });
  }, []);

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
