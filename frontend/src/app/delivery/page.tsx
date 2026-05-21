import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Доставка и возврат — Fashion Store",
};

export default function DeliveryPage() {
  return (
    <section className="mx-auto grid max-w-2xl gap-10 pb-16">
      <div className="border-b pb-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← На главную
        </Link>
        <h1
          className="text-5xl font-light italic"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Доставка и возврат
        </h1>
      </div>

      <div className="grid gap-10">
        <article className="grid gap-4">
          <h2 className="text-xs uppercase tracking-[0.25em]">Доставка</h2>
          <div className="grid gap-4 divide-y">
            <div className="grid gap-1 pb-4">
              <p className="text-sm font-medium">Самовывоз</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Бесплатно. Заберите заказ из нашего пункта выдачи после подтверждения готовности.
              </p>
            </div>
            <div className="grid gap-1 py-4">
              <p className="text-sm font-medium">Доставка CDEK</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                370 ₽. Доставка до двери или пункта выдачи CDEK в любую точку России. Срок — от 2 до 7 рабочих дней в зависимости от региона.
              </p>
            </div>
            <div className="grid gap-1 pt-4">
              <p className="text-sm font-medium">Бесплатная доставка</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                При заказе от 5 000 ₽ доставка осуществляется бесплатно.
              </p>
            </div>
          </div>
        </article>

        <article className="grid gap-4">
          <h2 className="text-xs uppercase tracking-[0.25em]">Возврат</h2>
          <div className="grid gap-4 divide-y">
            <div className="grid gap-1 pb-4">
              <p className="text-sm font-medium">Срок возврата</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Вы можете вернуть товар в течение 14 дней с момента получения заказа.
              </p>
            </div>
            <div className="grid gap-1 py-4">
              <p className="text-sm font-medium">Условия возврата</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Товар должен быть в оригинальной упаковке, без следов использования, с сохранёнными бирками. Возврат товаров надлежащего качества осуществляется за счёт покупателя.
              </p>
            </div>
            <div className="grid gap-1 pt-4">
              <p className="text-sm font-medium">Как оформить возврат</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Перейдите в раздел «Профиль» → «Мои заказы», выберите нужный заказ и нажмите «Оформить возврат». Мы свяжемся с вами в течение 1 рабочего дня.
              </p>
            </div>
          </div>
        </article>

        <article className="grid gap-4">
          <h2 className="text-xs uppercase tracking-[0.25em]">Обмен</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Обмен товара на другой размер или цвет возможен в течение 14 дней при наличии нужной позиции на складе. Для оформления обмена свяжитесь с нами через профиль или напишите в поддержку.
          </p>
        </article>
      </div>
    </section>
  );
}
