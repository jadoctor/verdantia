const fs = require('fs');
let modal = fs.readFileSync('scratch/modal_backup.tsx', 'utf8');

// The file might contain multiple '--- MULTI CHUNK ---' lines.
modal = modal.split('--- MULTI CHUNK ---')[0];

// The file is a JSON string literal.
if (modal.startsWith('"')) {
  modal = modal.substring(1);
}
if (modal.endsWith('"')) {
  modal = modal.substring(0, modal.length - 1);
}

modal = modal.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

// Add the interface GestorProps
const interfaceProps = `
interface GestorProps {
  aviso: any;
  pautas: any[];
  userEmail: string;
  onClose: () => void;
  onRefresh: () => void;
  setLightboxUrl: (url: string | null) => void;
}
`;

fs.writeFileSync('scratch/clean_modal.tsx', interfaceProps + '\n' + modal.trim());
console.log('Clean modal ready!');
