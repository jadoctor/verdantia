const fs = require('fs');

const files = [
  'src/app/api/auth/webauthn/register/generate/route.ts',
  'src/app/api/auth/webauthn/register/verify/route.ts',
  'src/app/api/auth/webauthn/authenticate/generate/route.ts',
  'src/app/api/auth/webauthn/authenticate/verify/route.ts'
];

files.forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace static rpID
  code = code.replace(
    /const rpID = process\.env\.NODE_ENV === 'production' \? 'verdantia\.com' : 'localhost';\r?\n?/g,
    ''
  );
  
  // Replace static origin
  code = code.replace(
    /const origin = process\.env\.NODE_ENV === 'production' \? 'https:\/\/verdantia\.com' : 'http:\/\/localhost:3000';\r?\n?/g,
    ''
  );

  // In POST function, extract origin and rpID dynamically
  if (code.includes('export async function POST(req: NextRequest) {')) {
    const dynamicVars = `
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const rpID = new URL(origin).hostname;
`;
    code = code.replace('export async function POST(req: NextRequest) {\n  try {', 'export async function POST(req: NextRequest) {\n  try {\n' + dynamicVars);
  }

  fs.writeFileSync(file, code);
});
console.log('Dynamic Origins Applied');
