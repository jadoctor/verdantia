const fs = require('fs');
const readline = require('readline');

async function searchTranscript() {
  const fileStream = fs.createReadStream('C:\\Users\\jaill\\.gemini\\antigravity-ide\\brain\\be535c88-250d-4ce8-92aa-79afcdcb3160\\.system_generated\\logs\\transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.includes('"type":"USER_INPUT"')) {
      const data = JSON.parse(line);
      console.log(data.content.split('<USER_REQUEST>')[1]?.split('</USER_REQUEST>')[0].trim());
    }
  }
}

searchTranscript();
