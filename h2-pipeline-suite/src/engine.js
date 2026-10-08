/* =====================================================================
   H2 Pipeline Suite — calculation engine
   Pure functions only (no DOM). Runs in the browser and in Node.js
   (tests/run_tests.js). Internal units are SI: Pa, K, m, kg, s, J.
   Every correlation carries a reference tag [Rxx] that resolves in
   data.js -> REFS.
   ===================================================================== */
(function (root) {
  'use strict';

  const RU = 8.314462618;          // J/(mol K) universal gas constant
  const PATM = 101325;             // Pa
  const G = 9.80665;               // m/s2
  const M_AIR = 28.9626;           // g/mol [R40 ISO 6976]
  const Z_AIR = 0.99958;           // air compressibility 15 C, 1 atm [R40]
  const T15 = 288.15;

  /* ---------------------------------------------------------------
     Component data
     M g/mol; Tc K; Pc bar; w acentric; Hs/Hi molar gross/net CV at 15 C
     (kJ/mol, ISO 6976:2016 [R40]); s summation factor 15 C [R40];
     cp: Cp/R = A + B T + C T^2 + D/T^2 (Smith-Van Ness-Abbott App. C [R41]);
     mu0 viscosity at 273.15 K (Pa s) & Sutherland C (K) [R42];
     LFL/UFL vol% in air [R43]; o2 stoich mol O2 / mol; nC carbon atoms;
     Tad stoich adiabatic flame temperature K [R43]
     --------------------------------------------------------------- */
  const COMP = {
    CH4:  { name: 'Methane',        zra: 0.2892, M: 16.0425, Tc: 190.56, Pc: 45.99, w: 0.0115, Hs: 891.51, Hi: 802.69, s: 0.04452, cp: [1.702, 9.081e-3, -2.164e-6, 0],      mu0: 10.4e-6, Cs: 164, LFL: 5.0, UFL: 15.0, o2: 2.0, nC: 1, Tad: 2226 },
    C2H6: { name: 'Ethane',         zra: 0.2808, M: 30.069,  Tc: 305.32, Pc: 48.72, w: 0.0995, Hs: 1562.06, Hi: 1428.84, s: 0.0919, cp: [1.131, 19.225e-3, -5.561e-6, 0],    mu0: 8.6e-6, Cs: 252, LFL: 3.0, UFL: 12.4, o2: 3.5, nC: 2, Tad: 2259 },
    C3H8: { name: 'Propane',        zra: 0.2766, M: 44.0956, Tc: 369.83, Pc: 42.48, w: 0.1523, Hs: 2220.99, Hi: 2043.37, s: 0.1344, cp: [1.213, 28.785e-3, -8.824e-6, 0],    mu0: 7.5e-6, Cs: 278, LFL: 2.1, UFL: 9.5, o2: 5.0, nC: 3, Tad: 2267 },
    iC4:  { name: 'i-Butane',       zra: 0.2754, M: 58.122,  Tc: 407.8,  Pc: 36.40, w: 0.1835, Hs: 2870.58, Hi: 2648.42, s: 0.1722, cp: [1.677, 37.853e-3, -11.945e-6, 0],   mu0: 6.9e-6, Cs: 330, LFL: 1.8, UFL: 8.4, o2: 6.5, nC: 4, Tad: 2270 },
    nC4:  { name: 'n-Butane',       zra: 0.273, M: 58.122,  Tc: 425.12, Pc: 37.96, w: 0.2002, Hs: 2879.63, Hi: 2657.60, s: 0.1830, cp: [1.935, 36.915e-3, -11.402e-6, 0],   mu0: 6.9e-6, Cs: 330, LFL: 1.8, UFL: 8.4, o2: 6.5, nC: 4, Tad: 2270 },
    nC5:  { name: 'n-Pentane',      zra: 0.2684, M: 72.149,  Tc: 469.7,  Pc: 33.70, w: 0.2515, Hs: 3538.60, Hi: 3272.00, s: 0.2366, cp: [2.464, 45.351e-3, -14.111e-6, 0],   mu0: 6.2e-6, Cs: 383, LFL: 1.4, UFL: 7.8, o2: 8.0, nC: 5, Tad: 2272 },
    N2:   { name: 'Nitrogen',       zra: 0.29, M: 28.0134, Tc: 126.2,  Pc: 33.98, w: 0.0377, Hs: 0, Hi: 0,          s: 0.0170, cp: [3.280, 0.593e-3, 0, 0.040e5],       mu0: 16.6e-6, Cs: 111, LFL: 0, UFL: 0, o2: 0, nC: 0, Tad: 0 },
    CO2:  { name: 'Carbon dioxide', zra: 0.2722, M: 44.0095, Tc: 304.13, Pc: 73.77, w: 0.2239, Hs: 0, Hi: 0,          s: 0.0752, cp: [5.457, 1.045e-3, 0, -1.157e5],      mu0: 13.7e-6, Cs: 240, LFL: 0, UFL: 0, o2: 0, nC: 1, Tad: 0 },
    H2:   { name: 'Hydrogen',       zra: 0.3218, M: 2.01588, Tc: 33.19,  Pc: 13.13, w: -0.216, Hs: 286.15, Hi: 241.72, s: 0,       cp: [3.249, 0.422e-3, 0, 0.083e5],       mu0: 8.4e-6, Cs: 72, LFL: 4.0, UFL: 75.0, o2: 0.5, nC: 0, Tad: 2390, bpos: 0.00060 },
    O2:   { name: 'Oxygen',         zra: 0.2907, M: 31.9988, Tc: 154.58, Pc: 50.43, w: 0.0222, Hs: 0, Hi: 0,          s: 0.0283, cp: [3.639, 0.506e-3, 0, -0.227e5],      mu0: 19.2e-6, Cs: 127, LFL: 0, UFL: 0, o2: 0, nC: 0, Tad: 0 },
    He:   { name: 'Helium',         zra: 0.3, M: 4.0026,  Tc: 5.19,   Pc: 2.27,  w: -0.39,  Hs: 0, Hi: 0,          s: 0,       cp: [2.5, 0, 0, 0],                       mu0: 18.7e-6, Cs: 79, LFL: 0, UFL: 0, o2: 0, nC: 0, Tad: 0, bpos: 0.00050 },
    CO:   { name: 'Carbon monoxide',zra: 0.2896, M: 28.0101, Tc: 132.85, Pc: 34.94, w: 0.045,  Hs: 282.95, Hi: 282.95, s: 0.0200, cp: [3.376, 0.557e-3, 0, -0.031e5],      mu0: 16.6e-6, Cs: 118, LFL: 12.5, UFL: 74.0, o2: 0.5, nC: 1, Tad: 2400 },
    H2S:  { name: 'Hydrogen sulphide', zra: 0.2855, M: 34.081, Tc: 373.1, Pc: 89.63, w: 0.0942, Hs: 562.38, Hi: 517.95, s: 0.0994, cp: [3.931, 1.490e-3, 0, -0.232e5],    mu0: 11.7e-6, Cs: 331, LFL: 4.0, UFL: 44.0, o2: 1.5, nC: 0, Tad: 2200 }
  };
  const KEYS = Object.keys(COMP);

  // Binary interaction parameters for Peng-Robinson (generic values) [R44]
  const KIJ = { 'CH4|CO2': 0.0919, 'CH4|N2': 0.0311, 'C2H6|CO2': 0.1322, 'C3H8|CO2': 0.1241, 'N2|CO2': -0.017,
    'C2H6|N2': 0.0515, 'C3H8|N2': 0.0852, 'H2|N2': 0.103, 'H2|CO2': -0.1622, 'H2|CH4': 0.0156 };
  function kij(a, b) { return KIJ[a + '|' + b] ?? KIJ[b + '|' + a] ?? 0; }

  /* ---------- composition helpers ---------- */
  function normalize(c) {
    const out = {}; let s = 0;
    for (const k of KEYS) { const v = +c[k] || 0; if (v > 0) { out[k] = v; s += v; } }
    if (s <= 0) return { CH4: 1 };
    for (const k in out) out[k] /= s;
    return out;
  }
  // blend: base gas (any units) + H2 mole % -> normalized mole fractions
  function blend(base, h2pct) {
    const b = normalize(base); const x = Math.min(Math.max(h2pct, 0), 100) / 100;
    const out = {};
    for (const k in b) out[k] = b[k] * (1 - x);
    out.H2 = (out.H2 || 0) + x;
    return normalize(out);
  }
  function molarMass(c) { let m = 0; for (const k in c) m += c[k] * COMP[k].M; return m; }

  /* ---------- ISO 6976 style calorific value, density, Wobbe [R40] ---------- */
  function zStd(c) {
    let s = 0, bpos = 0;
    for (const k in c) { s += c[k] * COMP[k].s; if (COMP[k].bpos) bpos += c[k] * COMP[k].bpos; }
    return 1 - s * s + bpos;
  }
  const REFS_T = { '15/15': 288.15, '0': 273.15, '60F': 288.7056, '20': 293.15 };
  function isoProps(c, ref = '15/15') {
    const Tm = REFS_T[ref] || 288.15;
    const Vm = RU * Tm / PATM;                 // m3/mol ideal at metering reference
    const Z = zStd(c);
    const M = molarMass(c);
    let Hs = 0, Hi = 0;
    for (const k in c) { Hs += c[k] * COMP[k].Hs; Hi += c[k] * COMP[k].Hi; }
    const HsV = Hs / Vm / 1000 / Z;            // MJ/m3 real
    const HiV = Hi / Vm / 1000 / Z;
    const rho = M / 1000 / Vm / Z;             // kg/m3
    const d = (M / M_AIR) * (Z_AIR / Z);       // relative density real
    const W = HsV / Math.sqrt(d);
    const Wi = HiV / Math.sqrt(d);
    return { M, Z, HsMol: Hs, HiMol: Hi, HsV, HiV, HsM: Hs / M, HiM: Hi / M, rho, d, W, Wi };
  }

  /* ---------- ideal-gas heat capacity & isentropic exponent [R41] ---------- */
  function cpR(c, T) {
    let s = 0;
    for (const k in c) { const [A, B, C, D] = COMP[k].cp; s += c[k] * (A + B * T + C * T * T + D / (T * T)); }
    return s;
  }
  function gammaIdeal(c, T) { const cp = cpR(c, T); return cp / (cp - 1); }

  /* ---------- Peng-Robinson EOS [R44] ---------- */
  const zCorr = { factor: 1 };   // user calibration multiplier (Gas module)
  function prZ(c, p, T) {
    const ks = Object.keys(c);
    const a = {}, b = {};
    for (const k of ks) {
      const d = COMP[k]; const Pc = d.Pc * 1e5;
      const kap = 0.37464 + 1.54226 * d.w - 0.26992 * d.w * d.w;
      const al = Math.pow(1 + kap * (1 - Math.sqrt(T / d.Tc)), 2);
      a[k] = 0.45724 * RU * RU * d.Tc * d.Tc / Pc * al;
      b[k] = 0.07780 * RU * d.Tc / Pc;
    }
    let am = 0, bm = 0;
    for (const i of ks) { bm += c[i] * b[i]; for (const j of ks) am += c[i] * c[j] * Math.sqrt(a[i] * a[j]) * (1 - kij(i, j)); }
    const A = am * p / (RU * RU * T * T), B = bm * p / (RU * T);
    // Z^3 + c2 Z^2 + c1 Z + c0 = 0
    const c2 = -(1 - B), c1 = A - 3 * B * B - 2 * B, c0 = -(A * B - B * B - B * B * B);
    const roots = cubicRoots(c2, c1, c0).filter(z => z > B);
    let cm = 0; // Peneloux-type volume translation (Jhaveri-Youngren form for PR) [R44]
    for (const k of ks) { const d = COMP[k]; cm += c[k] * 0.50033 * (0.25969 - (d.zra ?? 0.29)) * RU * d.Tc / (d.Pc * 1e5); }
    const Z = (roots.length ? Math.max(...roots) : 1) - cm * p / (RU * T);
    return Z * zCorr.factor;
  }
  function cubicRoots(a, b, c) {
    const q = (a * a - 3 * b) / 9, r = (2 * a * a * a - 9 * a * b + 27 * c) / 54;
    if (r * r < q * q * q) {
      const th = Math.acos(r / Math.sqrt(q * q * q)), sq = -2 * Math.sqrt(q);
      return [sq * Math.cos(th / 3) - a / 3, sq * Math.cos((th + 2 * Math.PI) / 3) - a / 3, sq * Math.cos((th - 2 * Math.PI) / 3) - a / 3];
    }
    const A = -Math.sign(r) * Math.cbrt(Math.abs(r) + Math.sqrt(r * r - q * q * q));
    const Bc = A === 0 ? 0 : q / A;
    return [A + Bc - a / 3];
  }

  /* ---------- viscosity: Sutherland + Wilke mixing [R42] ---------- */
  function viscPure(k, T) { const d = COMP[k]; return d.mu0 * ((273.15 + d.Cs) / (T + d.Cs)) * Math.pow(T / 273.15, 1.5); }
  function viscMix(c, T) {
    const ks = Object.keys(c); const mu = {}; for (const k of ks) mu[k] = viscPure(k, T);
    let s = 0;
    for (const i of ks) {
      let den = 0;
      for (const j of ks) {
        const phi = Math.pow(1 + Math.sqrt(mu[i] / mu[j]) * Math.pow(COMP[j].M / COMP[i].M, 0.25), 2) / Math.sqrt(8 * (1 + COMP[i].M / COMP[j].M));
        den += c[j] * phi;
      }
      s += c[i] * mu[i] / den;
    }
    return s;
  }

  /* ---------- state at (p abs Pa, T K) ---------- */
  function state(c, p, T) {
    const M = molarMass(c) / 1000;               // kg/mol
    const Z = prZ(c, p, T);
    const rho = p * M / (Z * RU * T);
    const g = gammaIdeal(c, T);
    const a = Math.sqrt(g * Z * RU * T / M);     // approximate speed of sound
    return { M, Z, rho, gamma: g, c: a, mu: viscMix(c, T) };
  }

  /* ---------- flammability ---------- */
  function flammability(c) {
    let fuel = 0, inv = 0, invU = 0, o2 = 0, tad = 0;
    for (const k in c) { const d = COMP[k]; if (d.LFL > 0) { fuel += c[k]; } }
    for (const k in c) {
      const d = COMP[k]; if (d.LFL > 0) {
        const y = c[k] / fuel; inv += y / d.LFL; invU += y / d.UFL; tad += y * d.Tad;
      }
      o2 += c[k] * d.o2;
    }
    const LFLf = 1 / inv, UFLf = 1 / invU;          // Le Chatelier on fuel fraction [R43]
    const M = molarMass(c);
    const nAir = o2 / 0.2095;
    const fs = M / (M + nAir * M_AIR);               // stoichiometric fuel mass fraction
    return { LFL: LFLf / fuel, UFL: Math.min(UFLf / fuel, 100), fuelFrac: fuel, airStoich: nAir, fs, Tad: tad };
  }
  function co2PerGJ(c) { // kg CO2 per GJ (HHV) of delivered gas, combustion only
    let nC = 0, Hs = 0; for (const k in c) { nC += c[k] * COMP[k].nC; Hs += c[k] * COMP[k].Hs; }
    return Hs > 0 ? nC * 44.0095 / Hs * 1000 : 0; // g/kJ -> kg/GJ
  }

  /* ---------- friction factor (Colebrook-White) [R45] ---------- */
  function colebrook(Re, rel) {
    if (Re < 2300) return 64 / Math.max(Re, 1);
    let f = 0.25 / Math.pow(Math.log10(rel / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2); // Swamee-Jain start
    for (let i = 0; i < 30; i++) { const x = -2 * Math.log10(rel / 3.7 + 2.51 / (Re * Math.sqrt(f))); f = 1 / (x * x); }
    return f;
  }
  function pAvg(p1, p2) { return (2 / 3) * (p1 + p2 - p1 * p2 / (p1 + p2)); }

  /* ---------- isothermal general flow equation with elevation [R45, R46]
     p1^2 - e^s p2^2 = f Le G^2 Z R T /(D M)   (Darcy f, G = mdot/A)
     ------------------------------------------------------------------ */
  function pipeFlow(o) {
    // o: {c, D (m ID), L (m), p1, p2 (Pa abs), T, rough (m), E (efficiency 0-1), dz (m)}
    const A = Math.PI * o.D * o.D / 4; const M = molarMass(o.c) / 1000;
    const Z = prZ(o.c, pAvg(o.p1, o.p2), o.T); const mu = viscMix(o.c, o.T);
    const s = 2 * G * M * (o.dz || 0) / (Z * RU * o.T);
    const Le = Math.abs(s) > 1e-9 ? o.L * (Math.exp(s) - 1) / s : o.L;
    const dp2 = o.p1 * o.p1 - Math.exp(s) * o.p2 * o.p2;
    if (dp2 <= 0) return { mdot: 0, Z, f: NaN, Re: 0 };
    let f = 0.01, mdot = 0, Re = 0; const E = o.E || 1;
    for (let i = 0; i < 40; i++) {
      mdot = A * Math.sqrt(dp2 * o.D * M / (f / (E * E) * Le * Z * RU * o.T));
      Re = mdot / A * o.D / mu;
      const fn = colebrook(Re, (o.rough || 4.57e-5) / o.D);
      if (Math.abs(fn - f) < 1e-10) { f = fn; break; } f = fn;
    }
    return { mdot, Z, f, Re, mu, Le, s };
  }
  // outlet pressure for a given mass flow (returns NaN when infeasible)
  function pipeOutlet(o) {
    const A = Math.PI * o.D * o.D / 4; const M = molarMass(o.c) / 1000; const mu = viscMix(o.c, o.T); const E = o.E || 1;
    const Gm = o.mdot / A; const Re = Gm * o.D / mu; const f = colebrook(Re, (o.rough || 4.57e-5) / o.D) / (E * E);
    let p2 = o.p1 * 0.8, Z = 1, s = 0, Le = o.L;
    for (let i = 0; i < 40; i++) {
      Z = prZ(o.c, pAvg(o.p1, Math.max(p2, PATM)), o.T);
      s = 2 * G * M * (o.dz || 0) / (Z * RU * o.T);
      Le = Math.abs(s) > 1e-9 ? o.L * (Math.exp(s) - 1) / s : o.L;
      const v = (o.p1 * o.p1 - f * Le * Gm * Gm * Z * RU * o.T / (o.D * M)) / Math.exp(s);
      if (v <= 0) return { p2: NaN, Z, f, Re };
      const pn = Math.sqrt(v); if (Math.abs(pn - p2) < 1) { p2 = pn; break; } p2 = pn;
    }
    return { p2, Z, f, Re };
  }
  function pipeInlet(o) { // required inlet pressure for mdot and p2
    const A = Math.PI * o.D * o.D / 4; const M = molarMass(o.c) / 1000; const mu = viscMix(o.c, o.T); const E = o.E || 1;
    const Gm = o.mdot / A; const Re = Gm * o.D / mu; const f = colebrook(Re, (o.rough || 4.57e-5) / o.D) / (E * E);
    let p1 = o.p2 * 1.2, Z = 1;
    for (let i = 0; i < 40; i++) {
      Z = prZ(o.c, pAvg(p1, o.p2), o.T);
      const s = 2 * G * M * (o.dz || 0) / (Z * RU * o.T);
      const Le = Math.abs(s) > 1e-9 ? o.L * (Math.exp(s) - 1) / s : o.L;
      const pn = Math.sqrt(Math.exp(s) * o.p2 * o.p2 + f * Le * Gm * Gm * Z * RU * o.T / (o.D * M));
      if (Math.abs(pn - p1) < 1) { p1 = pn; break; } p1 = pn;
    }
    return { p1, Z, f, Re };
  }

  /* ---------- compression (isentropic, multi-stage with intercooling) [R47, R48] ---------- */
  function compressor(o) {
    // o: {c, mdot kg/s, ps, pd Pa abs, Ts K, eta (isentropic), maxRatio, mech, driverEff}
    const r = o.pd / o.ps;
    if (!(r > 1)) return { power: 0, stages: 0, r, head: 0, Td: o.Ts, rStage: 1 };
    const n = Math.max(1, Math.ceil(Math.log(r) / Math.log(o.maxRatio || 3)));
    const rs = Math.pow(r, 1 / n); const M = molarMass(o.c) / 1000; const k = gammaIdeal(o.c, o.Ts);
    let head = 0, ps = o.ps, Td = o.Ts;
    for (let i = 0; i < n; i++) {
      const pd = ps * rs; const Z = (prZ(o.c, ps, o.Ts) + prZ(o.c, pd, o.Ts)) / 2;
      const h = Z * RU * o.Ts / M * k / (k - 1) * (Math.pow(rs, (k - 1) / k) - 1);
      head += h; Td = o.Ts * (1 + (Math.pow(rs, (k - 1) / k) - 1) / (o.eta || 0.78)); ps = pd;
    }
    const gasPower = o.mdot * head / (o.eta || 0.78);
    const shaft = gasPower / (o.mech || 0.98);
    return { power: shaft, stages: n, rStage: rs, r, head, headPerStage: head / n, Td, k, driverInput: shaft / (o.driverEff || 1) };
  }

  /* ---------- line pack ---------- */
  function linepack(o) { // {c, D, L, p1, p2, T}
    const pa = pAvg(o.p1, o.p2); const st = state(o.c, pa, o.T);
    const V = Math.PI * o.D * o.D / 4 * o.L; const m = V * st.rho;
    const iso = isoProps(o.c); const mol = m / st.M;
    return { V, mass: m, energyGJ: mol * iso.HsMol / 1e6, pAvg: pa, Z: st.Z, stdVol: m / iso.rho };
  }

  /* ---------- energy-flow units ---------- */
  function energyMW(c, mdot, basis = 'HHV') { const iso = isoProps(c); const mol = mdot / (iso.M / 1000); return mol * (basis === 'LHV' ? iso.HiMol : iso.HsMol) / 1000; }
  function mdotFromMW(c, MW, basis = 'HHV') { const iso = isoProps(c); return MW * 1000 / (basis === 'LHV' ? iso.HiMol : iso.HsMol) * iso.M / 1000; }
  function stdFlow(c, mdot, ref = '15/15') { const iso = isoProps(c, ref); return mdot / iso.rho; } // Sm3/s

  /* ---------- leak & permeation ratios ---------- */
  function chokedMassFlux(c, p0, T0, Cd = 1) {
    const st = state(c, p0, T0); const g = st.gamma;
    return Cd * p0 * Math.sqrt(g * st.M / (st.Z * RU * T0)) * Math.pow(2 / (g + 1), (g + 1) / (2 * (g - 1)));
  }
  function leakRatios(base, mix, p0, T0) {
    const fb = chokedMassFlux(base, p0, T0) / (isoProps(base).rho), fm = chokedMassFlux(mix, p0, T0) / (isoProps(mix).rho);
    const vChoked = fm / fb;                                   // std volumetric ratio, orifice (choked) leak
    const vLam = viscMix(base, T0) / viscMix(mix, T0);         // std volumetric ratio, laminar (viscous) leak
    const eb = isoProps(base).HsV, em = isoProps(mix).HsV;
    return { vChoked, vLam, eChoked: vChoked * em / eb, eLam: vLam * em / eb };
  }

  /* ---------- pipe strength [R1 B31.8, R2 B31.12] ---------- */
  function barlowP(S, t, D, F, E = 1, T = 1, Hf = 1) { return 2 * S * t / D * F * E * T * Hf; }
  function tempDerating(Tc) { // B31.8 Table 841.1.8-1 [R1]
    const tab = [[121, 1], [149, 0.967], [177, 0.933], [204, 0.9], [232, 0.867]];
    if (Tc <= 121) return 1; if (Tc >= 232) return 0.867;
    for (let i = 1; i < tab.length; i++) if (Tc <= tab[i][0]) { const [a, fa] = tab[i - 1], [b, fb] = tab[i]; return fa + (fb - fa) * (Tc - a) / (b - a); }
    return 1;
  }
  // B31.12 Hf lookup with bilinear interpolation. table: {p_psig:[], rows:[{smts_ksi, hf:[]}]}
  function hfLookup(table, smtsMPa, pMPa) {
    const smts = smtsMPa / 6.894757, p = pMPa * 145.0377;
    const P = table.p_psig, rows = table.rows;
    if (p > P[P.length - 1] * 1.0001) return { hf: NaN, note: 'Pressure above Hf table range' };
    if (smts > rows[rows.length - 1].smts_ksi + 1) return { hf: NaN, note: 'SMTS above Hf table range' };
    const colInterp = r => { if (p <= P[0]) return r.hf[0]; for (let i = 1; i < P.length; i++) if (p <= P[i]) return r.hf[i - 1] + (r.hf[i] - r.hf[i - 1]) * (p - P[i - 1]) / (P[i] - P[i - 1]); return r.hf[r.hf.length - 1]; };
    // rows are step-wise strength bands (a grade belongs to the first band whose SMTS it does not exceed;
    // 1 ksi tolerance so that e.g. X52 PSL2 (66.7 ksi) falls in the "<= 66 ksi" band); pressure is interpolated
    for (const r of rows) if (smts <= r.smts_ksi + 1) return { hf: colInterp(r), row: r };
    return { hf: NaN };
  }
  // Solve P = P0*Hf(P) (Hf decreases with P) by bisection — B31.12 Option A design pressure
  function b3112OptionA(S, smts, t, D, F, E, T, table) {
    const P0 = barlowP(S, t, D, F, E, T, 1);
    const g = P => { const h = hfLookup(table, smts, P).hf; return isNaN(h) ? -1 : P0 * h - P; };
    if (g(P0) >= 0) return { P: P0, Hf: 1, P0 };
    let lo = 0, hi = P0; for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (g(mid) >= 0) lo = mid; else hi = mid; }
    return { P: lo, Hf: hfLookup(table, smts, lo).hf, P0 };
  }

  /* ---------- design basis by code [R2 B31.12, R5 IGEM/TD/1 Supp 2, R69 CSA Z662 Cl. 17] ----------
     Returns the effective factor (F × Hf, or F × L for CSA) applied to 2·S·t/D·E·T at pressure p (MPa).
     IGEM: 0.5-capped design factor with B31.12 Hf only for grades above L360.
     CSA: Clause 17 requires an engineering assessment; the tool takes the LOWER of the Z662 design
          factor (F·L) and the B31.12 Option A factor that Z662 cites as guidance (tool interpretation). */
  function codeFactor(code, t, loc, smys, smts, pMPa) {
    const hf = () => { const h = hfLookup(t.hf, smts, pMPa).hf; return isNaN(h) ? NaN : h; };
    if (code === 'B') return { F: t.F_B[loc], Hf: 1, eff: t.F_B[loc] };
    if (code === 'IGEM') { const F = t.F_IGEM[loc]; const H = smys > 361 ? hf() : 1; return { F, Hf: H, eff: F * H }; }
    if (code === 'CSA') { const fl = t.limits.F_CSA * t.L_CSA[loc]; const a = t.F_A[loc] * hf(); return { F: fl, Hf: 1, eff: Math.min(fl, a), csaFL: fl, b3112: a, governs: a < fl ? 'B31.12 Option A' : 'Z662 F·L' }; }
    const H = hf(); return { F: t.F_A[loc], Hf: H, eff: t.F_A[loc] * H };
  }
  // allowable design pressure (MPa) solving P = 2·S·t/D·E·T·eff(P)
  function codeAllowP(code, t, o) { // o: {loc, smys, smts, t (mm), D (mm), E, T}
    const P0 = 2 * o.smys * o.t / o.D * (o.E ?? 1) * (o.T ?? 1);
    const g = P => { const e = codeFactor(code, t, o.loc, o.smys, o.smts, P).eff; return isNaN(e) ? -1 : P0 * e - P; };
    let lo = 0, hi = P0; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (g(m) >= 0) lo = m; else hi = m; }
    const f = codeFactor(code, t, o.loc, o.smys, o.smts, lo);
    return { P: lo, ...f };
  }

  /* ---------- metal loss: Modified B31G (0.85dL) [R10] ---------- */
  function modB31G(o) { // {D, t, d, L (mm), SMYS MPa}
    const Sflow = o.SMYS + 68.95; const z = o.L * o.L / (o.D * o.t);
    const M = z <= 50 ? Math.sqrt(1 + 0.6275 * z - 0.003375 * z * z) : 0.032 * z + 3.3;
    const dt = o.d / o.t;
    const Sf = Sflow * (1 - 0.85 * dt) / (1 - 0.85 * dt / M);
    return { Pf: 2 * Sf * o.t / o.D, Sf, M, z };
  }

  /* ---------- surface crack SIF: Newman-Raju (plate, membrane) + bulging [R12, R13] ---------- */
  function newmanRaju(a, c, t, sigma, phi) {
    const ac = a / c; if (ac > 1) { const r = newmanRaju(c, a, t, sigma, phi); return r; } // fallback symmetry (rare)
    const Q = 1 + 1.464 * Math.pow(ac, 1.65);
    const M1 = 1.13 - 0.09 * ac, M2 = -0.54 + 0.89 / (0.2 + ac), M3 = 0.5 - 1 / (0.65 + ac) + 14 * Math.pow(1 - ac, 24);
    const at = Math.min(a / t, 0.95);
    const g = 1 + (0.1 + 0.35 * at * at) * Math.pow(1 - Math.sin(phi), 2);
    const fphi = Math.pow(ac * ac * Math.cos(phi) ** 2 + Math.sin(phi) ** 2, 0.25);
    const F = (M1 + M2 * at * at + M3 * Math.pow(at, 4)) * g * fphi;
    return sigma * Math.sqrt(Math.PI * a / Q) * F;
  }
  function bulging(a, c, t, Rm) { // API 579 style surface-crack bulging factor Ms (Folias Mt)
    const l = c * c / (Rm * t); const Mt = Math.sqrt(1 + 1.255 * l - 0.0135 * l * l);
    const at = Math.min(a / t, 0.95); return Math.max(1, (1 - at / Mt) / (1 - at));
  }
  function crackK(a, c, t, D, P) { // P in MPa, mm units -> MPa sqrt(m)
    const sigma = P * D / (2 * t); const Rm = (D - t) / 2; const Ms = bulging(a, c, t, Rm);
    const toM = Math.sqrt(1e-3);  // sqrt(mm) -> sqrt(m)
    return { Ka: newmanRaju(a, c, t, sigma, Math.PI / 2) * Ms * toM, Kc: newmanRaju(a, c, t, sigma, 0) * Ms * toM, sigma, Ms };
  }

  /* ---------- fatigue crack growth laws [R14 CC2938, R15, R16 BS 7910] ---------- */
  function fcgr(dK, R, model, pH2MPa) {
    if (dK <= 0) return 0;
    R = Math.min(Math.max(R, 0), 0.9);
    if (model.type === 'air') return model.airC * Math.pow(dK, model.airM);
    const fL = (1 + model.rL * R) / (1 - R), fH = (1 + model.rH * R) / (1 - R);
    const pf = model.pScale ? Math.min(1, Math.sqrt(Math.max(pH2MPa, 0.001) / model.pRef)) : 1;
    const low = model.CL * fL * pf * Math.pow(dK, model.mL);
    const high = model.CH * fH * Math.pow(dK, model.mH);
    return Math.min(low, high);
  }
  const FCG_DEFAULT = { type: 'h2', CL: 3.5e-14, mL: 6.5, rL: 0.4286, CH: 1.5e-11, mH: 3.66, rH: 2.0, pScale: true, pRef: 106, airC: 5.21e-13, airM: 3.0 };

  /* Crack growth integration under a load block.
     o: {D, t (mm), a0, c0 (mm), cycles:[{pmax, pmin, n}] per block (MPa), blockYears,
         KIH MPa sqrt(m), model, pH2 MPa, aLimitFrac}  */
  function crackGrowth(o) {
    let a = o.a0, c = o.c0, blocks = 0; const t = o.t; const path = [];
    const aLim = (o.aLimitFrac || 0.8) * t; const Pmax = Math.max(...o.cycles.map(x => x.pmax));
    let reason = 'limit'; let guard = 0;
    while (guard++ < 20000) {
      const Kmax = crackK(a, c, t, o.D, Pmax).Ka;
      path.push({ years: blocks * o.blockYears, a, c, Kmax });
      if (Kmax >= o.KIH) { reason = 'KIH'; break; }
      if (a >= aLim) { reason = 'depth'; break; }
      let rateA = 0, rateC = 0;
      for (const cy of o.cycles) {
        if (cy.pmax <= 0 || cy.n <= 0) continue;
        const R = Math.max(cy.pmin, 0) / cy.pmax;
        const kA = crackK(a, c, t, o.D, cy.pmax - Math.max(cy.pmin, 0));
        rateA += cy.n * fcgr(kA.Ka, R, o.model, o.pH2) * 1000; // mm per block
        rateC += cy.n * fcgr(kA.Kc, R, o.model, o.pH2) * 1000;
      }
      if (rateA <= 0) { reason = 'no-growth'; break; }
      const da = Math.max(t / 400, 0.002);
      const nb = da / rateA;
      if (blocks + nb > 1e7 / Math.max(o.blockYears, 1e-9) || blocks * o.blockYears > 1e5) { reason = 'runout'; blocks += nb; break; }
      a += da; c += rateC * nb; blocks += nb;
    }
    const years = blocks * o.blockYears;
    // critical depth for KIH at Pmax (keeping aspect ratio)
    return { years, reason, aFinal: a, cFinal: c, path };
  }
  // critical crack depth at which Kmax = KIH, constant aspect ratio
  function criticalDepth(D, t, aspect, P, KIH) {
    let lo = 0.01, hi = 0.95 * t;
    if (crackK(hi, hi / aspect, t, D, P).Ka < KIH) return { a: hi, limited: true };
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (crackK(m, m / aspect, t, D, P).Ka < KIH) lo = m; else hi = m; }
    return { a: lo, limited: false };
  }

  /* ---------- rainflow counting ASTM E1049 [R17] ---------- */
  function reversals(series) {
    const r = []; for (const v of series) {
      if (!isFinite(v)) continue;
      if (r.length < 2) { if (!r.length || v !== r[r.length - 1]) r.push(v); continue; }
      const a = r[r.length - 2], b = r[r.length - 1];
      if ((b - a) * (v - b) > 0) r[r.length - 1] = v; else if (v !== b) r.push(v);
    }
    return r;
  }
  function rainflow(series) {
    const rev = reversals(series); const st = []; const out = [];
    for (const p of rev) {
      st.push(p);
      while (st.length >= 3) {
        const X = Math.abs(st[st.length - 1] - st[st.length - 2]), Y = Math.abs(st[st.length - 2] - st[st.length - 3]);
        if (X < Y) break;
        if (st.length === 3) { out.push({ range: Y, mean: (st[0] + st[1]) / 2, max: Math.max(st[0], st[1]), min: Math.min(st[0], st[1]), count: 0.5 }); st.shift(); }
        else { const a = st[st.length - 3], b = st[st.length - 2]; out.push({ range: Y, mean: (a + b) / 2, max: Math.max(a, b), min: Math.min(a, b), count: 1 }); const last = st.pop(); st.pop(); st.pop(); st.push(last); }
      }
    }
    for (let i = 0; i < st.length - 1; i++) out.push({ range: Math.abs(st[i + 1] - st[i]), mean: (st[i] + st[i + 1]) / 2, max: Math.max(st[i], st[i + 1]), min: Math.min(st[i], st[i + 1]), count: 0.5 });
    return out;
  }

  /* ---------- Battelle two-curve method, ideal-gas decompression [R18, R19, R20] ---------- */
  function decompressionSpeed(c0, gam, ratio) { return c0 * ((gam + 1) / (gam - 1) * Math.pow(ratio, (gam - 1) / (2 * gam)) - 2 / (gam - 1)); }
  function btcm(o) {
    // o: {D, t mm, SMYS MPa, P0 MPa abs, T K, c gas comp, CVN J (full size), E MPa, Cvel}
    const st = state(o.c, o.P0 * 1e6, o.T); const gam = st.gamma, c0 = st.c;
    const sf = o.SMYS + 68.95; const Rm = (o.D - o.t) / 2; const Ac = 80; const E = o.E || 207000; const C = o.Cvel || 0.379;
    const arrest = cvn => {
      const Rn = cvn * 1000 / Ac; // N/mm
      const sa = 2 * sf / (3.33 * Math.PI) * Math.acos(Math.exp(-Math.PI * E * Rn / (24 * sf * sf * Math.sqrt(Rm * o.t))));
      return sa * o.t / Rm; // MPa (abs ~ gauge for this purpose)
    };
    const propagates = cvn => {
      const Pa = arrest(cvn); const Rj = cvn / Ac;
      if (o.P0 <= Pa) return false;
      for (let i = 1; i <= 400; i++) {
        const p = Pa + (o.P0 - Pa) * i / 400; const ratio = p / o.P0;
        const W = decompressionSpeed(c0, gam, ratio); const Vf = C * sf / Math.sqrt(Rj) * Math.pow(p / Pa - 1, 1 / 6);
        if (Vf >= W) return true;
      }
      return false;
    };
    let lo = 1, hi = 1000;
    if (!propagates(lo)) return { cvn: lo, c0, gamma: gam, arrestAtMin: true, curve: null };
    if (propagates(hi)) return { cvn: NaN, c0, gamma: gam, note: 'BTCM: >1000 J — not applicable (consider full-scale test / crack arrestors)' };
    for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (propagates(m)) lo = m; else hi = m; }
    let cv = hi; let leis = null;
    if (cv > 95) leis = cv + 0.002 * Math.pow(cv, 2.04) - 21.18; // Leis correction for high toughness [R20]
    // curves for plotting at required CVN
    const Pa = arrest(cv); const curve = [];
    for (let i = 0; i <= 40; i++) { const r = 0.2 + 0.8 * i / 40; const p = o.P0 * r; curve.push({ p, W: decompressionSpeed(c0, gam, r), Vf: p > Pa ? C * sf / Math.sqrt(cv / Ac) * Math.pow(p / Pa - 1, 1 / 6) : 0 }); }
    return { cvn: cv, cvnLeis: leis, c0, gamma: gam, Pa, curve };
  }

  /* ---------- release & consequence models ---------- */
  function release(o) {
    // o: {c, p0 Pa abs, T0, dHole m, Cd, pa}
    const pa = o.pa || PATM; const st = state(o.c, o.p0, o.T0); const g = st.gamma; const M = st.M;
    const A = Math.PI * o.dHole * o.dHole / 4; const Cd = o.Cd ?? 0.85;
    const pcr = Math.pow((g + 1) / 2, g / (g - 1));
    const choked = o.p0 / pa >= pcr;
    let mdot, Tt, pt, rhot, ut;
    if (choked) {
      Tt = o.T0 * 2 / (g + 1); pt = o.p0 * Math.pow(2 / (g + 1), g / (g - 1));
      rhot = pt * M / (RU * Tt); ut = Math.sqrt(g * RU * Tt / M);
      mdot = Cd * A * o.p0 * Math.sqrt(g * M / (st.Z * RU * o.T0)) * Math.pow(2 / (g + 1), (g + 1) / (2 * (g - 1)));
    } else {
      const pr = pa / o.p0; pt = pa; Tt = o.T0 * Math.pow(pr, (g - 1) / g); rhot = pt * M / (RU * Tt);
      ut = Math.sqrt(2 * g / (g - 1) * RU * o.T0 / M * (1 - Math.pow(pr, (g - 1) / g)));
      mdot = Cd * A * rhot * ut;
    }
    // notional nozzle (Birch et al. 1987: mass + momentum, ambient T) [R21]
    const Ta = o.Ta || 288.15; const rhoE = pa * M / (RU * Ta);
    const At = mdot / (rhot * ut);
    const uE = ut + (pt - pa) / (rhot * ut);
    const AE = mdot / (rhoE * uE); const dE = Math.sqrt(4 * AE / Math.PI);
    return { mdot, choked, pcr, gamma: g, Z: st.Z, rhoE, uE, dE, Tt, pt, rhot, ut, At };
  }
  // Visible flame length — Delichatsios / Schefer-Houf Froude correlation [R22, R23]
  function flameLength(c, rel) {
    const fl = flammability(c); const fs = fl.fs; const rhoA = PATM * M_AIR / 1000 / (RU * 288.15);
    const dT = Math.max(fl.Tad - 288.15, 1000);
    const Fr = rel.uE * Math.pow(fs, 1.5) / (Math.pow(rel.rhoE / rhoA, 0.25) * Math.sqrt(dT / 288.15 * G * rel.dE));
    const Lstar = Fr < 5 ? 13.5 * Math.pow(Fr, 0.4) / Math.pow(1 + 0.07 * Fr * Fr, 0.2) : 23;
    const L = Lstar * rel.dE * Math.sqrt(rel.rhoE / rhoA) / fs;
    return { L, Fr, Lstar, fs };
  }
  // radiant fraction default: energy-weighted between H2 (0.16, Ekoto et al.) and NG (0.20, B31.8S) [R24, R6]
  function defaultXr(c) {
    const iso = isoProps(c); const eH2 = (c.H2 || 0) * COMP.H2.Hi; const tot = iso.HiMol || 1; const fH = eH2 / tot;
    return 0.16 * fH + 0.20 * (1 - fH);
  }
  // distance from flame centre for incident flux q (kW/m2) — single point source
  function pointSourceDistance(Qkw, Xr, tau, q) { return Math.sqrt(tau * Xr * Qkw / (4 * Math.PI * q)); }
  // centreline mean mass fraction decay of a round free jet (Chen & Rodi) [R25]
  function jetLFLDistance(c, rel, volFrac) {
    const rhoA = PATM * M_AIR / 1000 / (RU * 288.15); const M = molarMass(c);
    const Y = (volFrac * M) / (volFrac * M + (1 - volFrac) * M_AIR); // mass fraction at target mole fraction
    const x = 5.4 * rel.dE * Math.sqrt(rel.rhoE / rhoA) / Y;
    return x;
  }
  function jetFlammableMass(c, rel, LFL, UFL) {
    const rhoA = PATM * M_AIR / 1000 / (RU * 288.15);
    const xL = jetLFLDistance(c, rel, LFL), xU = jetLFLDistance(c, rel, Math.min(UFL, 0.99));
    const K = 6.2 * rel.dE * rel.uE * Math.sqrt(rel.rhoE / rhoA);  // centreline velocity u = K/x [R25]
    const t = x => x * x / (2 * K);
    return { mass: 2 * rel.mdot * Math.max(t(xL) - t(xU), 0), xL, xU };
  }
  // TNT equivalence + Mills (1987) side-on overpressure fit [R26, R27]
  function millsOverpressure(Zs) { return 1772 / Zs ** 3 - 114 / Zs ** 2 + 108 / Zs; } // kPa, Z in m/kg^(1/3)
  function distanceForOverpressure(Wtnt, dP) {
    let lo = 0.5, hi = 500;
    for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (millsOverpressure(m) > dP) lo = m; else hi = m; }
    return lo * Math.cbrt(Wtnt);
  }
  // Potential impact radius (generalised Stephens / C-FER model as used in ASME B31.8S) [R6, R7, R8]
  function pir(o) {
    // o: {c, D m, p Pa gauge, T, Cd, lambda (decay), ends, eta (combustion eff.), Xg (emissivity), Ith kW/m2, Hc override}
    const pAbs = o.p + PATM; const st = state(o.c, pAbs, o.T); const g = st.gamma;
    const A = Math.PI * o.D * o.D / 4;
    const m0 = (o.Cd ?? 0.62) * A * pAbs * Math.sqrt(g * st.M / (st.Z * RU * o.T)) * Math.pow(2 / (g + 1), (g + 1) / (2 * (g - 1)));
    const Hc = o.Hc || isoProps(o.c).HiM * 1e6 / 1000 * 1000; // J/kg LHV
    const Qeff = (o.lambda ?? 0.33) * (o.ends ?? 2) * m0;
    const r = Math.sqrt((o.eta ?? 0.35) * (o.Xg ?? 0.2) * Qeff * Hc / (4 * Math.PI * (o.Ith ?? 15.77) * 1000));
    const dIn = o.D / 0.0254, pPsi = o.p / 6894.757;
    return { r, m0, Qeff, k: (r / 0.3048) / (dIn * Math.sqrt(pPsi)) };
  }
  // Eisenberg thermal radiation probit (lethality) [R28]
  function probitFatality(qkW, tSec) {
    const Y = -14.9 + 2.56 * Math.log(tSec * Math.pow(qkW * 1000, 4 / 3) / 1e4);
    return normCdf(Y - 5);
  }
  function normCdf(x) { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }

  /* ---------- blowdown (choked, isothermal, ideal) ---------- */
  function blowdown(o) { // {c, V m3, p0 Pa abs, pEnd Pa abs, T, dVent m, Cd}
    const st = state(o.c, o.p0, o.T); const g = st.gamma; const A = Math.PI * o.dVent ** 2 / 4; const Cd = o.Cd ?? 0.85;
    const phi = Math.pow(2 / (g + 1), (g + 1) / (2 * (g - 1)));
    const tau = o.V * Math.sqrt(st.M / (g * st.Z * RU * o.T)) / (Cd * A * phi);
    const pChoke = PATM * Math.pow((g + 1) / 2, g / (g - 1));
    const pE = Math.max(o.pEnd, pChoke);
    const t = tau * Math.log(o.p0 / pE);
    const m = o.V * (o.p0 - o.pEnd) * st.M / (st.Z * RU * o.T);
    return { t, tau, mass: m, energyGJ: m / st.M * isoProps(o.c).HsMol / 1e6, peak: Cd * A * o.p0 * Math.sqrt(g * st.M / (st.Z * RU * o.T)) * phi };
  }

  /* ---------- PSV sizing API 520 Pt I, gas, critical flow [R29] ---------- */
  const API526 = [['D', 71], ['E', 126], ['F', 198], ['G', 325], ['H', 506], ['J', 830], ['K', 1186], ['L', 1841], ['M', 2323], ['N', 2800], ['P', 4116], ['Q', 7129], ['R', 10323], ['T', 16774]];
  function psvArea(o) { // {W kg/h, P1 kPa abs, T K, Z, M, k, Kd, Kb, Kc}
    const C = 0.03948 * Math.sqrt(o.k * Math.pow(2 / (o.k + 1), (o.k + 1) / (o.k - 1)));
    const A = o.W / (C * (o.Kd ?? 0.975) * o.P1 * (o.Kb ?? 1) * (o.Kc ?? 1)) * Math.sqrt(o.T * o.Z / o.M);
    const orifice = API526.find(x => x[1] >= A);
    return { A, C, orifice: orifice ? orifice[0] : 'multiple valves', orificeArea: orifice ? orifice[1] : NaN };
  }

  /* ---------- welding preheat EN 1011-2 Annex C method B (CET) [R30] ---------- */
  function cet(ch) { return (ch.C || 0) + ((ch.Mn || 0) + (ch.Mo || 0)) / 10 + ((ch.Cr || 0) + (ch.Cu || 0)) / 20 + (ch.Ni || 0) / 40; }
  function ceIIW(ch) { return (ch.C || 0) + (ch.Mn || 0) / 6 + ((ch.Cr || 0) + (ch.Mo || 0) + (ch.V || 0)) / 5 + ((ch.Ni || 0) + (ch.Cu || 0)) / 15; }
  function pcm(ch) { return (ch.C || 0) + (ch.Si || 0) / 30 + ((ch.Mn || 0) + (ch.Cu || 0) + (ch.Cr || 0)) / 20 + (ch.Ni || 0) / 60 + (ch.Mo || 0) / 15 + (ch.V || 0) / 10 + 5 * (ch.B || 0); }
  function preheatEN1011(o) { // {CET, d mm, HD ml/100g, Q kJ/mm}
    const T = 697 * o.CET + 160 * Math.tanh(o.d / 35) + 62 * Math.pow(o.HD, 0.35) + (53 * o.CET - 32) * o.Q - 328;
    return Math.max(T, 0);
  }

  /* ---------- verification (synthetic) cases ---------- */
  function verificationCases(tables) {
    const out = [];
    const add = (id, name, ref, computed, expected, tolPct, unit, basis) => out.push({ id, name, ref, computed, expected, tolPct, unit, basis, pass: Math.abs(computed - expected) <= Math.abs(expected) * tolPct / 100 });
    const ch4 = { CH4: 1 }, h2 = { H2: 1 };
    add('V01', 'Methane gross CV, real, 15/15 °C', 'R40', isoProps(ch4).HsV, 37.78, 0.3, 'MJ/m³', 'ISO 6976:2016 tabulated value for CH4');
    add('V02', 'Hydrogen gross CV, real, 15/15 °C', 'R40', isoProps(h2).HsV, 12.10, 0.3, 'MJ/m³', 'ISO 6976:2016 tabulated value for H2');
    add('V03', 'Wobbe index EN 437 test gas G20 (100% CH4)', 'R50', isoProps(ch4).W, 50.72, 0.3, 'MJ/m³', 'EN 437 G20 Ws = 50.72 MJ/m³');
    add('V04', 'Wobbe index EN 437 test gas G222 (77% CH4 + 23% H2)', 'R50', isoProps({ CH4: 0.77, H2: 0.23 }).W, 47.87, 0.4, 'MJ/m³', 'EN 437 G222 Ws = 47.87 MJ/m³');
    add('V05', 'Methane Z at 70 bar(a), 15 °C (PR EOS)', 'R44', prZ(ch4, 70e5, 288.15), 0.8713, 1.5, '–', 'GERG-2008 / Setzmann-Wagner via CoolProp = 0.8713');
    add('V06', 'Hydrogen Z at 100 bar(a), 15 °C (PR EOS)', 'R44', prZ(h2, 100e5, 288.15), 1.0615, 1.5, '–', 'Leachman (NIST) EOS via CoolProp = 1.0615');
    add('V07', 'Barlow MAOP 610 × 9.5 mm X52, F = 0.72 (B31.8)', 'R1', barlowP(358.5, 9.5, 610, 0.72), 8.039, 0.1, 'MPa', 'Hand calculation 2·S·t/D·F');
    add('V08', 'B31.12 Hf lookup, SMTS 82 ksi at 2000 psig', 'R2', hfLookup(tables.hf, 82 * 6.894757, 2000 / 145.0377).hf, tables.hf.rows[2].hf[1], 0.01, '–', 'Code-table value (Settings → Code tables)');
    const b = modB31G({ D: 610, t: 9.5, d: 4.75, L: 200, SMYS: 358.5 });
    add('V09', 'Modified B31G failure pressure (d/t = 0.5, L = 200 mm)', 'R10', b.Pf, 9.415, 0.1, 'MPa', 'Independent hand calculation (Python), see tests/hand_calcs.py');
    add('V10', 'Natural-gas PIR constant (r = k·d·√p, ft/in/psi)', 'R6', pir({ c: ch4, D: 0.762, p: 1000 * 6894.757, T: 288.15, Xg: 0.2 }).k, 0.69, 5, '–', 'ASME B31.8S Eq. (k = 0.69)');
    add('V11', 'Hydrogen PIR constant (r = k·d·√p, ft/in/psi)', 'R8', pir({ c: h2, D: 0.762, p: 1000 * 6894.757, T: 288.15, Xg: tables.pir.XgH2 }).k, 0.47, 5, '–', 'ASME B31.12 / PHMSA constant 0.47');
    add('V12', 'Mills overpressure at scaled distance 10 m/kg^⅓', 'R27', millsOverpressure(10), 11.432, 0.1, 'kPa', 'Mills (1987) fit, hand calculation');
    const rf = rainflow([-2, 1, -3, 5, -1, 3, -4, 4, -2]);
    const tot = rf.reduce((s, x) => s + x.range * x.count, 0);
    add('V13', 'Rainflow ASTM E1049 example Σ(range × count)', 'R17', tot, 23, 0.01, '–', 'ASTM E1049 rainflow example: ranges 3(½), 4(1½), 6(½), 8(1), 9(½) → Σ = 23');
    add('V14', 'API 520 PSV area example (W = 24 270 kg/h, M = 51, k = 1.11)', 'R29', psvArea({ W: 24270, P1: 670, T: 348, Z: 0.9, M: 51, k: 1.11 }).A, 3698, 0.5, 'mm²', 'API 520 Part I worked example ≈ 3 698 mm²');
    add('V15', 'CC2938 da/dN at ΔK = 10 MPa√m, R = 0.5 (106 MPa)', 'R14', fcgr(10, 0.5, { ...FCG_DEFAULT, pScale: false }, 106), 2.688e-7, 0.1, 'm/cycle', 'min(low, high) hand calculation');
    add('V16', 'EN 1011-2 preheat, CET 0.30, 20 mm, HD 5, Q 1.0 kJ/mm', 'R30', preheatEN1011({ CET: 0.30, d: 20, HD: 5, Q: 1.0 }), 56.53, 0.1, '°C', 'Hand calculation of EN 1011-2 Annex C Eq. C.5');
    const pf = pipeFlow({ c: ch4, D: 0.5906, L: 100e3, p1: 70e5 + PATM, p2: 50e5 + PATM, T: 288.15, rough: 4.57e-5, E: 1 });
    add('V17', 'General flow eq. 24" pipe, 100 km, 70→50 barg CH4 (mass flow)', 'R45', pf.mdot, 84.09, 2.0, 'kg/s', 'Independent Python solver with GERG-2008 Z (tests/hand_calcs.py)');
    add('V18', 'IGEM/TD/1 Supp 2 allowable, 610 × 9.5 mm L360, Class R (F = 0.5)', 'R5', codeAllowP('IGEM', tables, { loc: 0, smys: 360, smts: 460, t: 9.5, D: 610 }).P, 5.6066, 0.1, 'MPa', 'Hand calculation 2·360·9.5/610·0.5 (Hf not applied ≤ L360)');
    add('V19', 'CSA Z662 F·L, 610 × 9.5 mm X52, Class 1 (0.8 × 1.0)', 'R69', barlowP(360, 9.5, 610, tables.limits.F_CSA * tables.L_CSA[0]), 8.9705, 0.1, 'MPa', 'Hand calculation 2·360·9.5/610·0.8');
    return out;
  }

  const api = { zCorr, RU, PATM, G, M_AIR, COMP, KEYS, normalize, blend, molarMass, isoProps, zStd, cpR, gammaIdeal, prZ, viscMix, viscPure, state,
    flammability, co2PerGJ, colebrook, pAvg, pipeFlow, pipeOutlet, pipeInlet, compressor, linepack, energyMW, mdotFromMW, stdFlow,
    chokedMassFlux, leakRatios, barlowP, tempDerating, hfLookup, b3112OptionA, codeFactor, codeAllowP, modB31G, newmanRaju, bulging, crackK, fcgr, FCG_DEFAULT,
    crackGrowth, criticalDepth, reversals, rainflow, decompressionSpeed, btcm, release, flameLength, defaultXr, pointSourceDistance,
    jetLFLDistance, jetFlammableMass, millsOverpressure, distanceForOverpressure, pir, probitFatality, normCdf, blowdown, psvArea, API526,
    cet, ceIIW, pcm, preheatEN1011, verificationCases };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.H2E = api;
})(typeof window !== 'undefined' ? window : globalThis);
