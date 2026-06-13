import { useState } from 'react';

export const MOTIVOS_RECHAZO_LEVE = [
  'La imagen no está relacionada con cultivos, plantas o huertos',
  'Imagen de baja calidad, borrosa o ilegible',
  'Imagen duplicada o ya existente en la plataforma',
  'Otro motivo — ver nota adicional',
];

export const MOTIVOS_SANCION_GRAVE = [
  'Contenido inapropiado, ofensivo, o de carácter sexual',
  'Contenido violento o incitación al odio',
  'La imagen contiene datos personales visibles (personas, matrículas, domicilios)',
  'Contenido con derechos de autor o marca comercial sin autorización',
];

export function useRechazos(
  setPendientes: React.Dispatch<React.SetStateAction<any[]>>,
  setProcessing: (id: number | null) => void,
  showToast: (msg: string) => void,
) {
  const [rechazandoId, setRechazandoId] = useState<number | null>(null);
  const [rechazandoRecursoId, setRechazandoRecursoId] = useState<{ id: number; p: any } | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
  const [motivoExtra, setMotivoExtra] = useState('');
  const [motivoRechazoRecurso, setMotivoRechazoRecurso] = useState('');

  const abrirModalRechazo = (photoId: number) => {
    setRechazandoId(photoId);
    setMotivoSeleccionado('');
    setMotivoExtra('');
  };

  const cerrarModalRechazo = () => setRechazandoId(null);

  const confirmarRechazo = async () => {
    if (!rechazandoId || !motivoSeleccionado) return;
    setProcessing(rechazandoId);
    const motivoFinal = motivoSeleccionado === 'Otro motivo — ver nota adicional' && motivoExtra.trim()
      ? `${motivoSeleccionado}: ${motivoExtra.trim()}` : motivoSeleccionado;
    const actionType = MOTIVOS_SANCION_GRAVE.includes(motivoSeleccionado) ? 'eliminar_inapropiado' : 'rechazar';
    try {
      const res = await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: rechazandoId, action: actionType, motivo: motivoFinal }),
      });
      const data = await res.json();
      setPendientes(prev => prev.filter(p => p.id !== rechazandoId));
      setRechazandoId(null);
      if (actionType === 'eliminar_inapropiado') {
        const msgs: Record<string, string> = {
          advertencia_1: '⚠️ Foto eliminada y 1ª advertencia enviada.',
          advertencia_2: '🔒 Foto eliminada. 2ª infracción: cuenta suspendida 7 días.',
          baja: '🔴 Foto eliminada. 3ª infracción: cuenta dada de baja definitivamente.',
        };
        showToast(msgs[data.sancion] || '✅ Foto eliminada y sanción aplicada.');
      } else {
        showToast(data.emailEnviado ? `✅ Foto rechazada. Correo enviado a: ${data.emailEnviado}` : '✅ Foto rechazada. El usuario verá el motivo en su galería.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const abrirModalRechazoRecurso = (incidenciaId: number, p: any) => {
    setRechazandoRecursoId({ id: incidenciaId, p });
    setMotivoRechazoRecurso('');
  };

  const handleRechazarRecursoConfirmado = async () => {
    if (!rechazandoRecursoId) return;
    const { id, p } = rechazandoRecursoId;
    if (!motivoRechazoRecurso.trim()) { showToast('⚠️ Debes escribir un motivo para denegar el recurso.'); return; }
    setProcessing(id);
    setRechazandoRecursoId(null);
    try {
      await fetch('/api/admin/incidencias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id, estado: 'resuelta',
          notas: (p.motivoRecurso || '') + `\n\n--- RESOLUCIÓN DEL EQUIPO (${new Date().toISOString().split('T')[0]}) ---\n${motivoRechazoRecurso}`,
          rejectionEmailTo: p.usuarioEmail && p.usuarioEmail !== 'desconocido' ? p.usuarioEmail : null,
          rejectionReason: motivoRechazoRecurso,
        }),
      });
      setPendientes(prev => prev.filter(item => item.id !== id));
      showToast('❌ Recurso denegado.');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  return {
    rechazandoId, rechazandoRecursoId,
    motivoSeleccionado, setMotivoSeleccionado,
    motivoExtra, setMotivoExtra,
    motivoRechazoRecurso, setMotivoRechazoRecurso,
    abrirModalRechazo, cerrarModalRechazo, confirmarRechazo,
    abrirModalRechazoRecurso, handleRechazarRecursoConfirmado,
  };
}
