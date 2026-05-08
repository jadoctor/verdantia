const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = env.match(/GEMINI_API_KEY=([^\r\n]+)/);
if (!apiKeyMatch) process.exit(1);
const apiKey = apiKeyMatch[1];

async function list() {
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
  const data = await res.json();
  data.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).forEach(m => console.log(m.name));
}
list();
