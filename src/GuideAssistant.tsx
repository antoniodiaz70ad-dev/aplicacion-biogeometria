import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, BookOpen, MessageCircle, Send } from 'lucide-react';
import knowledge from '../docs/guide-knowledge.json';
import './guide.css';

type Citation = { id: string; title: string; pages: number[]; url: string };
type Answer = { status: 'documented' | 'limited'; answer: string; nextAction: string; missing: string; citations: Citation[] };
const spaceSteps = [
  { name: 'Define tu lugar', action: 'Pon nombre a la habitación y mide ancho y fondo. Para orientar el plano, elige la pared que dibujarás arriba y apunta hacia ella el borde superior del teléfono.', record: 'Dimensiones y orientación. Si no conoces la orientación, puedes continuar indicándolo.', cards: ['record_fields'] },
  { name: 'Prepara tu instrumento', action: 'Elige el instrumento real y confirma su modelo. Consulta su ficha y las figuras del manual antes de ajustar los diales.', record: 'Modelo, accesorios, ajustes, referencia y comprobación. Una longitud de otro modelo no sirve como instrucción universal.', cards: ['vertical_preparation', 'horizontal_preparation', 'instrument_difference', 'rod_accessory'] },
  { name: 'Marca un punto', action: 'Toca el plano en el lugar que quieres observar. Ponle un nombre reconocible y comprueba su posición.', record: 'Punto y recorrido realizado. La marca representa tu observación; no una detección automática del mapa.', cards: ['record_fields', 'grid_layout'] },
  { name: 'Registra lo observado', action: 'Anota primero el movimiento y después tu interpretación. Conserva las diferencias entre repeticiones.', record: 'Movimiento, condiciones y dificultades. Las tres repeticiones son un control de registro propuesto por la plataforma.', cards: ['instrument_difference', 'rod_accessory'] },
  { name: 'Revisa antes de guardar', action: 'Comprueba el punto, el instrumento y las condiciones. Si la comprobación no fue consistente, conserva la interpretación como indeterminada.', record: 'No elijas una figura como cura a partir de un giro. Documenta por separado cualquier intervención que decidas estudiar.', cards: ['instrument_difference', 'temporary_clearing'] },
  { name: 'Continúa tu revisión', action: 'Exporta el espacio como respaldo. Puedes registrar otro punto o documentar una intervención y una observación posterior.', record: 'Compara el mismo punto, instrumento y condiciones. Una diferencia observada no establece su causa.', cards: ['record_fields', 'temporary_clearing'] }
];
const emitterSteps = [
  { name: 'Elige tus referencias', action: 'Empieza con una plantilla. Añade las firmas que quieras estudiar desde el catálogo; abre su página documental si tienes dudas sobre el dibujo.', record: 'Las firmas iniciales son ejemplos editables. La elección es tuya y no constituye una prescripción.', cards: ['figure_placement', 'tracing'] },
  { name: 'Personaliza la composición', action: 'Abre Foto → Añadir foto. Ajusta el encuadre central. Añade firmas con un toque en el catálogo y arrástralas en el lienzo; selecciona una y pulsa Retirar figura para quitarla.', record: 'Conserva espacio visual y evita solapamientos. Las figuras impresas en el fondo se sustituyen cambiando el fondo.', cards: ['photo_center', 'figure_placement'] },
  { name: 'Guarda y comprueba', action: 'Guarda una versión y abre la vista de impresión. Revisa que la foto, los márgenes y las firmas se vean completos.', record: 'La regla de 100 mm comprueba la impresión del editor. No certifica una dimensión terapéutica ni la escala nativa del emisor original.', cards: ['figure_placement'] },
  { name: 'Descarga y documenta', action: 'Descarga la composición y comprueba la regla si la imprimes. Consulta las instrucciones de mantenimiento de la fuente que estás usando.', record: 'El PDF aportado propone retirar el polvo diariamente. Registra tu uso y revisión como observaciones personales.', cards: ['daily_maintenance'] }
];

function validAnswer(value: unknown): value is Answer {
  if (!value || typeof value !== 'object') return false;
  const v = value as Answer;
  return ['documented', 'limited'].includes(v.status) && [v.answer, v.nextAction, v.missing].every(x => typeof x === 'string' && x.length <= 4000)
    && Array.isArray(v.citations) && v.citations.length <= 20 && v.citations.every(c => typeof c.id === 'string' && typeof c.title === 'string' && typeof c.url === 'string' && Array.isArray(c.pages) && c.pages.every(n => Number.isInteger(n) && n > 0));
}

