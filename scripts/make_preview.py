"""Build an offline review copy after npm run build (Python standard library only)."""
import base64
import json
import mimetypes
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
html = (DIST / 'index.html').read_text()
assets = {}
for file in (ROOT / 'public').rglob('*'):
    if file.is_file() and file.suffix in {'.png', '.svg', '.webp'}:
        mime = mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
        assets['/' + file.relative_to(ROOT / 'public').as_posix()] = f'data:{mime};base64,' + base64.b64encode(file.read_bytes()).decode()
def inline_css(match):
    return '<style>' + (DIST / match[1].lstrip('/')).read_text() + '</style>'
def inline_js(match):
    js = (DIST / match[1].lstrip('/')).read_text().replace('</script', '<\\/script')
    return '<script type="module">' + js + '</script>'
html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', inline_css, html)
html = re.sub(r'<script[^>]*src="([^"]+)"[^>]*></script>', inline_js, html)
html = html.replace('href="/favicon.svg"', f'href="{assets["/favicon.svg"]}"')
before_head_end, after_head_end = html.rsplit('</head>', 1)
html = before_head_end + '<script>window.__BIO_ASSETS__=' + json.dumps(assets, separators=(',', ':')) + ';</script></head>' + after_head_end
(ROOT / 'vista-previa.html').write_text(html)
print('Vista autónoma creada:', (ROOT / 'vista-previa.html').stat().st_size, 'bytes')
