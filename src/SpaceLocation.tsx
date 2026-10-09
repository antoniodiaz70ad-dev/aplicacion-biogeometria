import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

export type Location = { latitude: number; longitude: number; accuracy: number | null; capturedAt: string; source: 'dispositivo' | 'manual' };
export function validLocation(value: unknown): value is Location {
  if (!value || typeof value !== 'object') return false;
  const v = value as Location;
  return Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180
    && (v.accuracy === null ? v.source === 'manual' : v.source === 'dispositivo' && Number.isFinite(v.accuracy) && v.accuracy >= 0)
    && typeof v.capturedAt === 'string' && v.capturedAt.length <= 100 && !Number.isNaN(Date.parse(v.capturedAt));
}

export default function SpaceLocation({ location, onChange }: { location?: Location; onChange: (location: Location | undefined) => void }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [latitude, setLatitude] = useState(''), [longitude, setLongitude] = useState('');
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  function locate() {
    if (!window.isSecureContext || !navigator.geolocation) { setMessage('La ubicación requiere HTTPS y un navegador compatible. Puedes ingresar coordenadas manualmente.'); return; }
    const id = ++request.current; setBusy(true); setMessage('Solicitando ubicación al dispositivo…');
    const fail = (message: string) => { if (request.current !== id) return; setBusy(false); setMessage(message); };
    try {
      navigator.geolocation.getCurrentPosition(position => {
        if (request.current !== id) return;
        const captured = new Date(position.timestamp);
        if (!Number.isFinite(captured.getTime())) { fail('El dispositivo devolvió una fecha inválida. Intenta de nuevo.'); return; }
        const next: Location = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, capturedAt: captured.toISOString(), source: 'dispositivo' };
        if (!validLocation(next)) { fail('El dispositivo devolvió una ubicación inválida. Se conservó la ubicación anterior.'); return; }
        onChange(next); setBusy(false); setMessage('Ubicación guardada en este navegador.');
      }, error => fail(error.code === 1 ? 'Permiso de ubicación denegado. Puedes ingresar coordenadas manualmente.' : error.code === 3 ? 'No se obtuvo la ubicación a tiempo. Intenta de nuevo o ingresa coordenadas manualmente.' : 'Ubicación no disponible. Intenta cerca de una ventana o ingresa coordenadas manualmente.'), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
    } catch { fail('No se pudo solicitar la ubicación. Puedes ingresar coordenadas manualmente.'); }
  }
  function saveManual() {
    const next: Location = { latitude: Number(latitude), longitude: Number(longitude), accuracy: null, capturedAt: new Date().toISOString(), source: 'manual' };
    if (!latitude.trim() || !longitude.trim() || !validLocation(next)) { setMessage('Ingresa latitud entre −90 y 90, y longitud entre −180 y 180.'); return; }
    request.current++; setBusy(false); onChange(next); setMessage('Coordenadas manuales guardadas; precisión no verificada.');
  }
  return <section className="space-card location-card" aria-label="Ubicación del lugar"><p className="eyebrow">UBICACIÓN DEL LUGAR</p><h2>Un lugar en el mapa.</h2><p>Guarda la posición del inmueble. Los puntos de la habitación se ubican en el plano; estas coordenadas no miden energía ni determinan el norte del plano.</p>
    <button className="button secondary" type="button" disabled={busy} onClick={locate}><MapPin size={16} />{busy ? 'Obteniendo ubicación…' : 'Usar ubicación del dispositivo'}</button>
    <p className="detail-note">Solo se solicita al pulsar el botón y aceptar el permiso del navegador. La app guarda las coordenadas localmente, sin seguimiento continuo. El servicio de ubicación de tu navegador puede consultar a su proveedor.</p>
    {location && <div className="location-result"><strong>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</strong><p>{location.source === 'dispositivo' ? `Precisión estimada por el dispositivo: ±${Math.ceil(location.accuracy!)} m.` : 'Coordenadas manuales · precisión desconocida.'}<br />Registrada: {new Date(location.capturedAt).toLocaleString('es-MX')}.</p>
      <a className="button secondary" href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`} target="_blank" rel="noreferrer">Ver en OpenStreetMap</a>
      <p className="detail-note">Al abrir el mapa, compartes estas coordenadas con OpenStreetMap. No se carga ningún mapa externo automáticamente. El respaldo JSON también incluye esta ubicación.</p>
      <button className="text-button" type="button" disabled={busy} onClick={() => { request.current++; onChange(undefined); setMessage('Ubicación retirada del registro actual. Los respaldos anteriores conservan su copia.'); }}>Quitar ubicación del registro</button>
    </div>}
    <details><summary>Ingresar coordenadas manualmente</summary><div className="space-form-grid"><label>Latitud<input aria-label="Latitud del lugar" type="number" min={-90} max={90} step="any" value={latitude} onChange={e => setLatitude(e.target.value)} /></label><label>Longitud<input aria-label="Longitud del lugar" type="number" min={-180} max={180} step="any" value={longitude} onChange={e => setLongitude(e.target.value)} /></label></div><button className="button secondary" type="button" onClick={saveManual}>Guardar coordenadas</button></details>
    {message && <p role="status" className="location-status">{message}</p>}
  </section>;
}
