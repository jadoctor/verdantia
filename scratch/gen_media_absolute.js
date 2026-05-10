const fs = require('fs');

const lines = fs.readFileSync('src/components/admin/EspecieForm.tsx', 'utf8').split('\n');

const states1 = lines.slice(67, 77).join('\n'); // photos
const states2 = lines.slice(108, 143).join('\n'); // editor
const states3 = lines.slice(158, 165).join('\n'); // AI Image

const funcs = lines.slice(178, 1422).join('\n'); // all media functions

const adjuntos = lines.slice(2820, 3167).join('\n'); // the adjuntos JSX inside grid-form
const modales1 = lines.slice(3285, 3445).join('\n'); // photo editor modal
const modales2 = lines.slice(3446, 3514).join('\n'); // AI Image Generator Modal
const modales3 = lines.slice(3515, 3570).join('\n'); // PDF Search Modal

const modales = modales1 + '\n' + modales2 + '\n' + modales3;

let code = `'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import './EspecieForm.css';

interface SharedMediaUploaderProps {
  entityId: string;
  entityType: 'especies' | 'variedades' | 'labores';
  userEmail: string;
}

export default function SharedMediaUploader({ entityId, entityType, userEmail }: SharedMediaUploaderProps) {
${states1}
${states2}
${states3}

  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');

  // We map formData from the original to empty object, only for compatibility if any method accesses it.
  const formData = {};

  useEffect(() => {
    if (!entityId || !userEmail) return;
    const loadMedia = async () => {
      try {
        const [resPhotos, resPdfs] = await Promise.all([
          fetch(\`/api/admin/\${entityType}/\${entityId}/photos\`, { headers: { 'x-user-email': userEmail } }),
          fetch(\`/api/admin/\${entityType}/\${entityId}/pdfs\`, { headers: { 'x-user-email': userEmail } })
        ]);
        const dataPhotos = await resPhotos.json();
        const dataPdfs = await resPdfs.json();
        setPhotos(dataPhotos.photos || []);
        setPdfs(dataPdfs.pdfs || []);
      } catch(e) { console.error(e); }
    };
    loadMedia();
  }, [entityId, entityType, userEmail]);

  const loadEspecie = async () => {
    // This is a stub so that save functions that call loadEspecie() just trigger a reload.
    const resPhotos = await fetch(\`/api/admin/\${entityType}/\${entityId}/photos\`, { headers: { 'x-user-email': userEmail } });
    const dataPhotos = await resPhotos.json();
    setPhotos(dataPhotos.photos || []);
  };

${funcs}

  return (
    <div className="shared-media-uploader">
      <div className="grid-form">
${adjuntos}
      </div>
${modales}
    </div>
  );
}
`;

// Replace `especieId` with `entityId` globally in the generated code
code = code.replace(/especieId/g, 'entityId');
code = code.replace(/\/api\/admin\/especies/g, '/api/admin/${entityType}');
code = code.replace(/'\/api\/admin\/\$\{entityType\}/g, '`/api/admin/${entityType}');

// Make sure that URL construction like `/api/admin/especies/${entityId}` becomes `/api/admin/${entityType}/${entityId}`
code = code.replace(/`\/api\/admin\/\$\{entityType\}\/\$\{entityId\}/g, '`/api/admin/${entityType}/${entityId}');

fs.writeFileSync('src/components/admin/SharedMediaUploader.tsx', code);
console.log('SharedMediaUploader generated successfully.');
