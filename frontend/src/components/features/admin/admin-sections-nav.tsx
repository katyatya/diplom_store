"use client";

import { AdminSection } from "@/lib/admin";

type SectionOption = {
  id: AdminSection;
  title: string;
  description: string;
};

const SECTION_OPTIONS: SectionOption[] = [
  {
    id: "products",
    title: "Товары",
    description: "Добавление, редактирование и удаление существующих товаров",
  },
  {
    id: "orders",
    title: "Заказы",
    description: "Новые, в работе и архивные заказы + смена статуса",
  },
  {
    id: "stylistLooks",
    title: "Образы стилиста",
    description: "Конструктор и управление образами, которые публикуются как стилистские",
  },
  {
    id: "collections",
    title: "Коллекции",
    description: "Создание коллекций для разделов и ссылок с главной страницы",
  },
  {
    id: "banners",
    title: "Баннеры",
    description: "Добавление баннеров, отображаемых на главной странице",
  },
];

type AdminSectionsNavProps = {
  activeSection: AdminSection;
  onChange: (nextSection: AdminSection) => void;
};

export function AdminSectionsNav({ activeSection, onChange }: AdminSectionsNavProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-5">
      {SECTION_OPTIONS.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onChange(section.id)}
          className={`rounded-lg border p-4 text-left transition-colors ${
            activeSection === section.id ? "border-foreground border-green-500" : "hover:bg-accent/20"
          }`}
        >
          <p className="text-lg font-semibold">{section.title}</p>
          <p className="text-sm text-muted-foreground">{section.description}</p>
        </button>
      ))}
    </div>
  );
}
