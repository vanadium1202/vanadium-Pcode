/* =====================================================================
   H2 Pipeline Suite — UI framework: state, forms, charts, files, reports
   ===================================================================== */
(function () {
  'use strict';
  const E = window.H2E, D = window.H2D;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const STORE_KEY = 'h2pipe-suite.v1';

  /* ------------------------------------------------------------ state */
  function freshState() {
    return {
      meta: { project: 'Synthetic case — 24" NG trunkline repurposing study', client: '', engineer: '', rev: 'A', date: new Date().toISOString().slice(0, 10), notes: '' },
      settings: { basis: 'HHV', ref: '15/15', zFactor: 1, theme: 'auto' },
      tables: clone(D.DEFAULT_TABLES),
      gasName: 'RLNG typical (India)',
      gas: clone(D.GASES['RLNG typical (India)']),
      m: {},
      ili: null,
      press: null
    };
  }
  let S = freshState();
  function load() {
    try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const o = JSON.parse(raw); S = Object.assign(freshState(), o); S.tables = Object.assign(clone(D.DEFAULT_TABLES), o.tables || {}); } } catch (e) { /* storage unavailable */ }
    E.zCorr.factor = +S.settings.zFactor || 1;
  }
  let saveT = null;
  function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }, 250); }

  /* ------------------------------------------------------------ formatting */
  function fmt(x, d = 2) {
    if (x === null || x === undefined || (typeof x === 'number' && !isFinite(x))) return '—';
    if (typeof x !== 'number') return esc(x);
    const a = Math.abs(x);
    if (a !== 0 && (a >= 1e7 || a < 1e-3)) return x.toExponential(Math.max(1, d));
    return x.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  const ref = (...ids) => ids.map(id => `<a class="ref" href="#refs" data-ref="${id}" title="${esc((D.REFS[id] || [id])[0] + ' — ' + ((D.REFS[id] || [])[1] || ''))}">${id}</a>`).join('');
  const chip = (s, t) => `<span class="chip ${s}">${esc(t)}</span>`;
  const statusWord = { g: 'OK', a: 'Review', r: 'Fails / not suitable', i: 'Info' };

  function kv(rows) {
    const cls = v => String(v ?? '').replace(/<[^>]+>/g, '').length > 26 ? 'txt' : 'num';
    return `<table class="kv"><tbody>${rows.filter(Boolean).map(r => `<tr><th>${r[0]}</th><td class="${cls(r[1])}">${r[1]}</td><td class="u">${r[2] || ''}</td><td class="rf">${r[3] || ''}</td></tr>`).join('')}</tbody></table>`;
  }
  function table(cols, rows, opt = {}) {
    return `<div class="tbl-wrap"><table class="grid ${opt.cls || ''}"><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr${r._cls ? ` class="${r._cls}"` : ''}>${(Array.isArray(r) ? r : r.cells).map((c, i) => `<td${opt.num && opt.num[i] ? ' class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function card(title, body, opt = {}) { return `<section class="rcard ${opt.cls || ''}"><h3>${title}</h3>${body}</section>`; }
  function note(t, cls = '') { return `<p class="note ${cls}">${t}</p>`; }

  /* ------------------------------------------------------------ SVG line chart */
  function lineChart(o) {
    const W = o.w || 640, H = o.h || 300, m = { l: 62, r: 16, t: 14, b: 46 };
    const all = o.series.flatMap(s => s.pts).filter(p => isFinite(p[0]) && isFinite(p[1]));
    if (!all.length) return '<p class="note">No data to plot.</p>';
    let x0 = o.xMin ?? Math.min(...all.map(p => p[0])), x1 = o.xMax ?? Math.max(...all.map(p => p[0]));
    let y0 = o.yMin ?? Math.min(0, ...all.map(p => p[1])), y1 = o.yMax ?? Math.max(...all.map(p => p[1]), ...(o.hLines || []).map(h => h.y));
    if (o.logY) { y0 = Math.log10(o.yMin ?? Math.min(...all.map(p => p[1]).filter(v => v > 0))); y1 = Math.log10(o.yMax ?? Math.max(...all.map(p => p[1]))); }
    if (y1 === y0) y1 = y0 + 1; if (x1 === x0) x1 = x0 + 1;
    const nice = (lo, hi, n) => { const span = hi - lo, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0))); const st = [1, 2, 2.5, 5, 10].map(k => k * mag).find(k => span / k <= n) || mag * 10; const a = Math.floor(lo / st) * st, b = Math.ceil(hi / st) * st; const t = []; for (let v = a; v <= b + st / 2; v += st) t.push(+v.toPrecision(12)); return { a, b, t }; };
    const nx = nice(x0, x1, 6), ny = o.logY ? { a: Math.floor(y0), b: Math.ceil(y1), t: Array.from({ length: Math.ceil(y1) - Math.floor(y0) + 1 }, (_, i) => Math.floor(y0) + i) } : nice(y0, y1, 5);
    if (o.xMin === undefined) x0 = nx.a; if (o.xMax === undefined) x1 = nx.b; y0 = ny.a; y1 = ny.b;
    const X = v => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r);
    const Y = v => H - m.b - ((o.logY ? Math.log10(Math.max(v, 1e-300)) : v) - y0) / (y1 - y0) * (H - m.t - m.b);
    const Yr = v => H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b);
    let g = '';
    for (const t of ny.t) g += `<line class="gl" x1="${m.l}" x2="${W - m.r}" y1="${Yr(t)}" y2="${Yr(t)}"/><text class="tk" x="${m.l - 6}" y="${Yr(t) + 4}" text-anchor="end">${o.logY ? '1e' + t : fmtTick(t)}</text>`;
    for (const t of nx.t) if (t >= x0 - 1e-9 && t <= x1 + 1e-9) g += `<line class="gl v" x1="${X(t)}" x2="${X(t)}" y1="${m.t}" y2="${H - m.b}"/><text class="tk" x="${X(t)}" y="${H - m.b + 16}" text-anchor="middle">${fmtTick(t)}</text>`;
    g += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/><line class="ax" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${H - m.b}"/>`;
    g += `<text class="al" x="${(m.l + W - m.r) / 2}" y="${H - 8}" text-anchor="middle">${esc(o.xLabel || '')}</text><text class="al" transform="translate(14 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">${esc(o.yLabel || '')}</text>`;
    for (const h of (o.hLines || [])) { if (h.y < (o.logY ? 10 ** y0 : y0) || h.y > (o.logY ? 10 ** y1 : y1)) continue; g += `<line class="hl" x1="${m.l}" x2="${W - m.r}" y1="${Y(h.y)}" y2="${Y(h.y)}"/><text class="hlt" x="${W - m.r - 4}" y="${Y(h.y) - 4}" text-anchor="end">${esc(h.label)}</text>`; }
    for (const v of (o.vLines || [])) { if (v.x < x0 || v.x > x1) continue; g += `<line class="hl" x1="${X(v.x)}" x2="${X(v.x)}" y1="${m.t}" y2="${H - m.b}"/><text class="hlt" x="${X(v.x) + 4}" y="${m.t + 12}">${esc(v.label)}</text>`; }
    o.series.forEach((s, i) => {
      const pts = s.pts.filter(p => isFinite(p[0]) && isFinite(p[1]) && (!o.logY || p[1] > 0));
      if (!pts.length) return;
      const d = pts.map((p, j) => (j ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1)).join(' ');
      g += `<path class="ln s${(s.ci ?? i) % 6}${s.dash ? ' dash' : ''}" d="${d}" fill="none"/>`;
      if (s.markers || pts.length < 25) g += pts.map(p => `<circle class="pt s${(s.ci ?? i) % 6}" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="2.6"><title>${esc(s.name)}: x=${fmtTick(p[0])}, y=${fmtTick(p[1])}</title></circle>`).join('');
    });
    const legend = `<div class="legend">${o.series.map((s, i) => `<span><i class="sw s${(s.ci ?? i) % 6}${s.dash ? ' dash' : ''}"></i>${esc(s.name)}</span>`).join('')}</div>`;
    return `<figure class="chart">${o.title ? `<figcaption>${esc(o.title)}</figcaption>` : ''}<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.title || o.yLabel || 'chart')}">${g}</svg></div>${legend}</figure>`;
  }
  function fmtTick(v) { const a = Math.abs(v); if (a >= 1e5 || (a < 1e-2 && a > 0)) return v.toExponential(1); return +v.toPrecision(4) + ''; }

  /* ------------------------------------------------------------ toasts & files */
  function toast(msg, opt = {}) {
    const box = $('#toasts'); const t = document.createElement('div'); t.className = 'toast';
    t.innerHTML = `<span>${msg}</span>` + (opt.copy ? '<button class="btn sm" type="button">Copy content</button>' : '');
    if (opt.copy) t.querySelector('button').onclick = () => copyText(opt.copy);
    box.appendChild(t); setTimeout(() => t.remove(), opt.ms || 6000);
  }
  function copyText(text) {
    try { navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard.'), () => showCopyDialog(text)); } catch (e) { showCopyDialog(text); }
  }
  function showCopyDialog(text) {
    const dlg = $('#copyDlg'); $('#copyArea').value = text; dlg.hidden = false; $('#copyArea').select();
  }
  // Hosted viewer (claude.ai): downloads go through the platform's downloads capability.
  // Opened locally from disk, window.claude is absent and a normal browser download is used.
  let DL = null;
  try { if (window.claude && window.claude.use) window.claude.use('downloads').then(d => { DL = d; }, () => { }); } catch (e) { /* not hosted */ }
  function download(name, content, mime = 'text/plain') {
    if (DL) {
      const fname = name.replace(/\.doc$/i, '.html');
      DL.save({ filename: fname, data: content }).then(() => toast(`Saved <b>${esc(fname)}</b>${fname !== name ? ' (open it in Word)' : ''}.`), e => {
        if (e && e.code === 'declined') return;
        if (typeof content === 'string') showCopyDialog(content); else toast('This viewer cannot save files. Open the tool from your disk instead.');
      });
      return;
    }
    try {
      const blob = content instanceof Blob ? content : new Blob([content], { type: mime + ';charset=utf-8' });
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      toast(`Saved <b>${esc(name)}</b>. If no file appeared, your viewer blocks downloads — use Copy.`, { copy: typeof content === 'string' ? content : null });
    } catch (e) { if (typeof content === 'string') showCopyDialog(content); else toast('Download blocked in this viewer.'); }
  }
  function toCSV(rows) { return rows.map(r => r.map(v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\n'); }
  function parseCSV(text) {
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true; else if (c === ',' || c === ';' || c === '\t') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
    return rows.filter(r => r.some(x => x.trim() !== ''));
  }
  function pickFile(accept, cb, asText = true) {
    const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
    inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => cb(r.result, f); if (asText) r.readAsText(f); else r.readAsArrayBuffer(f); };
    inp.click();
  }

  /* ------------------------------------------------------------ IndexedDB document library */
  const LIB = {
    db: null,
    open() {
      return new Promise((res) => {
        try {
          const rq = indexedDB.open('h2pipe-suite-lib', 1);
          rq.onupgradeneeded = () => rq.result.createObjectStore('files', { keyPath: 'id' });
          rq.onsuccess = () => { LIB.db = rq.result; res(true); };
          rq.onerror = () => res(false);
        } catch (e) { res(false); }
      });
    },
    tx(mode) { return LIB.db.transaction('files', mode).objectStore('files'); },
    all() { return new Promise(res => { if (!LIB.db) return res(LIB.mem); const r = LIB.tx('readonly').getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => res([]); }); },
    put(rec) { return new Promise(res => { if (!LIB.db) { LIB.mem = LIB.mem.filter(x => x.id !== rec.id).concat(rec); return res(); } const r = LIB.tx('readwrite').put(rec); r.onsuccess = () => res(); r.onerror = () => res(); }); },
    del(id) { return new Promise(res => { if (!LIB.db) { LIB.mem = LIB.mem.filter(x => x.id !== id); return res(); } const r = LIB.tx('readwrite').delete(id); r.onsuccess = () => res(); r.onerror = () => res(); }); },
    mem: []
  };

  /* ------------------------------------------------------------ forms */
  function fieldHTML(mid, f, val) {
    const id = `f_${mid}_${f.k}`;
    const help = f.h ? `<small>${f.h}</small>` : '';
    const lab = `<label for="${id}">${f.l}${f.ref ? ' ' + ref(...[].concat(f.ref)) : ''}</label>`;
    if (f.t === 'sel') {
      const opts = (typeof f.o === 'function' ? f.o() : f.o).map(o => Array.isArray(o) ? o : [o, o]);
      return `<div class="fld">${lab}<select id="${id}" data-k="${f.k}">${opts.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>${help}</div>`;
    }
    if (f.t === 'chk') return `<div class="fld chk"><input type="checkbox" id="${id}" data-k="${f.k}"${val ? ' checked' : ''}/>${lab}${help}</div>`;
    if (f.t === 'txt') return `<div class="fld wide">${lab}<input type="text" id="${id}" data-k="${f.k}" value="${esc(val)}"/>${help}</div>`;
    if (f.t === 'area') return `<div class="fld wide">${lab}<textarea id="${id}" data-k="${f.k}" rows="${f.rows || 3}">${esc(val)}</textarea>${help}</div>`;
    return `<div class="fld">${lab}<div class="inp-u"><input type="number" inputmode="decimal" id="${id}" data-k="${f.k}" value="${esc(val)}" step="${f.step ?? 'any'}"${f.min !== undefined ? ` min="${f.min}"` : ''}${f.max !== undefined ? ` max="${f.max}"` : ''}/>${f.u ? `<span>${f.u}</span>` : ''}</div>${help}</div>`;
  }
  function moduleValues(mod) {
    if (!S.m[mod.id]) S.m[mod.id] = {};
    const v = S.m[mod.id];
    for (const sec of sections(mod)) for (const f of sec.fields) if (v[f.k] === undefined) v[f.k] = typeof f.v === 'function' ? f.v() : f.v;
    return v;
  }
  function sections(mod) { return typeof mod.sections === 'function' ? mod.sections(S.m[mod.id] || {}) : (mod.sections || []); }
  function readField(f, el) { if (f.t === 'chk') return el.checked; if (f.t === 'num' || !f.t) { const n = parseFloat(el.value); return isFinite(n) ? n : 0; } return el.value; }

  /* Shared project values that modules can pull with "Fill from project" */
  function project() { return S.m.project || {}; }
  function gradeBy(name) { return D.GRADES.find(g => g.g === name) || D.GRADES[3]; }

  /* ------------------------------------------------------------ report export */
  function reportHTML(mod, resultsHTML) {
    const v = S.m[mod.id] || {};
    const inputs = sections(mod).map(sec => `<h3>${esc(sec.title)}</h3><table class="kv">${sec.fields.map(f => `<tr><th>${f.l}</th><td>${esc(typeof v[f.k] === 'boolean' ? (v[f.k] ? 'Yes' : 'No') : v[f.k])}</td><td>${f.u || ''}</td></tr>`).join('')}</table>`).join('');
    const used = Array.from(new Set((resultsHTML.match(/data-ref="(R\d+)"/g) || []).map(s => s.slice(10, -1)))).sort((a, b) => +a.slice(1) - +b.slice(1));
    const refs = used.map(id => `<li><b>${id}</b> ${esc(D.REFS[id][0])} — ${esc(D.REFS[id][1])}. <i>${esc(D.REFS[id][2])}</i></li>`).join('');
    const css = document.getElementById('app-css') ? document.getElementById('app-css').textContent : '';
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(mod.title)} — ${esc(S.meta.project)}</title><style>${css}
      body{background:#fff;color:#111;padding:24px;max-width:1000px;margin:auto} .rcard{break-inside:avoid} a.ref{pointer-events:none}</style></head>
      <body class="report"><header class="rep-h"><h1>${esc(mod.title)}</h1><p><b>Project:</b> ${esc(S.meta.project)} · <b>Client:</b> ${esc(S.meta.client)} · <b>Engineer:</b> ${esc(S.meta.engineer)} · <b>Rev:</b> ${esc(S.meta.rev)} · <b>Date:</b> ${esc(S.meta.date)}</p>
      <p class="note">Generated by H2 Pipeline Suite (screening-level engineering tool). Verify all code values against licensed standards; results require review by a competent engineer.</p></header>
      <h2>Inputs</h2>${inputs}<h2>Results</h2>${resultsHTML}<h2>References</h2><ol class="refs">${refs}</ol></body></html>`;
  }

  window.H2U = { $, $$, clone, esc, fmt, ref, chip, statusWord, kv, table, card, note, lineChart, toast, copyText, showCopyDialog, download, toCSV, parseCSV, pickFile, LIB, fieldHTML, moduleValues, sections, readField, project, gradeBy, reportHTML, freshState,
    get S() { return S; }, set S(v) { S = v; }, load, save, STORE_KEY };
})();
