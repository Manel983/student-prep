const baseUrl = "http://localhost:3000";

const response = await fetch(
  `${baseUrl}/api/admin/questions/nonexistent-question-id`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subjectId: "fake-subject",
      topicId: "",
      questionText: "Security test",
      optionA: "A",
      optionB: "B",
      optionC: "C",
      optionD: "D",
      correctAnswer: "A",
      explanation: "",
      difficulty: "EASY",
      marks: 1,
      status: "DRAFT",
    }),
  }
);

console.log("HTTP status:", response.status);
console.log("Response:", await response.text());