import "dotenv/config";
import { prisma } from "../src/lib/prisma.ts";

async function main() {
  const subject = await prisma.subject.findUnique({
    where: { name: "Mathematics" },
    select: { id: true, name: true },
  });

  console.log(subject);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
