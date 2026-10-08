"""Build H2 Pipeline Suite into a single self-contained HTML file.

    python3 build.py

Outputs
  dist/H2_Pipeline_Suite.html   full standalone page (double-click to open, works offline)
  dist/User_Manual.html         copied from docs/ (linked from the app sidebar)
  build/artifact/index.html     body fragment used for publishing as a hosted page
"""
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / 'src'
JS_ORDER = ['engine.js', 'data.js', 'ui.js', 'modules1.js', 'modules2.js', 'modules3.js', 'app.js']


def build():
    css = (SRC / 'style.css').read_text(encoding='utf-8')
    js = '\n'.join((SRC / f).read_text(encoding='utf-8') for f in JS_ORDER)
    assert '</script' not in js.lower(), 'JS must not contain a closing script tag'
    shell = (SRC / 'shell.html').read_text(encoding='utf-8')
    fragment = shell.replace('/*CSS*/', css).replace('/*JS*/', js)

    head_end = fragment.index('<div class="app">')
    head, body = fragment[:head_end], fragment[head_end:]
    full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '</head>\n<body>\n' + body + '\n</body>\n</html>\n')

    dist = ROOT / 'dist'
    dist.mkdir(exist_ok=True)
    (dist / 'H2_Pipeline_Suite.html').write_text(full, encoding='utf-8')
    manual = ROOT / 'docs' / 'User_Manual.html'
    if manual.exists():
        shutil.copy(manual, dist / 'User_Manual.html')
    art = ROOT / 'build' / 'artifact'
    art.mkdir(parents=True, exist_ok=True)
    (art / 'index.html').write_text(fragment, encoding='utf-8')
    print('built', dist / 'H2_Pipeline_Suite.html', f'{len(full) / 1024:.0f} kB')


if __name__ == '__main__':
    build()
