const fs = require('fs');

let modalContent = fs.readFileSync('scratch/modal_backup.tsx', 'utf8');

// It's a string literal from JSON, so it might start with a quote and end with a quote.
if (modalContent.startsWith('"') && modalContent.endsWith('"')) {
  // We need to parse it as JSON to properly unescape \n, \", etc.
  try {
    modalContent = JSON.parse(modalContent);
  } catch (e) {
    console.error('Failed to parse as JSON directly, doing manual unescape.');
    modalContent = modalContent.slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}

// Now we need to append this modal to page.tsx
const pagePath = 'src/app/dashboard/cultivos/[id]/page.tsx';
let pageContent = fs.readFileSync(pagePath, 'utf8');

// Wait, the modal might already be partially there, or we need to put it outside the default function.
// In Next.js page.tsx, we can just append it to the end of the file.
// We also need to make sure the modal is rendered in the return statement!

// Let's first clean up the modal code.
// The extracted modal might contain the trailing `}` of CultivoDashboard, because I might have replaced the whole bottom of the file!
// Let's check what it contains.
fs.writeFileSync('scratch/clean_modal.tsx', modalContent);
console.log('Clean modal written to scratch/clean_modal.tsx');
