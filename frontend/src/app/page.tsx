import Link from "next/link";
import { Banner } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getBanners(): Promise<Banner[]> {
  const res = await fetch(`${API_URL}/catalog/banners?section=home`, {
    next: { revalidate: 120 },
  });
  return res.ok ? ((await res.json()) as Banner[]) : [];
}

export default async function HomePage() {
  const banners = await getBanners();

  return (
    <div className="grid gap-0">
      {/* Hero banners */}
      {banners.length > 0 ? (
        <section className="-mx-4 -mt-8 sm:-mx-6">
          <div className="grid gap-px">
            {banners.map((banner, index) => (
              <Link
                key={banner.id}
                href={
                  banner.collection?.slug
                    ? `/catalog/collection/${encodeURIComponent(banner.collection.slug)}`
                    : "/catalog"
                }
                className="group relative block overflow-hidden"
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className={`w-full object-cover transition-transform duration-700 group-hover:scale-[1.02] ${index === 0 ? "h-[70vh] min-h-[480px]" : "h-[50vh] min-h-[360px]"}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 text-white sm:p-12">
                  {banner.collection?.title ? (
                    <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/70">
                      {banner.collection.title}
                    </p>
                  ) : null}
                  <h2
                    className="text-4xl font-light italic leading-tight sm:text-6xl"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {banner.title}
                  </h2>
                  {banner.subtitle ? (
                    <p className="mt-3 max-w-md text-sm text-white/80 sm:text-base">
                      {banner.subtitle}
                    </p>
                  ) : null}
                  <div className="mt-6 inline-flex items-center gap-2 border border-white/60 px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition-all group-hover:bg-white group-hover:text-black">
                    Смотреть коллекцию
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="-mx-4 -mt-8 sm:-mx-6">
          <div className="relative flex h-[70vh] min-h-[480px] items-end bg-[#1a1a1a]">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400')] bg-cover bg-center opacity-60" />
            <div className="relative p-8 text-white sm:p-12">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/70">Новая коллекция</p>
              <h2
                className="text-5xl font-light italic leading-tight sm:text-7xl"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Твой стиль
              </h2>
              <p className="mt-3 text-sm text-white/80">Одежда, которая говорит за вас</p>
              <Link
                href="/catalog"
                className="mt-6 inline-flex border border-white/60 px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition-all hover:bg-white hover:text-black"
              >
                Смотреть каталог
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Feature strips */}
      <section className="-mx-4 sm:-mx-6">
        <div className="grid gap-px border-y sm:grid-cols-3">
          {[
            { label: "Бесплатная доставка", sub: "в магазины" },
            { label: "Примерка дома", sub: "14 дней на возврат" },
            { label: "Образы от стилиста", sub: "покупайте готовые образы" },
          ].map((item) => (
            <div key={item.label} className="grid gap-1 px-6 py-8 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.1em]">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stylist looks promo */}
      <section className="-mx-4 sm:-mx-6">
        <div className="grid sm:grid-cols-2">
          <div className="relative flex h-[60vh] min-h-[400px] items-end overflow-hidden bg-[#1c1c1c]">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-50"
              style={{ backgroundImage: "url('	https://cache-limeshop.cdnvideo.ru/limeshop/2026/0…908a8e2f766a63fc0ffcf29c308bc14de.JPG?q=85&w=1300')" }}
            />
            <div className="relative z-10 p-8 text-white sm:p-10">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-white/60">
                Кураторская подборка
              </p>
              <h2
                className="mb-4 text-3xl font-light italic leading-tight sm:text-4xl"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Образы от стилистов
              </h2>
              <p className="mb-6 max-w-xs text-xs leading-relaxed text-white/70">
                Готовые луки, собранные нашими стилистами — вдохновляйтесь и добавляйте целые образы в корзину
              </p>
              <Link
                href="/outfits"
                className="inline-flex border border-white/60 px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition-all hover:bg-white hover:text-black"
              >
                Смотреть образы →
              </Link>
            </div>
          </div>

          {/* Outfit builder promo */}
          <div className="relative flex h-[60vh] min-h-[400px] items-end overflow-hidden bg-[#f5f0eb]">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1445205170230-053b83016050?w=800')" }}
            />
            <div className="relative z-10 p-8 sm:p-10">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Персонализация
              </p>
              <h2
                className="mb-4 text-3xl font-light italic leading-tight sm:text-4xl"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Создай свой образ
              </h2>
              <p className="mb-6 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Конструктор образов — подбери вещи, сочетай цвета и сохрани готовый лук
              </p>
              <Link
                href="/outfit-builder"
                className="inline-flex bg-foreground px-8 py-3.5 text-sm font-medium uppercase tracking-[0.2em] text-black shadow-lg transition-all hover:bg-foreground/85 hover:shadow-xl"
              >
                Открыть конструктор →
              </Link>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}
