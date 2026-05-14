import { Card, CardHeader } from "@/components/ui/card";

export default function CatalogLoading() {
  return (
    <section className="grid gap-4">
      <h1 className="text-3xl font-semibold tracking-tight">Каталог</h1>
      <p className="text-sm text-muted-foreground">Выберите категорию, чтобы посмотреть товары.</p>
      <div className="grid gap-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="h-full">
            <CardHeader className="p-2">
              <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
