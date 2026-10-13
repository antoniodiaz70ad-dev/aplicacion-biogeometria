import assert from 'node:assert/strict';
import handler from '../api/guide.js';
import { relevantCards, responsePayload, validRequest, verifiedAnswer } from '../server/guide-core.js';

const base = { route: 'spaces', step: 1, question: '¿Cómo preparo mi instrumento?', instrument: 'Vertical BioGeometry' };
assert(validRequest(base));
for (const patch of [{ step: -1 }, { step: 1.5 }, { question: '' }, { question: 'x'.repeat(1201) }, { instrument: 'inventado' }, { latitude: 20 }]) assert(!validRequest({ ...base, ...patch }));
const vertical = relevantCards('spaces', 'Vertical BioGeometry');
assert(vertical.some(c => c.id === 'vertical_preparation'));
assert(!vertical.some(c => c.id === 'horizontal_preparation'));
const rods = relevantCards('spaces', 'Varillas de cobre');
assert(rods.some(c => c.id === 'rod_accessory'));
assert(!rods.some(c => c.id === 'vertical_preparation'));
assert(!relevantCards('emitter', '').some(c => c.id === 'vertical_preparation'));
const result = { status: 'documented', answer: 'Consulta el procedimiento de tu modelo.', nextAction: 'Confirma el modelo.', missing: '', cardIds: ['vertical_preparation'] };
assert.equal(verifiedAnswer(result, vertical).citations[0].pages.join(','), '18,19');
assert.equal(verifiedAnswer({ ...result, cardIds: ['invented'] }, vertical), null);
assert.equal(verifiedAnswer({ ...result, cardIds: [] }, vertical), null);
assert.equal(verifiedAnswer({ ...result, cardIds: ['horizontal_preparation'] }, vertical), null);
const payload = responsePayload(base, vertical, 'test-model');
assert.equal(payload.store, false);
assert.equal(payload.text.format.strict, true);
assert(!Object.keys(JSON.parse(payload.input[0].content)).some(k => ['photo', 'latitude', 'longitude', 'notes', 'access'].includes(k)));

async function request(method, body, access = 'private-test-access', client = 'test') {
  const req = { method, body, headers: { 'x-guide-access': access, 'x-forwarded-for': client } };
  const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(n) { this.code = n; return this; }, json(v) { this.data = v; return this; } };
  await handler(req, res); return res;
}
const previousFetch = globalThis.fetch;
let calls = 0;
globalThis.fetch = async () => { calls++; throw Error('No request expected'); };
delete process.env.BIO_GUIDE_ENABLED;
assert.equal((await request('GET')).data.enabled, false);
assert.equal((await request('POST', base)).code, 503);
assert.equal(calls, 0);
process.env.BIO_GUIDE_ENABLED = 'true'; process.env.OPENAI_API_KEY = 'synthetic-test-credential'; process.env.BIO_GUIDE_TOKEN = 'private-test-access';
assert.equal((await request('POST', base, 'wrong')).code, 401);
assert.equal((await request('POST', { ...base, photo: 'forbidden' })).code, 400);
assert.equal(calls, 0);
globalThis.fetch = async (_url, options) => { calls++; assert.equal(JSON.parse(options.body).store, false); return { ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(result) }] }] }) }; };
const successful = await request('POST', base);
assert.equal(successful.code, 200); assert.equal(successful.data.citations[0].title, 'The BioGeometry Horizontal & Vertical Pendulum Set');
globalThis.fetch = async () => ({ ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ ...result, cardIds: ['fake'] }) }] }] }) });
assert.equal((await request('POST', base)).code, 502);
globalThis.fetch = async () => ({ ok: false, status: 429 });
assert.equal((await request('POST', base)).code, 429);
globalThis.fetch = previousFetch;
console.log('PASS: request boundaries, instrument filtering, verified citations, private access, privacy, disabled service and provider failure');
