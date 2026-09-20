import "dotenv/config";

const BASE_URL = "http://localhost:3000";
const QUESTION_ID = "cmu7imzkb003kgowqi0gifymz";

async function testRequest(name, options = {}) {
  const response = await fetch(
    `${BASE_URL}/api/admin/questions/${QUESTION_ID}/restore`,
    {
      method: "PATCH",
      ...options,
    }
  );

  const text = await response.text();

  console.log(`\n=== ${name} ===`);
  console.log(`HTTP ${response.status}`);
  console.log(text);
}

await testRequest("Logged out");

console.log("\nSecurity test script completed.");