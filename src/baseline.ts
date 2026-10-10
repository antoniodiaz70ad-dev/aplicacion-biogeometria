import { validHeading } from './RoomCompass';
import { validLocation, type Location } from './SpaceLocation';
export const instruments = ['BG16', 'Horizontal BioGeometry', 'Vertical BioGeometry', 'Neutro / IKUP', 'Varillas de cobre'] as const;
export const movements = ['Horario', 'Antihorario', 'Oscilación', 'Inmóvil', 'Indeterminado'] as const;
export const rodMovements = ['Cruce', 'Apertura', 'Sin cambio', 'Indeterminado'] as const;
export const interpretations = ['Observado', 'No detectado en esta prueba', 'Indeterminado', 'Pendiente de repetición'] as const;
export type Trial = { movement: string; interpretation: string; note: string; route?: string };
export type Preparation = { operator: string; instrument: string; model: string; length: string; settings: string; reference: string; control: string; check: string; conditions: string; installed: string; quality: string };
export type Baseline = { id: string; date: string; protocol: 'lugares-v1'; preparation: Preparation; point: { id: string; name: string; x: number; y: number }; room: { name: string; width: number; height: number; north: number; heading?: number | null; location?: Location }; trials: Trial[] };
const bounded = (v: unknown, n = 2000): v is string => typeof v === 'string' && v.length <= n;
const finite = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
export function validBaselines(value: unknown, pointIds: string[]): value is Baseline[] {
  if (!Array.isArray(value) || value.length > 1000 || new Set(value.map(b => b?.id)).size !== value.length) return false;
  return value.every(b => {
    if (!b || !bounded(b.id, 100) || !b.id || !bounded(b.date, 100) || Number.isNaN(Date.parse(b.date)) || b.protocol !== 'lugares-v1') return false;
    const p = b.preparation;
    if (!p || !['operator','instrument','model','length','settings','reference','control','check','conditions','installed','quality'].every(k => bounded(p[k]))) return false;
    if (![p.operator,p.model,p.settings,p.reference,p.control,p.conditions,p.installed].every(v => v.trim()) || !instruments.includes(p.instrument) || !['Consistente','Inconsistente','No realizada'].includes(p.check) || !['BG3','Verde negativo vertical','Respuesta personal', 'Respuesta de varillas'].includes(p.quality)) return false;
    if (p.length !== '' && (!/^\d+(\.\d+)?$/.test(p.length) || !finite(Number(p.length), .1, 200))) return false;
    if (!['BG16', 'Varillas de cobre'].includes(p.instrument) && !p.length) return false;
    if (p.instrument === 'Varillas de cobre' && (p.quality !== 'Respuesta de varillas' || p.length !== '')) return false;
    if (p.instrument === 'BG16' && p.quality !== 'BG3' || p.instrument === 'Neutro / IKUP' && p.quality !== 'Respuesta personal' || p.instrument === 'Vertical BioGeometry' && p.quality !== 'Verde negativo vertical' || p.instrument === 'Horizontal BioGeometry' && p.quality !== 'BG3') return false;
    if (!b.point || !pointIds.includes(b.point.id) || !bounded(b.point.name, 100) || !b.point.name.trim() || !finite(b.point.x, 0, 100) || !finite(b.point.y, 0, 100)) return false;
    if (!b.room || !bounded(b.room.name, 100) || !b.room.name.trim() || !finite(b.room.width, 1, 30) || !finite(b.room.height, 1, 30) || !finite(b.room.north, 0, 359) || !validHeading(b.room.heading)) return false;
    if (b.room.location !== undefined && !validLocation(b.room.location)) return false;
    return Array.isArray(b.trials) && b.trials.length === 3 && b.trials.every((t: Trial) => t && (p.instrument === 'Varillas de cobre' ? rodMovements.includes(t.movement as typeof rodMovements[number]) && bounded(t.route, 200) && !!t.route.trim() : movements.includes(t.movement as typeof movements[number])) && interpretations.includes(t.interpretation as typeof interpretations[number]) && bounded(t.note) && (t.route === undefined || bounded(t.route, 200)) && (p.check === 'Consistente' || t.interpretation === 'Indeterminado'));
  });
}
