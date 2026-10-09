"""Check catalogue IDs, provenance and every shipped asset. Standard library only."""
import hashlib
import json
import struct
import xml.etree.ElementTree as ET
from pathlib import Path

root = Path(__file__).resolve().parents[1]
rows = json.loads((root / 'src/figures.json').read_text())
assert len(rows) == 246
assert len({r['id'] for r in rows}) == 246
assert sum(r['status'] == 'revisada' for r in rows) == 9
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
print('PASS: 246 PNG hashes and dimensions; 246 SVG paths/aspect ratios; 63 page assets; 9 reviewed IDs; catalogue consistency.')

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
print('PASS: 9 optional Bezier variants, hashes, aspect ratios and bounded contour fit.')
