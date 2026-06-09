'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>¡Vaya! Algo ha fallado.</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Hemos encontrado un error inesperado. Nuestro equipo técnico ha sido notificado.
          </p>
          <button
            onClick={() => reset()}
            style={{ padding: '10px 20px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Volver a intentarlo
          </button>
        </div>
      </body>
    </html>
  );
}
