"""Render page references. Usage: python scripts/render_source_pages.py source.pdf
Requires PyMuPDF and Pillow. The whole source book is not included in the project.
"""
import json
import sys
from pathlib import Path
import fitz
from PIL import Image

root = Path(__file__).resolve().parents[1]
doc = fitz.open(sys.argv[1])
out = root / 'public/source-pages'
out.mkdir(parents=True, exist_ok=True)
for number in sorted({f['page'] for f in json.loads((root / 'src/figures.json').read_text())}):
    pix = doc[number - 1].get_pixmap(matrix=fitz.Matrix(1.8, 1.8), alpha=False)
    Image.frombytes('RGB', [pix.width, pix.height], pix.samples).save(out / f'{number}.webp', quality=83)
print('Páginas de referencia renderizadas.')
