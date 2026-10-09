"""Recover private source drawings, retain provenance and vectorize raster ink.

Usage: python scripts/recover_figures.py /absolute/path/to/originals
Requires PyMuPDF, OpenCV and NumPy. This script does not infer therapeutic uses.
"""
import csv
import hashlib
import json
import re
import shutil
import sys
from pathlib import Path

import cv2
import fitz
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
INPUT = Path(sys.argv[1])
PDF = INPUT / 'BIOGEOMETRY_SIGNATURES_(Ibrahim_Karim)_(Z-Library).pdf'
IMAGES = INPUT / 'segments/biogeometry_segments_all'
OUTPUT = ROOT / 'public/figures'
OUTPUT.mkdir(parents=True, exist_ok=True)
doc = fitz.open(PDF)

CURATED = {
    'page_89_seg_0': ('Mano · 1', 'Arms, Hands & Shoulders Hand 1'),
    'page_89_seg_1': ('Cuello y hombro · 1', 'Arms Hands & Shoulders Neck & Shoulder 1'),
    'page_89_seg_2': ('Mano · 2', 'Arms, Hands & Shoulders Hand 2'),
    'page_89_seg_3': ('Hombro · 2', 'Arms, Hands & Shoulders Shoulder 2'),
    'page_89_seg_4': ('Hombro · 1', 'Arms, Hands & Shoulders Shoulder 1'),
    'page_90_seg_0': ('Codo · 1', 'Arms, Hands & Shoulders Elbow 1'),
    'page_90_seg_1': ('Codo · 2', 'Arms, Hands & Shoulders Elbow 2'),
    'page_90_seg_2': ('Antebrazo · 1', 'Arms, Hands & Shoulders Lower Arm 1'),
    'page_90_seg_3': ('Artritis · 1', 'Arms, Hands & Shoulders Arthiritis 1'),
}


def ink(image):
    if image.ndim == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(image, 140, 255, cv2.THRESH_BINARY_INV)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    cleaned = np.zeros_like(mask)
    for label in range(1, count):
        if stats[label, cv2.CC_STAT_AREA] >= 6:
            cleaned[labels == label] = 255
    return cleaned


def fingerprint(image):
    mask = ink(image)
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    if count < 2:
        return np.zeros((160, 160), dtype=bool)
    mask = np.uint8(labels == (1 + np.argmax(stats[1:, cv2.CC_STAT_AREA]))) * 255
    y, x = np.where(mask > 0)
    cropped = mask[y.min():y.max() + 1, x.min():x.max() + 1]
    return cv2.resize(cropped, (160, 160), interpolation=cv2.INTER_NEAREST) > 0


def candidates(page):
    result = []
    for info in page.get_image_info(xrefs=True):
        if info['width'] < 150 or info['height'] < 150 or not info['xref']:
            continue
        raw = doc.extract_image(info['xref'])['image']
        image = cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_GRAYSCALE)
        result.append((info, fingerprint(image)))
    return result


def caption(page, bbox):
    center = (bbox[0] + bbox[2]) / 2
    lines = []
    for block in page.get_text('dict')['blocks']:
        if 'lines' not in block:
            continue
        for line in block['lines']:
            text = ''.join(span['text'] for span in line['spans']).strip()
            x0, y0, x1, y1 = line['bbox']
            if text and bbox[3] - 5 <= y0 <= bbox[3] + 70:
                dx = abs((x0 + x1) / 2 - center)
                if dx < 82:
                    lines.append((max(0, y0 - bbox[3]) + dx * .3, y0, text))
    if not lines:
        return ''
    first = min(lines)
    close = sorted([l for l in lines if l[1] <= first[1] + 17], key=lambda l: l[1])
    return re.sub(r'\s+', ' ', ' '.join(l[2] for l in close))


def category(title):
    low = title.lower()
    mappings = [
        ('Movimiento', ['arm', 'shoulder', 'hand', 'elbow', 'neck', 'joint', 'bone', 'leg', 'spine', 'muscle']),
        ('Corazón y circulación', ['heart', 'blood', 'circulation']),
        ('Respiración', ['lung', 'asthma', 'sinus', 'throat', 'respirat']),
        ('Digestión', ['digest', 'stomach', 'intestin', 'food', 'liver', 'gall', 'colon']),
        ('Percepción', ['eye', 'ear', 'brain', 'memory', 'concentrat']),
        ('Descanso', ['sleep', 'insomnia', 'fatigue', 'stress']),
        ('Otros títulos', ['endocrine', 'kidney', 'skin', 'immune']),
    ]
    for group, words in mappings:
        if any(word in low for word in words):
            return group
    return 'Por clasificar'


