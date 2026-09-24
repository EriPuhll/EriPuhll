"""Genera Perezoso.html: la app entera en un solo archivo (CSS, JS e ícono adentro).

Uso:  python3 tools/build-standalone.py
"""
import base64
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')


def inline_css(m):
    css = (root / m.group(1)).read_text(encoding='utf-8')
    return f'<style>\n{css}\n</style>'


def inline_js(m):
    js = (root / m.group(1)).read_text(encoding='utf-8').replace('</script', '<\\/script')
    return f'<script>\n{js}\n</script>'


html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)
html = re.sub(r'<script src="(js/[^"]+)"(?: defer)?></script>', inline_js, html)
icon = base64.b64encode((root / 'img/perezoso.svg').read_bytes()).decode()
html = html.replace('href="img/perezoso.svg"', f'href="data:image/svg+xml;base64,{icon}"')

out = root / 'Perezoso.html'
out.write_text(html, encoding='utf-8')
print(f'{out.name}: {out.stat().st_size // 1024} KB')
