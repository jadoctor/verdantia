const fs = require('fs');

const E_FILE = 'src/components/admin/EspecieForm.tsx';
let eContent = fs.readFileSync(E_FILE, 'utf8');

const extract = (startText, endText) => {
  const start = eContent.indexOf(startText);
  if (start === -1) throw new Error("Start text not found: " + startText);
  const end = eContent.indexOf(endText, start);
  if (end === -1) throw new Error("End text not found: " + endText);
  return eContent.substring(start, end);
};

try {
  // 1. Estados
  const states1 = extract('  const [photos, setPhotos] = useState<any[]>([]);', '  // -- Relaciones State --');
  const states2 = extract('  // -- Photo Editor State --', '  // -- Pautas Labores State --');

  // 2. Funciones
  const funcs = extract('  const STYLE_FILTERS: Record<string, string> = {', '  // ── Pautas Handlers ──');

  // 3. Modales
  const modales = extract('      {/* EDITOR DE FOTOS MODAL */}', '      {/* SINÓNIMOS (Inteligencia Artificial) */}');

  // 4. Adjuntos Tab
  const adjuntosJSX = extract("                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>", "          {/* BLOGS */}");

  // Reemplazos
  const replaceMap = (str) => {
    return str
      .replace(/especieId/g, 'entityId')
      .replace(/\/api\/admin\/especies/g, '`/api/admin/${entityType}`') // Note: inside template literal, it could be tricky. We use exact replaces below
      .replace(/'\/api\/admin\/especies/g, '`/api/admin/${entityType}')
      .replace(/formData\.especiesnombre/g, 'entityName')
      .replace(/loadEspecie\(entityId\)/g, 'if (onUpdate) onUpdate()')
      .replace(/loadEspecie\(\)/g, 'if (onUpdate) onUpdate()')
      .replace(/setEspecieData/g, 'onUpdate');
  };

  const code = `'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Blurhash } from 'react-blurhash';
import { getMediaUrl } from '@/lib/media-url';
import { storage } from '@/lib/firebase/config';
import './EspecieForm.css';

interface SharedMediaUploaderProps {
  entityId: string;
  entityType: 'especies' | 'variedades' | 'labores';
  entityName?: string;
  userEmail: string;
  onUpdate?: () => void;
}

export default function SharedMediaUploader({ entityId, entityType, entityName = 'Entidad', userEmail, onUpdate }: SharedMediaUploaderProps) {
${states1.replace(/especieId/g, 'entityId')}
${states2.replace(/especieId/g, 'entityId')}

  // Fetch initial data
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

${funcs.replace(/especieId/g, 'entityId').replace(/\/api\/admin\/especies/g, '/api/admin/${entityType}').replace(/'\/api\/admin\/\$\{entityType\}/g, '`/api/admin/${entityType}')}

  return (
    <div className="shared-media-uploader">
      <div className="grid-form">
        <div className="form-group full">
${adjuntosJSX.replace(/especieId/g, 'entityId').replace(/formData\.especiesnombre/g, 'entityName').split('</div>\n            </div>\n          )}')[0]}
        </div>
      </div>
      
${modales.replace(/especieId/g, 'entityId').replace(/\/api\/admin\/especies/g, '/api/admin/${entityType}').replace(/'\/api\/admin\/\$\{entityType\}/g, '`/api/admin/${entityType}').replace(/formData\.especiesnombre/g, 'entityName')}
    </div>
  );
}
`;

  // Fix API routes inside templates
  const finalCode = code.replace(/`\/api\/admin\/\$\{entityType\}\/\$\{entityId\}/g, "`/api/admin/${entityType}/${entityId}");
  
  fs.writeFileSync('src/components/admin/SharedMediaUploader.tsx', finalCode);
  console.log('SharedMediaUploader generated successfully!');

} catch (err) {
  console.error(err);
}
