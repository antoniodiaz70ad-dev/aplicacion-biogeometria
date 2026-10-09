import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

export type Location = { latitude: number; longitude: number; accuracy: number | null; capturedAt: string; source: 'dispositivo' | 'manual' };
export function validLocation(value: unknown): value is Location {
  if (!value || typeof value !== 'object') return false;
  const v = value as Location;
  return Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180
    && (v.accuracy === null ? v.source === 'manual' : v.source === 'dispositivo' && Number.isFinite(v.accuracy) && v.accuracy >= 0)
    && typeof v.capturedAt === 'string' && v.capturedAt.length <= 100 && !Number.isNaN(Date.parse(v.capturedAt));
}

function MapCanvas({ latitude, longitude, accuracy, zoom, revision }: { latitude: number; longitude: number; accuracy: number | null; zoom: number; revision: number }) {
  const container = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Cargando cartografía…');
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    setStatus('Cargando cartografía…');
    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !container.current) return;
      const map = L.map(container.current, { scrollWheelZoom: false, minZoom: 2, maxZoom: 19 }).setView([latitude, longitude], zoom);
      dispose = () => map.remove();
      const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' });
      tiles.on('tileload', () => { if (!cancelled) setStatus(''); });
      tiles.on('tileerror', () => { if (!cancelled) setStatus('No se pudo cargar parte del mapa. Revisa tu conexión o pulsa «Volver al marcador» para reintentar.'); });
      tiles.addTo(map);
      L.marker([latitude, longitude], { title: 'Ubicación del lugar', icon: L.divIcon({ className: 'place-map-marker', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(map);
      if (accuracy !== null && accuracy > 0) L.circle([latitude, longitude], { radius: accuracy, color: '#264e43', weight: 2, fillOpacity: .12, interactive: false }).addTo(map);
      const resize = new ResizeObserver(() => map.invalidateSize());
      resize.observe(container.current);
      dispose = () => { resize.disconnect(); map.remove(); };
    }).catch(() => { if (!cancelled) setStatus('No se pudo iniciar el mapa. Reintenta con «Volver al marcador».'); });
    return () => { cancelled = true; dispose?.(); };
  }, [latitude, longitude, accuracy, zoom, revision]);
  return <><div ref={container} className="map-frame" role="region" aria-label="Mapa interactivo del lugar" />{status && <p className="detail-note" role="status">{status}</p>}</>;
}

function PlaceMap({ location }: { location?: Location }) {
  const [visible, setVisible] = useState(false);
  const [scale, setScale] = useState<'cerca' | 'barrio' | 'zona'>('barrio');
  const [revision, setRevision] = useState(0);
  // A public landmark makes the empty state demonstrable without saving a location.
  const latitude = location?.latitude ?? 48.8584, longitude = location?.longitude ?? 2.2945;
  const supported = Math.abs(latitude) <= 85.05112878;
  const zoom = scale === 'cerca' ? 18 : scale === 'barrio' ? 16 : 13;
  return <div className="place-map" aria-label="Mapa dentro de la plataforma">
    <div className="map-heading"><div><p className="eyebrow">VISTA GEOGRÁFICA</p><h3>{location ? 'Tu lugar, aquí.' : 'Explora el mapa.'}</h3></div>{visible && <button className="text-button" type="button" onClick={() => setVisible(false)}>Cerrar mapa</button>}</div>
    {!location && <p className="detail-note">Ejemplo: Torre Eiffel, París. No usa tu ubicación ni guarda estas coordenadas en tu espacio.</p>}
    {!supported ? <p role="status">El mapa de calles no cubre estas latitudes polares. Tus coordenadas se conservan en el registro.</p> : <>
      {!visible ? <div className="map-placeholder"><MapPin size={30} aria-hidden="true" /><p>{location ? 'Visualiza el inmueble y su entorno sin salir de Espacios.' : 'Prueba el visor; después puedes usar la ubicación de tu dispositivo.'}</p><p className="detail-note">Al cargar el mapa, OpenStreetMap recibe {location ? 'las coordenadas del lugar' : 'las coordenadas públicas del ejemplo'} y tu conexión para mostrar la cartografía.</p><button className="button secondary" type="button" onClick={() => setVisible(true)}>{location ? 'Mostrar mapa aquí' : 'Ver ejemplo de mapa'}</button></div> : <>
        <div className="map-toolbar" aria-label="Escala del mapa">{(['cerca', 'barrio', 'zona'] as const).map(value => <button className="button secondary" type="button" key={value} aria-pressed={scale === value} onClick={() => setScale(value)}>{value === 'cerca' ? 'Cerca del lugar' : value === 'barrio' ? 'Barrio' : 'Zona amplia'}</button>)}<button className="text-button" type="button" onClick={() => setRevision(value => value + 1)}>Volver al marcador</button></div>
        <MapCanvas latitude={latitude} longitude={longitude} accuracy={location?.accuracy ?? null} zoom={zoom} revision={revision} />
        <p className="detail-note">Arrastra para explorar y usa +/− o el gesto de pellizcar para acercar o alejar. El marcador representa {location ? 'las coordenadas guardadas' : 'un lugar de ejemplo'}; mover el mapa no cambia tu registro. {location?.accuracy != null ? ' El círculo indica la precisión estimada, no una zona de anomalías.' : ''}</p>
        <p className="detail-note">Si no carga, revisa tu conexión o pulsa «Volver al marcador» para reintentarlo.</p>
      </>}
    </>}
  </div>;
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
      <p className="detail-note">El respaldo JSON también incluye esta ubicación. El mapa se carga dentro de la plataforma cuando lo solicitas.</p>
      <button className="text-button" type="button" disabled={busy} onClick={() => { request.current++; onChange(undefined); setMessage('Ubicación retirada del registro actual. Los respaldos anteriores conservan su copia.'); }}>Quitar ubicación del registro</button>
    </div>}
    <PlaceMap key={location ? `${location.latitude},${location.longitude}` : 'sin-ubicacion'} location={location} />
    <details><summary>Ingresar coordenadas manualmente</summary><div className="space-form-grid"><label>Latitud<input aria-label="Latitud del lugar" type="number" min={-90} max={90} step="any" value={latitude} onChange={e => setLatitude(e.target.value)} /></label><label>Longitud<input aria-label="Longitud del lugar" type="number" min={-180} max={180} step="any" value={longitude} onChange={e => setLongitude(e.target.value)} /></label></div><button className="button secondary" type="button" onClick={saveManual}>Guardar coordenadas</button></details>
    {message && <p role="status" className="location-status">{message}</p>}
  </section>;
}
