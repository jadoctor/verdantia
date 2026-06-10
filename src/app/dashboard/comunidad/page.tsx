'use client';

import { useEffect, useState, useRef } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-url';

export default function ComunidadPage() {
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Nuevos estados para Chat Múltiple
  const [chats, setChats] = useState<any[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [activeChatMeta, setActiveChatMeta] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const fromRangos = searchParams?.get('from') === 'rangos';

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/login'); return; }
      setUserEmail(user.email);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (userEmail) loadChats();
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && activeChatId) loadMensajes(activeChatId);
  }, [userEmail, activeChatId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const loadChats = async () => {
    try {
      const res = await fetch('/api/user/chat', { headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
        const data = await res.json();
        setChats(data.chats || []);
        if (data.chats?.length > 0 && !activeChatId) {
          const global = data.chats.find((c: any) => c.codigo === 'grupo:comunidad:general');
          if (global) {
            setActiveChatId(global.id);
            setActiveChatMeta(global);
          } else {
            setActiveChatId(data.chats[0].id);
            setActiveChatMeta(data.chats[0]);
          }
        }
      }
    } catch (e) {
      console.error('Error cargando chats:', e);
    }
  };

  const loadMensajes = async (chatId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/user/comunidad?chatId=${chatId}`, { headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
        const data = await res.json();
        setMensajes(data.mensajes || []);
      }
    } catch (e) {
      console.error('Error cargando mensajes:', e);
    } finally {
      setLoading(false);
    }
  };

  // Buscador de usuarios con debounce manual
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/user/usuarios/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'x-user-email': userEmail! }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.usuarios || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, userEmail]);

  const startPrivateChat = async (targetUserId: number) => {
    setSearchQuery('');
    setSearchResults([]);
    try {
      const res = await fetch('/api/user/chat/privado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ targetUserId })
      });
      if (res.ok) {
        const data = await res.json();
        await loadChats();
        setActiveChatId(data.chatId);
        const meta = chats.find(c => c.id === data.chatId);
        if (meta) setActiveChatMeta(meta);
      }
    } catch (e) {
      console.error('Error iniciando chat privado:', e);
    }
  };

  const handleEnviarMensaje = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nuevoMensaje.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/comunidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ texto: nuevoMensaje, chatId: activeChatId })
      });
      if (res.ok) {
        setNuevoMensaje('');
        if (activeChatId) loadMensajes(activeChatId);
        loadChats();
      } else {
        alert('Error al enviar el mensaje');
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviarMensaje();
    }
  };

  const formatWhatsAppDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* ── Navegación Jerárquica Superior ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={() => router.push(fromRangos ? '/dashboard?returnToLogros=true' : '/dashboard')}
          style={{
            background: 'white', color: '#475569', border: '1px solid #e2e8f0',
            padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 800,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
          onMouseOut={e => e.currentTarget.style.background = 'white'}
        >
          🏠 Volver al Inicio
        </button>
      </div>

      <div style={{ 
        display: 'flex', height: 'calc(100vh - 160px)', minHeight: '500px',
        background: '#efeae2', borderRadius: '16px', overflow: 'hidden', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)', position: 'relative' 
      }}>
        
        {/* ── Sidebar Izquierdo (Chats y Búsqueda) ── */}
        <div style={{ width: '30%', minWidth: '280px', maxWidth: '400px', background: '#ffffff', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(0,0,0,0.08)', zIndex: 5 }}>
          {/* Header Sidebar */}
          <div style={{ background: '#f0f2f5', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🧑‍🌾</div>
            <div style={{ color: '#54656f', display: 'flex', gap: '16px', fontSize: '1.2rem' }}>
              <span style={{ cursor: 'pointer' }} title="Nuevo Chat">💬</span>
              <span style={{ cursor: 'pointer' }} title="Opciones">⋮</span>
            </div>
          </div>
          
          {/* Buscador */}
          <div style={{ background: '#ffffff', padding: '8px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ background: '#f0f2f5', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '6px 12px' }}>
              <span style={{ fontSize: '0.9rem', color: '#54656f' }}>🔍</span>
              <input 
                type="text" 
                placeholder="Busca un usuario o chat" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', marginLeft: '12px', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Lista de Chats / Resultados */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {searchQuery ? (
              // Resultados Búsqueda
              <div>
                <div style={{ padding: '16px 16px 8px', color: '#00a884', fontSize: '0.85rem', fontWeight: 600 }}>RESULTADOS</div>
                {isSearching ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#667781', fontSize: '0.9rem' }}>Buscando...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <div key={u.id} onClick={() => startPrivateChat(u.id)} style={{ padding: '12px 16px', display: 'flex', gap: '12px', cursor: 'pointer', borderBottom: '1px solid #f0f2f5' }} onMouseOver={e => e.currentTarget.style.background = '#f5f6f6'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                       <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                         {u.avatar ? <img src={u.avatar} alt="avatar" style={{width:'100%', height:'100%', objectFit:'cover'}} crossOrigin="anonymous" /> : '🧑‍🌾'}
                       </div>
                       <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                         <span style={{ fontWeight: 600, color: '#111b21' }}>{u.nombre}</span>
                         {u.rango_nombre && <span style={{ fontSize: '0.8rem', color: '#667781' }}>{u.rango_nivel !== undefined && u.rango_nivel !== null ? `${u.rango_nivel} ` : ''}{u.rango_icono} {u.rango_nombre}</span>}
                       </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#667781', fontSize: '0.9rem' }}>No se encontraron usuarios</div>
                )}
              </div>
            ) : (
              // Lista de Chats Activos
              chats.map(c => {
                const isGlobal = c.codigo === 'grupo:comunidad:general';
                const isActive = activeChatId === c.id;
                return (
                  <div key={c.id} onClick={() => { setActiveChatId(c.id); setActiveChatMeta(c); }} style={{ padding: '12px 16px', display: 'flex', gap: '12px', cursor: 'pointer', background: isActive ? '#f0f2f5' : 'transparent', borderBottom: '1px solid #f0f2f5' }} onMouseOver={e => !isActive && (e.currentTarget.style.background = '#f5f6f6')} onMouseOut={e => !isActive && (e.currentTarget.style.background = 'transparent')}>
                     <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: isGlobal ? '#00a884' : '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: isGlobal ? 'white' : 'inherit' }}>
                       {isGlobal ? '🌍' : '🧑‍🌾'}
                     </div>
                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontWeight: 600, color: '#111b21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre}</span>
                         {c.fecha_ultimo_mensaje && <span style={{ fontSize: '0.75rem', color: '#667781' }}>{formatWhatsAppDate(c.fecha_ultimo_mensaje)}</span>}
                       </div>
                       <span style={{ fontSize: '0.85rem', color: '#667781', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                         {c.ultimo_mensaje || (isGlobal ? 'Muro general' : 'Inicia la conversación')}
                       </span>
                     </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Main Chat Area (70%) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Header Chat */}
          <div style={{ 
            background: '#f0f2f5', padding: '10px 16px', display: 'flex', alignItems: 'center', 
            gap: '16px', zIndex: 10, borderBottom: '1px solid rgba(0,0,0,0.05)' 
          }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '50%', background: activeChatMeta?.codigo === 'grupo:comunidad:general' ? '#00a884' : '#e2e8f0', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'white' 
            }}>
              {activeChatMeta?.codigo === 'grupo:comunidad:general' ? '🌍' : '🧑‍🌾'}
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111b21' }}>{activeChatMeta?.nombre || 'Comunidad Verdantia'}</h1>
              <span style={{ fontSize: '0.8rem', color: '#667781' }}>
                {mensajes.length} mensajes en total
              </span>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ 
            flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', 
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)', 
            backgroundSize: '20px 20px' 
          }}>
            
            {loading && (
              <div style={{ textAlign: 'center', margin: 'auto' }}>
                <span style={{ background: 'rgba(255,255,255,0.8)', padding: '8px 16px', borderRadius: '16px', fontSize: '0.85rem', color: '#667781' }}>Cargando mensajes...</span>
              </div>
            )}

            {!loading && mensajes.length === 0 && (
              <div style={{ textAlign: 'center', margin: 'auto' }}>
                <span style={{ background: '#ffeecd', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', color: '#667781', boxShadow: '0 1px 1px rgba(0,0,0,0.05)' }}>
                  🔒 Los mensajes están cifrados de extremo a extremo. Nadie fuera de este chat, ni siquiera Verdantia, puede leerlos ni escucharlos.
                </span>
              </div>
            )}

            {mensajes.map((m, index) => {
              const isMine = m.is_mine === 1;
              const isFirstInGroup = index === 0 || mensajes[index - 1].usuario_id !== m.usuario_id;
              const isLastInGroup = index === mensajes.length - 1 || mensajes[index + 1].usuario_id !== m.usuario_id;
              const time = new Date(m.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              let photoMeta: any = {};
              if (m.usuario_foto_meta) {
                try { photoMeta = JSON.parse(m.usuario_foto_meta); } catch(e) {}
              }
              const objPos = `${photoMeta.profile_object_x ?? 50}% ${photoMeta.profile_object_y ?? 38}%`;
              const objScale = photoMeta.profile_object_zoom > 100 ? `scale(${photoMeta.profile_object_zoom / 100})` : 'none';
              
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '8px', width: '100%', marginBottom: isLastInGroup ? '8px' : '2px' }}>
                  
                  {!isMine && (
                    <div style={{ width: '36px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                      {isFirstInGroup && (
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                          {m.usuario_foto ? (
                            <img src={getMediaUrl(m.usuario_foto)} alt="avatar" style={{width:'100%', height:'100%', objectFit:'cover', objectPosition: objPos, transform: objScale}} crossOrigin="anonymous" />
                          ) : (m.usuario_avatar && !m.usuario_avatar.startsWith('mdi-') ? m.usuario_avatar : '👤')}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    {!isMine && isFirstInGroup && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ color: '#667781', fontSize: '0.8rem', fontWeight: 600 }}>
                          {m.usuario_nombre || 'Usuario Anónimo'}
                        </span>
                        {m.usuario_poblacion && (
                          <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '-2px' }}>
                            📍 {m.usuario_poblacion}
                          </span>
                        )}
                        {m.rango_nombre && (
                          <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                            {m.rango_nivel !== undefined && m.rango_nivel !== null ? `${m.rango_nivel} ` : ''}{m.rango_icono} {m.rango_nombre}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{
                      background: isMine ? '#d9fdd3' : '#ffffff',
                      borderRadius: isMine ? (isFirstInGroup ? '8px 0 8px 8px' : '8px') : (isFirstInGroup ? '0 8px 8px 8px' : '8px'),
                      padding: '6px 8px 8px 12px',
                      boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {isFirstInGroup && (
                        <div style={{
                          position: 'absolute', top: 0, [isMine ? 'right' : 'left']: '-8px',
                          width: '8px', height: '12px',
                          background: isMine ? '#d9fdd3' : '#ffffff',
                          clipPath: isMine ? 'polygon(0 0, 100% 0, 0 100%)' : 'polygon(0 0, 100% 0, 100% 100%)'
                        }} />
                      )}
                      
                      <div style={{ fontSize: '0.95rem', color: '#111b21', lineHeight: '1.4', whiteSpace: 'pre-wrap', wordBreak: 'break-word', paddingRight: '46px' }}>
                        {m.texto}
                        <span style={{ float: 'right', fontSize: '0.65rem', color: '#667781', margin: '8px -42px -4px 12px' }}>
                          {time}
                          {isMine && <span style={{ marginLeft: '4px', color: '#53bdeb' }}>✓✓</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div style={{ background: '#f0f2f5', padding: '10px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ flex: 1, background: '#ffffff', borderRadius: '8px', padding: '9px 12px', display: 'flex', alignItems: 'center' }}>
              <textarea
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje"
                style={{ 
                  width: '100%', border: 'none', outline: 'none', resize: 'none', 
                  height: '24px', maxHeight: '100px', fontSize: '0.95rem', 
                  fontFamily: 'inherit', background: 'transparent' 
                }}
                rows={1}
              />
            </div>
            <button
              onClick={() => handleEnviarMensaje()}
              disabled={!nuevoMensaje.trim() || isSubmitting}
              style={{
                width: '40px', height: '40px', borderRadius: '50%', background: '#00a884', color: 'white',
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (!nuevoMensaje.trim() || isSubmitting) ? 'default' : 'pointer',
                opacity: (!nuevoMensaje.trim() || isSubmitting) ? 0.6 : 1,
                transition: 'opacity 0.2s', flexShrink: 0
              }}
            >
              <span style={{ transform: 'translateX(1px) translateY(1px)', fontSize: '1.2rem' }}>➤</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
