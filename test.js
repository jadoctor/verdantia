async function run() {
  const res = await fetch('http://localhost:3000/api/admin/scripts/check-state', { method: 'POST' });
  const data = await res.json();
  console.log(data);
}
run();
