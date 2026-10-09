export type TrackPoint = { t: number; x: number; y: number };
export type Motion = { samples: TrackPoint[]; duration: number; spanX: number; spanY: number; direction: string; turns: number };

// Track a single, distinct colored marker. Ambiguous multiple blobs are rejected.
export function findMarker(data: Uint8ClampedArray, width: number, height: number, color: number[]) {
  const step = 2, w = Math.ceil(width / step), h = Math.ceil(height / step), matched = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((y * step) * width + x * step) * 4;
    const distance = (data[i] - color[0]) ** 2 + (data[i + 1] - color[1]) ** 2 + (data[i + 2] - color[2]) ** 2;
    if (distance < 55 ** 2) matched[y * w + x] = 1;
  }
  const blobs: { count: number; x: number; y: number }[] = [];
  for (let i = 0; i < matched.length; i++) {
    if (!matched[i]) continue;
    const queue = [i]; matched[i] = 0; let count = 0, sx = 0, sy = 0;
    for (let q = 0; q < queue.length; q++) {
      const p = queue[q], x = p % w, y = Math.floor(p / w); count++; sx += x; sy += y;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const next = ny * w + nx; if (matched[next]) { matched[next] = 0; queue.push(next); }
      }
    }
    if (count >= 6) blobs.push({ count, x: sx * step / count, y: sy * step / count });
  }
  blobs.sort((a, b) => b.count - a.count);
  const best = blobs[0];
  if (!best || best.count > 2500 || (blobs[1] && blobs[1].count > best.count * .6)) return null;
  return { x: best.x, y: best.y };
}

export function summarizeMotion(samples: TrackPoint[]): Motion | null {
  if (samples.length < 10) return null;
  const xs = samples.map(p => p.x), ys = samples.map(p => p.y);
  const spanX = Math.max(...xs) - Math.min(...xs), spanY = Math.max(...ys) - Math.min(...ys);
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length, cy = ys.reduce((a, b) => a + b, 0) / ys.length;
  let angle = 0;
  for (let i = 1; i < samples.length; i++) {
    const p = samples[i - 1], n = samples[i]; if (n.t - p.t > 350) continue;
    if (Math.hypot(p.x - cx, p.y - cy) < 3 || Math.hypot(n.x - cx, n.y - cy) < 3) continue;
    let delta = Math.atan2(n.y - cy, n.x - cx) - Math.atan2(p.y - cy, p.x - cx);
    if (delta > Math.PI) delta -= Math.PI * 2; if (delta < -Math.PI) delta += Math.PI * 2;
    angle += delta;
  }
  const turns = angle / (Math.PI * 2), circular = Math.min(spanX, spanY) / Math.max(spanX, spanY, 1) > .4;
  const direction = circular && Math.abs(turns) > .75 ? (turns > 0 ? 'Horario en pantalla' : 'Antihorario en pantalla') : 'Sin giro claro / oscilación';
  return { samples, duration: (samples.at(-1)!.t - samples[0].t) / 1000, spanX, spanY, turns, direction };
}
