import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main(): Promise<void> {
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
    },
    {
      name: "Белая базовая футболка",
      description: "Плотный хлопок, прямой крой.",
      price: 2590,
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    },
    {
      name: "Черные прямые джинсы",
      description: "Высокая посадка, деним средней плотности.",
      price: 5490,
      imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246",
    },
    {
      name: "Кроссовки кожаные",
      description: "Минималистичный силуэт на каждый день.",
      price: 8990,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    },
    {
      name: "Свитер серый",
      description: "Мягкая пряжа с добавлением шерсти.",
      price: 6990,
      imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105",
    },
  ];

  const productIds: string[] = [];
  for (const product of productsData) {
    const savedProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        price: new Prisma.Decimal(product.price),
        imageUrl: product.imageUrl,
      },
    });
    productIds.push(savedProduct.id);
  }

  await prisma.cart.upsert({
    where: { userId: user.id },
    update: {},
    create: {
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
      items: stylistLookItems as unknown as Prisma.InputJsonValue,
    },
  });

  await prisma.outfit.create({
    data: {
      userId: user.id,
      name: "Мой ежедневный образ",
      description: "Удобный лук на каждый день.",
      isStylist: false,
      items: userOutfitItems as unknown as Prisma.InputJsonValue,
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
