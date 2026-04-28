import fetch from 'node-fetch';

async function testApi() {
  const payload = {
    pdfUrl: "https://www.mapa.gob.es/ministerio/pags/biblioteca/hojas/hd_1973_19.pdf",
    instructions: "Prueba técnica amigable",
    especieId: 3,
    variedadId: null,
    autorEmail: "jaillueca@gmail.com",
    especieNombre: "Acelga"
  };

  try {
    const res = await fetch('http://localhost:3000/api/ai/generate-blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("STATUS:", res.status);
    console.log("RESPONSE:", text);
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

testApi();
