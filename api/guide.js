import { createHash, timingSafeEqual } from 'node:crypto';
import { relevantCards, responsePayload, validRequest, verifiedAnswer } from '../server/guide-core.js';

export const config = { maxDuration: 60 };
const counters = new Map();
const digest = value => createHash('sha256').update(value).digest();
const configured = () => process.env.BIO_GUIDE_ENABLED === 'true' && !!process.env.OPENAI_API_KEY && !!process.env.BIO_GUIDE_TOKEN;
const json = (res, status, data) => res.status(status).json(data);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'GET') return json(res, 200, { enabled: configured(), reviewedCards: 13, requiresAccessCode: true });
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return json(res, 405, { error: 'Método no permitido.' }); }
  if (!configured()) return json(res, 503, { error: 'La conversación AI está pendiente de activación. Puedes consultar la guía documental.' });
  const supplied = typeof req.headers['x-guide-access'] === 'string' ? req.headers['x-guide-access'] : '';
  if (!supplied || supplied.length > 256 || !timingSafeEqual(digest(supplied), digest(process.env.BIO_GUIDE_TOKEN))) return json(res, 401, { error: 'El código de acceso no es correcto.' });
  if (Number(req.headers['content-length'] || 0) > 10000) return json(res, 413, { error: 'La consulta es demasiado extensa.' });
  let body;
  try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { return json(res, 400, { error: 'Consulta inválida.' }); }
  if (!validRequest(body)) return json(res, 400, { error: 'Revisa la pregunta, el módulo y el instrumento.' });
  // A secondary, per-instance throttle. The access code is the primary access boundary.
  const now = Date.now();
  for (const [key, value] of counters) if (value.until <= now) counters.delete(key);
  const client = digest(String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')).toString('hex');
  const count = counters.get(client) || { total: 0, until: now + 15 * 60 * 1000 };
  if (count.total >= 12 || counters.size > 1000) return json(res, 429, { error: 'Límite temporal de consultas. Intenta más tarde.' });
  count.total++; counters.set(client, count);
  const cards = relevantCards(body.route, body.instrument);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(responsePayload(body, cards, process.env.BIO_GUIDE_MODEL || 'gpt-6-luna'))
    });
    if (!upstream.ok) return json(res, upstream.status === 429 ? 429 : 502, { error: upstream.status === 429 ? 'OpenAI no permite completar esta consulta ahora. Revisa cuota y saldo si persiste.' : 'No se pudo completar la conversación AI. La guía documental sigue disponible.' });
    const data = await upstream.json();
    const text = (data.output || []).filter(item => item.type === 'message').flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('');
    let parsed;
    try { parsed = JSON.parse(text); } catch { return json(res, 502, { error: 'La respuesta no pudo verificarse. Consulta las fichas documentadas.' }); }
    const result = verifiedAnswer(parsed, cards);
    if (!result || data.status !== 'completed') return json(res, 502, { error: 'La respuesta no tiene referencias verificables. Consulta las fichas documentadas.' });
    return json(res, 200, result);
  } catch { return json(res, 502, { error: 'La conversación no respondió a tiempo. Puedes consultar la guía documental.' }); }
  finally { clearTimeout(timeout); }
}
