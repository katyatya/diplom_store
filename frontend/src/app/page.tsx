import Link from "next/link";

export default function HomePage() {
  return (
    <section>
      <h1>Fashion Store</h1>
      <p>Интернет-магазин одежды с конструктором образов.</p>
      <ul>
        <li>
          <Link href="/catalog">Перейти в каталог</Link>
        </li>
        <li>
          <Link href="/constructor">Открыть конструктор образов</Link>
        </li>
        <li>
          <Link href="/outfits">Смотреть образы стилистов</Link>
        </li>
      </ul>
    </section>
  );
}
