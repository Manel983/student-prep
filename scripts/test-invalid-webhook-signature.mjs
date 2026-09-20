const payload = JSON.stringify({
  event: "charge.success",
  data: {
    id: 111111111,
    status: "success",
    reference: "FAKE-ATTACK-REFERENCE",
    amount: 1000,
    currency: "GHS",
  },
});

const response = await fetch(
  "http://localhost:3000/api/payments/webhook",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": "this-is-an-invalid-signature",
    },
    body: payload,
  }
);

const result = await response.text();

console.log(`HTTP STATUS: ${response.status}`);
console.log(`RESPONSE: ${result}`);
