import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const users = await prisma.user.findMany({
  where: {
    OR: [
      { firstName: { contains: "jon", mode: "insensitive" } },
      { lastName: { contains: "jon", mode: "insensitive" } },
    ],
  },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
  },
});

console.log(users);

await prisma.$disconnect();
