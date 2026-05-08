const { PrismaClient, Prisma } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  await prisma.banner.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.outfit.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const userPasswordHash = await bcrypt.hash("User123!", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@fashionstore.local",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.create({
    data: {
      email: "user@fashionstore.local",
      passwordHash: userPasswordHash,
      role: "USER",
    },
  });

  const productsData = [
    {
      name: "Бежевый тренч",
      description: "Классический тренч oversize для межсезонья.",
      price: 12990,
      imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b",
      category: "Верхняя одежда",
      isNew: true,
    },
    {
      name: "Белая базовая футболка",
      description: "Плотный хлопок, прямой крой.",
      price: 2590,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
      category: "Футболки",
      isNew: true,
    },
    {
      name: "Черные прямые джинсы",
      description: "Высокая посадка, деним средней плотности.",
      price: 5490,
      imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246",
      category: "Джинсы",
      isNew: false,
    },
    {
      name: "Кроссовки кожаные",
      description: "Минималистичный силуэт на каждый день.",
      price: 8990,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
      category: "Обувь",
      isNew: true,
    },
    {
      name: "Свитер серый",
      description: "Мягкая пряжа с добавлением шерсти.",
      price: 6990,
      imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105",
      category: "Свитеры",
      isNew: false,
    },
  ];

  const productIds = [];
  for (const product of productsData) {
    const savedProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: new Prisma.Decimal(product.price),
        imageUrl: product.imageUrl,
        category: product.category,
        isNew: product.isNew,
      },
    });
    productIds.push(savedProduct.id);
  }

  await prisma.banner.createMany({
    data: [
      {
        title: "Весенняя коллекция 2026",
        subtitle: "Новые образы для города и офиса",
        imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8",
        section: "home",
      },
      {
        title: "Новинки недели",
        subtitle: "Соберите актуальный total look",
        imageUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b",
        section: "new",
      },
    ],
  });

  await prisma.cart.create({
    data: {
      userId: user.id,
      items: {
        create: [
          { productId: productIds[0], quantity: 1 },
          { productId: productIds[1], quantity: 2 },
        ],
      },
    },
  });

  const stylistLookItems = [
    { productId: productIds[0], x: 35, y: 20, zIndex: 1 },
    { productId: productIds[1], x: 40, y: 70, zIndex: 2 },
    { productId: productIds[2], x: 40, y: 120, zIndex: 3 },
    { productId: productIds[3], x: 42, y: 170, zIndex: 4 },
  ];

  const userOutfitItems = [
    { productId: productIds[4], x: 30, y: 40, zIndex: 1 },
    { productId: productIds[2], x: 34, y: 100, zIndex: 2 },
    { productId: productIds[3], x: 35, y: 160, zIndex: 3 },
  ];

  await prisma.outfit.create({
    data: {
      userId: admin.id,
      name: "Smart Casual от стилиста",
      description: "Образ для офиса и вечерней встречи.",
      isStylist: true,
      items: stylistLookItems,
    },
  });

  await prisma.wishlistItem.create({
    data: {
      userId: user.id,
      productId: productIds[3],
    },
  });

  await prisma.outfit.create({
    data: {
      userId: user.id,
      name: "Мой ежедневный образ",
      description: "Удобный лук на каждый день.",
      isStylist: false,
      items: userOutfitItems,
    },
  });

  console.log("Seed completed.");
  console.log("Admin:", "admin@fashionstore.local / Admin123!");
  console.log("User:", "user@fashionstore.local / User123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
