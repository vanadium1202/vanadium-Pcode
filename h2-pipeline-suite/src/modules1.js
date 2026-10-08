/* =====================================================================
   Modules part 1: Project, Gas, Repurposing, Blending (transmission),
   New H2 pipeline design, CGD blending & Wobbe
   ===================================================================== */
(function () {
  'use strict';
  const E = window.H2E, D = window.H2D, U = window.H2U;
  const { fmt, ref, chip, kv, table, card, note, lineChart, esc } = U;
  const MODS = window.H2M = window.H2M || [];
  const S = () => U.S;
  const bar = p => p * 1e5 + E.PATM;            // barg -> Pa abs
  const barg = pa => (pa - E.PATM) / 1e5;
  const gradeOpts = () => D.GRADES.map(g => g.g);
  const locOpts = () => D.DEFAULT_TABLES.loc.map((l, i) => [i, l]);
  const T = () => S().tables;
  const basis = () => S().settings.basis;
  const mix = h2 => E.blend(S().gas, h2);
  const pct = x => fmt(x * 100, 1) + ' %';
  const psig = b => fmt(b * 14.5038, 0) + ' psig';

  /* ---------------- shared field factories ---------------- */
  const pipeFields = () => [
    { k: 'OD', l: 'Outside diameter', u: 'mm', v: 610, share: 'OD' },
    { k: 'WT', l: 'Wall thickness (nominal)', u: 'mm', v: 9.5, share: 'WT' },
    { k: 'grade', l: 'Line pipe grade (API 5L / ISO 3183)', t: 'sel', o: gradeOpts, v: 'X52 (L360)', share: 'grade', ref: 'R4' },
    { k: 'smysO', l: 'SMYS override (0 = grade value)', u: 'MPa', v: 0, share: 'smysO' },
    { k: 'smtsO', l: 'SMTS override (0 = grade value)', u: 'MPa', v: 0, share: 'smtsO' }
  ];
  function steel(v) { const g = U.gradeBy(v.grade); return { smys: v.smysO > 0 ? v.smysO : g.smys, smts: v.smtsO > 0 ? v.smtsO : g.smts, g }; }

  /* ================================================================ PROJECT */
  MODS.push({
    id: 'project', group: 'Setup', nav: 'Project & scenario', title: 'Project set-up and scenario overview',
    intro: 'Enter the project identity and the <b>existing pipeline</b> data once. Other modules pull these values with <i>Fill from project</i>. The overview compares the three hydrogen transport routes for this pipeline.',
    sections: [
      { title: 'Project', fields: [
        { k: 'project', l: 'Project title', t: 'txt', v: 'Synthetic case — 24" NG trunkline repurposing study' },
        { k: 'client', l: 'Client / owner', t: 'txt', v: '' }, { k: 'engineer', l: 'Prepared by', t: 'txt', v: '' },
        { k: 'rev', l: 'Revision', t: 'txt', v: 'A' }] },
      { title: 'Existing pipeline (shared data)', fields: [
        ...pipeFields(),
        { k: 'seam', l: 'Long seam type', t: 'sel', o: () => D.SEAMS.map(s => [s.k, s.l]), v: 'HFW', share: 'seam' },
        { k: 'year', l: 'Year of manufacture', u: '', v: 1988, step: 1, share: 'year' },
        { k: 'len', l: 'Length (segment between compressor stations)', u: 'km', v: 120, share: 'len' },
        { k: 'maop', l: 'Existing MAOP', u: 'barg', v: 70, share: 'maop' },
        { k: 'pmin', l: 'Minimum delivery / suction pressure', u: 'barg', v: 40, share: 'pmin' },
        { k: 'temp', l: 'Gas temperature', u: '°C', v: 15, share: 'temp' },
        { k: 'loc', l: 'Location class', t: 'sel', o: locOpts, v: 1, share: 'loc', ref: 'R1' },
        { k: 'rough', l: 'Internal roughness', u: 'mm', v: 0.0457, share: 'rough' },
        { k: 'eff', l: 'Pipeline efficiency factor', u: '–', v: 0.95, share: 'eff', h: '0.92–0.98 typical; applied to flow' },
        { k: 'dz', l: 'Elevation change outlet − inlet', u: 'm', v: 0, share: 'dz' }] },
      { title: 'Hydrogen scenario', fields: [
        { k: 'h2blend', l: 'Blend level to evaluate', u: 'mol % H2', v: 20, share: 'h2blend' }] }
    ],
    compute(v) {
      Object.assign(S().meta, { project: v.project, client: v.client, engineer: v.engineer, rev: v.rev });
      const st = steel(v); const t = T(); const Tf = E.tempDerating(v.temp); const ID = (v.OD - 2 * v.WT) / 1000; const L = v.len * 1000;
      const seamE = ['LAP'].includes(v.seam) ? 0.8 : 1;
      const pB318 = E.barlowP(st.smys, v.WT, v.OD, t.F_b318[v.loc], seamE, Tf) * 10;
      const optA = E.b3112OptionA(st.smys, st.smts, v.WT, v.OD, t.F_A[v.loc], seamE, Tf, t.hf);
      const pA = Math.min(optA.P * 10, v.maop), pB = Math.min(E.barlowP(st.smys, v.WT, v.OD, t.F_B[v.loc], seamE, Tf) * 10, v.maop);
      const ng = mix(0), h2 = mix(100), bl = mix(v.h2blend);
      const flow = (c, p1) => E.pipeFlow({ c, D: ID, L, p1: bar(p1), p2: bar(v.pmin), T: v.temp + 273.15, rough: v.rough / 1000, E: v.eff, dz: v.dz });
      const eNG = E.energyMW(ng, flow(ng, v.maop).mdot, basis());
      const eA = E.energyMW(h2, flow(h2, pA).mdot, basis()), eB = E.energyMW(h2, flow(h2, pB).mdot, basis());
      const eBl = E.energyMW(bl, flow(bl, v.maop).mdot, basis());
      const hoop = v.maop * v.OD / (20 * v.WT) / st.smys;
      const rows = [
        ['Natural gas (today)', fmt(v.maop, 1) + ' barg', fmt(eNG, 0), '100 %', chip('i', 'Baseline')],
        [`Blend ${v.h2blend} % H2 at existing MAOP`, fmt(v.maop, 1) + ' barg', fmt(eBl, 0), pct(eBl / eNG), chip(v.h2blend <= 10 ? 'g' : v.h2blend <= 20 ? 'a' : 'r', `pH2 = ${fmt(v.maop * v.h2blend / 100, 1)} bar`)],
        ['Repurposed 100 % H2 — B31.12 Option A', fmt(pA, 1) + ' barg', fmt(eA, 0), pct(eA / eNG), chip(pA < v.maop ? 'a' : 'g', pA < v.maop ? `Derated ${fmt((1 - pA / v.maop) * 100, 0)} %` : 'No derating')],
        ['Repurposed 100 % H2 — B31.12 Option B', fmt(pB, 1) + ' barg', fmt(eB, 0), pct(eB / eNG), chip('a', 'Needs KIH ≥ 55 MPa√m tests')]
      ];
      const html = card('Pipeline at a glance', kv([
        ['Grade / SMYS / SMTS', `${esc(v.grade)} / ${fmt(st.smys, 0)} / ${fmt(st.smts, 0)}`, 'MPa', ref('R4')],
        ['D/t ratio', fmt(v.OD / v.WT, 1), ''],
        ['Hoop stress at existing MAOP', fmt(hoop * 100, 1), '% SMYS', ref('R1')],
        ['B31.8 allowable pressure (natural gas)', fmt(pB318, 1), 'barg', ref('R1')],
        ['Internal volume of segment', fmt(Math.PI * ID * ID / 4 * L, 0), 'm³']
      ])) + card('Three hydrogen routes for this line (energy capacity, ' + basis() + ')', table(['Route', 'Inlet pressure', 'Energy flow MW', 'vs NG', 'Status'], rows, { num: [0, 1, 1, 1, 0] }) +
        note(`Steady isothermal flow from inlet pressure to ${v.pmin} barg over ${v.len} km. Energy capacity at the same pressure drop is ~80 % for pure H2: H2 has ~⅓ the volumetric heating value but flows ~3× faster. Details in <a href="#blend">Blending</a> and <a href="#repurpose">Repurposing</a>.`)) +
        card('Suggested workflow', `<ol class="steps">
          <li><a href="#gas">Gas properties</a> — confirm the natural-gas composition and blend properties.</li>
          <li><a href="#repurpose">Repurposing assessment</a> — material screening, MAOP re-rating to ASME B31.12.</li>
          <li><a href="#ili">ILI & defects</a> and <a href="#fatigue">Fatigue & fracture</a> — upload ILI listing and SCADA pressure history.</li>
          <li><a href="#blend">Blending in transmission</a> — capacity, compression energy, leakage, end-user limits.</li>
          <li><a href="#design">New H2 pipeline design</a> → <a href="#linepipe">Line pipe spec</a> → <a href="#equipment">Instruments & equipment</a>.</li>
          <li><a href="#cgd">CGD blending & Wobbe</a> for city gas networks.</li>
          <li><a href="#safety">Hydrogen safety</a> — leak & rupture safe zones; <a href="#repair">Repair</a> and <a href="#ops">Operations</a>.</li></ol>`);
      return { html, csv: { name: 'route_comparison', rows: [['Route', 'Inlet barg', 'Energy MW', 'Ratio'], ...rows.map(r => [r[0], r[1], r[2], r[3]])] } };
    }
  });

  /* ================================================================ GAS */
  MODS.push({
    id: 'gas', group: 'Setup', nav: 'Gas properties', title: 'Gas composition and hydrogen-blend properties',
    intro: 'Edit the base natural-gas composition (used by every module). Properties follow ISO 6976:2016 at the selected metering reference; compressibility from Peng–Robinson with volume translation.',
    extra() {
      const g = S().gas; const keys = E.KEYS.filter(k => k !== 'H2' || true);
      return `<div class="sec"><h4>Base natural gas composition (mol %)</h4>
        <div class="fld"><label for="gasPreset">Preset</label><select id="gasPreset">${['Custom', ...Object.keys(D.GASES)].map(n => `<option${n === S().gasName ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
        <div class="comp">${keys.map(k => `<label class="ci"><span>${k}</span><input type="number" step="any" data-comp="${k}" value="${g[k] ?? ''}" placeholder="0"/></label>`).join('')}</div>
        <p class="note" id="compSum"></p>
        <div class="btns"><button class="btn sm" type="button" id="compImport">Import composition CSV</button><button class="btn sm ghost" type="button" id="compExport">Export composition CSV</button></div></div>`;
    },
    bind(el, rerun) {
      const upd = () => { const s = Object.values(S().gas).reduce((a, b) => a + (+b || 0), 0); U.$('#compSum', el).textContent = `Total = ${fmt(s, 3)} mol % (normalised automatically).`; };
      U.$$('[data-comp]', el).forEach(inp => inp.addEventListener('input', () => { const n = parseFloat(inp.value); if (n > 0) S().gas[inp.dataset.comp] = n; else delete S().gas[inp.dataset.comp]; S().gasName = 'Custom'; U.$('#gasPreset', el).value = 'Custom'; upd(); U.save(); rerun(); }));
      U.$('#gasPreset', el).addEventListener('change', e => { if (D.GASES[e.target.value]) { S().gas = U.clone(D.GASES[e.target.value]); S().gasName = e.target.value; U.$$('[data-comp]', el).forEach(i => i.value = S().gas[i.dataset.comp] ?? ''); upd(); U.save(); rerun(); } });
      U.$('#compImport', el).onclick = () => U.pickFile('.csv,.txt', txt => { const rows = U.parseCSV(txt); const g = {}; rows.forEach(r => { const k = (r[0] || '').trim(); const n = parseFloat(r[1]); if (E.COMP[k] && n > 0) g[k] = n; }); if (Object.keys(g).length) { S().gas = g; S().gasName = 'Custom'; U.save(); window.H2App.go('gas'); U.toast('Composition imported.'); } else U.toast('No valid rows. Expected: component,mol% (e.g. CH4,92.1).'); });
      U.$('#compExport', el).onclick = () => U.download('gas_composition.csv', U.toCSV([['component', 'mol_pct'], ...Object.entries(S().gas)]), 'text/csv');
      upd();
    },
    sections: [
      { title: 'Conditions', fields: [
        { k: 'h2', l: 'Hydrogen added', u: 'mol %', v: 20, share: 'h2blend' },
        { k: 'p', l: 'Line pressure', u: 'barg', v: 70, share: 'maop' },
        { k: 'temp', l: 'Temperature', u: '°C', v: 15, share: 'temp' }] },
      { title: 'Calculation settings (global)', fields: [
        { k: 'ref', l: 'Metering reference (combustion at 15 °C)', t: 'sel', o: [['15/15', '15 °C, 1.01325 bar (ISO standard)'], ['0', '0 °C, 1.01325 bar (normal m³)'], ['60F', '60 °F (15.56 °C), 1.01325 bar'], ['20', '20 °C, 1.01325 bar']], v: '15/15', ref: 'R40' },
        { k: 'basis', l: 'Energy basis for all modules', t: 'sel', o: [['HHV', 'Gross (HHV)'], ['LHV', 'Net (LHV)']], v: 'HHV' },
        { k: 'zf', l: 'Z calibration multiplier', u: '–', v: 1, h: 'Set ≠ 1 to match your AGA 8 / GERG-2008 value', ref: 'R44' }] }
    ],
    compute(v) {
      S().settings.basis = v.basis; S().settings.ref = v.ref; S().settings.zFactor = v.zf; E.zCorr.factor = +v.zf || 1;
      const ng = mix(0), bl = mix(v.h2), h2 = mix(100); const p = bar(v.p), Tk = v.temp + 273.15;
      const col = c => { const i = E.isoProps(c, v.ref), s = E.state(c, p, Tk), f = E.flammability(c); return { i, s, f }; };
      const a = col(ng), b = col(bl), c = col(h2);
      const r = (l, fn, u, d = 3, rf = '') => [l, fn(a), fn(b), fn(c), u, rf].map((x, j) => j > 0 && j < 4 ? fmt(x, d) : x);
      const rows = [
        r('Molar mass', o => o.i.M, 'g/mol', 3, ref('R40')),
        r('Relative density (real)', o => o.i.d, '–', 4, ref('R40')),
        r('Gross calorific value (HHV)', o => o.i.HsV, 'MJ/m³', 3, ref('R40')),
        r('Net calorific value (LHV)', o => o.i.HiV, 'MJ/m³', 3, ref('R40')),
        r('HHV mass basis', o => o.i.HsM, 'MJ/kg', 2),
        r('Wobbe index (gross)', o => o.i.W, 'MJ/m³', 3, ref('R40')),
        r('Standard density', o => o.i.rho, 'kg/m³', 4),
        r(`Z at ${v.p} barg, ${v.temp} °C`, o => o.s.Z, '–', 4, ref('R44')),
        r('Density at line conditions', o => o.s.rho, 'kg/m³', 2),
        r('Viscosity', o => o.s.mu * 1e6, 'µPa·s', 2, ref('R42')),
        r('Isentropic exponent k (ideal)', o => o.s.gamma, '–', 3, ref('R41')),
        r('Speed of sound (approx.)', o => o.s.c, 'm/s', 0),
        r('Lower flammability limit', o => o.f.LFL, 'vol %', 2, ref('R43')),
        r('Upper flammability limit', o => o.f.UFL, 'vol %', 1, ref('R43')),
        r('Stoichiometric air', o => o.f.airStoich, 'm³/m³', 2),
        r('CO₂ from combustion', o => E.co2PerGJ(o === a ? ng : o === b ? bl : h2), 'kg/GJ (HHV)', 1)
      ];
      const pH2 = (v.p + 1.01325) * bl.H2;
      let html = card('Properties: natural gas vs blend vs pure hydrogen', table(['Property', 'Natural gas', `Blend ${v.h2} % H2`, '100 % H2', 'Unit', 'Ref'], rows, { num: [0, 1, 1, 1, 0, 0] }) +
        kv([['Hydrogen partial pressure in blend', fmt(pH2, 2), 'bar(a)', ref('R39')], ['Energy share of H2 in blend (HHV)', fmt(bl.H2 * 286.15 / E.isoProps(bl).HsMol * 100, 1), '%'], ['CO₂ reduction vs natural gas (per unit energy)', fmt((1 - E.co2PerGJ(bl) / E.co2PerGJ(ng)) * 100, 1), '%']]) +
        note('A 20 % volume blend carries only ~7 % of its energy as hydrogen, so the CO₂ reduction per unit energy is much smaller than the volume fraction.'));
      const sweep = []; for (let x = 0; x <= 100; x += 5) { const m = mix(x); const i = E.isoProps(m, v.ref); sweep.push({ x, HsV: i.HsV, W: i.W, d: i.d, Z: E.state(m, p, Tk).Z, co2: E.co2PerGJ(m) }); }
      html += card('Trends with hydrogen fraction', lineChart({ title: 'Heating value and Wobbe index', xLabel: 'H2 in blend (mol %)', yLabel: 'MJ/m³', series: [{ name: 'Gross CV (HHV)', pts: sweep.map(s => [s.x, s.HsV]) }, { name: 'Wobbe index', pts: sweep.map(s => [s.x, s.W]) }] }) +
        lineChart({ title: `Compressibility at ${v.p} barg, ${v.temp} °C`, xLabel: 'H2 in blend (mol %)', yLabel: 'Z', yMin: Math.min(...sweep.map(s => s.Z)) - 0.02, series: [{ name: 'Z (PR + volume translation)', pts: sweep.map(s => [s.x, s.Z]), ci: 2 }] }));
      return { html, csv: { name: 'gas_property_sweep', rows: [['H2_mol_pct', 'HHV_MJ_m3', 'Wobbe_MJ_m3', 'rel_density', 'Z_line', 'CO2_kg_GJ'], ...sweep.map(s => [s.x, s.HsV.toFixed(4), s.W.toFixed(4), s.d.toFixed(5), s.Z.toFixed(5), s.co2.toFixed(2)])] } };
    }
  });

  /* ================================================================ REPURPOSE */
  MODS.push({
    id: 'repurpose', group: 'Transport routes', nav: 'Repurposing (100 % H2)', title: 'Repurposing an existing natural-gas pipeline for hydrogen',
    intro: 'Screens the existing line against hydrogen-service requirements (metallurgy, hardness, chemistry, seam, toughness, defects) and re-rates the MAOP to ASME B31.12 Option A / B. Use the <a href="#ili">ILI</a> and <a href="#fatigue">fatigue</a> modules for flaw-specific assessment.',
    sections: [
      { title: 'Service & pipe', fields: [
        { k: 'h2', l: 'Hydrogen in future service', u: 'mol %', v: 100 },
        ...pipeFields(),
        { k: 'seam', l: 'Long seam type', t: 'sel', o: () => D.SEAMS.map(s => [s.k, s.l]), v: 'HFW', share: 'seam' },
        { k: 'year', l: 'Year of manufacture', v: 1988, step: 1, share: 'year' },
        { k: 'maop', l: 'Existing MAOP', u: 'barg', v: 70, share: 'maop' },
        { k: 'loc', l: 'Location class', t: 'sel', o: locOpts, v: 1, share: 'loc', ref: 'R1' },
        { k: 'tdes', l: 'Design temperature', u: '°C', v: 50 },
        { k: 'opt', l: 'B31.12 design method', t: 'sel', o: [['A', 'Option A — prescriptive (Hf)'], ['B', 'Option B — performance-based (KIH tests)']], v: 'A', ref: 'R2' }] },
      { title: 'Material test data (MTRs / in-situ / cut-outs)', fields: [
        { k: 'ysMax', l: 'Max actual yield strength', u: 'MPa', v: 455 },
        { k: 'utsMax', l: 'Max actual tensile strength', u: 'MPa', v: 560 },
        { k: 'hvBase', l: 'Max hardness — base metal', u: 'HV10', v: 210, ref: ['R3', 'R4'] },
        { k: 'hvWeld', l: 'Max hardness — seam/girth weld & HAZ', u: 'HV10', v: 228, ref: 'R2' },
        { k: 'hardSpots', l: 'Hard spots reported by ILI (≥ 327 HB)', u: 'count', v: 0, step: 1, ref: 'R9' },
        { k: 'cvn', l: 'Charpy energy at min. design temp. (full size, avg.)', u: 'J', v: 60 },
        { k: 'dwtt', l: 'DWTT shear area at min. design temp.', u: '%', v: 85, ref: 'R19' },
        { k: 'kih', l: 'Measured KIH in H2 (0 = not tested)', u: 'MPa√m', v: 0, ref: ['R2', 'R51'] }] },
      { title: 'Chemistry (ladle/product, wt %)', fields: [
        { k: 'C', l: 'C', v: 0.12 }, { k: 'Mn', l: 'Mn', v: 1.20 }, { k: 'Si', l: 'Si', v: 0.25 }, { k: 'P', l: 'P', v: 0.015 }, { k: 'S', l: 'S', v: 0.008 },
        { k: 'Cr', l: 'Cr', v: 0.03 }, { k: 'Mo', l: 'Mo', v: 0.01 }, { k: 'V', l: 'V', v: 0.04 }, { k: 'Ni', l: 'Ni', v: 0.03 }, { k: 'Cu', l: 'Cu', v: 0.03 }, { k: 'Nb', l: 'Nb', v: 0.03 }, { k: 'Ti', l: 'Ti', v: 0.01 }, { k: 'B', l: 'B', v: 0.0003 }] },
      { title: 'Condition & history', fields: [
        { k: 'cracks', l: 'Crack-like features', t: 'sel', o: [['none', 'None reported (crack ILI run)'], ['noili', 'No crack-detection ILI performed'], ['minor', 'Minor, assessed non-injurious'], ['scc', 'SCC / seam cracks present']], v: 'noili' },
        { k: 'dent', l: 'Max dent depth', u: '% OD', v: 1.5, ref: 'R11' },
        { k: 'dentWeld', l: 'Dents on welds or with metal loss present', t: 'chk', v: false },
        { k: 'wallLoss', l: 'Max metal loss (ILI)', u: '% t', v: 25 },
        { k: 'gw', l: 'Girth-weld practice', t: 'sel', o: [['modern', 'Modern SMAW/GMAW, 100 % RT/AUT'], ['unknown', 'Unknown / partial records'], ['vintage', 'Pre-1970 oxy-acetylene / no NDT']], v: 'modern', ref: 'R62' },
        { k: 'testRatio', l: 'Pre-service hydrotest pressure / MAOP', u: '–', v: 1.25, ref: ['R9', 'R60'] },
        { k: 'cpMin', l: 'Most negative CP off-potential', u: 'V CSE', v: -1.10, ref: 'R33' },
        { k: 'cyc', l: 'Pressure cycling', t: 'sel', o: [['low', 'Low (daily Δp < 10 % MAOP)'], ['mod', 'Moderate (10–30 %)'], ['high', 'High (> 30 % or line-pack swings)']], v: 'mod' }] }
    ],
    compute(v) {
      const t = T(), L = t.limits; const st = steel(v); const Tf = E.tempDerating(v.tdes);
      const seam = D.SEAMS.find(s => s.k === v.seam) || D.SEAMS[0]; const Ej = v.seam === 'LAP' ? 0.8 : 1;
      const pB318 = E.barlowP(st.smys, v.WT, v.OD, t.F_b318[v.loc], Ej, Tf) * 10;
      const A = E.b3112OptionA(st.smys, st.smts, v.WT, v.OD, t.F_A[v.loc], Ej, Tf, t.hf);
      const pA = A.P * 10, pB = E.barlowP(st.smys, v.WT, v.OD, t.F_B[v.loc], Ej, Tf) * 10;
      const pCode = v.opt === 'B' ? pB : pA; const newMaop = Math.min(pCode, v.maop);
      const ch = { C: v.C, Mn: v.Mn, Si: v.Si, P: v.P, S: v.S, Cr: v.Cr, Mo: v.Mo, V: v.V, Ni: v.Ni, Cu: v.Cu, B: v.B };
      const ce = E.ceIIW(ch), pc = E.pcm(ch); const smysKsi = st.smys / 6.894757, utsKsi = v.utsMax / 6.894757;
      const hoopNew = newMaop * v.OD / (20 * v.WT) / st.smys * 100;
      const pH2 = (newMaop + 1.013) * v.h2 / 100;
      const checks = [];
      const add = (n, val, lim, s, rf, act) => checks.push({ n, val, lim, s, rf, act });
      add('Base-metal hardness', `${v.hvBase} HV10`, `≤ ${L.hvBase} HV10`, v.hvBase > L.hvBase ? 'r' : v.hvBase > L.hvBase - 15 ? 'a' : 'g', ref('R3', 'R4'), 'Field hardness survey (UCI/Leeb) on representative joints; laboratory HV10 on cut-outs.');
      add('Weld / HAZ hardness', `${v.hvWeld} HV10`, `≤ ${L.hvWeld} HV10`, v.hvWeld > L.hvWeld ? 'r' : v.hvWeld > L.hvWeld - 10 ? 'a' : 'g', ref('R2'), 'Hardness traverses on seam and girth-weld cut-outs.');
      add('Hard spots', `${v.hardSpots}`, '0 (remove all)', v.hardSpots > 0 ? 'r' : 'g', ref('R9', 'R62'), 'Locate with ILI hard-spot tool; replace affected joints before H2 service.');
      add('Long seam', esc(seam.l), 'Seamless, HFW (normalised), DSAW', seam.s, ref('R62', 'R1'), seam.note);
      add('Grade / SMYS', `${esc(v.grade)} (${fmt(smysKsi, 0)} ksi)`, `Option A ≤ ${L.smysA} ksi; Option B ≤ ${L.smysB} ksi`, smysKsi > L.smysB ? 'r' : smysKsi > L.smysA ? (v.opt === 'B' ? 'a' : 'r') : smysKsi > 52.5 ? 'a' : 'g', ref('R2', 'R3'), 'Higher grades carry larger Hf penalty and higher H2 susceptibility; ≤ X52 preferred.');
      add('Actual UTS', `${v.utsMax} MPa (${fmt(utsKsi, 0)} ksi)`, `Option A ≤ ${L.utsA} ksi; B ≤ ${L.utsB} ksi`, utsKsi > (v.opt === 'B' ? L.utsB : L.utsA) ? 'r' : 'g', ref('R2'), 'Review MTR maximum strengths.');
      add('Carbon equivalent CE(IIW)', fmt(ce, 3), `≤ ${L.ceIIW}`, ce > L.ceIIW ? 'r' : ce > L.ceIIW - 0.03 ? 'a' : 'g', ref('R3'), 'High CE → hard HAZ during repairs/hot taps.');
      add('Pcm', fmt(pc, 3), `≤ ${L.pcm}`, pc > L.pcm ? 'a' : 'g', ref('R61'), 'Weldability for in-service repairs.');
      add('Sulphur', `${v.S} %`, `≤ ${L.S} % (≤ 0.003 % preferred)`, v.S > 2 * L.S ? 'r' : v.S > L.S ? 'a' : 'g', ref('R61', 'R53'), 'MnS inclusions act as H2 traps and crack initiation sites.');
      add('Phosphorus', `${v.P} %`, `≤ ${L.P} % (Option B)`, v.P > L.P ? (v.opt === 'B' ? 'r' : 'a') : 'g', ref('R2'), 'Segregation-related embrittlement.');
      add('Charpy toughness', `${v.cvn} J`, `≥ ${L.cvnMin} J (and BTCM arrest — see New design)`, v.cvn < L.cvnRed ? 'r' : v.cvn < L.cvnMin ? 'a' : 'g', ref('R18', 'R19'), 'H2 lowers fracture resistance even at low pH2 — retain margin.');
      add('DWTT shear area', `${v.dwtt} %`, '≥ 85 % at min. design temperature', v.dwtt < 85 ? 'a' : 'g', ref('R19'), 'Brittle-fracture control.');
      add('KIH in hydrogen', v.kih > 0 ? `${v.kih} MPa√m` : 'Not tested', `≥ ${L.kih} MPa√m (Option B)`, v.kih > 0 ? (v.kih >= L.kih ? 'g' : 'r') : (v.opt === 'B' ? 'r' : 'a'), ref('R2', 'R51'), 'Test per ASME VIII-3 KD-10 / ASTM E1681 at design pH2 on base, seam and HAZ.');
      add('Crack-like features', { none: 'None', noili: 'Unknown (no crack ILI)', minor: 'Minor', scc: 'SCC / seam cracks' }[v.cracks], 'None, or ECA in H2', { none: 'g', noili: 'a', minor: 'a', scc: 'r' }[v.cracks], ref('R13', 'R14'), 'Run EMAT/UT crack ILI; assess flaws in the Fatigue & fracture module.');
      add('Dents', `${v.dent} % OD${v.dentWeld ? ' + on weld / with metal loss' : ''}`, `Plain ≤ ${L.dentH2} % for H2 screening (B31.8: ${L.dentB318} %)`, v.dentWeld ? 'r' : v.dent > L.dentB318 ? 'r' : v.dent > L.dentH2 ? 'a' : 'g', ref('R11'), 'Strain-based dent assessment; dents concentrate strain where H2 lowers ductility.');
      add('Metal loss', `${v.wallLoss} % t`, '< 40 % t screening; full B31G in ILI module', v.wallLoss > 60 ? 'r' : v.wallLoss > 40 ? 'a' : 'g', ref('R10'), 'Assess every anomaly with the ILI module at the H2 MAOP.');
      add('Girth welds', { modern: 'Modern, NDT', unknown: 'Unknown', vintage: 'Vintage, no NDT' }[v.gw], 'Known quality, NDT records', { modern: 'g', unknown: 'a', vintage: 'r' }[v.gw], ref('R62'), 'Sample girth welds (hardness, toughness, defects).');
      add('Pressure test record', `${v.testRatio} × MAOP`, '≥ 1.25 × MAOP', v.testRatio >= 1.25 ? 'g' : v.testRatio >= 1.1 ? 'a' : 'r', ref('R9', 'R60'), 'Consider re-test (water or N2) to establish H2 MAOP.');
      add('CP off-potential', `${v.cpMin} V CSE`, `not more negative than ${L.cpLimit} V`, v.cpMin < L.cpLimit ? 'a' : 'g', ref('R33'), 'Avoid cathodic over-protection (external H uptake).');
      add('Hoop stress at H2 MAOP', `${fmt(hoopNew, 1)} % SMYS`, `≤ ${L.stressLow} % low-risk; > ${L.stressHigh} % needs ECA`, hoopNew > L.stressHigh ? 'a' : hoopNew > L.stressLow ? 'a' : 'g', ref('R3', 'R5'), 'Lower stress = slower H2-assisted crack growth and larger critical flaws.');
      add('Pressure cycling', { low: 'Low', mod: 'Moderate', high: 'High' }[v.cyc], 'Fatigue life ≥ 2× design life', { low: 'g', mod: 'a', high: 'r' }[v.cyc], ref('R14', 'R51'), 'Quantify with SCADA rainflow in Fatigue & fracture module.');
      const nR = checks.filter(c => c.s === 'r').length, nA = checks.filter(c => c.s === 'a').length;
      const verdict = nR ? ['r', `Not suitable without remediation (${nR} critical, ${nA} review items)`] : nA ? ['a', `Conditionally suitable — ${nA} items need review/testing`] : ['g', 'Suitable on screening basis'];
      // capacity
      const pr = U.S.m.project || {}; const ID = (v.OD - 2 * v.WT) / 1000; const Lm = (pr.len || 120) * 1000; const pmin = pr.pmin ?? 40; const Tk = (pr.temp ?? 15) + 273.15;
      const fl = (c, p1) => p1 > pmin ? E.pipeFlow({ c, D: ID, L: Lm, p1: bar(p1), p2: bar(pmin), T: Tk, rough: (pr.rough || 0.0457) / 1000, E: pr.eff || 0.95 }).mdot : 0;
      const eNG = E.energyMW(mix(0), fl(mix(0), v.maop), basis()), eH = E.energyMW(mix(v.h2), fl(mix(v.h2), newMaop), basis());
      let html = card('MAOP re-rating for hydrogen service', kv([
        ['B31.8 allowable (natural gas)', fmt(pB318, 1), 'barg', ref('R1')],
        [`B31.12 Option A — F = ${t.F_A[v.loc]}, Hf = ${fmt(A.Hf, 3)}`, fmt(pA, 1), 'barg', ref('R2')],
        [`B31.12 Option B — F = ${t.F_B[v.loc]}, Hf = 1`, fmt(pB, 1), 'barg', ref('R2')],
        ['Temperature derating factor T', fmt(Tf, 3), '–', ref('R1')],
        [`<b>Hydrogen MAOP (Option ${v.opt}, ≤ existing MAOP)</b>`, `<b>${fmt(newMaop, 1)}</b>`, 'barg · ' + psig(newMaop)],
        ['Derating vs existing MAOP', fmt((1 - newMaop / v.maop) * 100, 1), '%'],
        ['Hydrogen partial pressure at MAOP', fmt(pH2, 1), 'bar(a)', ref('R39')],
        [`Energy capacity, ${pr.len || 120} km to ${pmin} barg (H2 / NG)`, `${fmt(eH, 0)} / ${fmt(eNG, 0)}`, 'MW · ' + pct(eH / eNG)]
      ]) + (v.opt === 'B' ? note('Option B requires fracture-mechanics qualification of base metal, seam and HAZ in hydrogen (KIH ≥ 55 MPa√m) and chemistry limits (P ≤ 0.015 %). ' + ref('R2', 'R51'), 'warn') : note('Option A uses the material performance factor Hf from the code table (editable in Code tables). ' + ref('R2'))));
      html += card(`Material & condition screening — ${chip(verdict[0], verdict[1])}`, table(['Check', 'Value', 'Criterion', 'Status', 'Ref', 'Action / note'], checks.map(c => [c.n, c.val, c.lim, chip(c.s, U.statusWord[c.s]), c.rf, c.act])));
      const acts = checks.filter(c => c.s !== 'g').map(c => `<li>${chip(c.s, c.n)} ${c.act}</li>`).join('');
      html += card('Recommended programme before conversion', `<ol class="steps">${acts}<li>Hydrostatic or pneumatic strength test to establish the H2 MAOP; N₂ purge and drying (dew point < −40 °C).</li><li>Replace or re-qualify valves, seals, instruments and compressors (see Instruments & equipment).</li><li>Update integrity management plan and safety case (PIR with H2, see Hydrogen safety).</li></ol>`);
      return { html, csv: { name: 'repurposing_screening', rows: [['Check', 'Value', 'Criterion', 'Status', 'Action'], ...checks.map(c => [c.n, String(c.val).replace(/<[^>]+>/g, ''), c.lim, U.statusWord[c.s], c.act])] } };
    }
  });

  /* ================================================================ BLEND (transmission) */
  MODS.push({
    id: 'blend', group: 'Transport routes', nav: 'Blending in NG pipeline', title: 'Hydrogen blending in an existing natural-gas transmission pipeline',
    intro: 'Quantifies what a given H2 blend does to energy capacity, compression energy (the transport “energy loss”), line pack, velocity, leakage and material exposure (H2 partial pressure), and checks end-user tolerances.',
    sections: [
      { title: 'Pipeline', fields: [
        { k: 'OD', l: 'Outside diameter', u: 'mm', v: 610, share: 'OD' }, { k: 'WT', l: 'Wall thickness', u: 'mm', v: 9.5, share: 'WT' },
        { k: 'len', l: 'Segment length', u: 'km', v: 120, share: 'len' }, { k: 'maop', l: 'MAOP (station discharge)', u: 'barg', v: 70, share: 'maop' },
        { k: 'pmin', l: 'Minimum delivery / next suction', u: 'barg', v: 40, share: 'pmin' }, { k: 'temp', l: 'Gas temperature', u: '°C', v: 15, share: 'temp' },
        { k: 'rough', l: 'Roughness', u: 'mm', v: 0.0457, share: 'rough' }, { k: 'eff', l: 'Efficiency factor', u: '–', v: 0.95, share: 'eff' }, { k: 'dz', l: 'Elevation change', u: 'm', v: 0, share: 'dz' }] },
      { title: 'Blend & operation', fields: [
        { k: 'h2', l: 'Hydrogen in blend', u: 'mol %', v: 20, share: 'h2blend' },
        { k: 'mode', l: 'Comparison basis', t: 'sel', o: [['energy', 'Same energy delivered (MW)'], ['pressure', 'Same pressures (max capacity)']], v: 'energy' },
        { k: 'demand', l: 'Energy demand (same-energy basis)', u: 'MW', v: 2500 },
        { k: 'eta', l: 'Compressor isentropic efficiency', u: '–', v: 0.80, ref: 'R46' },
        { k: 'driver', l: 'Compressor driver', t: 'sel', o: [['gt', 'Gas turbine (fuel from pipeline gas)'], ['em', 'Electric motor (grid power)']], v: 'gt' },
        { k: 'drvEff', l: 'Driver efficiency', u: '–', v: 0.34, h: 'GT ~0.30–0.38; motor+VFD ~0.95' },
        { k: 'leak', l: 'Baseline NG leakage (fugitive) of throughput', u: '%', v: 0.05, ref: 'R38' },
        { k: 'leakType', l: 'Dominant leak mechanism', t: 'sel', o: [['choked', 'Orifice / choked (holes, cracks)'], ['lam', 'Laminar / permeation (fittings, threads)']], v: 'choked' }] }
    ],
    compute(v) {
      const ID = (v.OD - 2 * v.WT) / 1000, L = v.len * 1000, Tk = v.temp + 273.15, A = Math.PI * ID * ID / 4;
      const common = { D: ID, L, T: Tk, rough: v.rough / 1000, E: v.eff, dz: v.dz };
      const evalX = x => {
        const c = mix(x); const iso = E.isoProps(c); const r = { x };
        const cap = E.pipeFlow({ ...common, c, p1: bar(v.maop), p2: bar(v.pmin) });
        r.capMW = E.energyMW(c, cap.mdot, basis());
        let mdot, p1;
        if (v.mode === 'energy') { mdot = E.mdotFromMW(c, v.demand, basis()); p1 = E.pipeInlet({ ...common, c, mdot, p2: bar(v.pmin) }).p1; }
        else { mdot = cap.mdot; p1 = bar(v.maop); }
        r.mdot = mdot; r.p1 = barg(p1); r.feasible = r.p1 <= v.maop * 1.0001;
        const comp = E.compressor({ c, mdot, ps: bar(v.pmin), pd: p1, Ts: Tk, eta: v.eta, maxRatio: 3, driverEff: v.drvEff });
        r.power = comp.power / 1e6; r.drvIn = comp.driverInput / 1e6; r.MW = E.energyMW(c, mdot, basis());
        r.lossPct = r.drvIn / r.MW * 100;
        r.q = E.stdFlow(c, mdot) * 86400 / 1e6; // MMSCMD
        const out = E.state(c, bar(v.pmin), Tk); r.vOut = mdot / (out.rho * A);
        r.vEros = 1.22 * 100 / Math.sqrt(out.rho);
        const lp = E.linepack({ c, D: ID, L, p1, p2: bar(v.pmin), T: Tk }); r.lpGJ = lp.energyGJ;
        const lr = E.leakRatios(mix(0), c, bar(v.maop), Tk); r.leakE = v.leak * (v.leakType === 'lam' ? lr.eLam : lr.eChoked); r.leakV = v.leakType === 'lam' ? lr.vLam : lr.vChoked;
        r.pH2 = (v.maop + 1.013) * (c.H2 || 0); r.W = iso.W; r.HsV = iso.HsV; r.k = comp.k; r.head = comp.head / 1000; r.Td = comp.Td - 273.15; r.stages = comp.stages;
        return r;
      };
      const ng = evalX(0), b = evalX(v.h2);
      const sweep = []; for (let x = 0; x <= 100; x += 5) sweep.push(evalX(x));
      const rows = [
        ['Max energy capacity (MAOP → min delivery)', fmt(ng.capMW, 0), fmt(b.capMW, 0), pct(b.capMW / ng.capMW), 'MW'],
        [v.mode === 'energy' ? 'Energy delivered (fixed)' : 'Energy delivered at max flow', fmt(ng.MW, 0), fmt(b.MW, 0), pct(b.MW / ng.MW), 'MW'],
        ['Mass flow', fmt(ng.mdot, 1), fmt(b.mdot, 1), pct(b.mdot / ng.mdot), 'kg/s'],
        ['Standard volumetric flow', fmt(ng.q, 2), fmt(b.q, 2), pct(b.q / ng.q), 'MMSCMD'],
        ['Required inlet pressure', fmt(ng.p1, 1), fmt(b.p1, 1), b.feasible ? chip('g', '≤ MAOP') : chip('r', 'Exceeds MAOP'), 'barg'],
        ['Compressor shaft power (recompress segment drop)', fmt(ng.power, 2), fmt(b.power, 2), pct(b.power / ng.power), 'MW'],
        ['Isentropic head / stages (ratio ≤ 3)', `${fmt(ng.head, 0)} / ${ng.stages}`, `${fmt(b.head, 0)} / ${b.stages}`, '', 'kJ/kg'],
        ['Driver energy input', fmt(ng.drvIn, 2), fmt(b.drvIn, 2), '', 'MW'],
        [`<b>Transport energy loss (compression) per ${v.len} km</b>`, `<b>${fmt(ng.lossPct, 3)}</b>`, `<b>${fmt(b.lossPct, 3)}</b>`, '× ' + fmt(b.lossPct / ng.lossPct, 2), '% of energy'],
        ['Energy loss per 100 km', fmt(ng.lossPct / v.len * 100, 3), fmt(b.lossPct / v.len * 100, 3), '', '% / 100 km'],
        ['Leakage energy loss', fmt(ng.leakE, 4), fmt(b.leakE, 4), `vol × ${fmt(b.leakV, 2)}`, '% of energy'],
        ['Outlet velocity', fmt(ng.vOut, 1), fmt(b.vOut, 1), b.vOut > b.vEros ? chip('r', '> erosional') : chip('g', 'OK'), 'm/s'],
        ['API RP 14E erosional velocity (C = 100)', fmt(ng.vEros, 1), fmt(b.vEros, 1), ref('R52'), 'm/s'],
        ['Line-pack energy', fmt(ng.lpGJ / 1000, 1), fmt(b.lpGJ / 1000, 1), pct(b.lpGJ / ng.lpGJ), 'TJ'],
        ['Wobbe index (gross)', fmt(ng.W, 2), fmt(b.W, 2), pct(b.W / ng.W - 1).replace(' %', ' % Δ'), 'MJ/m³'],
        ['H2 partial pressure at MAOP', '0', fmt(b.pH2, 2), '', 'bar(a)']
      ];
      let html = card(`Natural gas vs ${v.h2} % H2 blend — ${v.mode === 'energy' ? 'same energy delivered' : 'same pressures'}`, table(['Quantity', 'Natural gas', `${v.h2} % H2`, 'Ratio / status', 'Unit'], rows, { num: [0, 1, 1, 0, 0] }) +
        note(`Energy loss = compressor driver energy needed to restore the pressure drop of this segment, divided by the energy delivered. ${v.driver === 'gt' ? 'With gas-turbine drivers this is fuel gas consumed from the line.' : 'With electric drivers this is grid electricity.'} Method: isothermal general flow equation ${ref('R45')} and multi-stage isentropic compression ${ref('R46')}.`));
      html += card('Effect of blend level', lineChart({ title: 'Energy capacity and compression energy vs H2 fraction', xLabel: 'H2 in blend (mol %)', yLabel: 'Ratio to natural gas', series: [{ name: 'Max energy capacity (same pressures)', pts: sweep.map(s => [s.x, s.capMW / ng.capMW]) }, { name: 'Compression energy per unit energy delivered', pts: sweep.map(s => [s.x, s.lossPct / ng.lossPct]), ci: 1 }, { name: 'Standard volume flow for same energy', pts: sweep.map(s => [s.x, s.q / ng.q * (v.mode === 'energy' ? 1 : ng.MW / s.MW)]), ci: 2, dash: true }], vLines: [{ x: v.h2, label: 'Selected' }] }) +
        lineChart({ title: 'Outlet velocity vs H2 fraction', xLabel: 'H2 in blend (mol %)', yLabel: 'm/s', series: [{ name: 'Outlet velocity', pts: sweep.map(s => [s.x, s.vOut]), ci: 3 }, { name: 'Erosional velocity (API RP 14E)', pts: sweep.map(s => [s.x, s.vEros]), ci: 4, dash: true }] }) +
        (v.mode === 'energy' && sweep.some(s => !s.feasible) ? note(`Above ~${sweep.find(s => !s.feasible).x} % H2 the fixed energy demand cannot be delivered within MAOP for this segment — more compression stations or looping would be needed.`, 'warn') : ''));
      const tol = D.TOLERANCE.map(t => [t.c, fmt(t.pct, t.pct < 1 ? 1 : 0) + ' %', chip(v.h2 <= t.pct ? 'g' : 'r', v.h2 <= t.pct ? 'Within' : 'Exceeds'), t.note, ref(...t.src.split(', '))]);
      html += card('Materials exposure at this blend', kv([
        ['H2 partial pressure at MAOP', fmt(b.pH2, 2), 'bar(a)', ref('R39')],
        ['Fracture toughness', b.pH2 > 0 ? 'Reduced — knock-down applies even below 1 bar H2' : '—', '', ref('R39', 'R38')],
        ['Fatigue crack growth (intermediate ΔK)', b.pH2 > 0 ? `×${fmt(Math.sqrt(Math.max(b.pH2, 0.01) / 1060), 3)} of 106 MPa CC2938 low-ΔK rate (still ≫ air)` : '—', '', ref('R14', 'R15')],
        ['Recommended', b.pH2 > 0 ? 'Assess flaws with Fatigue & fracture module at this pH2; hardness ≤ 250/235 HV10' : '', '', ref('R2')]
      ])) + card('End-use & component tolerance check', table(['Component / end use', 'Typical max H2', 'At ' + v.h2 + ' %', 'Note', 'Ref'], tol));
      return { html, csv: { name: 'blend_sweep', rows: [['H2_pct', 'cap_MW', 'MW_delivered', 'mdot_kg_s', 'MMSCMD', 'p_inlet_barg', 'comp_power_MW', 'driver_MW', 'energy_loss_pct', 'v_out_m_s', 'linepack_TJ', 'leak_energy_pct', 'Wobbe'], ...sweep.map(s => [s.x, s.capMW.toFixed(1), s.MW.toFixed(1), s.mdot.toFixed(3), s.q.toFixed(3), s.p1.toFixed(2), s.power.toFixed(3), s.drvIn.toFixed(3), s.lossPct.toFixed(4), s.vOut.toFixed(2), (s.lpGJ / 1000).toFixed(2), s.leakE.toFixed(5), s.W.toFixed(3)])] } };
    }
  });

  /* ================================================================ NEW DESIGN */
  const flowToMdot = (c, unit, val) => unit === 'MW' ? E.mdotFromMW(c, val, basis()) : unit === 'kgs' ? val : unit === 'tpd' ? val / 86.4 : val * 1e6 / 86400 * E.isoProps(c).rho;
  MODS.push({
    id: 'design', group: 'Transport routes', nav: 'New H2 pipeline design', title: 'New hydrogen pipeline — hydraulic and mechanical design (ASME B31.12)',
    intro: 'Sizes a new pipeline for a hydrogen (or blend) duty: evaluates every standard NPS, selects the smallest feasible size, computes wall thickness with the B31.12 material performance factor, hydrotest, ductile-fracture arrest toughness (BTCM) and compression. The selected design feeds the <a href="#linepipe">line pipe specification</a> and <a href="#equipment">equipment datasheets</a>.',
    sections: [
      { title: 'Duty', fields: [
        { k: 'h2', l: 'Hydrogen content', u: 'mol %', v: 100 },
        { k: 'unit', l: 'Flow unit', t: 'sel', o: [['MW', 'MW (energy basis per settings)'], ['kgs', 'kg/s'], ['tpd', 'tonne/day'], ['mmscmd', 'MMSCMD (15 °C)']], v: 'tpd' },
        { k: 'flow', l: 'Design flow', u: '', v: 500 },
        { k: 'len', l: 'Length', u: 'km', v: 150 },
        { k: 'pin', l: 'Inlet (compressor discharge) pressure', u: 'barg', v: 60 },
        { k: 'pdes', l: 'Design pressure', u: 'barg', v: 65 },
        { k: 'pmin', l: 'Minimum delivery pressure', u: 'barg', v: 30 },
        { k: 'psrc', l: 'Source pressure (electrolyser / plant)', u: 'barg', v: 30 },
        { k: 'temp', l: 'Flowing temperature', u: '°C', v: 20 }, { k: 'dz', l: 'Elevation change', u: 'm', v: 0 }] },
      { title: 'Mechanical design', fields: [
        { k: 'opt', l: 'B31.12 method', t: 'sel', o: [['A', 'Option A — prescriptive'], ['B', 'Option B — performance-based']], v: 'A', ref: 'R2' },
        { k: 'loc', l: 'Location class', t: 'sel', o: locOpts, v: 1 },
        { k: 'grade', l: 'Grade', t: 'sel', o: gradeOpts, v: 'X52 (L360)', ref: 'R3' },
        { k: 'tdes', l: 'Design temperature', u: '°C', v: 50 }, { k: 'tmin', l: 'Minimum design temperature', u: '°C', v: -10 },
        { k: 'ca', l: 'Corrosion allowance', u: 'mm', v: 0, h: 'Dry H2: 0 typical; add for blends with water risk' },
        { k: 'dtMax', l: 'Max D/t (constructability)', u: '–', v: 96 },
        { k: 'tMin', l: 'Minimum wall', u: 'mm', v: 6.4 }] },
      { title: 'Hydraulic criteria', fields: [
        { k: 'rough', l: 'Internal roughness', u: 'mm', v: 0.0457, h: '0.005–0.01 with internal flow coat' }, { k: 'eff', l: 'Efficiency factor', u: '–', v: 0.95 },
        { k: 'vmax', l: 'Max velocity', u: 'm/s', v: 20, h: 'Noise/erosion/ILI-speed limit; EIGA velocity guidance ' }, { k: 'nps', l: 'Force NPS (0 = automatic)', u: 'in', v: 0, step: 1 },
        { k: 'eta', l: 'Compressor isentropic efficiency', u: '–', v: 0.78 }] }
    ],
    compute(v) {
      const t = T(); const c = mix(v.h2); const mdot = flowToMdot(c, v.unit, v.flow); const Tk = v.temp + 273.15; const g = U.gradeBy(v.grade);
      const Tf = E.tempDerating(v.tdes); const F = (v.opt === 'B' ? t.F_B : t.F_A)[v.loc];
      const hf = v.opt === 'B' ? 1 : E.hfLookup(t.hf, g.smts, v.pdes / 10).hf;
      const cands = [];
      for (const [nps, OD] of D.PIPE_OD) {
        if (OD < 100) continue;
        const treq = v.pdes / 10 * OD / (2 * g.smys * F * Tf * hf) + v.ca;
        const tsel = D.WALLS.find(w => w >= Math.max(treq, v.tMin, OD / v.dtMax)) || NaN;
        if (!isFinite(tsel)) continue;
        const ID = (OD - 2 * tsel) / 1000; const A = Math.PI * ID * ID / 4;
        const out = E.pipeOutlet({ c, D: ID, L: v.len * 1000, p1: bar(v.pin), mdot, T: Tk, rough: v.rough / 1000, E: v.eff, dz: v.dz });
        const p2 = barg(out.p2); const st2 = isFinite(out.p2) ? E.state(c, out.p2, Tk) : null; const vOut = st2 ? mdot / (st2.rho * A) : Infinity;
        const ok = isFinite(p2) && p2 >= v.pmin && vOut <= v.vmax;
        cands.push({ nps, OD, treq, tsel, ID, p2, vOut, ok, hoop: v.pdes * OD / (20 * tsel) / g.smys * 100, steel: Math.PI * (OD - tsel) * tsel * 7.85 / 1000 });
      }
      let sel = v.nps > 0 ? cands.find(x => x.nps === v.nps) : cands.find(x => x.ok);
      if (!sel) sel = cands[cands.length - 1];
      let html = card('Size screening (all standard NPS)', table(['NPS', 'OD mm', 't req mm', 't sel mm', 'Outlet barg', 'Outlet v m/s', 'Hoop % SMYS', 'Steel t/km', 'Status'],
        cands.map(x => ({ _cls: x === sel ? 'sel' : '', cells: [x.nps + '"', fmt(x.OD, 1), fmt(x.treq, 2), fmt(x.tsel, 1), isFinite(x.p2) ? fmt(x.p2, 1) : 'infeasible', isFinite(x.vOut) ? fmt(x.vOut, 1) : '—', fmt(x.hoop, 1), fmt(x.steel, 1), x.ok ? chip('g', 'Feasible') : chip('r', !isFinite(x.p2) || x.p2 < v.pmin ? 'Δp too high' : 'Velocity')] })), { num: [0, 1, 1, 1, 1, 1, 1, 1, 0] }) +
        note(`t = P·D/(2·S·F·E·T·Hf) + CA with F = ${F}, Hf = ${fmt(hf, 3)}, T = ${fmt(Tf, 3)}; wall rounded up to the next standard thickness, D/t ≤ ${v.dtMax}. ${ref('R2')}`));
      if (!sel) return { html };
      const P0 = v.pdes / 10; const hydroRatio = Math.max(t.hydro[v.loc], 1.25); // 1.25 floor adopted for H2 service (tool default)
      const bt = E.btcm({ D: sel.OD, t: sel.tsel, SMYS: g.smys, P0: P0 + 0.101, T: Tk, c });
      const cvnReq = Math.max(t.limits.cvnMin, isFinite(bt.cvn) ? (bt.cvnLeis || bt.cvn) : 0);
      const comp = v.pin > v.psrc ? E.compressor({ c, mdot, ps: bar(v.psrc), pd: bar(v.pin), Ts: Tk, eta: v.eta, maxRatio: 3 }) : null;
      const lp = E.linepack({ c, D: sel.ID / 1, L: v.len * 1000, p1: bar(v.pin), p2: bar(Math.max(sel.p2, 0)), T: Tk });
      const prof = []; for (let i = 0; i <= 20; i++) { const Li = v.len * 1000 * i / 20; const o = i ? E.pipeOutlet({ c, D: sel.ID, L: Li, p1: bar(v.pin), mdot, T: Tk, rough: v.rough / 1000, E: v.eff, dz: v.dz * i / 20 }) : { p2: bar(v.pin) }; prof.push([Li / 1000, barg(o.p2)]); }
      const maop = E.barlowP(g.smys, sel.tsel - v.ca, sel.OD, F, 1, Tf, v.opt === 'B' ? 1 : E.hfLookup(t.hf, g.smts, v.pdes / 10).hf) * 10;
      html += card(`Selected design: ${sel.nps}" × ${fmt(sel.tsel, 1)} mm ${esc(v.grade)} PSL2`, kv([
        ['Mass flow / energy flow', `${fmt(mdot, 3)} kg/s / ${fmt(E.energyMW(c, mdot, basis()), 0)} MW`, basis()],
        ['Standard volume flow', fmt(E.stdFlow(c, mdot) * 86400 / 1e6, 3), 'MMSCMD'],
        ['Design pressure / max allowable (with selected wall)', `${fmt(v.pdes, 1)} / ${fmt(maop, 1)}`, 'barg', ref('R2')],
        ['Hoop stress at design pressure', fmt(sel.hoop, 1), '% SMYS'],
        ['Hydrostatic test pressure (min.)', `${fmt(v.pdes * hydroRatio, 1)} (${hydroRatio} × DP; ≥ 1.25 used for H2) → ${fmt(v.pdes * hydroRatio * sel.OD / (20 * sel.tsel) / g.smys * 100, 0)} % SMYS`, 'barg', ref('R60')],
        ['Outlet pressure at design flow', fmt(sel.p2, 1), 'barg', ref('R45')],
        ['Max velocity (outlet)', fmt(sel.vOut, 1), 'm/s'],
        ['Line pack (operating)', `${fmt(lp.mass / 1000, 1)} t / ${fmt(lp.energyGJ / 1000, 1)} TJ`, ''],
        ['Ductile-fracture arrest CVN (BTCM)', isFinite(bt.cvn) ? fmt(bt.cvn, 0) + (bt.cvnLeis ? ` (Leis-corrected ${fmt(bt.cvnLeis, 0)})` : '') : bt.note, 'J', ref('R18', 'R20')],
        ['Specified CVN (max of arrest and 40 J floor) at ' + v.tmin + ' °C', fmt(cvnReq, 0), 'J (full size)', ref('R19')],
        ['Decompression wave speed at initial state', fmt(bt.c0, 0), 'm/s'],
        comp ? ['Inlet compression ' + v.psrc + ' → ' + v.pin + ' barg', `${fmt(comp.power / 1e6, 2)} MW, ${comp.stages} stage(s), Td ${fmt(comp.Td - 273.15, 0)} °C`, '', ref('R46', 'R47')] : null,
        comp ? ['Compression energy / energy transported', fmt(comp.power / 1e6 / E.energyMW(c, mdot, basis()) * 100, 2), '%'] : null
      ]) + note('Pure H2 decompresses at ~1 200–1 300 m/s, so running ductile fracture is rarely governing; blends with heavy hydrocarbons need a full GASDECOM check. ' + ref('R18')));
      html += card('Pressure profile', lineChart({ title: 'Pressure along the pipeline at design flow', xLabel: 'Distance (km)', yLabel: 'barg', series: [{ name: 'Pressure', pts: prof }], hLines: [{ y: v.pmin, label: 'Min delivery' }, { y: v.pdes, label: 'Design pressure' }] }));
      S().design = { nps: sel.nps, OD: sel.OD, WT: sel.tsel, grade: v.grade, smys: g.smys, smts: g.smts, pdes: v.pdes, maop, pin: v.pin, pmin: v.pmin, h2: v.h2, mdot, vmax: sel.vOut, cvn: cvnReq, tmin: v.tmin, opt: v.opt, loc: v.loc, len: v.len, temp: v.temp, sos: E.state(c, bar(v.pin), Tk).c, power: comp ? comp.power / 1e3 : 0, stages: comp ? comp.stages : 0, psrc: v.psrc, hydro: v.pdes * hydroRatio };
      U.save();
      return { html, csv: { name: 'new_pipeline_size_screening', rows: [['NPS', 'OD_mm', 't_req_mm', 't_sel_mm', 'p_out_barg', 'v_out_m_s', 'hoop_pct_SMYS', 'steel_t_per_km', 'feasible'], ...cands.map(x => [x.nps, x.OD, x.treq.toFixed(2), x.tsel, x.p2.toFixed(2), x.vOut.toFixed(2), x.hoop.toFixed(1), x.steel.toFixed(1), x.ok])] } };
    }
  });

  /* ================================================================ CGD */
  MODS.push({
    id: 'cgd', group: 'Transport routes', nav: 'CGD blending & Wobbe', title: 'Hydrogen blending in city gas distribution — Wobbe index & interchangeability',
    intro: 'Shows how the blend level changes Wobbe index, heating value, appliance heat input, flame speed and CO₂, against the selected gas-quality range, and lists component limits for CGD networks (including India PNGRB preliminary limits).',
    sections: [
      { title: 'Blend & standard', fields: [
        { k: 'h2', l: 'Hydrogen in blend', u: 'mol %', v: 10 },
        { k: 'hmax', l: 'Sweep up to', u: 'mol %', v: 30 },
        { k: 'std', l: 'Wobbe acceptance range', t: 'sel', o: () => Object.keys(D.WOBBE_STD), v: 'UK GS(M)R (from Apr 2025)', ref: 'R36' },
        { k: 'wmin', l: 'Custom range — min', u: 'MJ/m³', v: 47.0 }, { k: 'wmax', l: 'Custom range — max', u: 'MJ/m³', v: 52.0 },
        { k: 'band', l: 'Appliance adjustment band about base-gas Wobbe', u: '± %', v: 5, h: 'Heat-input tolerance of installed appliances' }] },
      { title: 'Network (for capacity note)', fields: [
        { k: 'pnet', l: 'Network operating pressure', u: 'barg', v: 4 }, { k: 'temp', l: 'Gas temperature', u: '°C', v: 15 }] }
    ],
    compute(v) {
      const rng = v.std === 'Custom range' ? [v.wmin, v.wmax] : D.WOBBE_STD[v.std];
      const base = E.isoProps(mix(0)); const sl = x => { const tb = D.SL_TABLE; for (let i = 1; i < tb.length; i++) if (x <= tb[i][0]) return tb[i - 1][1] + (tb[i][1] - tb[i - 1][1]) * (x - tb[i - 1][0]) / (tb[i][0] - tb[i - 1][0]); return tb[tb.length - 1][1]; };
      const rows = []; const pts = []; let maxStd = null, maxBand = null;
      for (let x = 0; x <= v.hmax + 1e-9; x += (v.hmax <= 30 ? 1 : 5)) {
        const c = mix(x), i = E.isoProps(c), f = E.flammability(c);
        const dW = (i.W / base.W - 1) * 100; const inStd = i.W >= rng[0] && i.W <= rng[1]; const inBand = Math.abs(dW) <= v.band;
        if (inStd) maxStd = x; if (inBand) maxBand = x;
        rows.push({ x, i, f, dW, inStd, inBand, sl: sl(x), co2: (1 - E.co2PerGJ(c) / E.co2PerGJ(mix(0))) * 100, vol: base.HsV / i.HsV });
        pts.push([x, i.W]);
      }
      const at = rows.reduce((a, r) => Math.abs(r.x - v.h2) < Math.abs(a.x - v.h2) ? r : a, rows[0]);
      const cur = { c: mix(v.h2) }; cur.i = E.isoProps(cur.c); cur.dW = (cur.i.W / base.W - 1) * 100;
      let html = card(`At ${v.h2} % H2`, kv([
        ['Wobbe index (gross, 15/15 °C)', `${fmt(cur.i.W, 2)} (base ${fmt(base.W, 2)})`, 'MJ/m³', ref('R40')],
        ['Change in Wobbe → appliance heat input at fixed nozzle & pressure', fmt(cur.dW, 2), '%'],
        ['Gross CV', `${fmt(cur.i.HsV, 2)} (base ${fmt(base.HsV, 2)})`, 'MJ/m³'],
        ['Relative density', fmt(cur.i.d, 4), '–'],
        ['Volume to deliver the same energy (billing volume)', '+' + fmt((base.HsV / cur.i.HsV - 1) * 100, 1), '%'],
        ['Network energy capacity at same pressure drop (∝ Wobbe)', fmt(cur.i.W / base.W * 100, 1), '% of NG'],
        ['Stoichiometric laminar burning velocity', `${fmt(sl(v.h2), 2)} (NG ${fmt(sl(0), 2)})`, 'm/s', ref('R49')],
        ['CO₂ reduction per unit energy', fmt((1 - E.co2PerGJ(cur.c) / E.co2PerGJ(mix(0))) * 100, 1), '%'],
        [`Within ${esc(v.std)} [${rng[0]}–${rng[1]}]`, cur.i.W >= rng[0] && cur.i.W <= rng[1] ? chip('g', 'Yes') : chip('r', 'No'), ''],
        [`Max H2 within range / within ±${v.band} % band`, `${maxStd ?? '—'} % / ${maxBand ?? '—'} %`, 'mol %']
      ]));
      html += card('Wobbe index vs hydrogen fraction', lineChart({ xLabel: 'H2 in blend (mol %)', yLabel: 'Wobbe index MJ/m³', yMin: Math.min(rng[0], ...pts.map(p => p[1])) - 1, yMax: Math.max(rng[1], base.W) + 1, series: [{ name: 'Blend Wobbe index', pts }, { name: `Base −${v.band} % appliance band`, pts: pts.map(p => [p[0], base.W * (1 - v.band / 100)]), ci: 1, dash: true }], hLines: [{ y: rng[0], label: 'Range min' }, { y: rng[1], label: 'Range max' }], vLines: [{ x: v.h2, label: v.h2 + ' %' }] }) +
        note('EN 437 test gas G222 (23 % H2) is the light-back limit gas for 2H appliances — appliances certified to it have demonstrated flashback resistance at that blend. ' + ref('R50')));
      html += card('Interchangeability table', table(['H2 %', 'HHV MJ/m³', 'Rel. density', 'Wobbe MJ/m³', 'ΔW %', 'S_L m/s', 'CO₂ cut %', 'Range', `±${v.band} % band`], rows.map(r => [r.x, fmt(r.i.HsV, 2), fmt(r.i.d, 4), fmt(r.i.W, 2), fmt(r.dW, 2), fmt(r.sl, 2), fmt(r.co2, 1), chip(r.inStd ? 'g' : 'r', r.inStd ? 'In' : 'Out'), chip(r.inBand ? 'g' : 'a', r.inBand ? 'In' : 'Out')]), { num: [1, 1, 1, 1, 1, 1, 1, 0, 0] }));
      const cgdT = D.TOLERANCE.filter(t => /India|CGD|PE80|appliance|burner|meter|chromat|CNG|engine/i.test(t.c));
      html += card('CGD component limits', table(['Component', 'Limit', `At ${v.h2} %`, 'Note', 'Ref'], cgdT.map(t => [t.c, t.pct + ' %', chip(v.h2 <= t.pct ? 'g' : 'r', v.h2 <= t.pct ? 'OK' : 'Exceeds'), t.note, ref(...t.src.split(', '))])) +
        note('India: PNGRB has issued preliminary component limits (2024) and approved pilots at 2–8 % (e.g. NTPC–GGL Kavas 8 %); no final national cap is notified yet. ' + ref('R37'), 'warn'));
      return { html, csv: { name: 'cgd_wobbe_table', rows: [['H2_pct', 'HHV_MJ_m3', 'rel_density', 'Wobbe_MJ_m3', 'dW_pct', 'SL_m_s', 'CO2_cut_pct', 'in_range', 'in_band'], ...rows.map(r => [r.x, r.i.HsV.toFixed(3), r.i.d.toFixed(5), r.i.W.toFixed(3), r.dW.toFixed(3), r.sl.toFixed(3), r.co2.toFixed(2), r.inStd, r.inBand])] } };
    }
  });
})();
