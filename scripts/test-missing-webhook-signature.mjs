const payload = JSON.stringify({
  event: "charge.success",
  data: {
    id: 222222222,
    status: "success",
    reference: "NO-SIGNATURE-TEST",
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
    },
    body: payload,
  }
);

const result = await response.text();

console.log(`HTTP STATUS: ${response.status}`);
console.log(`RESPONSE: ${result}`);