export default function GuideAssistant({ route, step, instrument = '' }: { route: 'spaces' | 'emitter'; step: number; instrument?: string }) {
  const id = useId();
  const stage = (route === 'spaces' ? spaceSteps : emitterSteps)[Math.min(step, route === 'spaces' ? 5 : 3)];
  const cards = knowledge.cards.filter(card => stage.cards.includes(card.id) && (card.instrument_scope === 'all' || card.instrument_scope === instrument));
  const [enabled, setEnabled] = useState(false), [checking, setChecking] = useState(true);
  const [question, setQuestion] = useState(''), [access, setAccess] = useState(''), [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const pending = useRef<AbortController | null>(null), generation = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/guide', { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => setEnabled(data?.enabled === true)).catch(() => {}).finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    generation.current++; pending.current?.abort(); setBusy(false); setAnswer(null); setError('');
    return () => { generation.current++; pending.current?.abort(); };
  }, [route, step, instrument]);
  async function ask(e: React.FormEvent) {
    e.preventDefault(); if (busy || !question.trim() || !access.trim() || !enabled) return;
    const current = ++generation.current, controller = new AbortController(); pending.current = controller;
    setBusy(true); setError(''); setAnswer(null);
    const timer = window.setTimeout(() => controller.abort(), 55000);
    try {
      const response = await fetch('/api/guide', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json', 'X-Guide-Access': access }, body: JSON.stringify({ route, step, instrument, question: question.trim() }) });
      const data = await response.json();
      if (current !== generation.current) return;
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo completar la consulta.');
      if (!validAnswer(data)) throw new Error('La respuesta no pudo verificarse.');
      setAnswer(data);
    } catch (ex) {
      if (current === generation.current) setError(controller.signal.aborted ? 'La consulta tardó demasiado. Puedes volver a intentarlo.' : ex instanceof Error ? ex.message : 'No se pudo conectar.');
    } finally { window.clearTimeout(timer); if (current === generation.current) setBusy(false); }
  }
  return <section className="guide-assistant" aria-label="Guía de la etapa actual">
    <header><BookOpen size={21} /><div><small>GUÍA DOCUMENTADA · PASO {Math.min(step + 1, route === 'spaces' ? 6 : 4)}</small><h3>{stage.name}</h3></div><span>Referencias revisadas</span></header>
    <div className="guide-next"><strong>Qué hacer ahora</strong><p>{stage.action}</p><strong>Qué registrar o comprobar</strong><p>{stage.record}</p></div>
    <details className="guide-evidence"><summary>Por qué · consultar las fuentes ({cards.length})</summary>{cards.length ? cards.map(card => <article key={card.id}><h4>{card.question}</h4><p>{card.answer}</p>{card.citations.map((ref, i) => { const source = knowledge.sources.find(s => s.id === ref.source_id); return <p className="guide-citation" key={i}>{source?.title} · páginas PDF {ref.pdf_pages.join(', ')}{source && 'url' in source && typeof source.url === 'string' && <a href={source.url} target="_blank" rel="noreferrer">Consultar manual <ArrowUpRight size={12} /></a>}</p>; })}</article>) : <p>Este paso organiza el registro de la plataforma. Confirma el modelo del instrumento para consultar su procedimiento específico.</p>}<p className="guide-note">Las referencias documentan lo que dice la fuente. No acreditan efectos terapéuticos ni una medición física de BG3.</p></details>
    <details className="guide-chat"><summary><MessageCircle size={17} />Preguntar a la guía AI<span>{checking ? 'Comprobando conexión' : enabled ? 'Disponible con acceso privado' : 'Pendiente de activación'}</span></summary>
      {enabled ? <><p>Al consultar, OpenAI recibe tu pregunta, el módulo, la etapa, el tipo de instrumento y las fichas documentales revisadas. Evita incluir datos personales. El código se conserva sólo mientras esta vista está abierta.</p><form onSubmit={ask}><label htmlFor={`${id}-access`}>Código de acceso a la guía<input id={`${id}-access`} type="password" autoComplete="off" maxLength={256} value={access} onChange={e => setAccess(e.target.value)} /></label><label htmlFor={`${id}-question`}>Tu pregunta sobre este paso<textarea id={`${id}-question`} maxLength={1200} rows={3} value={question} onChange={e => setQuestion(e.target.value)} placeholder="¿Qué me falta para completar esta etapa?" /></label><button className="button primary" type="submit" disabled={busy || !question.trim() || !access.trim()}><Send size={15} />{busy ? 'Consultando…' : 'Consultar AI'}</button></form></> : <p>La conversación AI requiere activar el servicio y su acceso privado. Puedes usar ahora las instrucciones y referencias de esta etapa.</p>}
      {error && <p role="alert" className="guide-error">{error}</p>}
      {busy && <p role="status">La guía está consultando las fichas revisadas…</p>}
      {answer && <div className="guide-answer" aria-live="polite"><small>{answer.status === 'limited' ? 'RESPALDO LIMITADO' : 'RESPUESTA CON REFERENCIAS'}</small><p>{answer.answer}</p><strong>Siguiente acción</strong><p>{answer.nextAction}</p>{answer.missing && <><strong>Qué falta confirmar</strong><p>{answer.missing}</p></>}{answer.citations.map(c => <p className="guide-citation" key={c.id}>{c.title} · páginas PDF {c.pages.join(', ')}</p>)}</div>}
    </details>
  </section>;
}
