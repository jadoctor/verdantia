"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

interface DailyForecast {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  weather_code: number[];
}

interface CurrentWeather {
  temperature_2m: number;
  relative_humidity_2m: number;
  wind_speed_10m: number;
  weather_code: number;
}

interface WeatherData {
  current: CurrentWeather;
  daily: DailyForecast;
  locationName: string;
}

export default function MeteoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Map weather codes to emojis
  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️'; // Clear
    if (code === 1 || code === 2 || code === 3) return '⛅'; // Partly cloudy
    if (code >= 45 && code <= 48) return '🌫️'; // Fog
    if (code >= 51 && code <= 67) return '🌧️'; // Rain
    if (code >= 71 && code <= 77) return '❄️'; // Snow
    if (code >= 80 && code <= 82) return '🌦️'; // Showers
    if (code >= 95) return '⛈️'; // Thunderstorm
    return '☁️';
  };

  const getAdvice = (weatherCode: number, minTemp: number, maxTemp: number, rain: number) => {
    if (minTemp < 5) return '⚠️ Alerta de heladas: Protege tus planteles y cultivos sensibles al frío esta noche.';
    if (maxTemp > 35) return '🔥 Calor extremo: Aumenta la frecuencia de riego y proporciona sombra a las plantas jóvenes.';
    if (rain > 15) return '🌧️ Lluvias fuertes: Revisa el drenaje de tus macetas y huertos para evitar encharcamientos.';
    if (weatherCode === 0 && maxTemp > 25) return '☀️ Día soleado y cálido: Perfecto para polinización manual y recolección.';
    if (weatherCode >= 51 && weatherCode <= 67) return '💧 Lluvia ligera: Aprovecha el riego natural. Evita aplicar fertilizantes foliares hoy.';
    return '🌱 Condiciones óptimas: Día excelente para labores generales de mantenimiento en el huerto.';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push('/login'); return; }
      if (!user.emailVerified) {
        setErrorMsg('Debes verificar tu correo electrónico para acceder al radar meteorológico.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(user.email!)}`);
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          
          if (!p.poblacion && !p.codigoPostal) {
            setErrorMsg('Por favor, configura tu Población o Código Postal en tu perfil para ver el clima.');
            setLoading(false);
            return;
          }

          // Fetch coords
          let lat, lon, locName = p.poblacion || p.codigoPostal;
          if (p.poblacion) {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(p.poblacion)}&language=es&count=1`);
            const geoData = await geoRes.json();
            if (geoData.results?.length > 0) {
              lat = geoData.results[0].latitude;
              lon = geoData.results[0].longitude;
              locName = geoData.results[0].name;
            }
          }

          if (!lat && p.codigoPostal) {
            const geoRes = await fetch(`https://api.zippopotam.us/es/${encodeURIComponent(p.codigoPostal)}`);
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              lat = geoData.places[0].latitude;
              lon = geoData.places[0].longitude;
              locName = geoData.places[0]['place name'];
            }
          }

          if (!lat) throw new Error('No se encontraron coordenadas para tu ubicación.');

          // Fetch 7-day forecast
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
          const wRes = await fetch(weatherUrl);
          if (!wRes.ok) throw new Error('Error al conectar con el satélite.');
          const wData = await wRes.json();

          setWeatherData({
            current: wData.current,
            daily: wData.daily,
            locationName: locName
          });
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error desconocido.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="layout-content" style={{ padding: '20px', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-spinner" style={{ width: '50px', height: '50px', border: '4px solid rgba(16, 185, 129, 0.2)', borderLeftColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '20px', color: '#64748b', fontWeight: 500 }}>Sintonizando satélites meteorológicos...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="layout-content" style={{ padding: '20px' }}>
        <div className="card-storm" style={{ border: '2px solid #ef4444', textAlign: 'center', padding: '40px' }}>
          <span style={{ fontSize: '3rem' }}>🛰️❌</span>
          <h2 style={{ color: '#ef4444', marginTop: '10px' }}>Conexión Fallida</h2>
          <p style={{ color: '#64748b', marginTop: '10px' }}>{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!weatherData) return null;

  return (
    <div className="layout-content" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
        <div style={{ width: '60px', height: '60px', background: 'var(--storm-primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'white', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}>
          ⛅
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1e293b' }}>Mi Meteo Local</h1>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '1.1rem' }}>📍</span> 
            <strong style={{ color: 'var(--storm-primary)' }}>{weatherData.locationName}</strong>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Current Weather Card */}
        <div className="card-storm" style={{ background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '10rem', opacity: 0.15, transform: 'rotate(15deg)' }}>
            {getWeatherIcon(weatherData.current.weather_code)}
          </div>
          
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Condiciones Actuales
          </h3>
          
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px' }}>
            <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1 }}>{Math.round(weatherData.current.temperature_2m)}º</span>
            <span style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{getWeatherIcon(weatherData.current.weather_code)}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '25px', background: 'rgba(0,0,0,0.1)', padding: '15px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Humedad</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>💧 {weatherData.current.relative_humidity_2m}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Viento</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>💨 {Math.round(weatherData.current.wind_speed_10m)} km/h</span>
            </div>
          </div>
        </div>

        {/* Agricultural Advice Card */}
        <div className="card-storm" style={{ background: '#f8fafc', border: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤖 Consejo Agrícola de la IA
          </h3>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
            <p style={{ margin: 0, fontSize: '1.1rem', color: '#334155', lineHeight: 1.6, fontStyle: 'italic' }}>
              {getAdvice(
                weatherData.current.weather_code, 
                weatherData.daily.temperature_2m_min[0], 
                weatherData.daily.temperature_2m_max[0],
                weatherData.daily.precipitation_sum[0]
              )}
            </p>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        📅 Pronóstico a 7 Días
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '15px' }}>
        {weatherData.daily.time.map((dateStr, index) => {
          const date = new Date(dateStr);
          const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date);
          const isToday = index === 0;
          
          return (
            <div key={dateStr} className="card-storm" style={{ 
              padding: '15px', 
              textAlign: 'center', 
              background: isToday ? 'var(--storm-primary-light)' : 'white',
              border: isToday ? '2px solid var(--storm-primary)' : '1px solid #e2e8f0',
              transform: isToday ? 'scale(1.02)' : 'none',
              boxShadow: isToday ? '0 10px 25px rgba(16, 185, 129, 0.15)' : '0 2px 5px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isToday ? 'var(--storm-primary-dark)' : '#64748b', textTransform: 'capitalize' }}>
                {isToday ? 'Hoy' : dayName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px' }}>
                {date.getDate()}/{date.getMonth() + 1}
              </div>
              
              <div style={{ fontSize: '2.5rem', margin: '15px 0' }}>
                {getWeatherIcon(weatherData.daily.weather_code[index])}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', fontSize: '1.1rem', fontWeight: 600 }}>
                <span style={{ color: '#ef4444' }} title="Máxima">{Math.round(weatherData.daily.temperature_2m_max[index])}º</span>
                <span style={{ color: '#3b82f6', opacity: 0.8 }} title="Mínima">{Math.round(weatherData.daily.temperature_2m_min[index])}º</span>
              </div>
              
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#0ea5e9', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: weatherData.daily.precipitation_sum[index] > 0 ? 1 : 0.3 }}>
                💧 {weatherData.daily.precipitation_sum[index]}mm
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
