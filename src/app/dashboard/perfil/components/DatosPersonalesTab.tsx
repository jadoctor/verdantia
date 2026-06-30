import React, { useState, useRef } from 'react';
import { auth } from '@/lib/firebase/config';
import { perfilApi } from '../services/perfilApi';
import { PAISES } from '../constants/profileConstants';
import { useProfileData } from '../hooks/useProfileData';

interface DatosPersonalesTabProps {
  profileData: ReturnType<typeof useProfileData>;
}

export function DatosPersonalesTab({ profileData }: DatosPersonalesTabProps) {
  const {
    profile,
    nombre,
    setNombre,
    apellidos,
    setApellidos,
    nombreUsuario,
    setNombreUsuario,
    fechaNacimiento,
    setFechaNacimiento,
    pais,
    setPais,
    codigoPostal,
    setCodigoPostal,
    poblacion,
    setPoblacion,
    sexo,
    setSexo,
    editableEmail,
    setEditableEmail,
    domicilio,
    setDomicilio,
    telefono,
    setTelefono,
    collapsedMandatory,
    setCollapsedMandatory,
    collapsedOptional,
    setCollapsedOptional,
    geoData,
    zonaClimatica,
    verificationSentAt,
    setVerificationSentAt,
    isFirebaseVerified,
    calcularEdad,
    updateLiveHeaderName,
    autoSaveField,
    autoSaveMultiple,
    handleSexoChange,
    handleVerifyEmail,
    nif,
    setNif,
    razonSocial,
    setRazonSocial,
    tipoContribuyente,
    setTipoContribuyente
  } = profileData;

  const [collapsedFiscal, setCollapsedFiscal] = useState(true);

  if (!profile) return null;

  // Autocomplete states
  const [cpSuggestions, setCpSuggestions] = useState<{cp: string; ciudad: string}[]>([]);
  const [ciudadSuggestions, setCiudadSuggestions] = useState<{cp: string; ciudad: string}[]>([]);
  const [showCpDropdown, setShowCpDropdown] = useState(false);
  const [showCiudadDropdown, setShowCiudadDropdown] = useState(false);
  const [showCpDropdownOpt, setShowCpDropdownOpt] = useState(false);
  const [showCiudadDropdownOpt, setShowCiudadDropdownOpt] = useState(false);
  const cpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ciudadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchLocation = async (query: string, type: 'cp' | 'ciudad', zone: 'mandatory' | 'optional' = 'mandatory') => {
    try {
      const data = await perfilApi.searchLocation(query, type);
      if (type === 'cp') { 
        setCpSuggestions(data.results); 
        if (zone === 'mandatory') setShowCpDropdown(data.results.length > 0);
        else setShowCpDropdownOpt(data.results.length > 0);
      } else { 
        setCiudadSuggestions(data.results); 
        if (zone === 'mandatory') setShowCiudadDropdown(data.results.length > 0);
        else setShowCiudadDropdownOpt(data.results.length > 0);
      }
    } catch { /* silently fail */ }
  };

  const isProfileComplete = Boolean(
    nombre.trim() && fechaNacimiento && sexo && nombreUsuario.trim() &&
    pais.trim() && codigoPostal.trim() && poblacion.trim()
  );

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
      <div className="accordion-body">

        {/* ── CAMPOS OBLIGATORIOS (autoguardado) ── */}
        <div className="mandatory-zone">
          <div className="mandatory-zone-header" onClick={() => setCollapsedMandatory(!collapsedMandatory)} style={{ cursor: 'pointer', userSelect: 'none' }}>
            <span>📋 Campos Obligatorios</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <small style={{ color: '#92400e', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600 }}>{collapsedMandatory ? 'Mostrar' : 'Ocultar'}</small>
              <svg 
                style={{ 
                  transform: collapsedMandatory ? 'rotate(-90deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.25s ease',
                  width: '16px',
                  height: '16px',
                  color: '#92400e'
                }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          {!collapsedMandatory && (
            <div className="form-grid">
              {/* Fila 1: Nombre + Nombre de Usuario */}
              <div className="form-group">
                <label htmlFor="nombre" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span>Nombre</span>
                  <span className={`required-badge ${nombre.trim() ? 'filled' : 'pending'}`}>{nombre.trim() ? '✓ Completado' : '* Requerido'}</span>
                </label>
                <input id="nombre" type="text" className="form-input" value={nombre}
                  onChange={e => { setNombre(e.target.value); }}
                  onInput={updateLiveHeaderName}
                  onBlur={() => nombre.trim() && autoSaveField('nombre', nombre)}
                  required placeholder="Tu nombre" style={{ borderLeft: `3px solid ${nombre.trim() ? '#10b981' : '#f59e0b'}` }} />
              </div>
              <div className="form-group">
                <label htmlFor="nombre_usuario" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span>Nombre de Usuario</span>
                  <span className={`required-badge ${nombreUsuario.trim() ? 'filled' : 'pending'}`}>{nombreUsuario.trim() ? '✓ Completado' : '* Requerido'}</span>
                </label>
                <input id="nombre_usuario" type="text" className="form-input" value={nombreUsuario}
                  onChange={e => { setNombreUsuario(e.target.value); }}
                  onInput={updateLiveHeaderName}
                  onBlur={() => nombreUsuario.trim() && autoSaveField('nombreUsuario', nombreUsuario)}
                  placeholder="Nombre público visible" maxLength={100}
                  style={{ borderLeft: `3px solid ${nombreUsuario.trim() ? '#10b981' : '#f59e0b'}` }} />
                <small className="help-text">Nombre visible para los demás usuarios.</small>
              </div>

              {/* Fila 2: Fecha de Nacimiento + Sexo */}
              <div className="form-group">
                <label htmlFor="fecha_nacimiento" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span>Fecha de Nacimiento</span>
                  <span className={`required-badge ${fechaNacimiento ? 'filled' : 'pending'}`}>{fechaNacimiento ? '✓ Completado' : '* Requerido'}</span>
                </label>
                <input id="fecha_nacimiento" type="date" className="form-input" value={fechaNacimiento}
                  onChange={e => {
                    setFechaNacimiento(e.target.value);
                    if (e.target.value) autoSaveField('fechaNacimiento', e.target.value);
                  }} style={{ 
                    borderLeft: `3px solid ${fechaNacimiento ? '#10b981' : '#f59e0b'}`, 
                    color: fechaNacimiento ? '#0369a1' : 'var(--text-muted)',
                    backgroundColor: fechaNacimiento ? '#e0f2fe' : undefined,
                    borderColor: fechaNacimiento ? '#7dd3fc' : undefined,
                    fontWeight: fechaNacimiento ? 500 : undefined
                  }} />
                <small className="help-text">{calcularEdad() || 'Necesaria para verificar la mayoría de edad.'}</small>
              </div>
              <div className="form-group">
                <label htmlFor="sexo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span>Sexo / Género</span>
                  <span className={`required-badge ${sexo ? 'filled' : 'pending'}`}>{sexo ? '✓ Completado' : '* Requerido'}</span>
                </label>
                <select
                  id="sexo"
                  className="form-input"
                  value={sexo}
                  onChange={handleSexoChange}
                  style={{ 
                    borderLeft: `3px solid ${sexo ? '#10b981' : '#f59e0b'}`,
                    color: sexo ? '#0369a1' : 'var(--text-muted)',
                    backgroundColor: sexo ? '#e0f2fe' : undefined,
                    borderColor: sexo ? '#7dd3fc' : undefined,
                    fontWeight: sexo ? 500 : undefined
                  }}
                >
                  <option value="" disabled>Selecciona una opción...</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Neutro">Prefiero no decirlo (Neutro)</option>
                </select>
                <small className="help-text">Para personalizar nuestras comunicaciones contigo.</small>
              </div>

              {/* Fila 3: Subgrupo Localización */}
              <div className="location-subgroup-mandatory" style={{ gridColumn: 'span 2' }}>
                <div className="location-subgroup-header" style={{ marginBottom: '12px', paddingBottom: '6px' }}>
                  <span>📍 Localización</span>
                  <small>3 campos requeridos</small>
                </div>
                <p className="help-text" style={{ gridColumn: 'span 3', marginBottom: '16px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                  💡 Obligatoria para ubicar geográficamente tu huerto, ofrecerte el widget meteorológico en tiempo real y proporcionarte consejos de siembra adaptados a tu clima local.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label htmlFor="pais" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>País</span>
                      <span className={`required-badge ${pais.trim() ? 'filled' : 'pending'}`}>{pais.trim() ? '✓' : '*'}</span>
                    </label>
                    <select id="pais" className="form-input" value={pais}
                      onChange={e => {
                        setPais(e.target.value);
                        autoSaveField('pais', e.target.value);
                        if (e.target.value !== 'España' && pais === 'España') {
                          setCodigoPostal('');
                          setPoblacion('');
                          autoSaveMultiple({ codigoPostal: '', poblacion: '' });
                        }
                      }}
                      style={{ 
                        borderLeft: `3px solid ${pais.trim() ? '#10b981' : '#f59e0b'}`, 
                        color: pais ? '#0369a1' : 'var(--text-muted)', 
                        backgroundColor: pais ? '#e0f2fe' : undefined,
                        borderColor: pais ? '#7dd3fc' : undefined,
                        fontWeight: pais ? 500 : undefined,
                        cursor: 'pointer' 
                      }}>
                      <option value="" disabled>Selecciona un país...</option>
                      {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label htmlFor="codigo_postal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>C. Postal</span>
                      <span className={`required-badge ${codigoPostal.trim() ? 'filled' : 'pending'}`}>{codigoPostal.trim() ? '✓' : '*'}</span>
                    </label>
                    {pais === 'España' ? (
                      <>
                        <div className="autocomplete-wrapper">
                          <input id="codigo_postal" type="text" className="form-input autocomplete-input" value={codigoPostal}
                            autoComplete="off"
                            onChange={e => {
                              const val = e.target.value;
                              setCodigoPostal(val);
                              if (cpTimeoutRef.current) clearTimeout(cpTimeoutRef.current);
                              cpTimeoutRef.current = setTimeout(() => searchLocation(val, 'cp'), 300);
                            }}
                            onFocus={() => searchLocation(codigoPostal, 'cp')}
                            onClick={(e) => {
                              e.stopPropagation();
                              searchLocation(codigoPostal, 'cp');
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowCpDropdown(false), 200);
                              if (codigoPostal.trim()) autoSaveField('codigoPostal', codigoPostal);
                            }}
                            placeholder="C.P." style={{ borderLeft: `3px solid ${codigoPostal.trim() ? '#10b981' : '#f59e0b'}` }} />
                          <svg className="autocomplete-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                        {showCpDropdown && cpSuggestions.length > 0 && (
                          <ul className="location-dropdown">
                            {cpSuggestions.map((s, i) => (
                              <li key={i} onMouseDown={() => {
                                setCodigoPostal(s.cp);
                                setPoblacion(s.ciudad);
                                setShowCpDropdown(false);
                                setCpSuggestions([]);
                                autoSaveMultiple({ codigoPostal: s.cp, poblacion: s.ciudad });
                              }}>
                                <strong>{s.cp}</strong> — {s.ciudad}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <input id="codigo_postal" type="text" className="form-input" value={codigoPostal}
                        onChange={e => setCodigoPostal(e.target.value)}
                        onBlur={() => codigoPostal.trim() && autoSaveField('codigoPostal', codigoPostal)}
                        disabled={!pais}
                        placeholder={pais ? "C.P." : "Selecciona país primero"} style={{ borderLeft: `3px solid ${!pais ? '#cbd5e1' : codigoPostal.trim() ? '#10b981' : '#f59e0b'}`, cursor: !pais ? 'not-allowed' : 'text' }} />
                    )}
                  </div>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label htmlFor="poblacion" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>Población</span>
                      <span className={`required-badge ${poblacion.trim() ? 'filled' : 'pending'}`}>{poblacion.trim() ? '✓' : '*'}</span>
                    </label>
                    {pais === 'España' ? (
                      <>
                        <div className="autocomplete-wrapper">
                          <input id="poblacion" type="text" className="form-input autocomplete-input" value={poblacion}
                            autoComplete="off"
                            onChange={e => {
                              const val = e.target.value;
                              setPoblacion(val);
                              if (ciudadTimeoutRef.current) clearTimeout(ciudadTimeoutRef.current);
                              ciudadTimeoutRef.current = setTimeout(() => searchLocation(val, 'ciudad'), 300);
                            }}
                            onFocus={() => searchLocation(poblacion, 'ciudad')}
                            onClick={(e) => {
                              e.stopPropagation();
                              searchLocation(poblacion, 'ciudad');
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowCiudadDropdown(false), 200);
                              if (poblacion.trim()) autoSaveField('poblacion', poblacion);
                            }}
                            placeholder="Ciudad / Municipio" style={{ borderLeft: `3px solid ${poblacion.trim() ? '#10b981' : '#f59e0b'}` }} />
                          <svg className="autocomplete-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                        {showCiudadDropdown && ciudadSuggestions.length > 0 && (
                          <ul className="location-dropdown">
                            {ciudadSuggestions.map((s, i) => (
                              <li key={i} onMouseDown={() => {
                                setPoblacion(s.ciudad);
                                setCodigoPostal(s.cp);
                                setShowCiudadDropdown(false);
                                setCiudadSuggestions([]);
                                autoSaveMultiple({ poblacion: s.ciudad, codigoPostal: s.cp });
                              }}>
                                <strong>{s.ciudad}</strong> — CP: {s.cp}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <input id="poblacion" type="text" className="form-input" value={poblacion}
                        onChange={e => setPoblacion(e.target.value)}
                        onBlur={() => poblacion.trim() && autoSaveField('poblacion', poblacion)}
                        disabled={!pais}
                        placeholder={pais ? "Ciudad / Municipio" : "Selecciona país primero"} style={{ borderLeft: `3px solid ${!pais ? '#cbd5e1' : poblacion.trim() ? '#10b981' : '#f59e0b'}`, cursor: !pais ? 'not-allowed' : 'text' }} />
                    )}
                  </div>
                </div>
                {isFirebaseVerified && geoData && (
                  <div style={{ marginTop: '14px', fontSize: '0.88rem', color: '#064e3b', display: 'flex', flexDirection: 'column', gap: '8px', background: '#d1fae5', padding: '12px 14px', borderRadius: '8px', border: '1px solid #10b981' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }} title="Coordenadas GPS detectadas">🌍</span>
                      <div>
                        <strong style={{ display: 'block', marginBottom: '2px' }}>Zona de Cultivo y Clima Local</strong>
                        <span style={{ opacity: 0.85 }}>Lat: {geoData.lat} | Lon: {geoData.lon}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontStyle: 'italic', opacity: 0.9, fontSize: '0.85rem', lineHeight: 1.4 }}>
                        🌱 {zonaClimatica}
                      </span>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontWeight: 500, background: 'rgba(255,255,255,0.7)', padding: '6px 12px', borderRadius: '12px', alignSelf: 'flex-start', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <span style={{ color: '#047857', fontWeight: 600 }}>{geoData.name} ({geoData.updated})</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ color: '#ef4444' }} title="Máxima">Máx {geoData.max}º</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 700 }} title="Actual">{geoData.current}º {geoData.trend === 'subiendo' ? '↑' : geoData.trend === 'bajando' ? '↓' : '→'}</span>
                        <span style={{ color: '#cbd5e1' }}>|</span>
                        <span style={{ color: '#3b82f6' }} title="Mínima">Mín {geoData.min}º</span>
                        {geoData.rain > 0 && (
                          <>
                            <span style={{ color: '#cbd5e1' }}>|</span>
                            <span style={{ color: '#0ea5e9' }}>💧 {geoData.rain}mm</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Correo y Verificación (Última línea) */}
              <div className="form-group" style={{ 
                gridColumn: 'span 2', 
                marginTop: '10px',
                padding: '16px',
                borderRadius: '10px',
                border: isFirebaseVerified ? '2px solid #10b981' : isProfileComplete ? '2px solid #3b82f6' : '2px solid #f59e0b',
                backgroundColor: isFirebaseVerified ? '#f0fdf4' : isProfileComplete ? '#eff6ff' : '#fffbeb',
                transition: 'all 0.3s ease'
              }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', color: isFirebaseVerified ? '#065f46' : isProfileComplete ? '#1e3a8a' : '#92400e' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {isFirebaseVerified ? '✅ Correo Electrónico' : isProfileComplete ? '📧 Correo Electrónico' : '⚠️ Correo Electrónico'}
                  </span>
                  {isFirebaseVerified && <span className="verification-badge verified" style={{ margin: 0 }}>✅ Verificado</span>}
                </label>
                
                {isFirebaseVerified ? (
                  <>
                    <input type="email" className="form-input" value={profile.email} readOnly
                      style={{ background: '#ffffff', cursor: 'not-allowed', opacity: 0.8 }} />
                    <small className="help-text" style={{ color: '#065f46', marginTop: '8px', display: 'block' }}>El correo verificado no se puede modificar.</small>
                    {auth.currentUser?.metadata?.lastSignInTime && (
                      <small style={{ color: '#059669', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                        📅 Verificado el {new Date(auth.currentUser.metadata.creationTime || '').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </small>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <input type="email" className="form-input" value={editableEmail}
                        onChange={e => setEditableEmail(e.target.value)}
                        onBlur={async () => {
                          if (editableEmail === profile.email || !editableEmail.trim()) {
                            setEditableEmail(profile.email);
                            return;
                          }
                          try {
                            const data = await perfilApi.updateEmail(profile.email, editableEmail);
                            if (data.success) {
                              profile.email = editableEmail;
                              alert('✅ Correo actualizado. Recuerda verificarlo.');
                              setVerificationSentAt(null);
                            } else {
                              alert('❌ ' + (data.error || 'Error al cambiar email'));
                              setEditableEmail(profile.email);
                            }
                          } catch {
                            alert('❌ Error de conexión al cambiar email');
                            setEditableEmail(profile.email);
                          }
                        }}
                        placeholder="tu@email.com"
                        style={{ flex: 1, borderLeft: `3px solid ${editableEmail.trim() ? (isProfileComplete ? '#3b82f6' : '#f59e0b') : '#ef4444'}` }} />
                      <button type="button" onClick={handleVerifyEmail} className="btn btn-primary"
                        disabled={!isProfileComplete}
                        style={{ 
                          whiteSpace: 'nowrap', padding: '10px 18px', fontSize: '0.88rem', borderRadius: '8px', 
                          boxShadow: isProfileComplete ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                          opacity: isProfileComplete ? 1 : 0.6,
                          cursor: isProfileComplete ? 'pointer' : 'not-allowed',
                          background: isProfileComplete ? '#3b82f6' : '#94a3b8',
                          color: '#ffffff',
                          border: 'none'
                        }}>
                        {verificationSentAt ? '🔄 Volver a enviar' : '✉️ Verificar correo'}
                      </button>
                    </div>
                    {verificationSentAt && (
                      <small style={{ color: '#059669', fontSize: '0.78rem', display: 'block', marginTop: '8px', fontWeight: 600 }}>
                        📧 Correo enviado el {verificationSentAt}
                      </small>
                    )}
                    <small className="help-text" style={{ color: isProfileComplete ? '#1d4ed8' : '#b45309', marginTop: '10px', display: 'block', fontWeight: isProfileComplete ? 'normal' : 'bold' }}>
                      {isProfileComplete 
                        ? (verificationSentAt 
                            ? 'ℹ️ Revisa tu bandeja de entrada y haz clic en el enlace para completar la verificación.' 
                            : 'ℹ️ Haz clic en "Verificar correo" para enviarte un enlace de activación.')
                        : '🚨 Rellena todos los campos obligatorios de arriba para habilitar la verificación del correo.'}
                    </small>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── CAMPOS OPCIONALES ── */}
        <div className="optional-zone">
          <div className="optional-zone-header" onClick={() => setCollapsedOptional(!collapsedOptional)} style={{ cursor: 'pointer', userSelect: 'none' }}>
            <span>📝 Datos Complementarios</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <small style={{ color: '#475569', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600 }}>{collapsedOptional ? 'Mostrar' : 'Ocultar'}</small>
              <svg 
                style={{ 
                  transform: collapsedOptional ? 'rotate(-90deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.25s ease',
                  width: '16px',
                  height: '16px',
                  color: '#475569'
                }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          {!collapsedOptional && (
            <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
              <div className="form-grid">
                {/* Apellidos */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="apellidos" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Apellidos</span>
                    <span style={{ fontSize: '0.75rem', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-muted)' }}>Opcional</span>
                  </label>
                  <input id="apellidos" type="text" className="form-input" value={apellidos}
                    onChange={e => setApellidos(e.target.value)} 
                    onBlur={() => autoSaveField('apellidos', apellidos)}
                    placeholder="Tus apellidos" />
                </div>
              </div>

              {/* Subgrupo: Localización y Contacto */}
              <div className="location-subgroup">
                <div className="location-subgroup-header">
                  <span>📍 Localización y Contacto</span>
                  <small>Obligatorio para suscripciones de pago</small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group">
                    <label htmlFor="pais_opt" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>País</span>
                      <span className={`required-badge ${pais.trim() ? 'filled' : 'pending'}`}>{pais.trim() ? '✓' : '—'}</span>
                    </label>
                    <select id="pais_opt" className="form-input" value={pais}
                      onChange={e => {
                        setPais(e.target.value);
                        autoSaveField('pais', e.target.value);
                        if (e.target.value !== 'España' && pais === 'España') {
                          setCodigoPostal('');
                          setPoblacion('');
                          autoSaveField('codigoPostal', '');
                          autoSaveField('poblacion', '');
                        }
                      }}
                      style={{ 
                        borderLeft: `3px solid ${pais.trim() ? '#10b981' : '#f59e0b'}`,
                        color: pais ? '#0369a1' : 'var(--text-muted)',
                        backgroundColor: pais ? '#e0f2fe' : undefined,
                        borderColor: pais ? '#7dd3fc' : undefined,
                        fontWeight: pais ? 500 : undefined,
                        cursor: 'pointer' 
                      }}>
                      <option value="" disabled>Selecciona un país...</option>
                      {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label htmlFor="codigo_postal_opt" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>C. Postal</span>
                      <span className={`required-badge ${codigoPostal.trim() ? 'filled' : 'pending'}`}>{codigoPostal.trim() ? '✓' : '—'}</span>
                    </label>
                    {pais === 'España' ? (
                      <>
                        <div className="autocomplete-wrapper">
                          <input id="codigo_postal_opt" type="text" className="form-input autocomplete-input" value={codigoPostal}
                            autoComplete="off"
                            onChange={e => {
                              const val = e.target.value;
                              setCodigoPostal(val);
                              if (cpTimeoutRef.current) clearTimeout(cpTimeoutRef.current);
                              cpTimeoutRef.current = setTimeout(() => searchLocation(val, 'cp', 'optional'), 300);
                            }}
                            onFocus={() => searchLocation(codigoPostal, 'cp', 'optional')}
                            onClick={(e) => {
                              e.stopPropagation();
                              searchLocation(codigoPostal, 'cp', 'optional');
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowCpDropdownOpt(false), 200);
                              if (codigoPostal.trim()) autoSaveField('codigoPostal', codigoPostal);
                            }}
                            placeholder="C.P." style={{ borderLeft: `3px solid ${codigoPostal.trim() ? '#10b981' : '#f59e0b'}` }} />
                          <svg className="autocomplete-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                        {showCpDropdownOpt && cpSuggestions.length > 0 && (
                          <ul className="location-dropdown">
                            {cpSuggestions.map((s, i) => (
                              <li key={i} onMouseDown={() => {
                                setCodigoPostal(s.cp);
                                setPoblacion(s.ciudad);
                                setShowCpDropdownOpt(false);
                                setCpSuggestions([]);
                                autoSaveField('codigoPostal', s.cp);
                                autoSaveField('poblacion', s.ciudad);
                              }}>
                                <strong>{s.cp}</strong> — {s.ciudad}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <input id="codigo_postal_opt" type="text" className="form-input" value={codigoPostal}
                        onChange={e => setCodigoPostal(e.target.value)}
                        onBlur={() => codigoPostal.trim() && autoSaveField('codigoPostal', codigoPostal)}
                        disabled={!pais}
                        placeholder={pais ? "C.P." : "Selecciona país primero"} style={{ borderLeft: `3px solid ${!pais ? '#cbd5e1' : codigoPostal.trim() ? '#10b981' : '#f59e0b'}`, cursor: !pais ? 'not-allowed' : 'text' }} />
                    )}
                  </div>
                  <div className="form-group" style={{ position: 'relative' }}>
                    <label htmlFor="poblacion_opt" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>Población</span>
                      <span className={`required-badge ${poblacion.trim() ? 'filled' : 'pending'}`}>{poblacion.trim() ? '✓' : '—'}</span>
                    </label>
                    {pais === 'España' ? (
                      <>
                        <div className="autocomplete-wrapper">
                          <input id="poblacion_opt" type="text" className="form-input autocomplete-input" value={poblacion}
                            autoComplete="off"
                            onChange={e => {
                              const val = e.target.value;
                              setPoblacion(val);
                              if (ciudadTimeoutRef.current) clearTimeout(ciudadTimeoutRef.current);
                              ciudadTimeoutRef.current = setTimeout(() => searchLocation(val, 'ciudad', 'optional'), 300);
                            }}
                            onFocus={() => searchLocation(poblacion, 'ciudad', 'optional')}
                            onClick={(e) => {
                              e.stopPropagation();
                              searchLocation(poblacion, 'ciudad', 'optional');
                            }}
                            onBlur={() => {
                              setTimeout(() => setShowCiudadDropdownOpt(false), 200);
                              if (poblacion.trim()) autoSaveField('poblacion', poblacion);
                            }}
                            placeholder="Ciudad / Municipio" style={{ borderLeft: `3px solid ${poblacion.trim() ? '#10b981' : '#f59e0b'}` }} />
                          <svg className="autocomplete-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                        {showCiudadDropdownOpt && ciudadSuggestions.length > 0 && (
                          <ul className="location-dropdown">
                            {ciudadSuggestions.map((s, i) => (
                              <li key={i} onMouseDown={() => {
                                setPoblacion(s.ciudad);
                                setCodigoPostal(s.cp);
                                setShowCiudadDropdownOpt(false);
                                setCiudadSuggestions([]);
                                autoSaveField('poblacion', s.ciudad);
                                autoSaveField('codigoPostal', s.cp);
                              }}>
                                <strong>{s.ciudad}</strong> — CP: {s.cp}
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : (
                      <input id="poblacion_opt" type="text" className="form-input" value={poblacion}
                        onChange={e => setPoblacion(e.target.value)}
                        onBlur={() => poblacion.trim() && autoSaveField('poblacion', poblacion)}
                        disabled={!pais}
                        placeholder={pais ? "Ciudad / Municipio" : "Selecciona país primero"} style={{ borderLeft: `3px solid ${!pais ? '#cbd5e1' : poblacion.trim() ? '#10b981' : '#f59e0b'}`, cursor: !pais ? 'not-allowed' : 'text' }} />
                    )}
                  </div>
                </div>

                <div className="form-grid">
                  {/* Domicilio */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="domicilio" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>Domicilio</span>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '12px', color: '#92400e' }}>Para suscripción</span>
                    </label>
                    <input id="domicilio" type="text" className="form-input" value={domicilio}
                      onChange={e => setDomicilio(e.target.value)}
                      onBlur={() => autoSaveField('domicilio', domicilio)}
                      placeholder="Calle, número, piso..." />
                  </div>
                  {/* Teléfono */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="telefono" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>Teléfono de contacto</span>
                      <span style={{ fontSize: '0.75rem', backgroundColor: '#fef3c7', padding: '2px 8px', borderRadius: '12px', color: '#92400e' }}>Para suscripción</span>
                    </label>
                    <input id="telefono" type="tel" className="form-input" value={telefono}
                      onChange={e => setTelefono(e.target.value)}
                      onBlur={() => autoSaveField('telefono', telefono)}
                      placeholder="+34 600 000 000" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── DATOS FISCALES Y FACTURACIÓN ── */}
        <div className="fiscal-zone" style={{ marginTop: '16px' }}>
          <div className="optional-zone-header" onClick={() => setCollapsedFiscal(!collapsedFiscal)} style={{ cursor: 'pointer', userSelect: 'none', background: '#f8fafc', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
            <span style={{ fontWeight: 600, color: '#334155' }}>💼 Datos Fiscales y de Facturación</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <small style={{ color: '#475569', opacity: 0.8, fontSize: '0.8rem', fontWeight: 600 }}>{collapsedFiscal ? 'Mostrar' : 'Ocultar'}</small>
              <svg 
                style={{ 
                  transform: collapsedFiscal ? 'rotate(-90deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.25s ease',
                  width: '16px',
                  height: '16px',
                  color: '#475569'
                }}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
          </div>

          {!collapsedFiscal && (
            <div style={{ animation: 'fadeIn 0.25s ease-out', padding: '16px 0' }}>
              <div className="form-grid">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="tipo_contribuyente" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Tipo de Cuenta Fiscal</span>
                  </label>
                  <select id="tipo_contribuyente" className="form-input" value={tipoContribuyente}
                    onChange={e => {
                      setTipoContribuyente(e.target.value);
                      autoSaveField('tipoContribuyente', e.target.value);
                      if (e.target.value === 'particular') {
                        setRazonSocial('');
                        autoSaveField('razonSocial', '');
                      }
                    }}>
                    <option value="particular">Particular</option>
                    <option value="autonomo">Autónomo</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="nif" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>NIF / CIF / NIE</span>
                  </label>
                  <input id="nif" type="text" className="form-input" value={nif}
                    onChange={e => setNif(e.target.value)} 
                    onBlur={() => autoSaveField('nif', nif)}
                    placeholder="Documento de identidad" />
                </div>

                {tipoContribuyente !== 'particular' && (
                  <div className="form-group">
                    <label htmlFor="razon_social" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span>Razón Social</span>
                      <span className={`required-badge ${razonSocial.trim() ? 'filled' : 'pending'}`}>{razonSocial.trim() ? '✓' : 'Requerido'}</span>
                    </label>
                    <input id="razon_social" type="text" className="form-input" value={razonSocial}
                      onChange={e => setRazonSocial(e.target.value)} 
                      onBlur={() => razonSocial.trim() && autoSaveField('razonSocial', razonSocial)}
                      placeholder="Nombre de la empresa o profesional" style={{ borderLeft: `3px solid ${razonSocial.trim() ? '#10b981' : '#f59e0b'}` }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
