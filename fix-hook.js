const fs = require('fs');
let code = fs.readFileSync('src/components/admin/hooks/EspecieVegetal/useEspecieMedia.ts', 'utf8');

// Add import
if (!code.includes("import { storage } from '@/lib/firebase/clientApp';")) {
  code = code.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport { storage } from '@/lib/firebase/clientApp';");
}

// Remove storageApiRef param
code = code.replace(
  "const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any, type: 'photos' | 'pdfs', storageApiRef: any) => {",
  "const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | any, type: 'photos' | 'pdfs') => {"
);

// Replace storageApiRef.storage with storage
code = code.replace("clientStorage = storageApiRef.storage;", "clientStorage = storage;");

fs.writeFileSync('src/components/admin/hooks/EspecieVegetal/useEspecieMedia.ts', code);
console.log("Fixed useEspecieMedia");
