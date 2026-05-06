import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Script de Pruebas de Carga con k6 (Gold Standard).
 * Simula tráfico intensivo para validar que Firebase y Next.js no colapsan
 * bajo peticiones simultáneas.
 * 
 * Uso: k6 run tests/load/upload.js
 */
export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Rampa de subida a 20 usuarios virtuales
    { duration: '1m', target: 20 },  // Mantener 20 usuarios
    { duration: '10s', target: 0 },  // Rampa de bajada
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% de peticiones bajo 2 segundos
    http_req_failed: ['rate<0.01'],    // Errores menores al 1%
  },
};

export default function () {
  const url = 'https://verdantia-494121.web.app/api/media';
  // Nota: Este endpoint GET es ligero. Para probar el POST de subida,
  // se requeriría inyectar un Bearer Token válido de Firebase Auth.
  
  const res = http.get(url);
  
  check(res, {
    'status is 200 or 400 (if no params)': (r) => r.status === 200 || r.status === 400,
  });
  
  sleep(1);
}
