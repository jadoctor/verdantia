'use client';
import React, { useState, useEffect } from 'react';

interface CultivoMeteoWidgetProps {
  ubicacion: string; // la ubicación del cultivo
  userEmail: string;
}

export default function CultivoMeteoWidget({ ubicacion, userEmail }: CultivoMeteoWidgetProps) {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [locName, setLocName] = useState('');

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(false);
      try {
        // 1. Obtener perfil del usuario para la ubicación base
        const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) throw new Error('No profile');
        const data = await res.json();
        const p = data.profile;

        const location = ubicacion && ubicacion.trim() !== '' ? ubicacion : p.poblacion;
        if (!location) throw new Error('No location');

        // 2. Geocodificar la ubicación
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&language=es&count=1`);
        const geoData = await geoRes.json();
        if (!geoData.results?.length) throw new Error('No coords');
        const { latitude, longitude, name } = geoData.results[0];
        setLocName(name);

        // 3. Obtener clima actual
        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation&timezone=auto`
        );
        const wData = await wRes.json();
        setWeather(wData.current);
      } catch (e) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (userEmail) fetchWeather();
  }, [userEmail, ubicacion]);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 95) return '⛈️';
    return '☁️';
  };

  const getAdvice = (code: number, temp: number) => {
    if (temp < 5) return { text: 'Riesgo de helada', color: '#3b82f6' };
    if (temp > 35) return { text: 'Calor extremo, más riego', color: '#ef4444' };
    if (code >= 51 && code <= 67) return { text: 'Lluvia: reduce el riego', color: '#0ea5e9' };
    if (code === 0 && temp > 22) return { text: 'Ideal para recolección', color: '#10b981' };
    return { text: 'Condiciones normales', color: '#64748b' };
  };

  if (error || (!loading && !weather)) return null;

  return (
    <div style={{
      background: loading ? '#f8fafc' : 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
      borderRadius: '16px',
      padding: '16px',
      color: 'white',
      marginTop: '20px',
      minHeight: '80px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {loading ? (
        <div style={{ color: '#64748b', fontSize: '0.9rem', padding: '4px' }}>
          🌡️ Cargando condiciones meteorológicas...
        </div>
      ) : weather && (
        <>
          {/* Decorative large icon */}
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '5rem', opacity: 0.15 }}>
            {getWeatherIcon(weather.weather_code)}
          </div>

          <div style={{ fontSize: '3rem', flexShrink: 0 }}>
            {getWeatherIcon(weather.weather_code)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '4px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
                {Math.round(weather.temperature_2m)}°
              </span>
              <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>💧 {weather.relative_humidity_2m}%</span>
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '4px' }}>
              📍 {locName}
            </div>
            {(() => {
              const advice = getAdvice(weather.weather_code, weather.temperature_2m);
              return (
                <div style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.8rem',
                  display: 'inline-block',
                  fontWeight: 600
                }}>
                  {advice.text}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
  );
}
