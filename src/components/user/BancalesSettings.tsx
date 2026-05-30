import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LucideIcon, Trash2, Edit3, Plus, Search, ChevronRight, Ruler, Layers, Sparkles, AlertCircle } from 'lucide-react';

interface BancalesSettingsProps {
  profile: any;
  showToast: (msg: string) => void;
}

export default function BancalesSettings({ profile, showToast }: BancalesSettingsProps) {
  const router = useRouter();
  const [bancales, setBancales] = useState<any[]>([]);
  const [maxSpace, setMaxSpace] = useState(10);
  const [usedSpace, setUsedSpace] = useState(0);
  const [usedPerBancal, setUsedPerBancal] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sigpacSearching, setSigpacSearching] = useState(false);

  // Form view states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showZoomModal, setShowZoomModal] = useState(false);

  // Form fields
  const [formNombre, setFormNombre] = useState('');
  const [formAncho, setFormAncho] = useState('2.0');
  const [formAnchoSuperior, setFormAnchoSuperior] = useState('1.5');
  const [formLargo, setFormLargo] = useState('1.2');
  const [formForma, setFormForma] = useState('rectangular');
  const [formProvincia, setFormProvincia] = useState('');
  const [formMunicipio, setFormMunicipio] = useState('');
  const [formPoligono, setFormPoligono] = useState('');
  const [formParcela, setFormParcela] = useState('');
  const [formRecinto, setFormRecinto] = useState('1');
  const [formSuperficie, setFormSuperficie] = useState('');

  // Loaded stats
  const fetchBancales = async () => {
    setLoading(true);
    try {
      const email = profile?.email;
      if (!email) return;

      const res = await fetch('/api/user/bancales', {
        headers: { 'x-user-email': email }
      });
      if (res.ok) {
        const data = await res.json();
        setBancales(data.bancales || []);
        setMaxSpace(data.maxSpace || 10);
        setUsedSpace(data.usedSpace || 0);
        setUsedPerBancal(data.usedPerBancal || {});
      }
    } catch (e) {
      console.error('Error fetching bancales:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBancales();
  }, [profile]);

  // Open Form for Create
  const handleAddNew = () => {
    setEditingId(null);
    setFormNombre(`Bancal ${bancales.length + 1}`);
    setFormAncho('2.0');
    setFormAnchoSuperior('1.5');
    setFormLargo('1.2');
    setFormForma('rectangular');
    setFormProvincia('');
    setFormMunicipio('');
    setFormPoligono('');
    setFormParcela('');
    setFormRecinto('1');
    setFormSuperficie('');
    setIsEditing(true);
  };

  // Open Form for Edit
  const handleEdit = (bancal: any) => {
    setEditingId(bancal.idbancales);
    setFormNombre(bancal.bancalesnombre);
    setFormAncho(String(bancal.bancalesancho));
    setFormAnchoSuperior(bancal.bancalesanchosuperior ? String(bancal.bancalesanchosuperior) : String(bancal.bancalesancho));
    setFormLargo(String(bancal.bancaleslargo));
    setFormForma(bancal.bancalesforma || 'rectangular');
    setFormProvincia(bancal.bancalessigpacprovincia || '');
    setFormMunicipio(bancal.bancalessigpacmunicipio || '');
    setFormPoligono(bancal.bancalessigpacpoligono || '');
    setFormParcela(bancal.bancalessigpacparcela || '');
    setFormRecinto(bancal.bancalessigpacrecinto || '1');
    setFormSuperficie(bancal.bancalessigpacsuperficie ? String(bancal.bancalessigpacsuperficie) : '');
    setIsEditing(true);
  };

  // Delete Bed
  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que quieres eliminar este bancal? Los cultivos que contenga se moverán al Bancal Estándar.')) return;
    try {
      const email = profile?.email;
      if (!email) return;

      const res = await fetch(`/api/user/bancales?idbancales=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': email }
      });

      if (res.ok) {
        showToast('Bancal eliminado correctamente');
        fetchBancales();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error}`);
      }
    } catch {
      showToast('Error de conexión al eliminar bancal');
    }
  };

  // SIGPAC Cadastral Query
  const handleQuerySigpac = async () => {
    if (!formProvincia || !formMunicipio || !formPoligono || !formParcela) {
      alert('Por favor, rellena Provincia, Municipio, Polígono y Parcela para consultar el SIGPAC.');
      return;
    }

    setSigpacSearching(true);
    try {
      const res = await fetch(
        `/api/location/sigpac?provincia=${formProvincia}&municipio=${formMunicipio}&poligono=${formPoligono}&parcela=${formParcela}&recinto=${formRecinto}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setFormSuperficie(String(data.superficie));
          // Calcular dimensiones recomendadas basadas en raíz cuadrada de la superficie
          const dimension = Math.round(Math.sqrt(data.superficie) * 10) / 10;
          setFormAncho(String(dimension));
          setFormLargo(String(dimension));

          if (data.warning) {
            showToast('SIGPAC: ' + data.warning);
          } else {
            showToast('Datos catastrales importados correctamente del SIGPAC');
          }
        } else {
          showToast('No se encontraron datos en SIGPAC para estos parámetros');
        }
      } else {
        showToast('El servidor de consulta SIGPAC no respondió correctamente');
      }
    } catch {
      showToast('Error consultando el catastro SIGPAC');
    } finally {
      setSigpacSearching(false);
    }
  };

  // Form submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre) {
      alert('El nombre es obligatorio');
      return;
    }

    const ancho = parseFloat(formAncho);
    const largo = parseFloat(formLargo);
    if (isNaN(ancho) || ancho <= 0 || isNaN(largo) || largo <= 0) {
      alert('Ancho y Largo deben ser números válidos y mayores a cero');
      return;
    }

    setSaving(true);
    try {
      const email = profile?.email;
      if (!email) return;

      const payload = {
        idbancales: editingId,
        bancalesnombre: formNombre,
        bancalesancho: ancho,
        bancalesanchosuperior: formForma === 'trapezoidal' ? parseFloat(formAnchoSuperior) : null,
        bancaleslargo: largo,
        bancalesforma: formForma,
        bancalessigpacprovincia: formProvincia || null,
        bancalessigpacmunicipio: formMunicipio || null,
        bancalessigpacpoligono: formPoligono || null,
        bancalessigpacparcela: formParcela || null,
        bancalessigpacrecinto: formRecinto || null,
        bancalessigpacsuperficie: formSuperficie ? parseFloat(formSuperficie) : null
      };

      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch('/api/user/bancales', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(editingId ? 'Bancal actualizado correctamente' : 'Bancal creado correctamente');
        setIsEditing(false);
        fetchBancales();
      } else {
        const err = await res.json();
        alert(`Error al guardar: ${err.error}`);
      }
    } catch {
      alert('Error de red al guardar el bancal');
    } finally {
      setSaving(false);
    }
  };

  // SVG Preview renderer
  const renderSvgPreview = () => {
    const w = parseFloat(formAncho) || 2;
    const wSup = formForma === 'trapezoidal' ? (parseFloat(formAnchoSuperior) || 1.5) : w;
    const l = parseFloat(formLargo) || 1.2;
    
    // Proporciones
    const maxDimension = Math.max(w, wSup, l);
    const scale = 105 / maxDimension; // Reducido para dar espacio cómodo a las cotas
    
    const svgWidth = w * scale;
    const svgWidthTop = wSup * scale;
    const svgHeight = l * scale;

    const offsetX = (200 - svgWidth) / 2;
    const offsetXTop = (200 - svgWidthTop) / 2;
    const offsetY = (200 - svgHeight) / 2;

    const calculatedArea = getCalculatedArea();
    const minX = Math.min(offsetX, offsetXTop);

    return (
      <div 
        onClick={() => setShowZoomModal(true)}
        title="Click para ampliar vista de diseño"
        style={{
          width: '200px', height: '200px', background: '#f8fafc',
          borderRadius: '12px', border: '2px dashed #cbd5e1',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          position: 'relative', overflow: 'hidden', cursor: 'zoom-in',
          transition: 'all 0.2s'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f766e'; e.currentTarget.style.background = '#f0fdf4'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}
      >
        <svg width="200" height="200" viewBox="0 0 200 200">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Forma geométrica principal */}
          {formForma === 'rectangular' && (
            <rect
              x={offsetX} y={offsetY}
              width={svgWidth} height={svgHeight}
              rx="8" fill="#10b981" fillOpacity="0.15"
              stroke="#059669" strokeWidth="3"
            />
          )}

          {formForma === 'circular' && (
            <circle
              cx="100" cy="100"
              r={svgWidth / 2}
              fill="#10b981" fillOpacity="0.15"
              stroke="#059669" strokeWidth="3"
            />
          )}

          {formForma === 'trapezoidal' && (
            <polygon
              points={`
                ${offsetXTop},${offsetY} 
                ${offsetXTop + svgWidthTop},${offsetY} 
                ${offsetX + svgWidth},${offsetY + svgHeight} 
                ${offsetX},${offsetY + svgHeight}
              `}
              fill="#10b981" fillOpacity="0.15"
              stroke="#059669" strokeWidth="3"
            />
          )}

          {/* Líneas de Cota / Reglas de Medidas (Estilo Planos Técnicos) */}
          <g>
            {/* 1. Ancho Inferior / Diámetro Horizontal */}
            {formForma !== 'circular' ? (
              <g>
                {/* Línea horizontal */}
                <line x1={offsetX} y1={offsetY + svgHeight + 14} x2={offsetX + svgWidth} y2={offsetY + svgHeight + 14} stroke="#94a3b8" strokeWidth="1" />
                {/* Líneas de extensión */}
                <line x1={offsetX} y1={offsetY + svgHeight + 2} x2={offsetX} y2={offsetY + svgHeight + 20} stroke="#cbd5e1" strokeWidth="1" />
                <line x1={offsetX + svgWidth} y1={offsetY + svgHeight + 2} x2={offsetX + svgWidth} y2={offsetY + svgHeight + 20} stroke="#cbd5e1" strokeWidth="1" />
                {/* Slashed ticks */}
                <line x1={offsetX - 3} y1={offsetY + svgHeight + 17} x2={offsetX + 3} y2={offsetY + svgHeight + 11} stroke="#64748b" strokeWidth="1.5" />
                <line x1={offsetX + svgWidth - 3} y1={offsetY + svgHeight + 17} x2={offsetX + svgWidth + 3} y2={offsetY + svgHeight + 11} stroke="#64748b" strokeWidth="1.5" />
                {/* Texto descriptivo */}
                <text x={offsetX + svgWidth / 2} y={offsetY + svgHeight + 24} textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">
                  {formatDec(w, 1)}m
                </text>
              </g>
            ) : (
              <g>
                {/* Línea horizontal (Diámetro) */}
                <line x1={100 - svgWidth / 2} y1={100 + svgWidth / 2 + 14} x2={100 + svgWidth / 2} y2={100 + svgWidth / 2 + 14} stroke="#94a3b8" strokeWidth="1" />
                {/* Extensiones */}
                <line x1={100 - svgWidth / 2} y1={100 + svgWidth / 2 + 2} x2={100 - svgWidth / 2} y2={100 + svgWidth / 2 + 20} stroke="#cbd5e1" strokeWidth="1" />
                <line x1={100 + svgWidth / 2} y1={100 + svgWidth / 2 + 2} x2={100 + svgWidth / 2} y2={100 + svgWidth / 2 + 20} stroke="#cbd5e1" strokeWidth="1" />
                {/* Slashed ticks */}
                <line x1={100 - svgWidth / 2 - 3} y1={100 + svgWidth / 2 + 17} x2={100 - svgWidth / 2 + 3} y2={100 + svgWidth / 2 + 11} stroke="#64748b" strokeWidth="1.5" />
                <line x1={100 + svgWidth / 2 - 3} y1={100 + svgWidth / 2 + 17} x2={100 + svgWidth / 2 + 3} y2={100 + svgWidth / 2 + 11} stroke="#64748b" strokeWidth="1.5" />
                {/* Texto */}
                <text x={100} y={100 + svgWidth / 2 + 24} textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">
                  Ø {formatDec(w, 1)}m
                </text>
              </g>
            )}

            {/* 2. Ancho Superior (Base Menor - Solo Trapecios) */}
            {formForma === 'trapezoidal' && (
              <g>
                <line x1={offsetXTop} y1={offsetY - 14} x2={offsetXTop + svgWidthTop} y2={offsetY - 14} stroke="#94a3b8" strokeWidth="1" />
                <line x1={offsetXTop} y1={offsetY - 2} x2={offsetXTop} y2={offsetY - 20} stroke="#cbd5e1" strokeWidth="1" />
                <line x1={offsetXTop + svgWidthTop} y1={offsetY - 2} x2={offsetXTop + svgWidthTop} y2={offsetY - 20} stroke="#cbd5e1" strokeWidth="1" />
                <line x1={offsetXTop - 3} y1={offsetY - 11} x2={offsetXTop + 3} y2={offsetY - 17} stroke="#64748b" strokeWidth="1.5" />
                <line x1={offsetXTop + svgWidthTop - 3} y1={offsetY - 11} x2={offsetXTop + svgWidthTop + 3} y2={offsetY - 17} stroke="#64748b" strokeWidth="1.5" />
                <text x={offsetXTop + svgWidthTop / 2} y={offsetY - 20} textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold">
                  {formatDec(wSup, 1)}m
                </text>
              </g>
            )}

            {/* 3. Largo o Altura */}
            {formForma !== 'circular' && (
              <g>
                {/* Línea vertical */}
                <line x1={minX - 14} y1={offsetY} x2={minX - 14} y2={offsetY + svgHeight} stroke="#94a3b8" strokeWidth="1" />
                {/* Extensiones */}
                <line x1={offsetXTop - 2} y1={offsetY} x2={minX - 20} y2={offsetY} stroke="#cbd5e1" strokeWidth="1" />
                <line x1={offsetX - 2} y1={offsetY + svgHeight} x2={minX - 20} y2={offsetY + svgHeight} stroke="#cbd5e1" strokeWidth="1" />
                {/* Ticks */}
                <line x1={minX - 17} y1={offsetY - 3} x2={minX - 11} y2={offsetY + 3} stroke="#64748b" strokeWidth="1.5" />
                <line x1={minX - 17} y1={offsetY + svgHeight - 3} x2={minX - 11} y2={offsetY + svgHeight + 3} stroke="#64748b" strokeWidth="1.5" />
                {/* Texto descriptivo vertical */}
                <text x={minX - 22} y={offsetY + svgHeight / 2} textAnchor="middle" fill="#475569" fontSize="8" fontWeight="bold" transform={`rotate(-90 ${minX - 22} ${offsetY + svgHeight / 2})`}>
                  {formatDec(l, 1)}m
                </text>
              </g>
            )}
          </g>
        </svg>

        <span style={{
          position: 'absolute', bottom: '8px', left: '8px',
          fontSize: '0.65rem', color: '#64748b', fontWeight: 600
        }}>
          Área: {formatDec(calculatedArea, 2)} m²
        </span>
      </div>
    );
  };

  const renderZoomModal = () => {
    if (!showZoomModal) return null;

    const w = parseFloat(formAncho) || 2;
    const wSup = formForma === 'trapezoidal' ? (parseFloat(formAnchoSuperior) || 1.5) : w;
    const l = parseFloat(formLargo) || 1.2;
    
    const maxDimension = Math.max(w, wSup, l);
    const scale = 250 / maxDimension; // Ampliado sustancialmente para alta fidelidad y zoom
    
    const svgWidth = w * scale;
    const svgWidthTop = wSup * scale;
    const svgHeight = l * scale;

    const offsetX = (400 - svgWidth) / 2;
    const offsetXTop = (400 - svgWidthTop) / 2;
    const offsetY = (400 - svgHeight) / 2;

    const calculatedArea = getCalculatedArea();
    const minX = Math.min(offsetX, offsetXTop);

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999, animation: 'fadeIn 0.25s ease'
      }} onClick={() => setShowZoomModal(false)}>
        
        <div style={{
          background: 'white', borderRadius: '24px', padding: '32px',
          maxWidth: '520px', width: '90%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          animation: 'zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', position: 'relative'
        }} onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{
                background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem',
                fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                textTransform: 'uppercase', display: 'inline-block', marginBottom: '6px'
              }}>
                Previsualización Técnica • {formForma}
              </span>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: 800 }}>
                🔍 {formNombre || 'Bancal en Diseño'}
              </h3>
            </div>
            <button 
              onClick={() => setShowZoomModal(false)}
              style={{
                background: '#f1f5f9', border: 'none', color: '#64748b',
                width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontWeight: 'bold', transition: 'background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              ×
            </button>
          </div>

          {/* SVG Canvas (Zoomed 400x400) */}
          <div style={{
            width: '400px', height: '400px', background: '#f8fafc',
            borderRadius: '16px', border: '2px solid #e2e8f0',
            position: 'relative', overflow: 'hidden', display: 'flex',
            justifyContent: 'center', alignItems: 'center',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <svg width="400" height="400" viewBox="0 0 400 400">
              <defs>
                <pattern id="zoomGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#f1f5f9" strokeWidth="1.5" />
                  <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#f8fafc" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#zoomGrid)" />
              
              {/* Shape Outline */}
              {formForma === 'rectangular' && (
                <rect
                  x={offsetX} y={offsetY}
                  width={svgWidth} height={svgHeight}
                  rx="12" fill="#10b981" fillOpacity="0.12"
                  stroke="#059669" strokeWidth="4"
                />
              )}

              {formForma === 'circular' && (
                <circle
                  cx="200" cy="200"
                  r={svgWidth / 2}
                  fill="#10b981" fillOpacity="0.12"
                  stroke="#059669" strokeWidth="4"
                />
              )}

              {formForma === 'trapezoidal' && (
                <polygon
                  points={`
                    ${offsetXTop},${offsetY} 
                    ${offsetXTop + svgWidthTop},${offsetY} 
                    ${offsetX + svgWidth},${offsetY + svgHeight} 
                    ${offsetX},${offsetY + svgHeight}
                  `}
                  fill="#10b981" fillOpacity="0.12"
                  stroke="#059669" strokeWidth="4"
                />
              )}

              {/* Rulers / Dimension lines (Detailed CAD-style) */}
              <g>
                {/* 1. Ancho Inferior / Diámetro Horizontal */}
                {formForma !== 'circular' ? (
                  <g>
                    <line x1={offsetX} y1={offsetY + svgHeight + 20} x2={offsetX + svgWidth} y2={offsetY + svgHeight + 20} stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1={offsetX} y1={offsetY + svgHeight + 4} x2={offsetX} y2={offsetY + svgHeight + 28} stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1={offsetX + svgWidth} y1={offsetY + svgHeight + 4} x2={offsetX + svgWidth} y2={offsetY + svgHeight + 28} stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1={offsetX - 4} y1={offsetY + svgHeight + 24} x2={offsetX + 4} y2={offsetY + svgHeight + 16} stroke="#475569" strokeWidth="2" />
                    <line x1={offsetX + svgWidth - 4} y1={offsetY + svgHeight + 24} x2={offsetX + svgWidth + 4} y2={offsetY + svgHeight + 16} stroke="#475569" strokeWidth="2" />
                    <text x={offsetX + svgWidth / 2} y={offsetY + svgHeight + 36} textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="bold">
                      {formatDec(w, 2)} metros
                    </text>
                  </g>
                ) : (
                  <g>
                    <line x1={200 - svgWidth / 2} y1={200 + svgWidth / 2 + 20} x2={200 + svgWidth / 2} y2={200 + svgWidth / 2 + 20} stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1={200 - svgWidth / 2} y1={200 + svgWidth / 2 + 4} x2={200 - svgWidth / 2} y2={200 + svgWidth / 2 + 28} stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1={200 + svgWidth / 2} y1={200 + svgWidth / 2 + 4} x2={200 + svgWidth / 2} y2={200 + svgWidth / 2 + 28} stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1={200 - svgWidth / 2 - 4} y1={200 + svgWidth / 2 + 24} x2={200 - svgWidth / 2 + 4} y2={200 + svgWidth / 2 + 16} stroke="#475569" strokeWidth="2" />
                    <line x1={200 + svgWidth / 2 - 4} y1={200 + svgWidth / 2 + 24} x2={200 + svgWidth / 2 + 4} y2={200 + svgWidth / 2 + 16} stroke="#475569" strokeWidth="2" />
                    <text x={200} y={200 + svgWidth / 2 + 36} textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="bold">
                      Diámetro: Ø {formatDec(w, 2)} metros
                    </text>
                  </g>
                )}

                {/* 2. Ancho Superior (Base Menor - Solo Trapecios) */}
                {formForma === 'trapezoidal' && (
                  <g>
                    <line x1={offsetXTop} y1={offsetY - 20} x2={offsetXTop + svgWidthTop} y2={offsetY - 20} stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1={offsetXTop} y1={offsetY - 4} x2={offsetXTop} y2={offsetY - 28} stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1={offsetXTop + svgWidthTop} y1={offsetY - 4} x2={offsetXTop + svgWidthTop} y2={offsetY - 28} stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1={offsetXTop - 4} y1={offsetY - 16} x2={offsetXTop + 4} y2={offsetY - 24} stroke="#475569" strokeWidth="2" />
                    <line x1={offsetXTop + svgWidthTop - 4} y1={offsetY - 16} x2={offsetXTop + svgWidthTop + 4} y2={offsetY - 24} stroke="#475569" strokeWidth="2" />
                    <text x={offsetXTop + svgWidthTop / 2} y={offsetY - 32} textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="bold">
                      Ancho Superior: {formatDec(wSup, 2)} metros
                    </text>
                  </g>
                )}

                {/* 3. Largo o Altura */}
                {formForma !== 'circular' && (
                  <g>
                    <line x1={minX - 20} y1={offsetY} x2={minX - 20} y2={offsetY + svgHeight} stroke="#94a3b8" strokeWidth="1.5" />
                    <line x1={offsetXTop - 4} y1={offsetY} x2={minX - 28} y2={offsetY} stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1={offsetX - 4} y1={offsetY + svgHeight} x2={minX - 28} y2={offsetY + svgHeight} stroke="#cbd5e1" strokeWidth="1.5" />
                    <line x1={minX - 24} y1={offsetY - 4} x2={minX - 16} y2={offsetY + 4} stroke="#475569" strokeWidth="2" />
                    <line x1={minX - 24} y1={offsetY + svgHeight - 4} x2={minX - 16} y2={offsetY + svgHeight + 4} stroke="#475569" strokeWidth="2" />
                    <text x={minX - 32} y={offsetY + svgHeight / 2} textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="bold" transform={`rotate(-90 ${minX - 32} ${offsetY + svgHeight / 2})`}>
                      Largo: {formatDec(l, 2)} metros
                    </text>
                  </g>
                )}
              </g>
            </svg>
          </div>

          {/* Details Summary */}
          <div style={{
            width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '16px', padding: '16px', display: 'flex',
            flexDirection: 'column', gap: '8px', fontSize: '0.875rem', color: '#475569'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Superficie Calculada:</span>
              <strong style={{ color: '#0f766e', fontSize: '1rem' }}>{formatDec(calculatedArea, 2)} m²</strong>
            </div>
            
            {formProvincia && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                <span>Referencia SIGPAC:</span>
                <strong style={{ color: '#0369a1' }}>
                  Prov {formProvincia} • Mun {formMunicipio} • Pol {formPoligono} • Par {formParcela} • Rec {formRecinto}
                </strong>
              </div>
            )}

            {formSuperficie && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Superficie Oficial (Catastro):</span>
                <strong style={{ color: '#0369a1' }}>{formatDec(formSuperficie, 2)} m²</strong>
              </div>
            )}
          </div>

          {/* Action button */}
          <button
            onClick={() => setShowZoomModal(false)}
            style={{
              background: '#0f766e', color: 'white', border: 'none',
              padding: '10px 24px', borderRadius: '10px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.9rem', width: '100%',
              textAlign: 'center', transition: 'background 0.2s',
              boxShadow: '0 2px 4px rgba(15, 118, 110, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#0d5a54'}
            onMouseLeave={e => e.currentTarget.style.background = '#0f766e'}
          >
            Cerrar Vista Detallada
          </button>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes zoomIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  };

  const formatDec = (val: number | string, decimals: number = 2) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const getCalculatedArea = () => {
    const w = parseFloat(formAncho) || 0;
    const l = parseFloat(formLargo) || 0;
    if (formForma === 'trapezoidal') {
      const wSup = parseFloat(formAnchoSuperior) || 0;
      return ((w + wSup) / 2) * l;
    } else if (formForma === 'circular') {
      return Math.PI * (w / 2) * (l / 2);
    }
    return w * l;
  };

  const planPercent = Math.min(Math.round((usedSpace / maxSpace) * 100), 100);

  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
      padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      marginBottom: '24px', animation: 'fadeIn 0.3s ease'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#0f766e', fontSize: '1.25rem', fontWeight: 800 }}>🚜 Gestión de Bancales Reales</h3>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Define las dimensiones físicas de tu huerto y conéctalas con el SIGPAC para un cálculo exacto.
          </p>
        </div>
        {!isEditing && bancales.length < 4 && (
          <button
            onClick={handleAddNew}
            style={{
              background: '#0f766e', color: 'white', border: 'none',
              padding: '10px 16px', borderRadius: '10px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem', display: 'inline-flex',
              alignItems: 'center', gap: '8px', transition: 'background 0.2s',
              boxShadow: '0 2px 4px rgba(15, 118, 110, 0.2)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#0d5a54'}
            onMouseLeave={e => e.currentTarget.style.background = '#0f766e'}
          >
            <Plus size={16} /> Añadir Bancal
          </button>
        )}
      </div>

      {/* Subscription Limit Progress Card */}
      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px',
        padding: '16px 20px', marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.25rem' }}>📊</span>
            <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>Límite de Ocupación (m²)</span>
            <span style={{
              background: '#e0f2fe', color: '#0369a1', fontSize: '0.75rem',
              fontWeight: 700, padding: '2px 8px', borderRadius: '6px'
            }}>{profile?.suscripcion || 'Gratuito'}</span>
          </div>
          <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>
            {usedSpace.toFixed(1)} m² / {maxSpace} m² ({planPercent}%)
          </span>
        </div>
        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
          <div style={{
            width: `${planPercent}%`, height: '100%',
            background: planPercent > 90 ? '#ef4444' : planPercent > 70 ? '#f59e0b' : '#10b981',
            borderRadius: '4px', transition: 'width 0.4s ease'
          }} />
        </div>
        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
          El espacio requerido se calcula de forma automática según la densidad y marco botánico real de cada especie activa.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
          <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid #cbd5e1', borderTopColor: '#0f766e', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Cargando tus bancales...</p>
        </div>
      ) : !isEditing ? (
        <>
          {bancales.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px 20px', background: '#f8fafc',
              border: '2px dashed #e2e8f0', borderRadius: '14px', color: '#64748b'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}>🌾</span>
              <h4 style={{ margin: '0 0 4px 0', color: '#334155', fontWeight: 700 }}>Aún no tienes bancales reales</h4>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                Actualmente estás usando el <strong>Bancal Estándar Virtual</strong> por defecto. Define tus bancales físicos para poder planificar a escala.
              </p>
              <button
                onClick={handleAddNew}
                style={{
                  background: '#0f766e', color: 'white', border: 'none',
                  padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.85rem'
                }}
              >
                + Diseñar mi primer Bancal
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
              {bancales.map(bancal => {
                let totalArea = bancal.bancalesancho * bancal.bancaleslargo;
                if (bancal.bancalesforma === 'trapezoidal') {
                  const sup = bancal.bancalesanchosuperior !== null ? parseFloat(bancal.bancalesanchosuperior) : bancal.bancalesancho;
                  totalArea = ((bancal.bancalesancho + sup) / 2) * bancal.bancaleslargo;
                } else if (bancal.bancalesforma === 'circular') {
                  totalArea = Math.PI * (bancal.bancalesancho / 2) * (bancal.bancaleslargo / 2);
                }
                const cropArea = usedPerBancal[bancal.idbancales] || 0;
                const percent = Math.min(Math.round((cropArea / totalArea) * 100), 100);

                return (
                  <div key={bancal.idbancales} style={{
                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '14px',
                    padding: '16px', display: 'flex', flexDirection: 'column',
                    justifyContent: 'space-between', transition: 'transform 0.2s, box-shadow 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                  }}
                  >
                    <div>
                      {/* Bed header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <span style={{
                            background: '#f0fdf4', color: '#166534', fontSize: '0.7rem',
                            fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                            display: 'inline-block', textTransform: 'uppercase', marginBottom: '4px'
                          }}>
                            {bancal.bancalesforma}
                          </span>
                          <h4 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: '1rem' }}>
                            {bancal.bancalesnombre}
                          </h4>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => router.push(`/dashboard/bancales/${bancal.idbancales}`)}
                            style={{
                              background: '#e0f2fe', border: 'none', color: '#0369a1',
                              width: '28px', height: '28px', borderRadius: '6px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#bae6fd'}
                            onMouseLeave={e => e.currentTarget.style.background = '#e0f2fe'}
                            title="Lienzo Planificador / Diseñador Visual"
                          >
                            <Ruler size={14} />
                          </button>
                          <button
                            onClick={() => handleEdit(bancal)}
                            style={{
                              background: '#f1f5f9', border: 'none', color: '#475569',
                              width: '28px', height: '28px', borderRadius: '6px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                            title="Editar Bancal"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(bancal.idbancales)}
                            style={{
                              background: '#fef2f2', border: 'none', color: '#dc2626',
                              width: '28px', height: '28px', borderRadius: '6px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                            title="Eliminar Bancal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Bed info */}
                      <div style={{ fontSize: '0.8rem', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                        {bancal.bancalesforma === 'trapezoidal' ? (
                          <>
                            <div>
                              <strong style={{ color: '#64748b' }}>A. Inferior:</strong> {formatDec(bancal.bancalesancho, 2)} m
                            </div>
                            <div>
                              <strong style={{ color: '#64748b' }}>A. Superior:</strong> {formatDec(bancal.bancalesanchosuperior ?? bancal.bancalesancho, 2)} m
                            </div>
                            <div>
                              <strong style={{ color: '#64748b' }}>Largo:</strong> {formatDec(bancal.bancaleslargo, 2)} m
                            </div>
                          </>
                        ) : bancal.bancalesforma === 'circular' ? (
                          <div style={{ gridColumn: 'span 2' }}>
                            <strong style={{ color: '#64748b' }}>Diámetro:</strong> {formatDec(bancal.bancalesancho, 2)} m
                          </div>
                        ) : (
                          <>
                            <div>
                              <strong style={{ color: '#64748b' }}>Ancho:</strong> {formatDec(bancal.bancalesancho, 2)} m
                            </div>
                            <div>
                              <strong style={{ color: '#64748b' }}>Largo:</strong> {formatDec(bancal.bancaleslargo, 2)} m
                            </div>
                          </>
                        )}
                        <div style={{ gridColumn: 'span 2' }}>
                          <strong style={{ color: '#64748b' }}>Superficie:</strong> {formatDec(totalArea, 2)} m²
                        </div>
                        {bancal.bancalessigpacsuperficie && (
                          <div style={{ gridColumn: 'span 2', color: '#0369a1', fontWeight: 600 }}>
                            📌 SIGPAC: {formatDec(bancal.bancalessigpacsuperficie, 2)} m²
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bed occupancy progress bar */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: 600 }}>
                        <span>Cultivado</span>
                        <span>{cropArea.toFixed(1)}m² / {totalArea.toFixed(1)}m² ({percent}%)</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${percent}%`, height: '100%',
                          background: percent > 95 ? '#ef4444' : '#10b981',
                          borderRadius: '3px'
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* EDIT OR CREATE FORM */
        <form onSubmit={handleSave} style={{ background: '#f8fafc', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', animation: 'slideDown 0.25s ease' }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1e293b', fontWeight: 800, fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            {editingId ? '✏️ Editar Bancal Real' : '➕ Crear Nuevo Bancal Real'}
          </h4>

          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px' }}>
            {/* Form Fields */}
            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Nombre del Bancal *
                </label>
                <input
                  type="text"
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  placeholder="Ej. Bancal Sur - Tomates"
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                />
              </div>

              {formForma === 'trapezoidal' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Ancho Inf. (B. Mayor) *
                    </label>
                    <input
                      type="number" step="0.1" min="0.1"
                      value={formAncho}
                      onChange={e => setFormAncho(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Ancho Sup. (B. Menor) *
                    </label>
                    <input
                      type="number" step="0.1" min="0.1"
                      value={formAnchoSuperior}
                      onChange={e => setFormAnchoSuperior(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Largo (metros) *
                    </label>
                    <input
                      type="number" step="0.1" min="0.1"
                      value={formLargo}
                      onChange={e => setFormLargo(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              ) : formForma === 'circular' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Diámetro (metros) *
                  </label>
                  <input
                    type="number" step="0.1" min="0.1"
                    value={formAncho}
                    onChange={e => {
                      setFormAncho(e.target.value);
                      setFormLargo(e.target.value);
                    }}
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                  />
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Ancho (metros) *
                    </label>
                    <input
                      type="number" step="0.1" min="0.1"
                      value={formAncho}
                      onChange={e => setFormAncho(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Largo (metros) *
                    </label>
                    <input
                      type="number" step="0.1" min="0.1"
                      value={formLargo}
                      onChange={e => setFormLargo(e.target.value)}
                      required
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>
              )}

              <div style={{
                background: '#f1f5f9', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', fontSize: '0.85rem'
              }}>
                <span style={{ fontWeight: 600, color: '#475569' }}>📏 Superficie del Bancal:</span>
                <strong style={{ color: '#0f766e', fontSize: '0.95rem' }}>
                  {getCalculatedArea().toFixed(2)} m²
                </strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Forma Geométrica *
                </label>
                <select
                  value={formForma}
                  onChange={e => {
                    const newForma = e.target.value;
                    setFormForma(newForma);
                    if (newForma === 'circular') {
                      setFormLargo(formAncho);
                    }
                  }}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: 'white' }}
                >
                  <option value="rectangular">Rectangular</option>
                  <option value="circular">Circular / Redondo</option>
                  <option value="trapezoidal">Trapezoidal</option>
                </select>
              </div>

              {/* SIGPAC Accordion Section */}
              <div style={{
                border: '1px solid #bae6fd', background: '#f0f9ff', borderRadius: '10px',
                padding: '12px', marginTop: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#0369a1' }}>
                  <Sparkles size={16} />
                  <span style={{ fontWeight: 700, fontSize: '0.825rem' }}>Vincular con SIGPAC / Catastro (Opcional)</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={formProvincia}
                    onChange={e => setFormProvincia(e.target.value)}
                    placeholder="Cod. Provincia (Ej. 28)"
                    style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #bae6fd', fontSize: '0.75rem' }}
                  />
                  <input
                    type="text"
                    value={formMunicipio}
                    onChange={e => setFormMunicipio(e.target.value)}
                    placeholder="Cod. Municipio (Ej. 79)"
                    style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #bae6fd', fontSize: '0.75rem' }}
                  />
                  <input
                    type="text"
                    value={formPoligono}
                    onChange={e => setFormPoligono(e.target.value)}
                    placeholder="Polígono (Ej. 3)"
                    style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #bae6fd', fontSize: '0.75rem' }}
                  />
                  <input
                    type="text"
                    value={formParcela}
                    onChange={e => setFormParcela(e.target.value)}
                    placeholder="Parcela (Ej. 256)"
                    style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #bae6fd', fontSize: '0.75rem' }}
                  />
                  <input
                    type="text"
                    value={formRecinto}
                    onChange={e => setFormRecinto(e.target.value)}
                    placeholder="Recinto (Ej. 1)"
                    style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #bae6fd', fontSize: '0.75rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleQuerySigpac}
                    disabled={sigpacSearching}
                    style={{
                      background: '#0284c7', color: 'white', border: 'none',
                      borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '4px'
                    }}
                  >
                    <Search size={12} /> {sigpacSearching ? 'Buscando...' : 'Buscar SIGPAC'}
                  </button>
                </div>

                {formSuperficie && (
                  <div style={{
                    background: 'white', padding: '8px 12px', borderRadius: '6px',
                    border: '1px solid #e0f2fe', fontSize: '0.75rem', color: '#0369a1',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span>Superficie Oficial SIGPAC:</span>
                    <strong>{formSuperficie} m²</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Visualizer Preview SVG */}
            <div style={{
              flex: '1 1 200px', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: '10px'
            }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', alignSelf: 'flex-start' }}>
                Previsualización del Diseño
              </label>
              {renderSvgPreview()}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '10px',
            marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px'
          }}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              style={{
                background: '#e2e8f0', color: '#475569', border: 'none',
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.875rem'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: '#0f766e', color: 'white', border: 'none',
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.875rem'
              }}
            >
              {saving ? 'Guardando...' : 'Guardar Bancal'}
            </button>
          </div>
        </form>
      )}
      {renderZoomModal()}
    </div>
  );
}
