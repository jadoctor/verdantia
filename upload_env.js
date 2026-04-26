const fs = require('fs');
const cp = require('child_process');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n').filter(line => line && !line.startsWith('#'));

for (const line of lines) {
  const [key, ...rest] = line.split('=');
  let val = rest.join('=');
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.slice(1, -1);
  }
  console.log('Adding', key);
  try {
    cp.execSync(`npx vercel env add ${key} production`, { input: val });
  } catch(e) {}
}
console.log('Done uploading env vars');
