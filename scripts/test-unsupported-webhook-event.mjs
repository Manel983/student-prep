import crypto from "crypto";

const secretKey = process.env.PAYSTACK_SECRET_KEY;

if (!secretKey) {
  throw new Error("PAYSTACK_SECRET_KEY is missing.");
}

const payload = JSON.stringify({
  event: "charge.failed",
  data: {
    id: 444444444,
    status: "failed",
    reference: "UNSUPPORTED-EVENT-TEST",
    amount: 1000,
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

const result = await response.text();

console.log(`HTTP STATUS: ${response.status}`);
console.log(`RESPONSE: ${result}`);
