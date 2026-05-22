const fs = require('fs');
const readline = require('readline');

async function extract() {
  const fileStream = fs.createReadStream('C:\\Users\\jaill\\.gemini\\antigravity-ide\\brain\\370b2f01-faad-42ae-ac65-b1825aa85902\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let bestContent = null;
  let bestTime = null;

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        for (const tc of obj.tool_calls) {
          if (tc.name === 'write_to_file' || tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
            const args = tc.args || {};
            const target = args.TargetFile || '';
            if (target.includes('page.tsx') && target.includes('cultivos')) {
              if (args.CodeContent) {
                 // write_to_file full content
                 fs.writeFileSync('scratch/full_page_backup.tsx', args.CodeContent);
                 bestContent = 'full_file';
              }
              if (args.ReplacementContent) {
                 fs.appendFileSync('scratch/snippets.txt', '\n\n--- REPLACEMENT ---\n' + args.ReplacementContent);
              }
              if (args.ReplacementChunks) {
                 for (const chunk of args.ReplacementChunks) {
                    fs.appendFileSync('scratch/snippets.txt', '\n\n--- MULTI CHUNK ---\n' + chunk.ReplacementContent);
                 }
              }
            }
          }
        }
      }
    } catch(e) {}
  }
  console.log('Extraction complete. Check scratch folder.');
}
extract();
