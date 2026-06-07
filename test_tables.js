fetch('http://localhost:3000/api/run-sql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: "SHOW TABLES;" })
}).then(r => r.json()).then(d => console.log(d.result || d));
