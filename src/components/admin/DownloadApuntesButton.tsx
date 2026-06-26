'use client';

import React, { useState } from 'react';
import { marked } from 'marked';

interface DownloadApuntesButtonProps {
  apuntes: string;
  titulo: string;
  urlOrigen?: string;
  nombreOriginal?: string;
}

export default function DownloadApuntesButton({ apuntes, titulo, urlOrigen, nombreOriginal }: DownloadApuntesButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!apuntes) return;
    setIsGenerating(true);

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const parsedHTML = await marked(apuntes);

      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const tempId = `pdf-content-${Date.now()}`;
      container.innerHTML = `
        <div id="${tempId}" style="padding: 40px; font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          
          <!-- Header -->
          <div style="border-bottom: 3px solid #10b981; padding-bottom: 15px; margin-bottom: 35px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div>
              <h1 style="color: #059669; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">VERDANTIA</h1>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Inteligencia Agronómica</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #0f172a; font-size: 16px; font-weight: 700;">Ficha Técnica / Apuntes</h2>
              <p style="margin: 4px 0 0; color: #64748b; font-size: 13px;">Generado automáticamente por IA</p>
            </div>
          </div>
          
          <!-- Título Principal -->
          <h1 style="font-size: 32px; color: #0f172a; margin-bottom: 30px; line-height: 1.2; font-weight: 800;">${titulo || 'Apuntes Técnicos'}</h1>
          
          <!-- Contenido Markdown -->
          <div class="markdown-body" style="line-height: 1.7; font-size: 15px; color: #334155;">
            ${parsedHTML}
          </div>
          
          <!-- Referencias -->
          <div style="margin-top: 60px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; page-break-inside: avoid;">
            <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📋 Referencia del Documento Original</h3>
            <p style="margin: 0 0 5px 0; font-size: 13px; color: #475569;"><strong>Archivo origen:</strong> ${nombreOriginal || 'Desconocido'}</p>
            <p style="margin: 0; font-size: 13px; color: #475569; word-break: break-all;"><strong>Fuente / Enlace:</strong> <a href="${urlOrigen || '#'}" style="color: #2563eb; text-decoration: none;">${urlOrigen || 'No disponible'}</a></p>
          </div>

          <!-- Footer -->
          <div style="margin-top: 40px; text-align: center; color: #94a3b8; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            Este documento ha sido generado mediante algoritmos de Inteligencia Artificial a partir del documento referenciado.<br/>
            Para uso interno exclusivo de administración.<br/>
            &copy; ${new Date().getFullYear()} Verdantia.
          </div>
          
        </div>
        
        <style>
          /* Estilos dinámicos inyectados para el HTML de marked */
          #${tempId} h2 { color: #0f172a; font-size: 22px; margin-top: 35px; margin-bottom: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; font-weight: 700; page-break-after: avoid; page-break-inside: avoid; }
          #${tempId} h3 { color: #1e293b; font-size: 18px; margin-top: 25px; margin-bottom: 10px; font-weight: 600; page-break-after: avoid; page-break-inside: avoid; }
          #${tempId} p { margin-bottom: 16px; page-break-inside: avoid; }
          #${tempId} ul { padding-left: 24px; margin-bottom: 20px; }
          #${tempId} li { margin-bottom: 8px; page-break-inside: avoid; }
          #${tempId} strong { color: #0f172a; font-weight: 700; }
          #${tempId} em { color: #475569; font-style: italic; }
        </style>
      `;

      const element = document.getElementById(tempId);

      const opt: any = {
        margin:       [15, 15, 15, 15] as [number, number, number, number], 
        filename:     `Apuntes_${titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'] }
      };

      if (!element) return;
      await html2pdf().from(element).set(opt).toPdf().get('pdf').then((pdf: any) => {
        const blobUrl = pdf.output('bloburl');
        window.open(blobUrl, '_blank');
      });

      document.body.removeChild(container);
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!apuntes) return null;

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      title="Ver Apuntes en PDF"
      style={{
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        padding: '4px 8px',
        fontSize: '0.8rem',
        cursor: isGenerating ? 'wait' : 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        opacity: isGenerating ? 0.7 : 1
      }}
    >
      {isGenerating ? '⏳ Generando...' : '👁️ Ver PDF'}
    </button>
  );
}
