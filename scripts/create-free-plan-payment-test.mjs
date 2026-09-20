import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const userId = "cmtnnhf730000rcwq9q8h8uew";
const planId = "cmtnml1y80000zcwq088x8wp";

const reference = `FREE-PAYMENT-TEST-${randomUUID()}`;

const payment = await prisma.payment.create({
  data: {
    userId,
    reference,
    amount: 0,
    currency: "GHS",
    status: "PENDING",
    provider: "PAYSTACK",
    metadata: {
      planId,
      freePlanPaymentTest: true,
    },
  },
});

console.log("Payment created:");
console.log(`ID: ${payment.id}`);
console.log(`REFERENCE: ${payment.reference}`);
console.log(`STATUS: ${payment.status}`);
console.log(`AMOUNT: ${payment.amount}`);
console.log(`METADATA: ${JSON.stringify(payment.metadata)}`);

await prisma.$disconnect();
