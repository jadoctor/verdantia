import Image from "next/image";

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div className="glass" style={{ padding: '3rem', borderRadius: 'var(--radius)', maxWidth: '600px', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Image
            src="/logo-verdantia.jpg"
            alt="Verdantia — Cultiva & Comparte Semillas"
            width={220}
            height={220}
            priority
            style={{ borderRadius: '50%', objectFit: 'cover', filter: 'drop-shadow(0 4px 12px rgba(0, 86, 179, 0.15))', marginBottom: '1rem' }}
          />
          <p style={{ fontSize: '1.2rem', color: 'var(--foreground)', opacity: 0.8 }}>
            Tu huerto inteligente, ahora en la nube.
          </p>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <a href="/login" style={{ display: 'inline-block', padding: '1rem 2.5rem', backgroundColor: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            Acceder a mi Huerto
          </a>
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="text-sm text-green-700 bg-green-100 px-4 py-2 rounded-full font-medium inline-block mb-2 shadow-sm border border-green-200">
              ✅ <span className="font-bold">Verificado:</span> 09/05/2026 00:20
            </div>
            <div className="text-xs text-slate-500 max-w-xl mx-auto italic">
              "Refactor: Caché Persistente Admin SDK vía globalThis"
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
