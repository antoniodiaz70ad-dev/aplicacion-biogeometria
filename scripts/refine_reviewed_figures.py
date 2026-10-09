"""Make optional, conservative Bezier variants of the nine reviewed scans.

Requires numpy, scipy, OpenCV and PyMuPDF. Originals remain authoritative.
Each contour is fitted separately, with a bounded displacement. Raster checks
reject changed connected components/holes or excessive ink differences.
"""
import hashlib
import json
from pathlib import Path
import cv2
import fitz
import numpy as np
from scipy.interpolate import splprep, BSpline
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter1d

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/figures/refined'
OUT.mkdir(exist_ok=True)
rows = json.loads((ROOT / 'src/figures.json').read_text())
report = []


def clean(image):
    mask = np.uint8(image < 140) * 255
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    return np.uint8(np.isin(labels, [i for i in range(1, count) if stats[i, cv2.CC_STAT_AREA] >= 6])) * 255


def topology(mask):
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    components = holes = 0
    if hierarchy is not None:
        for i in range(len(contours)):
            if cv2.contourArea(contours[i]) < 16: continue  # under one source pixel at 4x
            depth, parent = 0, hierarchy[0, i, 3]
            while parent >= 0:
                depth += 1
                parent = hierarchy[0, parent, 3]
            if depth % 2: holes += 1
            else: components += 1
    return components, holes


def curve(contour):
    points = contour.reshape(-1, 2).astype(float)
    if len(points) < 12:
        return 'M' + ' L'.join(f'{x:.3f},{y:.3f}' for x, y in points) + ' Z', 0
    smoothed = gaussian_filter1d(points, sigma=2, axis=0, mode='wrap')
    delta = smoothed - points
    lengths = np.linalg.norm(delta, axis=1)
    smoothed = points + delta * np.minimum(1, .35 / np.maximum(lengths, 1e-9))[:, None]
    closed = np.vstack([smoothed, smoothed[0]])
    # Dense samples preserve arrows and corners; only subpixel changes allowed.
    smoothing = len(points) * .01
    for _ in range(9):
        (knots, coeffs, degree), _ = splprep(closed.T, s=smoothing, per=True, k=3)
        spline = BSpline(knots, np.array(coeffs).T, degree)
        samples = spline(np.linspace(0, 1, len(points) * 5))
        distance = max(cKDTree(points).query(samples)[0].max(), cKDTree(samples).query(points)[0].max())
        if distance <= 1.0: break
        smoothing *= .5
    if distance > 1.0:
        raise ValueError('Contour exceeded permitted subpixel displacement')
    derivative = spline.derivative()
    breaks = np.unique(knots[(knots >= 0) & (knots <= 1)])
    start = spline(0)
    parts = [f'M{start[0]:.3f},{start[1]:.3f}']
    for a, b in zip(breaks[:-1], breaks[1:]):
        p0, p3 = spline(a), spline(b)
        p1 = p0 + derivative(a) * (b-a)/3
        p2 = p3 - derivative(b) * (b-a)/3
        parts.append('C' + ' '.join(f'{p[0]:.3f},{p[1]:.3f}' for p in (p1, p2, p3)))
    return ' '.join(parts) + ' Z', float(distance)


for row in rows:
    if row['status'] != 'revisada': continue
    source = ROOT / 'public' / row['image'].lstrip('/')
    original = cv2.imread(str(source), cv2.IMREAD_GRAYSCALE)
    mask = clean(original)
    contours, _ = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    paths, deviations = zip(*(curve(c) for c in contours if len(c) >= 3))
    w, h = row['width'], row['height']
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -14 {w+28} {h+28}" role="img"><title>{row["name"]} · curvas Bézier · variante de revisión</title><path fill="currentColor" fill-rule="evenodd" d="{" ".join(paths)}"/></svg>'
    # Render the actual SVG using MuPDF, at four times its source pixel scale.
    def render(text):
        rendered_svg = text.replace('<svg ', f'<svg width="{w+28}px" height="{h+28}px" ').replace('currentColor', '#000')
        svg_doc = fitz.open(stream=rendered_svg.encode(), filetype='svg')
        pdf = fitz.open(stream=svg_doc.convert_to_pdf(), filetype='pdf')
        pix = pdf[0].get_pixmap(matrix=fitz.Matrix(4, 4), alpha=False)
        pixels = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)
        raster = cv2.cvtColor(pixels, cv2.COLOR_RGB2GRAY)[56:56+4*h, 56:56+4*w]
        return np.uint8(raster < 140) * 255
    originals = []
    for contour in contours:
        if len(contour) < 3: continue
        pts = cv2.approxPolyDP(contour, .15, True).reshape(-1, 2)
        originals.append('M' + ' L'.join(f'{x},{y}' for x, y in pts) + ' Z')
    baseline = render((ROOT / 'public' / row['vector'].lstrip('/')).read_text())
    accepted = list(originals)
    count_smoothed = 0
    for i, candidate in enumerate(paths):
        proposed = accepted.copy()
        proposed[i] = candidate
        candidate_svg = svg.replace(' '.join(paths), ' '.join(proposed))
        if topology(render(candidate_svg)) == topology(baseline):
            accepted = proposed
            count_smoothed += 1
    svg = svg.replace(' '.join(paths), ' '.join(accepted))
    smooth_mask = render(svg)
    union = np.logical_or(baseline, smooth_mask).sum()
    overlap = float(np.logical_and(baseline, smooth_mask).sum() / union)
    assert overlap >= .85, (row['id'], overlap)
    assert topology(baseline) == topology(smooth_mask), (row['id'], 'changed topology', topology(baseline), topology(smooth_mask))
    dest = OUT / f"{row['id']}.svg"
    dest.write_text(svg)
    row['refinedVector'] = '/figures/refined/' + dest.name
    row['refinementStatus'] = 'variante de revisión'
    report.append({'id': row['id'], 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'refinedSha256': hashlib.sha256(dest.read_bytes()).hexdigest(), 'inkOverlapVsPreviousVector': round(overlap, 5), 'maximumContourDisplacementPixels': round(max(deviations), 4), 'componentsAndHolesAboveOneSourcePixel': topology(baseline), 'contoursSmoothed': count_smoothed, 'contoursRetained': len(paths) - count_smoothed, 'comparisonRenderScale': 4, 'method': 'bounded local Gaussian smoothing, periodic cubic Bezier, separate contours, topology guard', 'status': 'technical checks passed; original retained'})
    print(row['id'], 'overlap', round(overlap, 4), 'displacement', round(max(deviations), 3), 'contours', count_smoothed, '/', len(paths))
(ROOT / 'src/figures.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2))
(ROOT / 'public/catalogue.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2))
(ROOT / 'docs/revision-curvas.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
