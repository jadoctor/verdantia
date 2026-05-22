const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\jaill\\.gemini\\antigravity-ide\\brain\\370b2f01-faad-42ae-ac65-b1825aa85902\\.system_generated\\logs\\transcript.jsonl';

async function processLineByLine() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log('--- USER REQUESTS FROM TODAY ---');
  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT' && obj.content) {
        // Just extract the <USER_REQUEST> part if present
        const match = obj.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
        if (match) {
            console.log(`[Step ${obj.step_index}] USER: ${match[1].trim()}`);
        } else {
            console.log(`[Step ${obj.step_index}] USER: ${obj.content.substring(0, 200)}...`);
        }
      }
    } catch(e) {
      // ignore JSON parse errors
    }
  }
}

processLineByLine();
