import { useEffect, useRef, useState } from 'react';
export type Orientation = { north: number; heading?: number | null };
export const northAngle = (room: Orientation) => typeof room.heading === 'number' ? -room.heading : room.north;
export const validHeading = (v: unknown) => v === undefined || v === null || typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 360;
type Reading = DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
export function readHeading(e: Reading): number | null {
  if (!Number.isFinite(e.beta) || !Number.isFinite(e.gamma) || e.beta === null || e.gamma === null || Math.abs(e.beta) > 20 || Math.abs(e.gamma) > 20) return null;
  if (typeof e.webkitCompassAccuracy === 'number' && (e.webkitCompassAccuracy < 0 || e.webkitCompassAccuracy > 25)) return null;
  const h = typeof e.webkitCompassHeading === 'number' ? e.webkitCompassHeading : e.absolute && typeof e.alpha === 'number' ? 360 - e.alpha : NaN;
  return Number.isFinite(h) ? (h % 360 + 360) % 360 : null;
}
export default function RoomCompass({ room, onChange }: {room: Orientation; onChange: (patch: Orientation) => void}) {
  const [active, setActive] = useState(false), [reading, setReading] = useState<number | null>(null), [manual, setManual] = useState(''), [message, setMessage] = useState('');
  const last = useRef(0), generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  useEffect(() => {
    if (!active) return;
    const receive = (event: Event) => {
      const h = readHeading(event as Reading);
      if (h === null) { setReading(null); setMessage('Mantén el teléfono horizontal. Si la lectura no llega, utiliza la entrada manual.'); return; }
      last.current = Date.now(); setReading(Math.round(h) % 360); setMessage('Lectura disponible. Apunta hacia la pared resaltada y guarda cuando esté estable.');
    };
    const stopHidden = () => { if (document.hidden) { setActive(false); setReading(null); } };
    window.addEventListener('deviceorientation', receive); window.addEventListener('deviceorientationabsolute', receive); document.addEventListener('visibilitychange', stopHidden);
    const timer = window.setInterval(() => { if (Date.now() - last.current > 3000) { setReading(null); setMessage('Sin lectura válida del sensor. Puedes introducir los grados manualmente.'); } }, 1000);
    return () => { clearInterval(timer); window.removeEventListener('deviceorientation', receive); window.removeEventListener('deviceorientationabsolute', receive); document.removeEventListener('visibilitychange', stopHidden); };
  }, [active]);
  const start = async () => {
    const attempt = ++generation.current;
    setReading(null);
    if (!window.isSecureContext || !window.DeviceOrientationEvent) { setMessage('Sensor no disponible en este navegador. Utiliza la entrada manual.'); return; }
    try {
      const api = DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: (absolute?: boolean) => Promise<string> };
      if (api.requestPermission && await api.requestPermission(true) !== 'granted') { setMessage('Permiso no concedido. Puedes usar la entrada manual.'); return; }
      if (generation.current !== attempt) return;
      last.current = 0; setActive(true); setMessage('Esperando brújula. Mantén el teléfono horizontal, con la pantalla hacia arriba.');
    } catch { if (generation.current === attempt) setMessage('No se pudo activar el sensor. Utiliza la entrada manual.'); }
  };
  const save = (h: number) => { onChange({heading:h,north:(360-h)%360}); setActive(false); setReading(null); setMessage(`Orientación guardada: ${h}°. La flecha del norte se ajustó al plano.`); };
  const validManual = manual.trim() !== '' && Number.isFinite(Number(manual)) && Number(manual) >= 0 && Number(manual) < 360;
  return <section className="room-compass" aria-label="Brújula de la habitación"><h3>Orienta tu plano · opcional</h3><p>La brújula ubica el norte en tu dibujo. Elige la pared que representarás arriba del plano y apunta el borde superior del teléfono hacia ella. Esta pared es una referencia para dibujar; después puedes observar cualquier punto con péndulo o varillas.</p>
    <div className="compass-guide"><svg viewBox="0 0 240 150" role="img" aria-label="Apunta el borde superior del teléfono hacia la pared superior resaltada"><rect x="25" y="20" width="190" height="110" fill="none" stroke="currentColor"/><path d="M25 20H215" stroke="#a56347" strokeWidth="7"/><rect x="100" y="65" width="40" height="55" rx="6" fill="none" stroke="currentColor"/><path d="M120 60V35m-7 8 7-8 7 8" fill="none" stroke="#a56347" strokeWidth="3"/></svg><div><strong>Pared que dibujarás arriba</strong><p>Mantén el teléfono horizontal, con la pantalla hacia arriba y el borde superior hacia esa pared. Aléjate de imanes y objetos metálicos.</p></div></div>
    <p className="detail-note">{room.heading === null ? 'Orientación desconocida.' : typeof room.heading === 'number' ? `Dirección guardada de la pared superior: ${room.heading}°.` : 'Orientación anterior del plano. Puedes volver a registrarla con la brújula.'}</p>
    <svg className="compass-dial" viewBox="0 0 160 160" role="img" aria-label={reading === null ? 'Brújula sin lectura' : `Norte respecto al teléfono; rumbo ${reading} grados`}><circle cx="80" cy="80" r="60" fill="none" stroke="currentColor"/><text x="80" y="15" textAnchor="middle">Arriba del teléfono</text><g transform={`rotate(${reading === null ? 0 : -reading} 80 80)`} opacity={reading === null ? .25 : 1}><path d="M80 32 68 86 80 77 92 86Z" fill="#a56347"/><text x="80" y="27" textAnchor="middle">N</text></g></svg><div className="compass-reading" aria-live="polite">{reading === null ? '—' : `${reading}°`}<span>Dirección de la pared superior</span></div><div className="space-actions"><button type="button" className="button secondary" onClick={active ? () => {generation.current++;setActive(false);setReading(null);setMessage('Brújula detenida.');} : start}>{active ? 'Detener brújula' : 'Activar brújula'}</button><button type="button" className="button primary" disabled={!active || reading === null} onClick={() => {if(reading !== null && Date.now()-last.current <= 3000)save(reading);}}>Guardar orientación</button><button type="button" className="text-button" onClick={() => {generation.current++;setActive(false);setReading(null);onChange({heading:null,north:0});setMessage('Puedes continuar con orientación desconocida.');}}>No conozco la orientación</button></div>
    {message && <p role="status">{message}</p>}<details><summary>Introducir grados manualmente</summary><label>Dirección de la pared superior · grados<input aria-label="Dirección manual de la pared" type="number" min="0" max="359" step="1" value={manual} onChange={e=>setManual(e.target.value)} placeholder="Ejemplo: 90" /></label><p className="detail-note">0° norte · 90° este · 180° sur · 270° oeste. Copia la brújula del teléfono mientras apuntas hacia la misma pared.</p><button type="button" className="button secondary" disabled={!validManual} onClick={()=>save(Number(manual))}>Guardar dirección manual</button></details>
  </section>;
}
