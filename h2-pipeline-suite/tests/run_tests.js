// Engine unit tests (no browser). Run: node tests/run_tests.js
const E = require('../src/engine.js');
const D = require('../src/data.js');
let fail = 0;
const check = (name, ok, info = '') => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info ? '  ' + info : '')); if (!ok) fail++; };

// 1. Verification cases shown in the app
for (const c of E.verificationCases(D.DEFAULT_TABLES)) check(`${c.id} ${c.name}`, c.pass, `computed ${c.computed.toPrecision(6)} vs ${c.expected}`);

// 2. Physical sanity / consistency checks
const ng = E.normalize(D.GASES['RLNG typical (India)']);
check('Blend 0 % equals base gas', Math.abs(E.isoProps(E.blend(ng, 0)).HsV - E.isoProps(ng).HsV) < 1e-9);
check('Wobbe falls monotonically with H2 (0-30 %)', [0, 10, 20, 30].map(x => E.isoProps(E.blend(ng, x)).W).every((w, i, a) => i === 0 || w < a[i - 1]));
const pf = h => E.pipeFlow({ c: E.blend(ng, h), D: 0.591, L: 120e3, p1: 71e5, p2: 41e5, T: 288.15, rough: 4.57e-5, E: 0.95 });
const r100 = E.energyMW(E.blend(ng, 100), pf(100).mdot) / E.energyMW(ng, pf(0).mdot);
check('Pure-H2 energy capacity at equal pressures is 75-85 % of NG', r100 > 0.75 && r100 < 0.85, r100.toFixed(3));
const out = E.pipeOutlet({ c: ng, D: 0.591, L: 120e3, p1: 71e5, mdot: pf(0).mdot, T: 288.15, rough: 4.57e-5, E: 0.95 });
check('pipeOutlet inverts pipeFlow', Math.abs(out.p2 - 41e5) < 2e3, (out.p2 / 1e5).toFixed(3) + ' bar');
const inl = E.pipeInlet({ c: ng, D: 0.591, L: 120e3, p2: 41e5, mdot: pf(0).mdot, T: 288.15, rough: 4.57e-5, E: 0.95 });
check('pipeInlet inverts pipeFlow', Math.abs(inl.p1 - 71e5) < 2e3, (inl.p1 / 1e5).toFixed(3) + ' bar');
const A = E.b3112OptionA(360, 460, 9.5, 610, 0.5, 1, 1, D.DEFAULT_TABLES.hf);
check('B31.12 Option A X52 24" x 9.5 Class 1: Hf = 1 below 1000 psig', Math.abs(A.Hf - 1) < 1e-9 && Math.abs(A.P - 2 * 360 * 9.5 / 610 * 0.5) < 1e-6);
const A70 = E.b3112OptionA(485, 570, 15.9, 610, 0.5, 1, 1, D.DEFAULT_TABLES.hf);
check('B31.12 Option A X70: Hf < 1 and P = P0*Hf(P)', A70.Hf < 1 && Math.abs(A70.P - A70.P0 * A70.Hf) < 1e-3, `Hf ${A70.Hf.toFixed(3)}`);
const bt = E.btcm({ D: 610, t: 9.5, SMYS: 360, P0: 7.1, T: 288.15, c: { H2: 1 } });
const btn = E.btcm({ D: 914, t: 15.9, SMYS: 485, P0: 10, T: 288.15, c: ng });
check('BTCM: pure H2 needs less arrest toughness than rich NG', bt.cvn < btn.cvn, `${bt.cvn.toFixed(0)} J vs ${btn.cvn.toFixed(0)} J`);
const cg = E.crackGrowth({ D: 610, t: 9.5, a0: 1.5, c0: 12.5, cycles: [{ pmax: 5.5, pmin: 2.5, n: 1 }], blockYears: 1 / 365, KIH: 55, model: { ...E.FCG_DEFAULT, type: 'h2' }, pH2: 5.6 });
const ca = E.crackGrowth({ D: 610, t: 9.5, a0: 1.5, c0: 12.5, cycles: [{ pmax: 5.5, pmin: 2.5, n: 1 }], blockYears: 1 / 365, KIH: 55, model: { ...E.FCG_DEFAULT, type: 'air' }, pH2: 0 });
check('Fatigue life in H2 shorter than in air', cg.years < ca.years, `${cg.years.toFixed(0)} vs ${ca.years.toFixed(0)} years`);
const rH = E.release({ c: { H2: 1 }, p0: 56e5, T0: 288, dHole: 0.025, Cd: 0.85 });
check('Choked H2 release 25 mm @ 55 barg ~ 1.4-1.6 kg/s', rH.choked && rH.mdot > 1.4 && rH.mdot < 1.6, rH.mdot.toFixed(3));
const fl = E.flammability({ CH4: 0.8, H2: 0.2 });
check('Le Chatelier LFL of 80/20 CH4/H2 between 4 and 5 %', fl.LFL > 4 && fl.LFL < 5, fl.LFL.toFixed(2));
console.log(fail ? `\n${fail} test(s) failed` : '\nAll tests passed');
process.exit(fail ? 1 : 0);
