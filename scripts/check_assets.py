"""Check catalogue IDs, provenance and every shipped asset. Standard library only."""
import subprocess
import hashlib
import json
import struct
import xml.etree.ElementTree as ET
from pathlib import Path

root = Path(__file__).resolve().parents[1]
subprocess.run(['node',str(root / 'scripts/materialize-reviewed-assets.mjs')],check=True)
rows = json.loads((root / 'src/figures.json').read_text())
assert len(rows) >= 246
assert len({r['id'] for r in rows}) == len(rows)
assert all(r['status'] == 'revisada' for r in rows if r['isSignature']) if any('sourceCell' in r for r in rows) else True
assert sum(not r['isSignature'] for r in rows) == 1
assert json.loads((root / 'public/catalogue.json').read_text()) == rows
for row in rows:
    png = root / 'public' / row['image'].lstrip('/')
    svg = root / 'public' / row['vector'].lstrip('/')
    raw = png.read_bytes()
    assert raw[:8] == b'\x89PNG\r\n\x1a\n', row['id']
    assert struct.unpack('>II', raw[16:24]) == (row['width'], row['height']), row['id']
    assert hashlib.sha256(raw).hexdigest() == row['sourceSha256'], row['id']
    tree = ET.fromstring(svg.read_text())
    assert tree.tag == '{http://www.w3.org/2000/svg}svg'
    assert tree.find('{http://www.w3.org/2000/svg}path').get('d'), row['id']
    assert list(map(float, tree.get('viewBox').split())) == [-14, -14, row['width'] + 28, row['height'] + 28]
    webp = (root / 'public/source-pages' / f"{row['page']}.webp").read_bytes()
    assert webp[:4] == b'RIFF' and webp[8:12] == b'WEBP'
    assert row['sourceBook'] == 'BioGeometry Signatures · Ibrahim Karim'
print(f"PASS: {len(rows)} PNG hashes/dimensions, SVG paths/proportions and source pages; catalogue consistency.")

refinement = json.loads((root / 'docs/revision-curvas.json').read_text())
assert len(refinement) == 9
for row in rows:
    if 'refinedVector' not in row: continue
    report = next(r for r in refinement if r['id'] == row['id'])
    raw = (root / 'public' / row['refinedVector'].lstrip('/')).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == report['refinedSha256']
    assert report['inkOverlapVsPreviousVector'] >= .85
    assert report['maximumContourDisplacementPixels'] <= 1.0
    tree = ET.fromstring(raw)
    assert tree.get('viewBox') == f"-14 -14 {row['width'] + 28} {row['height'] + 28}"
    assert 'C' in tree.find('{http://www.w3.org/2000/svg}path').get('d')
print('PASS: optional refinements checked when present; full-page source references take precedence.')

if any('sourceCell' in r for r in rows):
    audited=[r for r in rows if r['isSignature']]
    assert len(audited)==262
    assert len(set(r['sourceCell'] for r in audited))==262
    assert all(r['originalTitle'] and r['sourcePdfSha256']=='657c331a226d25f24becbf06e34a406dcb53f3ae935f6fac986716233260d5b3' for r in audited)
    assert all(r['sourceBBox'][2]>r['sourceBBox'][0] and r['sourceBBox'][3]>r['sourceBBox'][1] for r in audited)
    assert all(r['traceStatus'] in ['marca-de-inicio-en-fuente','varios-inicios-numerados'] for r in audited)
    print('PASS: 262 unique source cells, complete captions, PDF identity and documented start markers.')
