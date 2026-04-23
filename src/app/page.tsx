import Image from "next/image";
import pool from "@/lib/db";

async function checkDatabase() {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}

export default async function Home() {
  const isDbConnected = await checkDatabase();

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div className="glass" style={{ padding: '3rem', borderRadius: 'var(--radius)', maxWidth: '600px', width: '100%' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem', fontWeight: 800, letterSpacing: '-1px' }}>
          Verdantia
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'var(--foreground)', opacity: 0.8 }}>
          Tu huerto inteligente, ahora en la nube.
        </p>
        
        <div style={{ padding: '1rem', borderRadius: '8px', backgroundColor: isDbConnected ? 'var(--primary-light)' : 'var(--danger)', color: isDbConnected ? 'var(--primary-hover)' : 'white', fontWeight: 600, display: 'inline-block', marginBottom: '2rem' }}>
          {isDbConnected ? '✅ Conectado a Google Cloud SQL' : '❌ Error de conexión a Base de Datos'}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <a href="/login" style={{ display: 'inline-block', padding: '1rem 2.5rem', backgroundColor: 'var(--primary)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            Acceder a mi Huerto
          </a>
        </div>
      </div>
    </main>
  );
}
