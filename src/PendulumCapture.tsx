import { useEffect, useRef, useState } from 'react';
import { Camera, Play, Square } from 'lucide-react';
import { findMarker, summarizeMotion, type Motion, type TrackPoint } from './pendulum';

export default function PendulumCapture({ onCapture }: { onCapture: (motion: Motion) => void }) {
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null), stream = useRef<MediaStream | null>(null);
  const mounted = useRef(true), target = useRef<number[] | null>(null), recordStart = useRef<number | null>(null), samples = useRef<TrackPoint[]>([]);
  const callback = useRef(onCapture); callback.current = onCapture;
  const [active, setActive] = useState(false), [busy, setBusy] = useState(false), [calibrated, setCalibrated] = useState(false), [recording, setRecording] = useState(false), [seconds, setSeconds] = useState(0), [status, setStatus] = useState('Cámara apagada.');
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; stream.current?.getTracks().forEach(t => t.stop()); }; }, []);
  const finish = () => {
    recordStart.current = null; setRecording(false);
    const motion = summarizeMotion(samples.current);
    if (motion) { callback.current(motion); setStatus(`Registro listo: ${motion.samples.length} posiciones válidas. Revisa la trayectoria antes de guardar.`); }
    else setStatus('No hubo suficientes posiciones válidas. Mejora la luz y selecciona un marcador de color distinto al fondo.');
  };
  const finishRef = useRef(finish); finishRef.current = finish;
  useEffect(() => {
    if (!active) return;
    let frame = 0, last = 0;
    const loop = (now: number) => {
      const v = video.current, c = canvas.current, ctx = c?.getContext('2d', { willReadFrequently: true });
      if (v && c && ctx && v.readyState >= 2 && now - last >= 100) {
        last = now; ctx.drawImage(v, 0, 0, 320, 240);
        const point = target.current ? findMarker(ctx.getImageData(0, 0, 320, 240).data, 320, 240, target.current) : null;
        if (point) { ctx.beginPath(); ctx.arc(point.x, point.y, 9, 0, Math.PI * 2); ctx.strokeStyle = '#ea5069'; ctx.lineWidth = 2; ctx.stroke(); }
        if (recordStart.current !== null) {
          const elapsed = now - recordStart.current;
          setSeconds(Math.min(20, Math.floor(elapsed / 1000)));
          if (point && elapsed <= 20_000) samples.current.push({ t: elapsed, x: point.x, y: point.y });
          if (elapsed >= 20_000) finishRef.current();
        }
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop); return () => cancelAnimationFrame(frame);
  }, [active]);
  const activate = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setStatus('La cámara requiere HTTPS o localhost y un navegador compatible.'); return; }
    setBusy(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 640, height: 480 }, audio: false });
      if (!mounted.current) { media.getTracks().forEach(t => t.stop()); return; }
      stream.current = media;
      if (video.current) { video.current.srcObject = media; await video.current.play(); }
      if (!mounted.current) { media.getTracks().forEach(t => t.stop()); return; }
      setActive(true); setStatus('Toca el marcador de color en la imagen. Usa fondo uniforme, luz estable y una cámara fija.');
    } catch { stream.current?.getTracks().forEach(t => t.stop()); if (mounted.current) setStatus('No se pudo abrir la cámara. Revisa el permiso del navegador o continúa con el registro manual.'); }
    finally { if (mounted.current) setBusy(false); }
  };
  const stop = () => { recordStart.current = null; setRecording(false); stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; if (video.current) video.current.srcObject = null; setActive(false); target.current = null; setCalibrated(false); setStatus('Cámara apagada.'); };
  const pick = (x: number, y: number) => {
    if (!active || recording) return;
    const ctx = canvas.current?.getContext('2d'); if (!ctx || !video.current) return;
    ctx.drawImage(video.current, 0, 0, 320, 240);
    target.current = [...ctx.getImageData(Math.max(0, Math.min(319, Math.round(x))), Math.max(0, Math.min(239, Math.round(y))), 1, 1).data].slice(0, 3);
    setCalibrated(true); setStatus('Color seleccionado. Comprueba que el círculo rosa siga el péndulo, sin seguir la mano o el fondo.');
  };
  return <section className="space-card camera-card"><p className="eyebrow">REGISTRO VISUAL OPCIONAL</p><h2>Movimiento del péndulo.</h2><p>Coloca un pequeño marcador de color en el péndulo. La cámara registra su movimiento en píxeles; no mide BG3 ni exposición electromagnética. El video se procesa en este navegador y no se guarda ni se envía.</p><video ref={video} muted playsInline hidden /><canvas ref={canvas} width={320} height={240} aria-label="Vista de cámara: toca el marcador de color" onClick={e => { const r = e.currentTarget.getBoundingClientRect(); pick((e.clientX - r.left) * 320 / r.width, (e.clientY - r.top) * 240 / r.height); }} /><p className="detail-note">También puedes seleccionar el color en el centro con este botón, después de centrar el marcador.</p><div className="space-actions"><button className="button secondary" disabled={active || busy} onClick={activate}><Camera size={16} />{busy ? 'Abriendo…' : 'Activar cámara'}</button><button className="button secondary" disabled={!active || recording} onClick={() => pick(160, 120)}>Elegir color central</button>{recording ? <button className="button primary" onClick={finish}><Square size={16} />Terminar · {seconds}s</button> : <button className="button primary" disabled={!active || !calibrated} onClick={() => { samples.current = []; recordStart.current = performance.now(); setSeconds(0); setRecording(true); setStatus('Registrando durante un máximo de 20 segundos…'); }}><Play size={16} />Registrar 20 s</button>}<button className="text-button" disabled={!active} onClick={stop}>Apagar cámara</button></div><p role="status" className="camera-status">{status}</p></section>;
}
