const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\jaill\\.gemini\\antigravity-ide\\brain\\2874f909-3579-45ea-9b66-5335c62a2f2a\\.system_generated\\logs\\transcript.jsonl';

async function search() {
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.toLowerCase().includes('ajo') || line.toLowerCase().includes('delete')) {
      try {
        const obj = JSON.parse(line);
        // Print step details, type, and source
        console.log(`Line ${lineCount}: Step ${obj.step_index} | Type: ${obj.type} | Source: ${obj.source}`);
        if (obj.content && obj.content.toLowerCase().includes('ajo')) {
          console.log(`  Content snippet: ${obj.content.substring(0, 150)}...`);
        }
        if (obj.tool_calls) {
          console.log(`  Tool Calls:`, JSON.stringify(obj.tool_calls).substring(0, 150) + '...');
        }
      } catch (e) {
        // Fallback if not JSON
        console.log(`Line ${lineCount} (plain): ${line.substring(0, 150)}...`);
      }
    }
  }
  process.exit(0);
}

search().catch(console.error);
