/* =====================================================================
   H2 Pipeline Suite — application shell & router
   ===================================================================== */
(function () {
  'use strict';
  const U = window.H2U, MODS = window.H2M, E = window.H2E;
  const { $, $$, esc } = U;
  const App = window.H2App = { refTarget: null, current: null, last: null, go(id) { if (location.hash.slice(1) !== id) location.hash = id; else render(id); } };

  function buildNav() {
    const groups = []; for (const m of MODS) { let g = groups.find(x => x.g === m.group); if (!g) groups.push(g = { g: m.group, items: [] }); g.items.push(m); }
    $('#nav').innerHTML = groups.map(g => `<div class="ng"><p class="ngt">${esc(g.g)}</p>${g.items.map(m => `<a href="#${m.id}" data-id="${m.id}">${esc(m.nav)}</a>`).join('')}</div>`).join('');
    $('#navSel').innerHTML = groups.map(g => `<optgroup label="${esc(g.g)}">${g.items.map(m => `<option value="${m.id}">${esc(m.nav)}</option>`).join('')}</optgroup>`).join('');
    $('#navSel').onchange = e => App.go(e.target.value);
  }

  let timer = null;
  function render(id) {
    const mod = MODS.find(m => m.id === id) || MODS[0]; App.current = mod;
    $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.id === mod.id)); $('#navSel').value = mod.id;
    $('#projTitle').textContent = U.S.meta.project || 'Untitled project';
    const main = $('#main');
    const head = `<header class="mh"><p class="eyebrow">${esc(mod.group)}</p><h2>${esc(mod.title)}</h2><p class="intro">${mod.intro || ''}</p>`;
    if (mod.page) {
      main.innerHTML = head + '</header>' + `<div class="pagebody">${mod.page()}</div>`;
      mod.bindPage && mod.bindPage($('.pagebody', main));
      main.focus({ preventScroll: true }); window.scrollTo(0, 0); return;
    }
    const v = U.moduleValues(mod);
    const hasShare = U.sections(mod).some(s => s.fields.some(f => f.share)) && mod.id !== 'project';
    main.innerHTML = head + `<div class="toolbar">
        ${hasShare ? '<button class="btn sm" type="button" data-t="fill">Fill from project</button>' : ''}
        <button class="btn sm ghost" type="button" data-t="reset">Reset inputs</button>
        <button class="btn sm ghost" type="button" data-t="rep">Export report (.html)</button>
        <button class="btn sm ghost" type="button" data-t="doc">Report for Word (.doc)</button>
        <button class="btn sm ghost" type="button" data-t="csv">Results table (.csv)</button></div></header>
      <div class="mgrid"><form class="inputs" id="inputs" autocomplete="off">${mod.extra ? mod.extra(v) : ''}${U.sections(mod).map(s => `<fieldset class="sec"><legend>${esc(s.title)}</legend><div class="formgrid">${s.fields.map(f => U.fieldHTML(mod.id, f, v[f.k])).join('')}</div></fieldset>`).join('')}</form>
      <div class="results" id="results" aria-live="polite"></div></div>`;
    const form = $('#inputs', main);
    form.addEventListener('submit', e => e.preventDefault());
    const rerun = () => { clearTimeout(timer); timer = setTimeout(() => compute(mod), 180); };
    form.addEventListener('input', e => {
      const k = e.target.dataset.k; if (!k) return;
      const f = U.sections(mod).flatMap(s => s.fields).find(x => x.k === k); if (!f) return;
      v[k] = U.readField(f, e.target); U.save();
      if (f.k === 'eq') { render(mod.id); return; }
      rerun();
    });
    form.addEventListener('change', e => { if (e.target.tagName === 'SELECT' && e.target.dataset.k === 'eq') return; });
    mod.bind && mod.bind(form, rerun);
    $$('.toolbar [data-t]', main).forEach(b => b.onclick = () => toolbar(mod, b.dataset.t));
    compute(mod);
    main.focus({ preventScroll: true });
  }

  function compute(mod) {
    const out = $('#results'); if (!out) return;
    const v = U.S.m[mod.id];
    try {
      const res = mod.compute(v) || { html: '' }; App.last = res;
      out.innerHTML = res.html; mod.after && mod.after(out, res, v);
      if (mod.id === 'project') $('#projTitle').textContent = U.S.meta.project || 'Untitled project';
    } catch (e) {
      console.error(e);
      out.innerHTML = `<section class="rcard"><h3>Calculation could not be completed</h3><p class="note warn">${esc(e.message)}. Check the inputs for zero or negative values (e.g. wall thickness, pressures, lengths).</p></section>`;
    }
  }

  function toolbar(mod, t) {
    const v = U.S.m[mod.id];
    if (t === 'fill') {
      const p = U.S.m.project || {}; let n = 0;
      for (const s of U.sections(mod)) for (const f of s.fields) if (f.share && p[f.share] !== undefined) { v[f.k] = p[f.share]; n++; }
      U.save(); render(mod.id); U.toast(`${n} values filled from the project set-up.`);
    }
    if (t === 'reset') { delete U.S.m[mod.id]; U.save(); render(mod.id); U.toast('Inputs reset to defaults.'); }
    const res = App.last || { html: '' }; const fname = `${mod.id}_${(U.S.meta.project || 'project').replace(/[^\w-]+/g, '_').slice(0, 40)}`;
    if (t === 'rep') U.download(fname + '.html', U.reportHTML(mod, res.html), 'text/html');
    if (t === 'doc') U.download(fname + '.doc', U.reportHTML(mod, res.html), 'application/msword');
    if (t === 'csv') { if (res.csv) U.download(fname + '_' + res.csv.name + '.csv', U.toCSV(res.csv.rows), 'text/csv'); else U.toast('This module has no tabular results to export.'); }
  }

  function theme(cycle) {
    const order = ['auto', 'light', 'dark']; let th = U.S.settings.theme || 'auto';
    if (cycle) { th = order[(order.indexOf(th) + 1) % 3]; U.S.settings.theme = th; U.save(); }
    if (th === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', th);
    $('#themeBtn').textContent = { auto: 'Theme: system', light: 'Theme: light', dark: 'Theme: dark' }[th];
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a.ref'); if (a) { e.preventDefault(); App.refTarget = a.dataset.ref; App.go('refs'); return; }
  });

  async function start() {
    U.load(); buildNav(); theme(false);
    $('#themeBtn').onclick = () => theme(true);
    $('#copyClose').onclick = () => { $('#copyDlg').hidden = true; };
    await U.LIB.open();
    window.addEventListener('hashchange', () => render(location.hash.slice(1)));
    render(location.hash.slice(1) || 'project');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
