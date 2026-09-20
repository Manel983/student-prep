import crypto from "crypto";

const secretKey = process.env.PAYSTACK_SECRET_KEY;

if (!secretKey) {
  throw new Error("PAYSTACK_SECRET_KEY is missing.");
}

const reference =
  "FREE-PAYMENT-TEST-c6183bbe-e000-4dfa-ab27-a81e6c701a2b";

const payload = JSON.stringify({
  event: "charge.success",
  data: {
    id: 1234567892,
    status: "success",
    reference,
    amount: 0,
    currency: "GHS",
  },
});

const signature = crypto
  .createHmac("sha512", secretKey)
  .update(payload)
  .digest("hex");

const response = await fetch(
  "http://localhost:3000/api/payments/webhook",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": signature,
    },
    body: payload,
  }
);

console.log("HTTP STATUS:", response.status);
console.log(
  "RESPONSE:",
  await response.text()
);
