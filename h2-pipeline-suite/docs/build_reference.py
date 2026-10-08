"""Render docs/Project_Reference.md to docs/Project_Reference.html (pip install markdown)."""
import pathlib, re, markdown
root = pathlib.Path(__file__).resolve().parent
md = (root / 'Project_Reference.md').read_text(encoding='utf-8')
body = markdown.markdown(md, extensions=['tables', 'fenced_code', 'toc'])
body = re.sub(r'(?<!href=")(https?://[^\s<]+)', r'<a href="\1" target="_blank" rel="noopener">\1</a>', body)
body = body.replace('<table>', '<div class="tw"><table>').replace('</table>', '</table></div>')
css = """:root{--bg:#f7f9f8;--surface:#fff;--ink:#15211d;--muted:#586862;--line:#d3dbd7;--accent:#0b6b66;--soft:#dcefec;
--body:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',Arial,sans-serif;--head:'IBM Plex Sans Condensed','Arial Narrow',system-ui,sans-serif;--mono:'IBM Plex Mono',Consolas,Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#0e1412;--surface:#161f1c;--ink:#e4ebe8;--muted:#9db0a9;--line:#2b3934;--accent:#3cb7ad;--soft:#173b37;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0e1412;--surface:#161f1c;--ink:#e4ebe8;--muted:#9db0a9;--line:#2b3934;--accent:#3cb7ad;--soft:#173b37;color-scheme:dark}
body{margin:0;background:var(--bg);color:var(--ink);font:15.5px/1.7 var(--body)}
main{max-width:78ch;margin:0 auto;padding:36px 16px 80px}
h1,h2,h3{font-family:var(--head);line-height:1.2;text-wrap:balance}h1{font-size:34px;margin:0 0 4px}
h2{font-size:23px;margin:44px 0 10px;padding-top:14px;border-top:1px solid var(--line)}h3{font-size:18px;margin:26px 0 6px}
a{color:var(--accent);overflow-wrap:anywhere}hr{border:0;border-top:1px solid var(--line);margin:20px 0}
code{font-family:var(--mono);font-size:.88em;background:var(--soft);padding:1px 5px;border-radius:3px}
pre{background:var(--surface);border:1px solid var(--line);padding:12px;border-radius:6px;overflow-x:auto}pre code{background:none;padding:0}
.tw{overflow-x:auto;margin:12px 0}table{border-collapse:collapse;width:100%;font-size:14px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);vertical-align:top}th{font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
li{margin:4px 0}p em:only-child{color:var(--muted)}"""
html = f"""<title>H2 Pipeline Suite Project Reference</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono&display=swap">
<style>{css}</style>
<main>{body}</main>
"""
(root / 'Project_Reference.html').write_text(html, encoding='utf-8')
print('ok', len(html))
