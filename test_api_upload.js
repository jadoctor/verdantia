
fetch('http://localhost:3000/api/admin/especies/1/photos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-email': 'jaillueca@gmail.com'
  },
  body: JSON.stringify({
    rawStoragePath: 'uploads/temp/test_does_not_exist.jpg',
    especieNombre: 'Test'
  })
}).then(res => res.json()).then(console.log).catch(console.error);

