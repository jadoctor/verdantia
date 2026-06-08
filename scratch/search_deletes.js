const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\jaill\\.gemini\\antigravity-ide\\brain\\2874f909-3579-45ea-9b66-5335c62a2f2a\\.system_generated\\logs\\transcript.jsonl';

async function search() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.toLowerCase().includes('delete') || line.toLowerCase().includes('drop') || line.toLowerCase().includes('truncate')) {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        console.log(`Step ${obj.step_index}: Tool call:`, JSON.stringify(obj.tool_calls));
      }
    }
  }
  process.exit(0);
}

search().catch(console.error);
