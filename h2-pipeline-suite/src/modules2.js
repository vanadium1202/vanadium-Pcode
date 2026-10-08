/* =====================================================================
   Modules part 2: ILI & defects, Fatigue & fracture, Hydrogen safety,
   Repair, Operations & integrity
   ===================================================================== */
(function () {
  'use strict';
  const E = window.H2E, D = window.H2D, U = window.H2U;
  const { fmt, ref, chip, kv, table, card, note, lineChart, esc } = U;
  const MODS = window.H2M;
  const S = () => U.S;
  const T = () => S().tables;
  const bar = p => p * 1e5 + E.PATM;
  const mix = h2 => E.blend(S().gas, h2);
  const gradeOpts = () => D.GRADES.map(g => g.g);
  const steel = v => { const g = U.gradeBy(v.grade); return { smys: v.smysO > 0 ? v.smysO : g.smys, smts: g.smts }; };
  const pipe = () => [
    { k: 'OD', l: 'Outside diameter', u: 'mm', v: 610, share: 'OD' }, { k: 'WT', l: 'Wall thickness', u: 'mm', v: 9.5, share: 'WT' },
    { k: 'grade', l: 'Grade', t: 'sel', o: gradeOpts, v: 'X52 (L360)', share: 'grade' }, { k: 'smysO', l: 'SMYS override (0 = grade)', u: 'MPa', v: 0, share: 'smysO' }];

  /* ---------- synthetic samples ---------- */
  const SAMPLE_ILI = [
    ['id', 'chainage_m', 'type', 'depth_pct', 'length_mm', 'width_mm', 'dent_pct', 'at_weld', 'clock'],
    ['A001', 1250, 'ML', 22, 85, 60, '', 'N', '06:00'], ['A002', 4820, 'ML', 41, 160, 90, '', 'N', '05:30'], ['A003', 9310, 'ML', 63, 45, 40, '', 'N', '07:00'],
    ['A004', 15020, 'CRACK', 12, 60, '', '', 'N', '03:00'], ['A005', 21880, 'CRACK', 25, 140, '', '', 'Y', '12:00'], ['A006', 30500, 'DENT', '', 180, 150, 1.4, 'N', '11:00'],
    ['A007', 33040, 'DENT', '', 240, 200, 3.2, 'N', '01:00'], ['A008', 41010, 'DENT', '', 150, 120, 2.1, 'Y', '12:30'], ['A009', 52300, 'HS', '', 300, 250, '', 'N', '04:00'],
    ['A010', 66780, 'LAM', 45, 120, 80, '', 'N', '09:00'], ['A011', 80220, 'ML', 78, 30, 25, '', 'N', '06:30'], ['A012', 97600, 'ML', 35, 520, 140, '', 'N', '06:00']
  ];
  function synthPressure() { // 60 days hourly, diurnal + weekly line-pack swings + random
    const t = [], p = []; let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let h = 0; h <= 24 * 60; h++) { const d = Math.sin(2 * Math.PI * h / 24), w = Math.sin(2 * Math.PI * h / 168); t.push(h); p.push(+(56 + 5 * d + 3 * w + (rnd() - 0.5) * 2 + (h % 500 === 0 ? -12 : 0)).toFixed(2)); }
    return { t, p, name: 'Synthetic 60-day hourly SCADA history' };
  }

  /* ================================================================ ILI */
  MODS.push({
    id: 'ili', group: 'Integrity', nav: 'ILI & defect assessment', title: 'ILI anomaly assessment for hydrogen service',
    intro: 'Upload an ILI feature listing (CSV) and assess every anomaly at the hydrogen operating pressure: metal loss by Modified B31G, crack-like features against K<sub>IH</sub>, dents with hydrogen-conservative screening, hard spots and laminations.',
    extra() {
      const n = S().ili ? S().ili.length - 1 : 0;
      return `<div class="sec"><h4>ILI feature listing</h4><p class="note">${n ? `<b>${n}</b> anomalies loaded.` : 'No listing loaded — the synthetic sample is used.'} Columns: id, chainage_m, type (ML / CRACK / DENT / HS / LAM), depth_pct, length_mm, width_mm, dent_pct, at_weld (Y/N), clock.</p>
        <div class="btns"><button class="btn sm" type="button" id="iliUp">Upload ILI CSV</button><button class="btn sm ghost" type="button" id="iliSample">Load synthetic sample</button><button class="btn sm ghost" type="button" id="iliTpl">Download template</button></div></div>`;
    },
    bind(el) {
      U.$('#iliUp', el).onclick = () => U.pickFile('.csv,.txt', txt => { const r = U.parseCSV(txt); if (r.length < 2) return U.toast('The file has no data rows.'); S().ili = r; U.save(); window.H2App.go('ili'); U.toast(`${r.length - 1} anomalies loaded.`); });
      U.$('#iliSample', el).onclick = () => { S().ili = U.clone(SAMPLE_ILI); U.save(); window.H2App.go('ili'); };
      U.$('#iliTpl', el).onclick = () => U.download('ili_template.csv', U.toCSV(SAMPLE_ILI), 'text/csv');
    },
    sections: [
      { title: 'Pipe & pressure', fields: [...pipe(),
        { k: 'p', l: 'Assessment pressure (H2 MAOP)', u: 'barg', v: 55.8, h: 'From the Repurposing module' },
        { k: 'sf', l: 'Design factor on failure pressure', u: '–', v: 0.5, h: 'B31.12 Option A: 0.5 (Class 1); B31.8 Class 1 Div 2: 0.72', ref: ['R2', 'R1'] }] },
      { title: 'Hydrogen criteria', fields: [
        { k: 'kih', l: 'KIH (threshold in H2)', u: 'MPa√m', v: 55, ref: ['R2', 'R51'] },
        { k: 'kfac', l: 'Allowable K / KIH', u: '–', v: 0.8, h: 'Margin on threshold' },
        { k: 'dentH2', l: 'Plain dent screening limit (H2)', u: '% OD', v: 2.0, ref: 'R11' }] }
    ],
    compute(v) {
      const rows = S().ili || SAMPLE_ILI; const hdr = rows[0].map(h => h.trim().toLowerCase()); const col = n => hdr.indexOf(n);
      const st = steel(v); const t = v.WT; const P = v.p / 10; const out = [];
      for (const r of rows.slice(1)) {
        const g = n => r[col(n)]; const num = n => parseFloat(g(n)); const type = String(g('type') || '').trim().toUpperCase();
        const o = { id: g('id'), ch: num('chainage_m'), type, s: 'g', res: '', act: '', erf: NaN };
        if (type === 'ML') {
          const d = num('depth_pct') / 100 * t; const b = E.modB31G({ D: v.OD, t, d, L: num('length_mm'), SMYS: st.smys });
          const ps = b.Pf * v.sf; o.erf = P / ps;
          o.res = `Pf ${fmt(b.Pf * 10, 1)} barg; Psafe ${fmt(ps * 10, 1)} barg; ERF ${fmt(o.erf, 2)}`;
          o.s = num('depth_pct') >= 80 || o.erf > 1 ? 'r' : o.erf > 0.9 || num('depth_pct') > 60 ? 'a' : 'g';
          o.act = o.s === 'r' ? 'Repair before H2 service' : o.s === 'a' ? 'Schedule repair / re-inspect' : 'Monitor';
        } else if (type === 'CRACK') {
          const a = num('depth_pct') / 100 * t, c = num('length_mm') / 2; const K = E.crackK(a, c, t, v.OD, P).Ka; const ratio = K / v.kih;
          o.erf = ratio / v.kfac; o.res = `Kmax ${fmt(K, 1)} MPa√m; K/KIH ${fmt(ratio, 2)}`;
          o.s = ratio >= v.kfac || g('at_weld') === 'Y' && ratio > 0.5 ? 'r' : ratio > 0.5 * v.kfac ? 'a' : 'a';
          o.act = o.s === 'r' ? 'Remove (cut-out) before H2 service' : 'Fatigue-crack-growth assessment (Fatigue module)';
        } else if (type === 'DENT') {
          const dp = num('dent_pct'); const w = g('at_weld') === 'Y';
          o.res = `Dent ${fmt(dp, 1)} % OD${w ? ' on weld' : ''}`;
          o.s = w || dp > T().limits.dentB318 ? 'r' : dp > v.dentH2 ? 'a' : 'g';
          o.act = o.s === 'r' ? 'Repair (B31.8 §851.4)' : o.s === 'a' ? 'Strain-based assessment; consider sleeve' : 'Monitor';
        } else if (type === 'HS') { o.res = 'Hard spot'; o.s = 'r'; o.act = 'Replace joint (hydrogen cracking risk)'; }
        else if (type === 'LAM') { o.res = `Lamination ${g('depth_pct') || '?'} % t`; o.s = 'a'; o.act = 'UT verify: no surface breaking or blister; mid-wall lamination can blister in H2'; }
        else { o.res = 'Unknown type'; o.s = 'i'; }
        out.push(o);
      }
      const n = s => out.filter(o => o.s === s).length;
      let html = card('Summary', `<div class="tiles"><div class="tile r"><b>${n('r')}</b><span>repair before H2</span></div><div class="tile a"><b>${n('a')}</b><span>review / assess</span></div><div class="tile g"><b>${n('g')}</b><span>acceptable</span></div><div class="tile"><b>${out.length}</b><span>anomalies</span></div></div>` +
        note(`Metal loss: Modified B31G ${ref('R10')} with factor ${v.sf}. Cracks: Newman–Raju SIF with bulging ${ref('R12', 'R13')} vs KIH ${ref('R2')}. Dents: ${ref('R11')} with hydrogen screening limit ${v.dentH2} % OD.`));
      html += card('Assessment by anomaly', table(['ID', 'Chainage m', 'Type', 'Result', 'Status', 'Action'], out.map(o => [esc(o.id), fmt(o.ch, 0), o.type, o.res, chip(o.s, U.statusWord[o.s]), o.act]), { num: [0, 1, 0, 0, 0, 0] }));
      const pts = out.filter(o => isFinite(o.erf)).map(o => [o.ch / 1000, o.erf]);
      if (pts.length) html += card('Severity along the line', lineChart({ title: 'ERF (metal loss) and K/allowable (cracks) by chainage', xLabel: 'Chainage (km)', yLabel: 'Ratio (≥ 1 → repair)', series: [{ name: 'Anomaly severity', pts: pts.sort((a, b) => a[0] - b[0]), markers: true }], hLines: [{ y: 1, label: 'Repair threshold' }] }).replace('<path class="ln', '<path style="display:none" class="ln'));
      return { html, csv: { name: 'ili_assessment', rows: [['id', 'chainage_m', 'type', 'result', 'status', 'action'], ...out.map(o => [o.id, o.ch, o.type, o.res, U.statusWord[o.s], o.act])] } };
    }
  });

  /* ================================================================ FATIGUE */
  MODS.push({
    id: 'fatigue', group: 'Integrity', nav: 'Fatigue & fracture', title: 'Hydrogen-assisted fatigue crack growth and fracture',
    intro: 'Grows a surface flaw under the pressure-cycle spectrum using the ASME Code Case 2938 hydrogen design curves (with optional pressure dependence) and compares with air. Upload a SCADA pressure history to use real cycles (rainflow, ASTM E1049).',
    extra() {
      const h = S().press;
      return `<div class="sec"><h4>Pressure history</h4><p class="note">${h ? `<b>${esc(h.name || 'Uploaded history')}</b>: ${h.p.length} points over ${fmt((h.t[h.t.length - 1] - h.t[0]) / 24, 1)} days.` : 'None loaded — constant-amplitude inputs are used.'} CSV columns: time_h, pressure_barg (or ISO timestamp, pressure).</p>
        <div class="btns"><button class="btn sm" type="button" id="prUp">Upload pressure CSV</button><button class="btn sm ghost" type="button" id="prSyn">Generate synthetic history</button><button class="btn sm ghost" type="button" id="prTpl">Download template</button><button class="btn sm ghost" type="button" id="prClr">Clear</button></div></div>`;
    },
    bind(el) {
      U.$('#prUp', el).onclick = () => U.pickFile('.csv,.txt', (txt, f) => {
        const r = U.parseCSV(txt); const t = [], p = []; let t0 = null;
        for (const row of r) { let tt = parseFloat(row[0]); const pp = parseFloat(row[1]); if (!isFinite(pp)) continue; if (!isFinite(tt) || /[-:T]/.test(row[0])) { const d = Date.parse(row[0]); if (!isFinite(d)) continue; if (t0 === null) t0 = d; tt = (d - t0) / 3.6e6; } t.push(tt); p.push(pp); }
        if (p.length < 3) return U.toast('Could not read pressure data. Expected two columns: time_h, pressure_barg.');
        S().press = { t, p, name: f.name }; U.save(); window.H2App.go('fatigue'); U.toast(`${p.length} pressure points loaded.`);
      });
      U.$('#prSyn', el).onclick = () => { S().press = synthPressure(); U.save(); window.H2App.go('fatigue'); };
      U.$('#prTpl', el).onclick = () => { const s = synthPressure(); U.download('pressure_history_template.csv', U.toCSV([['time_h', 'pressure_barg'], ...s.t.slice(0, 200).map((t, i) => [t, s.p[i]])]), 'text/csv'); };
      U.$('#prClr', el).onclick = () => { S().press = null; U.save(); window.H2App.go('fatigue'); };
    },
    sections: [
      { title: 'Pipe & flaw', fields: [...pipe(),
        { k: 'a0', l: 'Initial flaw depth a₀', u: 'mm', v: 1.5, h: 'ILI/NDT detection threshold or measured flaw' },
        { k: 'l0', l: 'Initial flaw length 2c₀', u: 'mm', v: 25 },
        { k: 'kih', l: 'KIH in hydrogen', u: 'MPa√m', v: 55, ref: ['R2', 'R51'] }] },
      { title: 'Loading', fields: [
        { k: 'h2', l: 'Hydrogen content', u: 'mol %', v: 100 },
        { k: 'pmax', l: 'Max pressure (constant amplitude)', u: 'barg', v: 55.8 }, { k: 'pmin', l: 'Min pressure', u: 'barg', v: 40 },
        { k: 'cpd', l: 'Cycles per day', u: '/day', v: 1 },
        { k: 'hist', l: 'Use uploaded pressure history (rainflow)', t: 'chk', v: true },
        { k: 'pscale', l: 'Apply pressure dependence of low-ΔK segment (√pH2)', t: 'chk', v: true, ref: ['R14', 'R15'] },
        { k: 'life', l: 'Required design life', u: 'years', v: 40 }] }
    ],
    compute(v) {
      const t = T(); const fc = t.fcg; const st = steel(v);
      let cycles, blockYears, srcTxt, rf = null;
      if (v.hist && S().press) {
        const h = S().press; rf = E.rainflow(h.p); const dur = Math.max(h.t[h.t.length - 1] - h.t[0], 1); blockYears = dur / 8760;
        const bins = {}; for (const c of rf) { if (c.range < 0.2) continue; const key = (Math.round(c.max * 2) / 2) + '|' + (Math.round(c.min * 2) / 2); bins[key] = (bins[key] || 0) + c.count; }
        cycles = Object.entries(bins).map(([k, n]) => { const [mx, mn] = k.split('|').map(Number); return { pmax: mx / 10, pmin: mn / 10, n }; }).filter(c => c.pmax > c.pmin);
        srcTxt = `Rainflow of ${esc(h.name || 'history')}: ${fmt(rf.reduce((s, c) => s + c.count, 0), 1)} cycles in ${fmt(dur / 24, 1)} days`;
      } else { cycles = [{ pmax: v.pmax / 10, pmin: v.pmin / 10, n: v.cpd }]; blockYears = 1 / 365; srcTxt = `Constant amplitude ${v.pmin}–${v.pmax} barg, ${v.cpd}/day`; }
      if (!cycles.length) return { html: card('No cycles', note('The pressure history contains no cycles above 0.2 bar range.')) };
      const pmax = Math.max(...cycles.map(c => c.pmax)); const pH2 = (pmax + 0.1013) * v.h2 / 100;
      const h2m = { ...E.FCG_DEFAULT, ...fc, type: 'h2', pScale: v.pscale }, air = { ...E.FCG_DEFAULT, ...fc, type: 'air' };
      const base = { D: v.OD, t: v.WT, a0: v.a0, c0: v.l0 / 2, cycles, blockYears, KIH: v.kih, pH2 };
      const rH = E.crackGrowth({ ...base, model: h2m }), rA = E.crackGrowth({ ...base, model: air });
      const crit = E.criticalDepth(v.OD, v.WT, v.a0 / (v.l0 / 2), pmax, v.kih); const K0 = E.crackK(v.a0, v.l0 / 2, v.WT, v.OD, pmax).Ka;
      const allowH = rH.years / fc.lifeFactor; const ok = allowH >= v.life;
      const reason = r => ({ KIH: 'Kmax reached KIH', depth: 'Depth reached 80 % t', runout: '> 100 000 years', 'no-growth': 'No growth', limit: 'Iteration limit' }[r]);
      let html = card(`Remaining life — ${chip(ok ? 'g' : 'r', ok ? 'Meets design life' : 'Below design life')}`, kv([
        ['Loading', srcTxt, ''],
        ['Hoop stress at max pressure', fmt(pmax * v.OD / (2 * v.WT), 0) + ' MPa (' + fmt(pmax * v.OD / (2 * v.WT) / st.smys * 100, 1) + ' % SMYS)', ''],
        ['H2 partial pressure at max pressure', fmt(pH2 * 10, 2), 'bar(a)'],
        ['Initial Kmax (deepest point, with bulging)', fmt(K0, 1), 'MPa√m', ref('R12', 'R13')],
        ['Critical depth at Pmax (Kmax = KIH, initial a/c kept; a growing flaw becomes rounder, so the growth run may end at 80 % t instead)', crit.limited ? '> 0.95 t (leak before break likely)' : fmt(crit.a, 2) + ' mm (' + fmt(crit.a / v.WT * 100, 0) + ' % t)', '', ref('R2')],
        ['<b>Life in hydrogen (CC2938)</b>', `<b>${fmt(rH.years, 1)}</b>`, 'years · ' + reason(rH.reason), ref('R14')],
        [`Allowable life (÷ ${fc.lifeFactor})`, fmt(allowH, 1), 'years', ref('R51')],
        ['Life in air (BS 7910 simplified law)', fmt(rA.years, 1), 'years · ' + reason(rA.reason), ref('R16')],
        ['Hydrogen life reduction factor', fmt(rA.years / Math.max(rH.years, 1e-9), 1), '×'],
        ['Re-inspection interval (half of allowable life)', fmt(allowH / 2, 1), 'years']
      ]));
      const down = arr => arr.filter((_, i) => i % Math.max(1, Math.floor(arr.length / 120)) === 0 || i === arr.length - 1);
      html += card('Crack growth', lineChart({ title: 'Crack depth vs time', xLabel: 'Years', yLabel: 'Depth a (mm)', series: [{ name: 'Hydrogen (CC2938)', pts: down(rH.path).map(p => [p.years, p.a]) }, { name: 'Air (BS 7910)', pts: down(rA.path).map(p => [p.years, p.a]).filter(p => p[0] <= Math.max(rH.years * 3, 1)), ci: 1, dash: true }], hLines: crit.limited ? [] : [{ y: crit.a, label: 'Critical depth (KIH)' }], xMax: Math.max(rH.years * 1.2, Math.min(rA.years, rH.years * 3), 1) }));
      const dom = cycles.reduce((a, c) => (c.pmax - c.pmin) > (a.pmax - a.pmin) ? c : a, cycles[0]); const Rr = Math.max(dom.pmin, 0) / dom.pmax; const dk = []; for (let k = 2; k <= 60; k *= 1.08) dk.push(k);
      html += card('Design curves', lineChart({ title: `da/dN at R = ${fmt(Rr, 2)} (largest cycle), pH2 = ${fmt(pH2 * 10, 1)} bar`, xLabel: 'ΔK (MPa√m)', yLabel: 'da/dN (m/cycle)', logY: true, series: [{ name: 'H2 — CC2938 at 106 MPa', pts: dk.map(k => [k, E.fcgr(k, Rr, { ...h2m, pScale: false }, 106)]) }, { name: 'H2 — pressure-scaled', pts: dk.map(k => [k, E.fcgr(k, Rr, h2m, pH2)]), ci: 2 }, { name: 'Air — BS 7910', pts: dk.map(k => [k, E.fcgr(k, Rr, air, 0)]), ci: 1, dash: true }] }) +
        note('Constants are editable in Code tables. CC2938 curves were derived at 106 MPa; the √(pressure) scaling of the low-ΔK segment is an approximation of the fugacity-based correction in CC2938-1 / B31.12 CC220 — verify against the code case text. ' + ref('R14', 'R15')));
      if (rf) { const bins = [0, 1, 2, 5, 10, 20, 50, 1e9]; const cnt = bins.slice(0, -1).map((b, i) => rf.filter(c => c.range >= b && c.range < bins[i + 1]).reduce((s, c) => s + c.count, 0)); html += card('Rainflow summary (ASTM E1049)', table(['Range bin (bar)', 'Cycles in record', 'Cycles per year'], cnt.map((n, i) => [`${bins[i]}–${bins[i + 1] > 1e8 ? '∞' : bins[i + 1]}`, fmt(n, 1), fmt(n / blockYears, 0)]), { num: [0, 1, 1] }) + ref('R17')); }
      return { html, csv: { name: 'crack_growth_h2', rows: [['years', 'a_mm', 'c_mm', 'Kmax'], ...rH.path.map(p => [p.years.toFixed(3), p.a.toFixed(3), p.c.toFixed(3), p.Kmax.toFixed(2)])] } };
    }
  });

  /* ================================================================ SAFETY */
  function zoneSVG(title, zones) {
    const zs = zones.filter(z => isFinite(z.r) && z.r > 0).sort((a, b) => b.r - a.r); if (!zs.length) return '';
    const R = zs[0].r, W = 340, c = W / 2, sc = (W / 2 - 16) / R;
    const circ = zs.map((z, i) => `<circle class="zone z${z.cls}" cx="${c}" cy="${c}" r="${(z.r * sc).toFixed(1)}"><title>${esc(z.label)}: ${fmt(z.r, 0)} m</title></circle>`).join('');
    const legend = zs.map(z => `<li><i class="zsw z${z.cls}"></i>${esc(z.label)} — <b>${fmt(z.r, 0)} m</b></li>`).join('');
    return `<figure class="zonefig"><figcaption>${esc(title)}</figcaption><div class="zone-row"><svg viewBox="0 0 ${W} ${W}" role="img" aria-label="${esc(title)}">${circ}<circle class="zsrc" cx="${c}" cy="${c}" r="3"/><line class="zscale" x1="${c}" x2="${c + R * sc}" y1="${W - 6}" y2="${W - 6}"/><text class="tk" x="${c + R * sc / 2}" y="${W - 10}" text-anchor="middle">${fmt(R, 0)} m</text></svg><ul class="zleg">${legend}</ul></div></figure>`;
  }
  MODS.push({
    id: 'safety', group: 'Safety', nav: 'Hydrogen safety', title: 'Hydrogen safety — leak and rupture consequences, safe zones',
    intro: 'Calculates release rate, jet-fire flame length and thermal radiation, flammable-cloud extent (LFL, ½ LFL), explosion overpressure (TNT equivalence) for a <b>leak</b>, and the potential impact radius and thermal zones for a full-bore <b>rupture</b>. Works for natural gas, blends and pure hydrogen.',
    sections: [
      { title: 'Pipeline & gas', fields: [
        { k: 'OD', l: 'Outside diameter', u: 'mm', v: 610, share: 'OD' }, { k: 'WT', l: 'Wall thickness', u: 'mm', v: 9.5, share: 'WT' },
        { k: 'p', l: 'Operating pressure', u: 'barg', v: 55.8 }, { k: 'temp', l: 'Gas temperature', u: '°C', v: 15, share: 'temp' },
        { k: 'h2', l: 'Hydrogen content', u: 'mol %', v: 100 }] },
      { title: 'Leak scenario', fields: [
        { k: 'hole', l: 'Leak hole diameter', u: 'mm', v: 25 },
        { k: 'holes', l: 'Additional hole sizes for table (mm, comma separated)', t: 'txt', v: '5, 10, 50, 100' },
        { k: 'cd', l: 'Discharge coefficient', u: '–', v: 0.85 },
        { k: 'xr', l: 'Radiant fraction (0 = automatic)', u: '–', v: 0, ref: ['R24', 'R6'] },
        { k: 'tau', l: 'Atmospheric transmissivity', u: '–', v: 1.0 },
        { k: 'texp', l: 'Exposure time (for fatality probit)', u: 's', v: 30, ref: 'R28' },
        { k: 'yield', l: 'TNT-equivalence yield', u: '%', v: 10, ref: 'R26' }] },
      { title: 'Rupture scenario', fields: [
        { k: 'tdel', l: 'Delayed-ignition release time (VCE estimate)', u: 's', v: 10 },
        { k: 'ffr', l: 'Fraction of released mass in flammable range', u: '–', v: 0.25 }] }
    ],
    compute(v) {
      const c = mix(v.h2); const fl = E.flammability(c); const iso = E.isoProps(c); const Tk = v.temp + 273.15; const p0 = bar(v.p); const t = T();
      const Hc = iso.HiM * 1e6; const Xr = v.xr > 0 ? v.xr : E.defaultXr(c);
      const leak = d => {
        const rel = E.release({ c, p0, T0: Tk, dHole: d / 1000, Cd: v.cd }); const f = E.flameLength(c, rel);
        const Q = rel.mdot * Hc / 1000; // kW
        const rad = t.rad.map(x => ({ ...x, r: E.pointSourceDistance(Q, Xr, v.tau, x.q) }));
        const xL = E.jetLFLDistance(c, rel, fl.LFL / 100), xH = E.jetLFLDistance(c, rel, fl.LFL / 200);
        const fm = E.jetFlammableMass(c, rel, fl.LFL / 100, fl.UFL / 100); const W = fm.mass * Hc * v.yield / 100 / 4.68e6;
        const op = t.op.map(x => ({ ...x, r: W > 0 ? E.distanceForOverpressure(W, x.kpa) : 0 }));
        const pr = q => E.probitFatality(q, v.texp);
        const findQ = target => { let lo = 0.5, hi = 500; for (let i = 0; i < 60; i++) { const m = Math.sqrt(lo * hi); if (pr(m) < target) lo = m; else hi = m; } return hi; };
        const r1 = E.pointSourceDistance(Q, Xr, v.tau, findQ(0.01)), r50 = E.pointSourceDistance(Q, Xr, v.tau, findQ(0.5));
        return { d, rel, f, Q, rad, xL, xH, fm, W, op, r1, r50 };
      };
      const L0 = leak(v.hole);
      const D_m = (v.OD - 2 * v.WT) / 1000; const pir = t.pir; const fH = (c.H2 || 0) * E.COMP.H2.Hi / iso.HiMol;
      const Xg = pir.XgH2 * fH + pir.XgNG * (1 - fH);
      const P = E.pir({ c, D: D_m, p: v.p * 1e5, T: Tk, Cd: pir.Cd, lambda: pir.lambda, ends: pir.ends, eta: pir.eta, Xg });
      const kCode = 0.47 * fH + 0.69 * (1 - fH); const rCode = kCode * (v.OD / 25.4) * Math.sqrt(v.p * 14.5038) * 0.3048;
      const rupRad = t.rad.map(x => ({ ...x, r: Math.sqrt(pir.eta * Xg * P.Qeff * Hc / (4 * Math.PI * x.q * 1000)) }));
      const Wr = P.Qeff * v.tdel * v.ffr * Hc * v.yield / 100 / 4.68e6; const rupOp = t.op.map(x => ({ ...x, r: E.distanceForOverpressure(Wr, x.kpa) }));
      let html = card(`Leak — ${v.hole} mm hole at ${v.p} barg (${v.h2} % H2)`, kv([
        ['Release rate (initial)', fmt(L0.rel.mdot, 3), 'kg/s · ' + (L0.rel.choked ? 'choked' : 'subsonic')],
        ['Heat release rate (LHV)', fmt(L0.Q / 1000, 2), 'MW'],
        ['Notional nozzle diameter / velocity', `${fmt(L0.rel.dE * 1000, 1)} mm / ${fmt(L0.rel.uE, 0)} m/s`, '', ref('R21')],
        ['Visible flame length (jet fire)', fmt(L0.f.L, 1), 'm · Fr = ' + fmt(L0.f.Fr, 1), ref('R22', 'R23')],
        ['Radiant fraction used', fmt(Xr, 3), v.xr > 0 ? 'user' : 'auto', ref('R24')],
        ['Distance to LFL (' + fmt(fl.LFL, 1) + ' %) on jet axis', fmt(L0.xL, 1), 'm', ref('R25')],
        ['Distance to ½ LFL on jet axis', fmt(L0.xH, 1), 'm', ref('R25')],
        ['Flammable mass in steady jet (estimate)', fmt(L0.fm.mass, 2), 'kg'],
        ['TNT-equivalent mass', fmt(L0.W, 2), 'kg TNT', ref('R26')],
        [`Distance to 1 % / 50 % fatality (${v.texp} s exposure)`, `${fmt(L0.r1, 1)} / ${fmt(L0.r50, 1)}`, 'm from flame centre', ref('R28')]
      ]) + table(['Thermal radiation', 'kW/m²', 'Radius from flame centre (m)', 'Reach along jet axis (m)'], L0.rad.map(x => [x.label, fmt(x.q, 2), fmt(x.r, 1), fmt(x.r + L0.f.L / 2, 1)]), { num: [0, 1, 1, 1] }) +
        table(['Overpressure', 'kPa', 'Distance (m)'], L0.op.map(x => [x.label, fmt(x.kpa, 1), fmt(x.r, 1)]), { num: [0, 1, 1] }));
      const holes = [v.hole, ...String(v.holes).split(/[,;\s]+/).map(Number).filter(x => x > 0)].sort((a, b) => a - b);
      const hl = holes.map(leak);
      html += card('Leak-size sensitivity', table(['Hole mm', 'Release kg/s', 'Flame m', 'LFL m', '½ LFL m', '4.73 kW/m² m', '12.5 kW/m² m', '1 % fatality m', '6.9 kPa m'], hl.map(x => [x.d, fmt(x.rel.mdot, 3), fmt(x.f.L, 1), fmt(x.xL, 1), fmt(x.xH, 1), fmt(x.rad.find(r => r.q === 4.73)?.r, 1), fmt(x.rad.find(r => r.q === 12.5)?.r, 1), fmt(x.r1, 1), fmt(x.op.find(o => o.kpa === 6.9)?.r, 1)]), { num: [1, 1, 1, 1, 1, 1, 1, 1, 1] }));
      html += card(`Rupture — full-bore, double-ended (${fmt(v.OD, 0)} mm, ${v.p} barg)`, kv([
        ['Initial release rate (one end)', fmt(P.m0, 0), 'kg/s', ref('R7')],
        ['Effective release rate (× ends × decay)', fmt(P.Qeff, 0), 'kg/s', ref('R7')],
        [`<b>Potential impact radius (model, Xg = ${fmt(Xg, 3)})</b>`, `<b>${fmt(P.r, 0)}</b>`, 'm (15.8 kW/m²) · k = ' + fmt(P.k, 3), ref('R6', 'R7')],
        ['PIR by code constant', fmt(rCode, 0), `m · k = ${fmt(kCode, 2)} (0.69 NG → 0.47 H2)`, ref('R6', 'R8')],
        ['Delayed-ignition VCE: TNT-equivalent', fmt(Wr, 0), 'kg TNT (assumption-driven)', ref('R26', 'R27')]
      ]) + table(['Thermal radiation (rupture fire)', 'kW/m²', 'Radius (m)'], rupRad.map(x => [x.label, fmt(x.q, 2), fmt(x.r, 0)]), { num: [0, 1, 1] }) +
        table(['Overpressure (delayed ignition)', 'kPa', 'Distance (m)'], rupOp.map(x => [x.label, fmt(x.kpa, 1), fmt(x.r, 0)]), { num: [0, 1, 1] }) +
        note('PIR for H2 is smaller than for NG at equal d and p: lower energy density per volume and lower flame emissivity outweigh the faster release. High-consequence-area screening uses the PIR (B31.8S: ≥ 20 buildings within the PIR circle). ' + ref('R6', 'R8')));
      const zl = [{ r: L0.xH, label: '½ LFL (leak)', cls: 1 }, { r: L0.xL, label: 'LFL (leak)', cls: 2 }, ...L0.rad.filter(x => [4.73, 12.5, 37.5].includes(x.q)).map((x, i) => ({ r: x.r + L0.f.L / 2, label: `${x.q} kW/m² (leak jet fire)`, cls: 3 + i }))];
      const zr = [{ r: P.r, label: 'PIR 15.8 kW/m²', cls: 4 }, ...rupRad.filter(x => [1.58, 4.73, 37.5].includes(x.q)).map((x, i) => ({ r: x.r, label: `${x.q} kW/m²`, cls: [1, 3, 5][i] })), { r: rupOp.find(o => o.kpa === 6.9).r, label: '6.9 kPa (1 psi)', cls: 6 }];
      html += card('Safe-zone diagrams', `<div class="zones">${zoneSVG(`Leak ${v.hole} mm`, zl)}${zoneSVG('Full-bore rupture', zr)}</div>` + note('Circles are plan-view envelopes about the release point (jet-fire reach includes ½ flame length). Emergency planning: exclusion zone ≥ 4.73 kW/m² contour (escape possible), public evacuation to the 1.58 kW/m² contour. Wind, terrain and jet direction are not modelled.'));
      html += card('Hydrogen hazard properties (for the safety case)', table(['Property', 'Hydrogen', 'Methane', 'Implication'], [
        ['Flammability range in air', '4–75 vol %', '5–15 vol %', 'Wider range — more mixtures ignitable'],
        ['Minimum ignition energy', '0.017 mJ', '0.29 mJ', 'Static and hot surfaces ignite easily'],
        ['Detonation range', '18–59 vol %', '6.3–13.5 vol %', 'Confined/congested clouds can detonate'],
        ['Autoignition temperature', '≈ 560–585 °C', '≈ 540–600 °C', 'Electrical Group IIC, T1'],
        ['Buoyancy (relative density)', '0.07', '0.55', 'Rises & disperses fast outdoors; accumulates under roofs'],
        ['Flame visibility', 'Nearly invisible', 'Visible', 'Use UV/IR or multi-IR flame detection'],
        ['Laminar burning velocity (stoich.)', '≈ 2.1 m/s', '≈ 0.37 m/s', 'Higher flame acceleration & overpressure']
      ]) + ref('R35', 'R34'));
      return { html, csv: { name: 'safety_leak_sensitivity', rows: [['hole_mm', 'release_kg_s', 'flame_m', 'LFL_m', 'halfLFL_m', ...T().rad.map(r => 'r_' + r.q + 'kW_m2'), 'fatal1pct_m', 'fatal50pct_m'], ...hl.map(x => [x.d, x.rel.mdot.toFixed(4), x.f.L.toFixed(2), x.xL.toFixed(2), x.xH.toFixed(2), ...x.rad.map(r => r.r.toFixed(2)), x.r1.toFixed(2), x.r50.toFixed(2)])] } };
    }
  });

  /* ================================================================ REPAIR */
  MODS.push({
    id: 'repair', group: 'Integrity', nav: 'Repair of H2 pipelines', title: 'Repair method selection and welding for hydrogen pipelines',
    intro: 'Selects suitable repair methods for the defect type in hydrogen (or blend) service, and calculates weldability indices and preheat (EN 1011-2) for repair welding. Hydrogen service favours cut-out replacement and non-welded repairs.',
    sections: [
      { title: 'Defect & service', fields: [
        { k: 'defect', l: 'Defect type', t: 'sel', o: () => Object.entries(D.REPAIR_MATRIX).map(([k, x]) => [k, x.l]), v: 'ext_corr' },
        { k: 'h2', l: 'Hydrogen content', u: 'mol %', v: 100 },
        { k: 'p', l: 'Pressure during repair', u: 'barg', v: 30 },
        { k: 'live', l: 'Repair on a live (pressurised, flowing) line', t: 'chk', v: false },
        { k: 'WT', l: 'Wall thickness', u: 'mm', v: 9.5, share: 'WT' },
        { k: 'depth', l: 'Defect depth', u: '% t', v: 40 }] },
      { title: 'Welding parameters', fields: [
        { k: 'C', l: 'C', v: 0.12 }, { k: 'Mn', l: 'Mn', v: 1.2 }, { k: 'Si', l: 'Si', v: 0.25 }, { k: 'Cr', l: 'Cr', v: 0.03 }, { k: 'Mo', l: 'Mo', v: 0.01 }, { k: 'Ni', l: 'Ni', v: 0.03 }, { k: 'Cu', l: 'Cu', v: 0.03 }, { k: 'V', l: 'V', v: 0.04 }, { k: 'B', l: 'B', v: 0.0003 },
        { k: 'Q', l: 'Heat input', u: 'kJ/mm', v: 1.0, ref: 'R30' }, { k: 'HD', l: 'Diffusible hydrogen of consumable', u: 'ml/100 g', v: 4, h: 'H4 low-hydrogen consumables recommended' }] }
    ],
    compute(v) {
      const row = D.REPAIR_MATRIX[v.defect]; const order = { R: 0, C: 1, N: 2 }; const word = { R: ['g', 'Recommended'], C: ['a', 'Conditional'], N: ['r', 'Not recommended'] };
      const ms = D.REPAIR_METHODS.map(m => ({ ...m, s: row[m.k] })).sort((a, b) => order[a.s] - order[b.s]);
      const ch = { C: v.C, Mn: v.Mn, Si: v.Si, Cr: v.Cr, Mo: v.Mo, Ni: v.Ni, Cu: v.Cu, V: v.V, B: v.B };
      const cet = E.cet(ch), ce = E.ceIIW(ch), pc = E.pcm(ch); const tp = E.preheatEN1011({ CET: cet, d: v.WT, HD: v.HD, Q: v.Q });
      const cetOK = cet >= 0.2 && cet <= 0.5;
      let html = card(`Repair options — ${esc(row.l)}`, table(['Method', 'Suitability', 'Hydrogen-specific considerations', 'Standard'], ms.map(m => [m.l, chip(word[m.s][0], word[m.s][1]), m.h2, m.std])) + ref('R31', 'R32', 'R2'));
      const warn = [];
      if (v.live && v.h2 > 0) warn.push(chip('r', 'Live welding on H2') + ' Welding on a pressurised hydrogen line adds process hydrogen to weld-metal hydrogen. Prefer depressurise → N₂ purge → cold work; if unavoidable, qualify per API 1104 Annex B with hydrogen-specific hardness and cracking tests.');
      if (v.live && v.WT < 6.4) warn.push(chip('r', 'Burn-through risk') + ' Wall < 6.4 mm — in-service welding needs a burn-through (thermal) analysis.');
      if (v.depth > 80) warn.push(chip('r', 'Depth > 80 % t') + ' Reduce pressure immediately; sleeves not permitted — cut-out.');
      if (v.defect === 'crack' && v.h2 > 0) warn.push(chip('a', 'Cracks in H2') + ' Cracks grow faster in hydrogen; remove by cut-out or grind-out with MPI verification. Composite wraps do not stop crack growth.');
      html += card('Welding & hydrogen-cracking control', kv([
        ['CE(IIW)', fmt(ce, 3), '', ref('R3')], ['Pcm', fmt(pc, 3), ''], ['CET (EN 1011-2)', fmt(cet, 3) + (cetOK ? '' : ' (outside 0.2–0.5 validity)'), '', ref('R30')],
        ['Minimum preheat (EN 1011-2 method B)', fmt(tp, 0), '°C', ref('R30')],
        ['Max weld/HAZ hardness', T().limits.hvWeld, 'HV10', ref('R2')],
        ['Consumables', 'Low-hydrogen H4 (≤ 4 ml/100 g); dry, controlled storage', ''],
        ['Post-repair', 'MPI/UT, hardness survey, pressure test or engineering assessment, ILI baseline', '']
      ]) + (warn.length ? `<ul class="warns">${warn.map(w => `<li>${w}</li>`).join('')}</ul>` : ''));
      html += card('Full method matrix', table(['Defect', ...D.REPAIR_METHODS.map(m => m.l.split(' (')[0])], Object.values(D.REPAIR_MATRIX).map(r => [r.l, ...D.REPAIR_METHODS.map(m => chip(word[r[m.k]][0], r[m.k]))])) + note('R = recommended, C = conditional (engineering assessment / qualified procedure), N = not recommended for hydrogen service.'));
      return { html, csv: { name: 'repair_options', rows: [['method', 'suitability', 'h2_notes', 'standard'], ...ms.map(m => [m.l, word[m.s][1], m.h2, m.std])] } };
    }
  });

  /* ================================================================ OPERATIONS */
  MODS.push({
    id: 'ops', group: 'Integrity', nav: 'Operations & integrity', title: 'Operations: inventory, blowdown, purging and integrity programme',
    intro: 'Section inventory and blowdown time for an isolation section, vented energy and greenhouse impact, purge guidance and an integrity-management programme adapted for hydrogen.',
    sections: [
      { title: 'Isolation section', fields: [
        { k: 'OD', l: 'Outside diameter', u: 'mm', v: 610, share: 'OD' }, { k: 'WT', l: 'Wall thickness', u: 'mm', v: 9.5, share: 'WT' },
        { k: 'Ls', l: 'Section length between block valves', u: 'km', v: 30 }, { k: 'p', l: 'Initial pressure', u: 'barg', v: 55 },
        { k: 'pend', l: 'Final pressure', u: 'barg', v: 0.5 }, { k: 'temp', l: 'Temperature', u: '°C', v: 15, share: 'temp' },
        { k: 'h2', l: 'Hydrogen content', u: 'mol %', v: 100 }, { k: 'dv', l: 'Vent / blowdown valve bore', u: 'mm', v: 150 }, { k: 'cd', l: 'Discharge coefficient', u: '–', v: 0.85 }] }
    ],
    compute(v) {
      const ID = (v.OD - 2 * v.WT) / 1000, V = Math.PI * ID * ID / 4 * v.Ls * 1000, Tk = v.temp + 273.15;
      const res = h => { const c = mix(h); const b = E.blowdown({ c, V, p0: bar(v.p), pEnd: bar(v.pend), T: Tk, dVent: v.dv / 1000, Cd: v.cd }); const mCH4 = b.mass * (c.CH4 || 0) * 16.043 / E.molarMass(c), mH2 = b.mass * (c.H2 || 0) * 2.016 / E.molarMass(c); return { c, b, ghg: (mCH4 * 29.8 + mH2 * 11.6) / 1000 }; };
      const a = res(0), b = res(v.h2);
      let html = card('Inventory & blowdown', table(['Quantity', 'Natural gas', `${v.h2} % H2`, 'Unit'], [
        ['Section geometric volume', fmt(V, 0), fmt(V, 0), 'm³'],
        ['Gas mass vented', fmt(a.b.mass / 1000, 2), fmt(b.b.mass / 1000, 2), 't'],
        ['Energy vented (HHV)', fmt(a.b.energyGJ, 0), fmt(b.b.energyGJ, 0), 'GJ'],
        ['Peak vent rate', fmt(a.b.peak, 1), fmt(b.b.peak, 1), 'kg/s'],
        ['Blowdown time to choked limit (vent-limited estimate)', fmt(a.b.t / 60, 1), fmt(b.b.t / 60, 1), 'min'],
        ['GWP100 of vented gas (CH4 29.8, H2 11.6)', fmt(a.ghg, 0), fmt(b.ghg, 0), 't CO₂e']
      ], { num: [0, 1, 1, 0] }) + note('Isothermal, choked, vent-limited estimate; long sections are friction-limited and take longer — use a transient simulator for design. Hydrogen vents faster (higher sound speed) and carries less energy per m³. GWP: CH4 IPCC AR6 (fossil 29.8); H2 indirect GWP100 ≈ 11.6 (Sand et al. 2023). ' + ref('R65', 'R66')));
      html += card('Purging (commissioning / decommissioning)', `<ul class="steps">
        <li>Never displace H2 directly with air or air with H2 — use nitrogen as intermediate inert (target O₂ < 1 % before H2-in; H2 < 1 % (≈ ¼ LFL) before air-in).</li>
        <li>Pig-assisted displacement: N₂ slug ≈ ${fmt(V * 0.1, 0)}–${fmt(V * 0.2, 0)} m³ (10–20 % of section volume at near-atmospheric pressure) with pig separation.</li>
        <li>Dilution purge without pig: allow ≈ ${fmt(V * 3, 0)}–${fmt(V * 5, 0)} Sm³ N₂ (3–5 section volumes).</li>
        <li>Monitor with H2-capable analysers (TCD or electrochemical) at the vent; earth all vents (MIE 0.017 mJ).</li></ul>` + ref('R35'));
      html += card('Integrity-management programme — natural gas vs hydrogen', table(['Activity', 'Typical natural-gas practice', 'Hydrogen / blend practice', 'Ref'], [
        ['Crack ILI (EMAT / UT-CD)', 'Risk-based, often none', 'Baseline before conversion; interval ≤ ½ remaining fatigue life', ref('R14', 'R51')],
        ['Metal-loss ILI (MFL)', '5–10 years', 'Baseline + same; assess at H2 MAOP with H2 design factor', ref('R10', 'R2')],
        ['Hard-spot / mapping ILI', 'Rare', 'Before conversion — remove hard spots', ref('R9')],
        ['Pressure-cycle monitoring', 'Not usual', 'Continuous SCADA rainflow; update fatigue life yearly', ref('R17')],
        ['Leak survey', 'Annual (Class 1–2)', 'More frequent; H2-specific detectors; no IR cameras for H2', ref('R34')],
        ['CP survey', 'Annual + CIPS 5 yr', 'Same, plus limit on over-protection potential', ref('R33')],
        ['Valve & seal maintenance', 'Annual function test', 'Function test + seat/stem leak test (He/H2)', ref('R54')],
        ['Gas quality', 'GC for CV/Wobbe', 'H2-capable GC (Ar carrier), moisture & O₂ limits', ref('R56')],
        ['Emergency response', 'Based on NG PIR', 'Re-zoned with H2 PIR; invisible-flame procedures', ref('R6', 'R8')]
      ]));
      return { html };
    }
  });
})();
