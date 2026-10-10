import { useEffect, useId, useRef, useState } from 'react';
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
  const faceId = useId();
  const shown = reading ?? (typeof room.heading === 'number' ? room.heading : null);
  const live = reading !== null && active;
  const cardinal = shown === null ? 'Sin orientación' : ['Norte', 'Noreste', 'Este', 'Sureste', 'Sur', 'Suroeste', 'Oeste', 'Noroeste'][Math.round(shown / 45) % 8];
  return <section className="room-compass" aria-label="Brújula de la habitación">
    <header className="compass-header"><div><span className="compass-eyebrow">ORIENTACIÓN DEL ESPACIO</span><h3>Encuentra tu norte</h3></div><span className={`compass-status ${live ? 'is-live' : ''}`}><i aria-hidden="true" />{live ? 'En directo' : active ? 'Buscando sensor' : shown !== null ? 'Guardada' : 'Sin activar'}</span></header>
    <div className="compass-layout">
      <div className="compass-instrument">
        <span className="compass-reference">BORDE SUPERIOR DEL TELÉFONO</span>
        <svg className="compass-dial" viewBox="0 0 320 320" role="img" aria-label={reading === null ? 'Brújula sin lectura en directo' : `Norte respecto al teléfono; rumbo ${reading} grados`}>
          <defs><radialGradient id={faceId}><stop stopColor="#345e51"/><stop offset="1" stopColor="#173a31"/></radialGradient></defs>
          <circle cx="160" cy="160" r="152" fill={`url(#${faceId})`}/><circle cx="160" cy="160" r="147" fill="none" stroke="#d9c6a2" strokeOpacity=".3"/><circle cx="160" cy="160" r="108" fill="none" stroke="#ecede1" strokeOpacity=".12"/>
          <path d="M160 3l-5 10h10Z" fill="#cdaa76"/>
          <g opacity={shown === null ? .35 : 1} transform={`rotate(${shown === null ? 0 : -shown} 160 160)`}>
            {Array.from({length:72},(_,i)=><line key={i} x1="160" y1="22" x2="160" y2={i%9===0?37:i%3===0?33:28} transform={`rotate(${i*5} 160 160)`} stroke={i===0?'#d6ad7b':'#e9ede1'} strokeOpacity={i%9===0?1:.45} strokeWidth={i%9===0?2:1}/>) }
            {['N','NE','E','SE','S','SO','O','NO'].map((label,i)=>{const angle=i*Math.PI/4;return <text key={label} x={160+Math.sin(angle)*112} y={160-Math.cos(angle)*112} textAnchor="middle" dominantBaseline="central" className={i===0?'dial-north':i%2===0?'dial-cardinal':'dial-intercardinal'}>{label}</text>;})}
            <path d="M160 64l-13 79 13-9 13 9Z" fill="#d3ac7b"/><path d="M160 256l-13-79 13 9 13-9Z" fill="#e9ede1" opacity=".5"/>
            <path d="M64 160l79-9-9 9 9 9Z M256 160l-79-9 9 9-9 9Z" fill="#e9ede1" opacity=".14"/>
          </g>
          <circle cx="160" cy="160" r="48" fill="#193c33" stroke="#d9c6a2" strokeOpacity=".35"/>
          <text x="160" y="155" textAnchor="middle" className="dial-degrees">{shown === null ? '—' : `${shown}°`}</text><text x="160" y="179" textAnchor="middle" className="dial-caption">{live ? 'EN DIRECTO' : shown !== null ? 'GUARDADA' : 'SIN LECTURA'}</text>
        </svg>
        <div className="compass-reading" aria-live="polite"><strong>{cardinal}</strong><span>Dirección de la pared superior</span></div>
      </div>
      <div className="compass-instructions"><h4>Una pared como referencia</h4><p>Elige la pared que dibujarás arriba del plano. No necesitas apuntar al norte de la casa.</p>
        <div className="compass-guide"><svg viewBox="0 0 240 150" role="img" aria-label="Apunta el borde superior del teléfono hacia la pared superior resaltada"><rect x="25" y="20" width="190" height="110" rx="4" fill="#f7f7ee" stroke="#a9b7a6" strokeWidth="2"/><path d="M25 20H215" stroke="#a56347" strokeWidth="6"/><path d="M120 62V35m-7 8 7-8 7 8" fill="none" stroke="#a56347" strokeWidth="3"/><rect x="103" y="72" width="34" height="48" rx="6" fill="#264e43"/><path d="M113 78h14" stroke="#edf0e5" strokeWidth="2"/><circle cx="120" cy="112" r="2" fill="#edf0e5"/></svg><span>Pared que dibujarás arriba</span></div>
        <ol className="compass-steps"><li><b>Apunta</b> el borde superior del teléfono hacia esa pared.</li><li><b>Mantenlo horizontal</b>, con la pantalla hacia arriba y lejos de imanes o metal.</li><li><b>Activa y guarda</b> cuando la lectura esté estable.</li></ol><p className="compass-purpose">La brújula orienta el plano. Las observaciones con péndulo o varillas se registran por separado.</p>
      </div>
    </div>
    <div className="compass-controls"><div className="space-actions"><button type="button" className="button secondary" onClick={active ? () => {generation.current++;setActive(false);setReading(null);setMessage('Brújula detenida.');} : start}>{active ? 'Detener brújula' : 'Activar brújula'}</button><button type="button" className="button primary" disabled={!active || reading === null} onClick={() => {if(reading !== null && Date.now()-last.current <= 3000)save(reading);}}>Guardar orientación</button></div>
    {message && <p className="compass-feedback" role="status">{message}</p>}
    <p className="detail-note">{room.heading === null ? 'Orientación desconocida.' : typeof room.heading === 'number' ? `Dirección guardada de la pared superior: ${room.heading}°.` : 'Orientación anterior del plano. Puedes volver a registrarla con la brújula.'}</p>
    <details><summary>Introducir grados manualmente</summary><label>Dirección de la pared superior · grados<input aria-label="Dirección manual de la pared" type="number" min="0" max="359" step="1" value={manual} onChange={e=>setManual(e.target.value)} placeholder="Ejemplo: 90" /></label><p className="detail-note">0° norte · 90° este · 180° sur · 270° oeste. Copia la brújula del teléfono mientras apuntas hacia la misma pared.</p><button type="button" className="button secondary" disabled={!validManual} onClick={()=>save(Number(manual))}>Guardar dirección manual</button></details>
    <button type="button" className="text-button compass-skip" onClick={() => {generation.current++;setActive(false);setReading(null);onChange({heading:null,north:0});setMessage('Puedes continuar con orientación desconocida.');}}>No conozco la orientación</button></div>
  </section>;
}
