import fs from 'fs';
import path from 'path';

function findEmojis() {
  const filePath = 'c:/Users/jaill/Documents/VERDANTIA/src/app/dashboard/page.tsx';
  if (!fs.existsSync(filePath)) {
    console.log("File not found");
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  // Unicode regex to find emojis
  const emojiRegex = /\p{Extended_Pictographic}/gu;
  const matches = content.match(emojiRegex) || [];
  const uniqueEmojis = Array.from(new Set(matches));
  console.log("Emojis found in dashboard page.tsx:");
  console.log(uniqueEmojis.join(' '));
}

findEmojis();
