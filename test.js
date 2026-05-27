fetch("http://localhost:3000/api/generate-quiz", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({
    text: "India is a country in South Asia.",
    difficulty: "Medium"
  })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);
