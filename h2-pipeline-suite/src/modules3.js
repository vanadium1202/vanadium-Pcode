/* =====================================================================
   Modules part 3: Line pipe specification, Instruments & equipment,
   Files & library, Code tables, Verification, References, About
   ===================================================================== */
(function () {
  'use strict';
  const E = window.H2E, D = window.H2D, U = window.H2U;
  const { fmt, ref, chip, kv, table, card, note, esc } = U;
  const MODS = window.H2M;
  const S = () => U.S;
  const des = () => S().design || {};
  const proj = () => S().m.project || {};
  const ansiClass = dp => dp <= 19.6 ? 150 : dp <= 51.1 ? 300 : dp <= 102.1 ? 600 : dp <= 153.2 ? 900 : dp <= 255.3 ? 1500 : 2500;

  /* ================================================================ LINE PIPE SPEC */
  MODS.push({
    id: 'linepipe', group: 'Specifications', nav: 'Line pipe specification', title: 'Line pipe specification for a new hydrogen pipeline',
    intro: 'Generates a purchase specification (supplementary to API 5L / ISO 3183 PSL2) for hydrogen service. Defaults come from the <a href="#design">New H2 pipeline design</a>; every requirement is editable. Export as HTML or Word (.doc).',
    sections: () => [
      { title: 'Document', fields: [
        { k: 'spec', l: 'Specification number', t: 'txt', v: 'LPS-H2-001' }, { k: 'rev', l: 'Revision', t: 'txt', v: '0' }] },
      { title: 'Pipe data', fields: [
        { k: 'OD', l: 'Outside diameter', u: 'mm', v: () => des().OD || 508 }, { k: 'WT', l: 'Wall thickness', u: 'mm', v: () => des().WT || 9.5 },
        { k: 'grade', l: 'Grade', t: 'sel', o: () => D.GRADES.map(g => g.g), v: () => des().grade || 'X52 (L360)' },
        { k: 'seam', l: 'Manufacturing process', t: 'sel', o: ['HFW (seam normalised)', 'LSAW (UOE/JCOE)', 'Seamless', 'HSAW (spiral)'], v: 'HFW (seam normalised)' },
        { k: 'route', l: 'Steel processing', t: 'sel', o: ['TMCP (thermomechanical rolled, M)', 'Normalised (N)', 'Quenched & tempered (Q)'], v: 'TMCP (thermomechanical rolled, M)' },
        { k: 'len', l: 'Pipe length', u: 'm', v: 12.2 }, { k: 'qty', l: 'Quantity', u: 'km', v: () => des().len || 150 },
        { k: 'dp', l: 'Design pressure', u: 'barg', v: () => des().pdes || 65 }, { k: 'tmin', l: 'Minimum design temperature', u: '°C', v: () => des().tmin ?? -10 },
        { k: 'h2', l: 'Hydrogen content', u: 'mol %', v: () => des().h2 ?? 100 }] },
      { title: 'Chemistry limits (max wt %)', fields: [
        { k: 'C', l: 'C', v: 0.10 }, { k: 'Si', l: 'Si', v: 0.40 }, { k: 'Mn', l: 'Mn', v: 1.40 }, { k: 'P', l: 'P', v: 0.015, ref: 'R2' }, { k: 'S', l: 'S', v: 0.003, ref: 'R61' },
        { k: 'NbVTi', l: 'Nb + V + Ti', v: 0.15 }, { k: 'Cu', l: 'Cu', v: 0.35 }, { k: 'Ni', l: 'Ni', v: 0.30 }, { k: 'Cr', l: 'Cr', v: 0.30 }, { k: 'Mo', l: 'Mo', v: 0.15 },
        { k: 'Bmax', l: 'B', v: 0.0005 }, { k: 'N', l: 'N', v: 0.010 }, { k: 'ce', l: 'CE(IIW)', v: 0.40, ref: 'R3' }, { k: 'pcm', l: 'CE(Pcm)', v: 0.20 }] },
      { title: 'Mechanical & toughness', fields: [
        { k: 'yt', l: 'Max Y/T ratio', u: '–', v: 0.90 }, { k: 'ysx', l: 'Max yield strength', u: 'MPa', v: () => (U.gradeBy(des().grade || 'X52 (L360)')).ymax },
        { k: 'hvb', l: 'Max hardness base metal', u: 'HV10', v: 250, ref: ['R3', 'R4'] }, { k: 'hvw', l: 'Max hardness weld & HAZ', u: 'HV10', v: 235, ref: 'R2' },
        { k: 'cvn', l: 'CVN pipe body, average (full size)', u: 'J', v: () => Math.ceil(des().cvn || 60), ref: ['R18', 'R19'] }, { k: 'cvnw', l: 'CVN weld & HAZ, average', u: 'J', v: 40 },
        { k: 'dwtt', l: 'DWTT shear area (avg.)', u: '%', v: 85, ref: 'R19' }] },
      { title: 'Hydrogen qualification', fields: [
        { k: 'tKIH', l: 'KIH test in gaseous H2 (ASTM E1681 / ASME KD-10)', t: 'chk', v: true, ref: 'R51' }, { k: 'kih', l: 'KIH acceptance (min.)', u: 'MPa√m', v: 55, ref: 'R2' },
        { k: 'tFCG', l: 'Fatigue crack growth test in H2 (ASTM E647)', t: 'chk', v: true }, { k: 'tJR', l: 'J-R fracture toughness in H2 (ASTM E1820)', t: 'chk', v: false },
        { k: 'tHIC', l: 'HIC test as cleanliness check (NACE TM0284)', t: 'chk', v: true, ref: 'R53' }, { k: 'tMicro', l: 'Microstructure & banding examination', t: 'chk', v: true },
        { k: 'coat', l: 'External coating', t: 'sel', o: ['3LPE (ISO 21809-1)', 'FBE (ISO 21809-2)', '3LPP (ISO 21809-1)', 'None'], v: '3LPE (ISO 21809-1)' },
        { k: 'flow', l: 'Internal flow coat (epoxy, API RP 5L2)', t: 'chk', v: false }] }
    ],
    compute(v) {
      const g = U.gradeBy(v.grade); const smysKsi = g.smys / 6.894757; const d = des();
      const issues = [];
      if (v.grade.startsWith('X7') || v.grade.startsWith('X8')) issues.push([chip('a', 'Grade'), 'Above X65: Option A Hf penalty is large; Option B requires KIH qualification of base, seam and HAZ.']);
      if (v.hvb > 250) issues.push([chip('r', 'Hardness'), 'Base-metal hardness limit above 250 HV10 is not recommended for hydrogen service.']);
      if (v.hvw > 235) issues.push([chip('r', 'Weld hardness'), 'B31.12 limits weld/HAZ hardness to 235 HV10.']);
      if (v.P > 0.015) issues.push([chip('a', 'Phosphorus'), 'B31.12 Option B requires P ≤ 0.015 %.']);
      if (d.cvn && v.cvn < d.cvn) issues.push([chip('r', 'Toughness'), `CVN below the design requirement (${fmt(d.cvn, 0)} J from fracture-arrest analysis).`]);
      if (!v.tKIH && d.opt === 'B') issues.push([chip('r', 'Option B'), 'Option B design requires KIH testing.']);
      if (!v.tKIH && !v.tJR && d.opt === 'IGEM') issues.push([chip('r', 'IGEM Supp 2'), 'IGEM/TD/1 Supplement 2 requires fracture-toughness testing in hydrogen — select KIH or J-R testing.']);
      if (d.opt === 'IGEM' && v.ce > 0.43) issues.push([chip('a', 'CE'), 'UK practice for hydrogen pipelines limits CE(IIW) to 0.43.']);
      if (d.opt === 'CSA') issues.push([chip('a', 'CSA Z662 Cl. 17'), 'Clause 17 requires an engineering assessment of material selection for hydrogen — attach the hydrogen test results of §7 to that assessment.']);
      const chem = [['C', v.C], ['Si', v.Si], ['Mn', v.Mn], ['P', v.P], ['S', v.S], ['Nb+V+Ti', v.NbVTi], ['Cu', v.Cu], ['Ni', v.Ni], ['Cr', v.Cr], ['Mo', v.Mo], ['B', v.Bmax], ['N', v.N], ['CE(IIW)', v.ce], ['CE(Pcm)', v.pcm]];
      const tests = [];
      if (v.tKIH) tests.push(['Threshold stress intensity KIH', `ASTM E1681 constant-displacement (or rising-load per ASME VIII-3 KD-10) in ≥ 99.999 % H2 at ≥ ${fmt(v.dp, 0)} bar(a), room temperature`, `KIH ≥ ${v.kih} MPa√m for base metal, seam weld and HAZ`, 'First heat per process qualification + 1 per 50 heats']);
      if (v.tFCG) tests.push(['Fatigue crack growth rate in H2', `ASTM E647, gaseous H2 at design pressure, R = 0.5, f ≤ 1 Hz`, 'da/dN not exceeding ASME CC2938 design curve (pressure-adjusted)', 'Process qualification']);
      if (v.tJR) tests.push(['Fracture toughness in H2', 'ASTM E1820 J-R in gaseous H2 at design pressure', 'J0.2 / KJIc ≥ purchaser value', 'Process qualification']);
      if (v.tHIC) tests.push(['HIC (cleanliness indicator)', 'NACE TM0284 solution A, 96 h', 'CLR ≤ 15 %, CTR ≤ 5 %, CSR ≤ 2 % (avg. per pipe)', 'First 3 heats, then 1 per 10 heats']);
      if (v.tMicro) tests.push(['Microstructure', 'Metallography of body, seam, HAZ', 'Fine ferrite–pearlite / acicular ferrite; no martensite or upper-bainite bands; centreline segregation ≤ Mannesmann class 2; inclusion rating ASTM E45 ≤ 1.5 thin', 'Process qualification + 1 per heat']);
      const sec = (n, t, b) => `<section class="spec-sec"><h4>${n}. ${t}</h4>${b}</section>`;
      const doc = `<div class="spec-doc"><header><p class="eyebrow">Purchase specification · supplementary to API Spec 5L / ISO 3183 PSL2</p><h3>${esc(v.spec)} rev ${esc(v.rev)} — Line pipe for hydrogen service</h3><p>${esc(S().meta.project)}</p></header>
        ${sec(1, 'Scope', `<p>Requirements for ${esc(v.seam)} line pipe, ${fmt(v.OD, 1)} mm OD × ${fmt(v.WT, 1)} mm WT, grade ${esc(v.grade)}${v.route.match(/\((\w)\)/) ? v.route.match(/\((\w)\)/)[1] : ''} PSL2, for a pipeline conveying ${v.h2} mol % hydrogen at a design pressure of ${fmt(v.dp, 1)} barg (${fmt(v.dp * 14.5038, 0)} psig), designed to ${esc((D.CODES.find(c => c.k === (des().opt || 'A')) || D.CODES[0]).l)}. Total quantity ${fmt(v.qty, 1)} km (${Math.ceil(v.qty * 1000 / v.len)} pipes of ${v.len} m nominal). These requirements supplement API 5L; where they differ, this specification governs.</p>`)}
        ${sec(2, 'Normative references', `<p>API Spec 5L (46th/47th ed.) / ISO 3183:2019; ASME B31.12-2023; IGEM/TD/1 Ed. 6 Supplement 2; CSA Z662:23 Clause 17; EIGA Doc 121/14; ASME BPVC VIII-3 KD-10 & Code Case 2938; ASTM E1681, E647, E1820, E45, E384; NACE TM0284; ISO 10893 (NDT); ISO 21809 (coatings); EN 10204 (inspection documents).</p>`)}
        ${sec(3, 'Manufacturing', `<ul><li>Steel: fully killed, fine-grain, ${esc(v.route)}; vacuum degassed; calcium treated for inclusion-shape control (Ca/S ≥ 1.5).</li><li>Process: ${esc(v.seam)}; the manufacturing procedure specification (MPS) shall be qualified by a first-day production test including all hydrogen tests in §7.</li><li>No cold expansion > 1.5 % for SAW pipe; HFW seams fully normalised (full-body or seam heat treatment) with seam hardness ≤ ${v.hvw} HV10.</li><li>Repair welding of pipe body not permitted; seam repairs limited per API 5L and qualified with hardness ≤ ${v.hvw} HV10.</li></ul>`)}
        ${sec(4, 'Chemical composition (product analysis, max wt %)', table(chem.map(c => c[0]), [chem.map(c => fmt(c[1], c[1] < 0.01 ? 4 : 3))]) + '<p>CE(IIW) = C + Mn/6 + (Cr+Mo+V)/5 + (Ni+Cu)/15; CE(Pcm) = C + Si/30 + (Mn+Cu+Cr)/20 + Ni/60 + Mo/15 + V/10 + 5B. Intentional additions of B are not permitted.</p>')}
        ${sec(5, 'Mechanical properties', table(['Property', 'Requirement'], [['Yield strength Rt0.5', `${g.smys} – ${fmt(v.ysx, 0)} MPa`], ['Tensile strength Rm', `${g.smts} – ${g.tmax} MPa`], ['Y/T ratio', `≤ ${v.yt}`], ['Elongation', 'Per API 5L Table 7 formula'], ['Hardness — body', `≤ ${v.hvb} HV10`], ['Hardness — weld & HAZ', `≤ ${v.hvw} HV10`], ['CVN at ' + v.tmin + ' °C — body (avg/min)', `${v.cvn} / ${Math.round(v.cvn * 0.75)} J (full size)`], ['CVN at ' + v.tmin + ' °C — weld & HAZ (avg/min)', `${v.cvnw} / ${Math.round(v.cvnw * 0.75)} J`], ['DWTT at ' + v.tmin + ' °C', `≥ ${v.dwtt} % shear area (avg. of 2)`]]))}
        ${sec(6, 'Hardness survey', `<p>HV10 traverses per ASTM E384 on body, seam weld and HAZ (inner, mid-wall and outer positions) at the frequency of API 5L tensile tests. Any single reading above the limit is cause for rejection of the test unit.</p>`)}
        ${sec(7, 'Hydrogen-specific qualification', tests.length ? table(['Test', 'Method', 'Acceptance', 'Frequency'], tests) : '<p>No hydrogen tests selected.</p>')}
        ${sec(8, 'Non-destructive testing', `<ul><li>Weld seam: 100 % automated UT (ISO 10893-11, acceptance U2) + pipe-end manual UT.</li><li>Pipe body: lamination check by UT (ISO 10893-9/-8), acceptance U2; pipe ends 50 mm 100 % UT for laminations.</li><li>Residual magnetism at bevels ≤ 3 mT.</li></ul>`)}
        ${sec(9, 'Hydrostatic test, dimensions, ends', `<ul><li>Mill hydrotest to a hoop stress of ≥ 95 % SMYS (≥ 90 % for HSAW), 10 s hold.</li><li>Dimensional tolerances per API 5L PSL2 with OD at ends ± 0.5 mm and out-of-roundness ≤ 0.6 % for AUT girth welding.</li><li>Ends bevelled 30° (+5/0°), 1.6 ± 0.8 mm root face.</li></ul>`)}
        ${sec(10, 'Coating & marking', `<p>External: ${esc(v.coat)}. Internal: ${v.flow ? 'epoxy flow coat per API RP 5L2 (roughness ≤ 10 µm)' : 'bare, cleaned and capped'}. Marking per API 5L plus “H2” and specification number; die stamping prohibited.</p>`)}
        ${sec(11, 'Inspection documents', `<p>EN 10204 type 3.2 certificates; third-party witness of MPS qualification and hydrogen testing; full traceability heat → plate/coil → pipe.</p>`)}</div>`;
      let html = issues.length ? card('Consistency checks', table(['Item', 'Finding'], issues)) : card('Consistency checks', note(chip('g', 'OK') + ' Specification is consistent with the design inputs and hydrogen limits.'));
      html += card('Specification document', doc + `<div class="btns"><button class="btn sm" type="button" data-act="specHtml">Export specification (.html)</button><button class="btn sm ghost" type="button" data-act="specDoc">Export for Word (.doc)</button></div>`);
      return { html, spec: doc };
    },
    after(el, res, v) {
      const wrap = t => `<!doctype html><html><head><meta charset="utf-8"><title>${esc(v.spec)}</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;max-width:900px;margin:auto;padding:20px}table{border-collapse:collapse;width:100%;margin:6px 0}td,th{border:1px solid #888;padding:4px 6px;text-align:left}h3{font-size:16pt}h4{font-size:12pt;margin:14px 0 4px}.eyebrow{color:#555}</style></head><body>${t}</body></html>`;
      const b1 = U.$('[data-act="specHtml"]', el), b2 = U.$('[data-act="specDoc"]', el);
      if (b1) b1.onclick = () => U.download(v.spec + '.html', wrap(res.spec), 'text/html');
      if (b2) b2.onclick = () => U.download(v.spec + '.doc', wrap(res.spec), 'application/msword');
    }
  });

  /* ================================================================ EQUIPMENT */
  function tokens() {
    const d = des(), p = proj(); const nps = d.nps || Math.round((p.OD || 610) / 25.4); const dp = d.pdes || p.maop || 70;
    return { NPS: nps, NPS2: nps + 2, CLASS: 'ASME ' + ansiClass(dp), DP: fmt(dp, 1), MAOP: fmt(d.maop || p.maop || 70, 1), T: fmt(d.temp ?? p.temp ?? 15, 0), RELIEF: fmt((d.mdot || 5) * 3600 * 0.1, 0),
      COMPTYPE: (d.h2 ?? 100) > 50 ? 'Reciprocating (API 618), non-lubricated' : 'Centrifugal (API 617)', FLOWKGS: fmt(d.mdot || 0, 2), PSUC: fmt(d.psrc ?? 30, 1), PDIS: fmt(d.pin ?? 60, 1), POWER: fmt(d.power || 0, 0), STAGES: d.stages || '—',
      VMAX: fmt(d.vmax || 20, 1), SOS: fmt(d.sos || 1300, 0), RANGE: Math.ceil(dp * 1.5 / 10) * 10, CPLIM: S().tables.limits.cpLimit, ODOR: 12 };
  }
  const fillT = s => String(s).replace(/\{(\w+)\}/g, (_, k) => tokens()[k] ?? k);
  MODS.push({
    id: 'equipment', group: 'Specifications', nav: 'Instruments & equipment', title: 'Instrument and equipment specifications for hydrogen service',
    intro: 'Datasheets with hydrogen-specific requirements for valves, PSVs, compressors, meters, analysers, transmitters, detectors, pig traps, insulating joints, CP, odorisation, seals and electrical equipment. Values are pre-filled from the design and editable. Includes API 520 PSV sizing.',
    sections: (v) => {
      const eq = D.EQUIP.find(e => e.k === (v.eq || 'mlv')) || D.EQUIP[0];
      const secs = [{ title: 'Equipment', fields: [{ k: 'eq', l: 'Equipment item', t: 'sel', o: D.EQUIP.map(e => [e.k, e.l]), v: 'mlv' }, { k: 'tag', l: 'Tag number', t: 'txt', v: 'XV-1001' }] },
        { title: 'Datasheet values', fields: eq.f.map(([k, l, d, u]) => ({ k: eq.k + '_' + k, l, t: 'txt', v: () => fillT(d) + (u ? '' : ''), h: u ? 'Unit: ' + u : '' })) }];
      if (eq.k === 'psv') secs.push({ title: 'PSV sizing (API 520, gas, critical flow)', fields: [
        { k: 'pW', l: 'Required relieving rate', u: 'kg/h', v: () => Math.round((des().mdot || 5) * 3600 * 0.1) }, { k: 'pSet', l: 'Set pressure', u: 'barg', v: () => +(des().maop || 70).toFixed(1) },
        { k: 'pOver', l: 'Allowable overpressure', u: '%', v: 10 }, { k: 'pT', l: 'Relieving temperature', u: '°C', v: 30 }, { k: 'pH2', l: 'Hydrogen content', u: 'mol %', v: () => des().h2 ?? 100 },
        { k: 'pKd', l: 'Effective discharge coefficient Kd', u: '–', v: 0.975 }, { k: 'pKb', l: 'Back-pressure correction Kb', u: '–', v: 1.0 }, { k: 'pKc', l: 'Rupture-disc combination Kc', u: '–', v: 1.0 }] });
      return secs;
    },
    compute(v) {
      const eq = D.EQUIP.find(e => e.k === v.eq) || D.EQUIP[0];
      const rows = eq.f.map(([k, l, d, u]) => [l, esc(v[eq.k + '_' + k] ?? fillT(d)), u]);
      let html = card(`${esc(eq.l)} — ${esc(v.tag)}`, table(['Item', 'Requirement / value', 'Unit'], rows) + `<p class="note"><b>Applicable standards:</b> ${esc(eq.std)}</p>`);
      html += card('Hydrogen-specific requirements', `<ul class="steps">${eq.h2.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`);
      let psv = null;
      if (eq.k === 'psv') {
        const c = E.blend(S().gas, v.pH2); const P1 = (v.pSet * (1 + v.pOver / 100) + 1.01325) * 100; const Tk = v.pT + 273.15; const Z = E.prZ(c, P1 * 1000, Tk); const k = E.gammaIdeal(c, Tk); const M = E.molarMass(c);
        psv = E.psvArea({ W: v.pW, P1, T: Tk, Z, M, k, Kd: v.pKd, Kb: v.pKb, Kc: v.pKc });
        html += card('PSV sizing result', kv([['Relieving pressure P1', fmt(P1, 0), 'kPa(a)'], ['Gas M / k / Z', `${fmt(M, 3)} / ${fmt(k, 3)} / ${fmt(Z, 4)}`, ''], ['Coefficient C', fmt(psv.C, 5), '', ref('R29')], ['<b>Required effective area</b>', `<b>${fmt(psv.A, 0)}</b>`, 'mm²', ref('R29')], ['Selected API 526 orifice', `${psv.orifice} (${fmt(psv.orificeArea, 0)} mm²)`, '', ref('R29')]]) + note('Critical-flow equation A = W/(C·Kd·P1·Kb·Kc)·√(T·Z/M), SI units. Verify inlet pressure loss (< 3 % of set) and back-pressure.'));
      }
      html += `<div class="btns"><button class="btn sm" type="button" data-act="eqOne">Export this datasheet (.html)</button><button class="btn sm ghost" type="button" data-act="eqAll">Export full datasheet package (.html)</button><button class="btn sm ghost" type="button" data-act="eqDoc">Full package for Word (.doc)</button></div>`;
      return { html, csv: { name: 'datasheet_' + eq.k, rows: [['item', 'value', 'unit'], ...eq.f.map(([k, l, d, u]) => [l, v[eq.k + '_' + k] ?? fillT(d), u])] } };
    },
    after(el, res, v) {
      const one = eq => `<h2>${esc(eq.l)}</h2><table><tr><th>Item</th><th>Requirement / value</th><th>Unit</th></tr>${eq.f.map(([k, l, d, u]) => `<tr><td>${esc(l)}</td><td>${esc(v[eq.k + '_' + k] ?? fillT(d))}</td><td>${u}</td></tr>`).join('')}</table><p><b>Standards:</b> ${esc(eq.std)}</p><ul>${eq.h2.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
      const wrap = b => `<!doctype html><html><head><meta charset="utf-8"><title>Equipment datasheets</title><style>body{font-family:Calibri,Arial,sans-serif;font-size:11pt;max-width:900px;margin:auto;padding:20px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:4px 6px;text-align:left}h2{margin-top:28px;font-size:14pt}</style></head><body><h1>Instrument & equipment datasheets — hydrogen service</h1><p>${esc(S().meta.project)} · generated ${new Date().toISOString().slice(0, 10)}</p>${b}</body></html>`;
      const eqSel = D.EQUIP.find(e => e.k === v.eq) || D.EQUIP[0];
      const a = U.$('[data-act="eqOne"]', el), b = U.$('[data-act="eqAll"]', el), c = U.$('[data-act="eqDoc"]', el);
      if (a) a.onclick = () => U.download(`datasheet_${eqSel.k}.html`, wrap(one(eqSel)), 'text/html');
      if (b) b.onclick = () => U.download('equipment_datasheets.html', wrap(D.EQUIP.map(one).join('')), 'text/html');
      if (c) c.onclick = () => U.download('equipment_datasheets.doc', wrap(D.EQUIP.map(one).join('')), 'application/msword');
    }
  });

  /* ================================================================ FILES */
  MODS.push({
    id: 'files', group: 'Data & QA', nav: 'Files & data', title: 'Project files, templates and document library',
    intro: 'Save or open the whole project as a single JSON file, download input templates, and keep supporting documents (MTRs, ILI reports, drawings, SCADA exports) in the local document library.',
    page() {
      return `<div class="cols2">
        ${card('Project file', `<p class="note">Everything you entered (all modules, gas composition, uploaded ILI listing and pressure history, code tables) is saved in one <code>.json</code> file. Open it later on any Windows or Mac computer.</p>
          <div class="fld chk"><input type="checkbox" id="incLib"/><label for="incLib">Include document-library files in the project file</label></div>
          <div class="btns"><button class="btn" type="button" id="pSave">Save project (.json)</button><button class="btn ghost" type="button" id="pOpen">Open project…</button><button class="btn ghost" type="button" id="pNew">New project</button></div>
          <div class="confirm" id="newConfirm" hidden><p>Start a new project? Unsaved inputs will be cleared (the document library is kept).</p><button class="btn sm danger" type="button" id="pNewYes">Clear and start new</button><button class="btn sm ghost" type="button" id="pNewNo">Cancel</button></div>`)}
        ${card('Input templates & exports', `<div class="btns col"><button class="btn sm ghost" type="button" data-tpl="ili">ILI feature listing template (.csv)</button><button class="btn sm ghost" type="button" data-tpl="press">Pressure history template (.csv)</button><button class="btn sm ghost" type="button" data-tpl="gas">Gas composition template (.csv)</button><button class="btn sm ghost" type="button" data-tpl="tables">Code tables (.json)</button><button class="btn sm" type="button" data-tpl="all">All module results (.csv)</button></div>`)}
      </div>
      ${card('Document library', `<p class="note">Files are stored in this browser on this computer (IndexedDB). To move them to another computer, save the project with “Include document-library files”.</p>
        <div class="lib-up"><div class="fld"><label for="libTag">Related module</label><select id="libTag">${MODS.filter(m => m.compute).map(m => `<option value="${m.id}">${esc(m.nav)}</option>`).join('')}<option value="general">General</option></select></div><div class="fld wide"><label for="libNote">Note</label><input id="libNote" type="text" placeholder="e.g. MTR heat 4471, 1988"/></div>
        <button class="btn" type="button" id="libAdd">Add files…</button></div><div id="libList"></div>`)}`;
    },
    bindPage(el) {
      const st = U.S;
      U.$('#pSave', el).onclick = async () => {
        const o = { format: 'h2-pipeline-suite', version: 1, saved: new Date().toISOString(), state: U.S };
        if (U.$('#incLib', el).checked) { const all = await U.LIB.all(); o.library = await Promise.all(all.map(f => new Promise(res => { const r = new FileReader(); r.onload = () => res({ ...f, blob: undefined, data: r.result }); r.readAsDataURL(f.blob); }))); }
        const name = (U.S.meta.project || 'project').replace(/[^\w-]+/g, '_').slice(0, 60) + '.h2proj.json';
        U.download(name, JSON.stringify(o, null, 1), 'application/json');
      };
      U.$('#pOpen', el).onclick = () => U.pickFile('.json', async txt => {
        try {
          const o = JSON.parse(txt); if (o.format !== 'h2-pipeline-suite') throw new Error('Not an H2 Pipeline Suite project file.');
          const s = Object.assign(U.freshState(), o.state); s.tables = Object.assign(U.clone(D.DEFAULT_TABLES), o.state.tables || {}); U.S = s; E.zCorr.factor = +s.settings.zFactor || 1;
          if (o.library) for (const f of o.library) { const b = await (await fetch(f.data)).blob(); await U.LIB.put({ ...f, data: undefined, blob: b }); }
          U.save(); U.toast('Project opened.'); window.H2App.go('project');
        } catch (e) { U.toast('Could not open: ' + esc(e.message)); }
      });
      U.$('#pNew', el).onclick = () => { U.$('#newConfirm', el).hidden = false; };
      U.$('#pNewNo', el).onclick = () => { U.$('#newConfirm', el).hidden = true; };
      U.$('#pNewYes', el).onclick = () => { U.S = U.freshState(); E.zCorr.factor = 1; U.save(); U.toast('New project started.'); window.H2App.go('project'); };
      U.$$('[data-tpl]', el).forEach(b => b.onclick = () => {
        const k = b.dataset.tpl;
        if (k === 'ili') U.download('ili_template.csv', 'id,chainage_m,type,depth_pct,length_mm,width_mm,dent_pct,at_weld,clock\nA001,1250,ML,22,85,60,,N,06:00\nA002,15020,CRACK,12,60,,,N,03:00\nA003,30500,DENT,,180,150,1.4,N,11:00\n', 'text/csv');
        if (k === 'press') U.download('pressure_template.csv', 'time_h,pressure_barg\n0,56.0\n1,57.2\n2,58.1\n3,57.0\n', 'text/csv');
        if (k === 'gas') U.download('gas_composition_template.csv', U.toCSV([['component', 'mol_pct'], ...Object.entries(st.gas)]), 'text/csv');
        if (k === 'tables') U.download('code_tables.json', JSON.stringify(st.tables, null, 1), 'application/json');
        if (k === 'all') { let out = ''; for (const m of MODS.filter(m => m.compute)) { try { U.moduleValues(m); const r = m.compute(U.S.m[m.id]); if (r.csv) out += `# ${m.title}\n${U.toCSV(r.csv.rows)}\n\n`; } catch (e) { out += `# ${m.title}: error ${e.message}\n\n`; } } U.download('all_results.csv', out, 'text/csv'); }
      });
      const list = async () => {
        const all = (await U.LIB.all()).sort((a, b) => b.date.localeCompare(a.date));
        U.$('#libList', el).innerHTML = all.length ? table(['File', 'Module', 'Note', 'Size', 'Added', ''], all.map(f => [esc(f.name), esc((MODS.find(m => m.id === f.tag) || { nav: 'General' }).nav), esc(f.note), fmt(f.size / 1024, 0) + ' kB', f.date.slice(0, 10), `<button class="btn sm ghost" type="button" data-get="${f.id}">Download</button> <button class="btn sm ghost" type="button" data-del="${f.id}">Remove</button>`])) : '<p class="note">No documents yet.</p>';
        U.$$('[data-get]', el).forEach(b => b.onclick = () => { const f = all.find(x => x.id === b.dataset.get); U.download(f.name, f.blob); });
        U.$$('[data-del]', el).forEach(b => b.onclick = async () => { await U.LIB.del(b.dataset.del); list(); });
      };
      U.$('#libAdd', el).onclick = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.multiple = true; inp.onchange = async () => { for (const f of inp.files) await U.LIB.put({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name: f.name, size: f.size, type: f.type, tag: U.$('#libTag', el).value, note: U.$('#libNote', el).value, date: new Date().toISOString(), blob: f }); U.toast(`${inp.files.length} file(s) added.`); list(); }; inp.click(); };
      list();
    }
  });

  /* ================================================================ CODE TABLES */
  MODS.push({
    id: 'codes', group: 'Data & QA', nav: 'Code tables', title: 'Code tables and screening limits (editable)',
    intro: 'Standard values used by the calculations. They were transcribed from public sources for convenience — <b>check each value against your licensed edition</b> and edit if needed. Changes apply to all modules and are saved with the project.',
    page() {
      const t = U.S.tables;
      const hf = `<div class="tbl-wrap"><table class="grid edit"><thead><tr><th>SMTS (ksi)</th>${t.hf.p_psig.map((p, j) => `<th><input type="number" data-hfp="${j}" value="${p}" aria-label="pressure column ${j}"/> psig</th>`).join('')}</tr></thead><tbody>${t.hf.rows.map((r, i) => `<tr><th><input type="number" data-hfs="${i}" value="${r.smts_ksi}" aria-label="SMTS row ${i}"/> <small>${esc(r.label || '')}</small></th>${r.hf.map((x, j) => `<td><input type="number" step="0.001" data-hf="${i}_${j}" value="${x}" aria-label="Hf ${i} ${j}"/></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      const arr = (key, label, r) => `<tr><th>${label} ${ref(r)}</th>${t[key].map((x, i) => `<td><input type="number" step="0.01" data-arr="${key}_${i}" value="${x}" aria-label="${label} ${t.loc[i]}"/></td>`).join('')}</tr>`;
      const obj = (key, title, refs) => card(title, `<div class="formgrid">${Object.entries(t[key]).map(([k, x]) => `<div class="fld"><label for="o_${key}_${k}">${k}</label><input id="o_${key}_${k}" type="${typeof x === 'boolean' ? 'checkbox' : 'number'}" step="any" data-obj="${key}.${k}" value="${x}"/></div>`).join('')}</div>` + (refs || ''));
      return card('ASME B31.12 Table IX-5A — material performance factor Hf ' + ref('R2'), hf + note('Rows are strength bands: a grade uses the first row whose SMTS it does not exceed (+1 ksi tolerance, so X52 PSL2 at 66.7 ksi uses the ≤ 66 ksi row). Values are interpolated linearly in pressure. Pressures above the last column or SMTS above the last row are outside the table (the tool reports “—”).')) +
        card('Design factors and test ratios by location class', `<div class="tbl-wrap"><table class="grid edit"><thead><tr><th></th>${t.loc.map(l => `<th>${l}</th>`).join('')}</tr></thead><tbody>${arr('F_b318', 'B31.8 design factor F', 'R1')}${arr('F_A', 'B31.12 Option A F', 'R2')}${arr('F_B', 'B31.12 Option B F', 'R2')}${arr('hydro', 'Hydrotest / MAOP', 'R60')}${arr('F_IGEM', 'IGEM/TD/1 Supp 2 F (1→R, 2→S, 3/4→T)', 'R5')}${arr('L_CSA', 'CSA Z662 location factor L (× F_CSA)', 'R69')}</tbody></table></div>`) +
        obj('limits', 'Screening limits', note('hv* in HV10; ceIIW, pcm; S, P in wt %; cvn* in J; kih MPa√m; smys*/uts* in ksi; stress* in % SMYS; dent* in % OD; cpLimit V CSE. ' + ref('R2', 'R3', 'R4', 'R9', 'R33'))) +
        obj('fcg', 'Fatigue crack growth constants (CC2938 form, BS 7910 air)', note('da/dN = min(CL·(1+rL·R)/(1−R)·ΔK^mL·√(pH2/pRef), CH·(1+rH·R)/(1−R)·ΔK^mH); air: airC·ΔK^airM. lifeFactor = divisor on calculated life. ' + ref('R14', 'R16', 'R51'))) +
        obj('pir', 'Rupture fire (PIR) model parameters', note('XgH2 calibrated so that pure H2 reproduces the 0.47 code constant; XgNG = 0.2 reproduces ≈ 0.69 for NG (Verification V10/V11). ' + ref('R6', 'R7', 'R8'))) +
        `<div class="btns"><button class="btn ghost" type="button" id="tReset">Reset all tables to defaults</button><button class="btn ghost" type="button" id="tImp">Import tables (.json)</button></div>`;
    },
    bindPage(el) {
      const t = () => U.S.tables;
      el.addEventListener('change', e => {
        const x = e.target; const n = parseFloat(x.value);
        if (x.dataset.hf) { const [i, j] = x.dataset.hf.split('_').map(Number); t().hf.rows[i].hf[j] = n; }
        else if (x.dataset.hfp) t().hf.p_psig[+x.dataset.hfp] = n;
        else if (x.dataset.hfs) t().hf.rows[+x.dataset.hfs].smts_ksi = n;
        else if (x.dataset.arr) { const [k, i] = x.dataset.arr.split('_'); t()[k][+i] = n; }
        else if (x.dataset.obj) { const [k, f] = x.dataset.obj.split('.'); t()[k][f] = x.type === 'checkbox' ? x.checked : n; }
        else return;
        U.save(); U.toast('Table value updated.', { ms: 2000 });
      });
      U.$('#tReset', el).onclick = () => { U.S.tables = U.clone(D.DEFAULT_TABLES); U.save(); window.H2App.go('codes'); U.toast('Code tables reset to defaults.'); };
      U.$('#tImp', el).onclick = () => U.pickFile('.json', txt => { try { U.S.tables = Object.assign(U.clone(D.DEFAULT_TABLES), JSON.parse(txt)); U.save(); window.H2App.go('codes'); U.toast('Tables imported.'); } catch (e) { U.toast('Invalid JSON file.'); } });
    }
  });

  /* ================================================================ VERIFY */
  MODS.push({
    id: 'verify', group: 'Data & QA', nav: 'Verification cases', title: 'Verification against published values and independent calculations',
    intro: 'Synthetic test cases compare the engine with tabulated standard values, worked examples and an independent Python implementation (tests/hand_calcs.py, with GERG-2008 compressibility from CoolProp). Re-run after editing code tables.',
    page() {
      const cases = E.verificationCases(U.S.tables); const pass = cases.filter(c => c.pass).length;
      return card(`Result: ${chip(pass === cases.length ? 'g' : 'a', `${pass} / ${cases.length} cases pass`)}`, table(['ID', 'Case', 'Computed', 'Expected', 'Tolerance', 'Unit', 'Status', 'Basis of expected value', 'Ref'],
        cases.map(c => [c.id, c.name, fmt(c.computed, Math.abs(c.expected) < 0.01 ? 4 : 4), fmt(c.expected, 4), '± ' + c.tolPct + ' %', c.unit, chip(c.pass ? 'g' : 'r', c.pass ? 'Pass' : 'Fail'), c.basis, ref(c.ref)])) +
        note('V08 checks the lookup against whatever is in Code tables; V11 depends on the calibrated XgH2. Z (V05/V06) is the main model uncertainty: ±1.5 % vs GERG-2008 for 10–100 bar, 0–40 °C (mean |error| 0.6 %). Use the Z calibration multiplier in Gas properties to match AGA 8 / GERG values for your gas.')) +
        card('Synthetic project cases built into the tool', `<ol class="steps"><li><b>24" X52 HFW trunkline, 120 km, MAOP 70 barg</b> (Project) — repurposing re-rates to ≈ 56 barg under Option A Class 1.</li><li><b>20 % blend</b> in the same line — capacity, compression-energy and Wobbe effects.</li><li><b>500 t/d pure-H2 line, 150 km, 60 → 30 barg</b> (New design) — size screening and specification.</li><li><b>12-anomaly ILI listing</b> (ILI) and <b>60-day hourly SCADA history</b> (Fatigue) — synthetic data sets.</li><li><b>RLNG CGD network at 10 % H2</b> (CGD) — Wobbe interchangeability.</li></ol>`);
    },
    bindPage() { }
  });

  /* ================================================================ REFERENCES */
  MODS.push({
    id: 'refs', group: 'Data & QA', nav: 'References', title: 'References',
    intro: 'Sources for every correlation, code value and limit. Reference tags (e.g. R2) appear next to results throughout the tool.',
    page() {
      return card('Reference list', table(['Tag', 'Source', 'Title', 'Used for'], Object.entries(D.REFS).sort((a, b) => +a[0].slice(1) - +b[0].slice(1)).map(([k, r]) => ({ _cls: 'ref-' + k, cells: [`<b id="ref-${k}">${k}</b>`, esc(r[0]), esc(r[1]), esc(r[2])] }))));
    },
    bindPage(el) { const id = window.H2App.refTarget; if (id) { const row = U.$('.ref-' + id, el); if (row) { row.classList.add('hit'); row.scrollIntoView({ block: 'center' }); } window.H2App.refTarget = null; } }
  });

  /* ================================================================ ABOUT */
  MODS.push({
    id: 'about', group: 'Data & QA', nav: 'About & limitations', title: 'About this tool and its limitations',
    intro: 'H2 Pipeline Suite is a screening-level engineering workbook for hydrogen transport by pipeline. It runs entirely in your browser — no installation, no internet needed after opening.',
    page() {
      return card('Scope', `<ul class="steps"><li>Three transport routes: repurposed NG pipeline (100 % H2), new H2 pipeline, H2 blended into NG pipelines — plus CGD blending.</li><li>Steady-state hydraulics (isothermal), real-gas Z (Peng–Robinson + volume translation), ISO 6976 heating values and Wobbe index.</li><li>Mechanical design to ASME B31.12 (Option A/B) and B31.8; flaw assessment (Modified B31G, LEFM with CC2938 hydrogen FCG curves).</li><li>Consequence models: choked release, notional nozzle, Froude-number flame length, point-source radiation, jet dispersion to LFL, TNT equivalence, PIR.</li></ul>`) +
        card('Limitations — read before use', `<ul class="steps"><li>Results are for screening, option comparison and specification drafting. Final design, MAOP establishment and safety studies must be performed and checked by competent engineers with licensed standards and validated software (e.g. AGA 8/GERG-2008, transient hydraulics, PHAST/HyRAM+, full ECA).</li><li>Code values are transcribed and <b>editable</b> (Code tables). Verify against your edition.</li><li>Hydraulics are steady and isothermal; Joule–Thomson cooling, transients and line-pack dynamics are not modelled.</li><li>Consequence models neglect wind, terrain, crater formation and obstacles; jet-fire radiation uses a single point source.</li><li>Fatigue uses semi-elliptical surface-flaw solutions in a flat plate with a bulging correction; residual stresses and weld misalignment are not included.</li></ul>`) +
        card('Portability', `<p>Single HTML file. Works offline in Chrome, Edge, Firefox and Safari on Windows and macOS. Data is stored in your browser and in project files you save. Version 1.1 (${new Date().getFullYear()}).</p>`);
    },
    bindPage() { }
  });
})();
