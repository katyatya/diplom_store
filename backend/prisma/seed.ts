import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.outfit.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  const userPasswordHash = await bcrypt.hash("User123!", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Администратор",
      email: "admin@fashionstore.local",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Покупатель",
      email: "user@fashionstore.local",
      passwordHash: userPasswordHash,
      role: "USER",
    },
  });

  const productsData = [
    {
      name: "Бежевый тренч",
      description: "Классический тренч oversize для межсезонья.",
      composition: "63% хлопок, 37% полиэстер",
      price: 12990,
      imageUrl:
        "https://loremflickr.com/1200/1600/fashion?lock=101, https://loremflickr.com/1200/1600/coat?lock=102, https://loremflickr.com/1200/1600/outerwear?lock=103",
      category: "Верхняя одежда",
    },
    {
      name: "Платье миди с поясом",
      description: "Легкое платье для повседневного и офисного образа.",
      composition: "70% вискоза, 30% полиэстер",
      price: 7590,
      imageUrl:
        "https://loremflickr.com/1200/1600/dress?lock=201, https://loremflickr.com/1200/1600/fashion?lock=202, https://loremflickr.com/1200/1600/women?lock=203",
      category: "Платья",
    },
    {
      name: "Черные прямые джинсы",
      description: "Высокая посадка, деним средней плотности.",
      composition: "98% хлопок, 2% эластан",
      price: 5490,
      imageUrl:
        "https://loremflickr.com/1200/1600/jeans?lock=301, https://loremflickr.com/1200/1600/pants?lock=302, https://loremflickr.com/1200/1600/denim?lock=303",
      category: "Брюки",
    },
    {
      name: "Кроссовки кожаные",
      description: "Минималистичный силуэт на каждый день.",
      composition: "Верх: 100% кожа; подкладка: 100% текстиль; подошва: 100% резина",
      price: 8990,
      imageUrl:
        "https://loremflickr.com/1200/1600/sneakers?lock=401, https://loremflickr.com/1200/1600/shoes?lock=402, https://loremflickr.com/1200/1600/footwear?lock=403",
      category: "Обувь",
    },
    {
      name: "Плетеная из пластин и бусин сумка",
      description: "Плетеная сумка прямоугольной формы выполнена из небольших пластиковых пластин и бусин серебристого цвета. Плечевая ручка. Магнитная застежка. Размер: 19 х 2,5 х 11,5 см (длина х ширина х высота).",
      composition: "Верх: 100% полиуретан; подкладка: 100% полиэстер",
      price: 5990,
      imageUrl:
        "	https://cache-limeshop.cdnvideo.ru/limeshop/aa/2a23763c77fe59ee9d66738ef1bc332c.jpeg?q=85&w=1000,	https://cache-limeshop.cdnvideo.ru/limeshop/aa/77c4576df255571c9a637f5476b3a7ea.jpeg?q=85&w=1000,https://cache-limeshop.cdnvideo.ru/limeshop/aa/e771689ff287591894413368b1bb2f00.jpeg?q=85&w=1000",
      category: "Сумки",
    },
  
    {
      name: "Плетеная сумка",
      description: "Вместительная модель для города и поездок.",
      composition: "Верх: 100% полиуретан; подкладка: 100% полиэстер",
      price: 6990,
      imageUrl:
        "https://cache-limeshop.cdnvideo.ru/limeshop/aa/af4b838090715b6bb8567ac2a549a088.jpeg?q=85&w=558,	https://cache-limeshop.cdnvideo.ru/limeshop/aa/30f66807ea7d5c1e810e4023aa4c7576.jpeg?q=85&w=558",
      category: "Сумки",
    },
    {
      name: "Плетеная сумка",
      description: "Вместительная модель для города и поездок.",
      composition: "Верх: 100% полиуретан; подкладка: 100% полиэстер",
      price: 6990,
      imageUrl:
        "https://cache-limeshop.cdnvideo.ru/limeshop/aa/0d9692dad7dd591db2fb0642986db2c0.jpeg?q=85&w=558,https://cache-limeshop.cdnvideo.ru/limeshop/aa/fe31c606cb6054dea114ffe281d002ef.jpeg?q=85&w=558",
      category: "Сумки",
    },
    {
      name: "Плетеная сумка из рафии",
      description: "Вместительная модель для города и поездок.",
      composition: "Вместительная сумка сплетена из легкой и при этом прочной искусственной рафии. Контрастная отделка широкими полосами. Пара плевых ручек из материала под гладкую кожу. Размер: 41 х 11 х 51 см (длина х ширина х высота).",
      price: 6990,
      imageUrl:
        "	https://cache-limeshop.cdnvideo.ru/limeshop/aa/a96c280f88c155c3a63cf7570ba83ac9.jpeg?q=85&w=558,https://cache-limeshop.cdnvideo.ru/limeshop/aa/289266b218395f739e6ecbeb4defb5d1.jpeg?q=85&w=558,	https://cache-limeshop.cdnvideo.ru/limeshop/aa/77007fceedce5065a48fc01661d18b80.jpeg?q=85&w=558",
      category: "Сумки",
    },
  ];

  const productIds: string[] = [];
  for (const product of productsData) {
    const savedProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        composition: product.composition,
        price: new Prisma.Decimal(product.price),
        imageUrl: product.imageUrl,
        category: product.category,
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