def vectorize(mask, path):
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    parts, arrays = [], []
    for contour in contours:
        if len(contour) < 3:
            continue
        points = cv2.approxPolyDP(contour, .15, True).reshape(-1, 2)
        arrays.append(points)
        parts.append('M' + ' L'.join(f'{x},{y}' for x, y in points) + ' Z')
    h, w = mask.shape
    # Filled contours reproduce the original line silhouette; no invented strokes.
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -14 {w+28} {h+28}" role="img"><title>Vectorización de recorte documental</title><path fill="currentColor" fill-rule="evenodd" d="{" ".join(parts)}"/></svg>'
    path.write_text(svg)
    raster = np.zeros_like(mask)
    cv2.fillPoly(raster, arrays, 255)
    a, b = mask > 0, raster > 0
    return round(float(np.logical_and(a, b).sum() / max(1, np.logical_or(a, b).sum())), 4)


records, page_cache = [], {}
files = sorted(IMAGES.glob('*.png'), key=lambda f: tuple(map(int, re.findall(r'\d+', f.name))))
for file in files:
    number, segment = map(int, re.findall(r'\d+', file.name))
    image = cv2.imread(str(file))
    if image is None:
        raise ValueError(f'Invalid image: {file.name}')
    source = fingerprint(image)
    page = doc[number - 1]
    options = page_cache.setdefault(number, candidates(page))
    scored = []
    for info, candidate in options:
        overlap = np.logical_and(source, candidate).sum() / max(1, np.logical_or(source, candidate).sum())
        scored.append((float(overlap), info))
    match, info = max(scored, key=lambda x: x[0]) if scored else (0, None)
    original_title = caption(page, info['bbox']) if info else ''
    curated = file.stem in CURATED
    if curated:
        title, original_title = CURATED[file.stem]
    else:
        title = original_title if original_title and match >= .7 else f'Recorte {number}.{segment + 1}'
    if number == 86:
        title, original_title = 'Tira eléctrica · ilustración', 'Electricity strip (illustration, not an individual BioSignature)'
    mask = ink(image)
    accuracy = vectorize(mask, OUTPUT / (file.stem + '.svg'))
    shutil.copy2(file, OUTPUT / file.name)
    records.append({
        'id': file.stem,
        'name': title,
        'originalTitle': original_title if curated or match >= .7 or number == 86 else '',
        'proposedTitle': original_title if not curated and match < .7 and number != 86 else '',
        'category': (category(original_title) if curated or match >= .7 else 'Por clasificar') if number != 86 else 'Instrumentos',
        'page': number,
        'segment': segment,
        'image': f'/figures/{file.name}',
        'vector': f'/figures/{file.stem}.svg',
        'width': image.shape[1],
        'height': image.shape[0],
        'status': 'revisada' if curated else 'por-revisar',
        'isSignature': number != 86,
        'sourceMatch': round(match, 4),
        'vectorFidelity': accuracy,
        'sourceSha256': hashlib.sha256(file.read_bytes()).hexdigest(),
        'sourceBook': 'BioGeometry Signatures · Ibrahim Karim',
        'sourceNote': 'Título documental; no constituye una indicación terapéutica. La correspondencia automática de los recortes pendientes requiere revisión editorial.',
    })

(ROOT / 'src/figures.json').write_text(json.dumps(records, ensure_ascii=False, indent=2))
(ROOT / 'public/catalogue.json').write_text(json.dumps(records, ensure_ascii=False, indent=2))
summary = {
    'sourcePdfSha256': hashlib.sha256(PDF.read_bytes()).hexdigest(),
    'sourcePdfPages': len(doc),
    'assets': len(records),
    'reviewedCaptions': sum(r['status'] == 'revisada' for r in records),
    'sourceMatchOver70pct': sum(r['sourceMatch'] >= .7 for r in records),
    'minimumVectorFidelity': min(r['vectorFidelity'] for r in records),
    'meanVectorFidelity': round(sum(r['vectorFidelity'] for r in records) / len(records), 4),
    'meaning': 'SourceMatch is pixel overlap after normalization, not clinical confidence. VectorFidelity is pixel overlap against the cleaned mask, not therapeutic validation.',
}
(ROOT / 'public/validation.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2))
print(json.dumps(summary, ensure_ascii=False, indent=2))
