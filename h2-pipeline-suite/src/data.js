/* =====================================================================
   H2 Pipeline Suite — reference data, code tables, libraries
   Values transcribed from public sources for convenience. Code tables are
   EDITABLE in the app (Code tables module). Always verify against your
   licensed copy of the governing standard before design use.
   ===================================================================== */
(function (root) {
  'use strict';

  const REFS = {
    R1: ['ASME B31.8-2022', 'Gas Transmission and Distribution Piping Systems', 'Design factors F (Table 841.1.6-1), joint factor E, temperature derating T (Table 841.1.8-1), hydrotest ratios (Table 841.3.2-1), dent limits §851.4'],
    R2: ['ASME B31.12-2023', 'Hydrogen Piping and Pipelines, Part PL & Mandatory Appendix IX', 'Option A (prescriptive) / Option B (performance-based) design, design factors, material performance factor Hf (Table IX-5A), weld hardness 235 HV10, KIH ≥ 55 MPa√m for Option B'],
    R3: ['EIGA Doc 121/14 (CGA G-5.6)', 'Hydrogen Pipeline Systems', 'Material guidance: max hardness ≈ 250 HB (22 HRC), CE ≤ 0.43, preference for ≤ X52/L360, normalised steels; scope 1–21 MPa, −40 to 175 °C'],
    R4: ['API Spec 5L (46th ed. 2018; 47th ed. 2026) / ISO 3183:2019', 'Line Pipe', 'PSL2 requirements, Annex H (sour-service style chemistry & hardness ≤ 250 HV10 used as a baseline by hydrogen line-pipe specifications), Annex G fracture propagation'],
    R5: ['IGEM/TD/1 Ed. 6, Supplement 2 (2021)', 'High pressure hydrogen pipelines (UK)', 'Based on ASME B31.12; design factor capped at 0.5 with B31.12 Hf for grades above L360 (pressures ≤ 137.9 barg); blends > 10 mol % H2 treated as 100 % H2; fracture-toughness testing in H2 (S5.3.4); repurposing procedure'],
    R6: ['ASME B31.8S-2022', 'Managing System Integrity of Gas Pipelines', 'Potential impact radius r = 0.69·d·√p (ft, in, psi); 15.8 kW/m² threshold; HCA definition'],
    R7: ['Stephens M.J. (2000), GRI-00/0189', 'A Model for Sizing High Consequence Areas Associated with Natural Gas Pipelines (C-FER)', 'Rupture fire model: release-rate decay 0.33, Cd 0.62, combustion efficiency 0.35, emissivity 0.2'],
    R8: ['PHMSA R&D (2025) Quarterly Report 2', 'PIR in Blended H2-NG Pipelines', 'Industry PIR constants: 0.47 hydrogen, 0.69 lean NG, 0.73 rich NG (ft, in, psi)'],
    R9: ['49 CFR Part 192', 'Transportation of Natural and Other Gas by Pipeline', '§192.309(b) hard spot ≥ 35 HRC (327 HB); §192.619/§192.624 MAOP establishment and reconfirmation'],
    R10: ['Kiefner J.F. & Vieth P.H. (1989) / ASME B31G-2012', 'Modified B31G (0.85dL) corrosion assessment', 'Failure pressure of blunt metal loss; flow stress SMYS + 69 MPa'],
    R11: ['ASME B31.8-2022 §851.4 / PRCI dent studies', 'Dent repair criteria', 'Plain dent > 6 % OD; dents with metal loss, cracks or on welds require repair'],
    R12: ['Newman J.C. & Raju I.S. (1981)', 'An empirical stress-intensity factor equation for the surface crack, Eng. Fract. Mech. 15', 'Semi-elliptical surface crack SIF in a plate under membrane load'],
    R13: ['API 579-1/ASME FFS-1 (2021) Part 9; BS 7910:2019', 'Fitness-for-Service — crack-like flaws', 'Surface-crack bulging factor Ms with Folias Mt; Level 2 crack assessment framework'],
    R14: ['ASME BPVC VIII-3 Code Case 2938 (-1); ASME B31.12 Code Case 220', 'Fatigue crack growth design curves for ferritic steels in gaseous hydrogen', 'Two-segment da/dN = C·f(R)·ΔK^m; low-ΔK segment pressure dependent'],
    R15: ['San Marchi C., Ronevich J. et al. (Sandia) PVP2019-93907; Sandia 2024 technical basis', 'Pressure-sensitive FCG rules in gaseous hydrogen', 'Low-ΔK rates scale ≈ with √(fugacity); high-ΔK rates nominally pressure independent'],
    R16: ['BS 7910:2019', 'Guide to methods for assessing the acceptability of flaws in metallic structures', 'Simplified FCG law for steels in air: da/dN = 5.21×10⁻¹³ ΔK³ (m/cycle, MPa√m)'],
    R17: ['ASTM E1049-85 (2017)', 'Standard Practices for Cycle Counting in Fatigue Analysis', 'Rainflow counting of pressure histories'],
    R18: ['Maxey W.A. (1974); Eiber R.J. et al. (1993) PRCI', 'Battelle Two-Curve Method (BTCM)', 'Ductile fracture arrest: fracture velocity vs. gas decompression wave speed; Vf = 0.379·σf/√R·(P/Pa−1)^(1/6)'],
    R19: ['ISO 3183 / API 5L Annex G', 'PSL2 pipe with resistance to ductile fracture propagation', 'CVN for arrest and DWTT ≥ 85 % shear area'],
    R20: ['Leis B.N. et al. (2000)', 'Modelling running fracture in pipelines — past, present and plausible future directions', 'Correction for high-toughness steels: CVN + 0.002·CVN^2.04 − 21.18 (J)'],
    R21: ['Birch A.D. et al. (1987)', 'Velocity decay of high pressure jets, Combust. Sci. Technol. 52', 'Notional (pseudo) nozzle — conservation of mass and momentum'],
    R22: ['Delichatsios M.A. (1993)', 'Transition from momentum to buoyancy-controlled turbulent jet diffusion flames, Combust. Flame 92', 'Visible flame length L* = f(Fr); L* = 23 in momentum regime'],
    R23: ['Schefer R.W., Houf W.G. et al. (2007)', 'Characterization of high-pressure, under-expanded hydrogen-jet flames, Int. J. Hydrogen Energy 32', 'Validated Froude-number flame-length correlation for H2 up to 413 bar'],
    R24: ['Ekoto I.W. et al. (2014); Molina, Schefer & Houf (2007)', 'Updated jet flame radiation modeling; radiative fraction of H2 jet flames', 'Radiant fraction ≈ 0.16 for large-scale hydrogen jet flames'],
    R25: ['Chen C.J. & Rodi W. (1980)', 'Vertical Turbulent Buoyant Jets — A Review of Experimental Data', 'Centre-line mass-fraction decay constant 5.4; velocity decay 6.2'],
    R26: ['CCPS (2010)', 'Guidelines for Vapor Cloud Explosion, Pressure Vessel Burst, BLEVE and Flash Fire Hazards', 'TNT-equivalence method; yield 3–10 % (higher end for H2)'],
    R27: ['Mills C.A. (1987)', 'Side-on overpressure fit for TNT', 'ΔP (kPa) = 1772/Z³ − 114/Z² + 108/Z'],
    R28: ['Eisenberg N.A. et al. (1975); CCPS probit', 'Vulnerability model — thermal radiation lethality', 'Y = −14.9 + 2.56·ln(t·I^(4/3)/10⁴), I in W/m²'],
    R29: ['API Std 520 Part I (2020); API Std 526', 'Sizing of pressure-relieving devices; flanged steel PRVs', 'Gas critical flow orifice area; standard orifice letters D–T'],
    R30: ['EN 1011-2:2001 Annex C', 'Welding — avoidance of hydrogen cracking (method B)', 'Tp = 697·CET + 160·tanh(d/35) + 62·HD^0.35 + (53·CET − 32)·Q − 328'],
    R31: ['ASME PCC-2-2022', 'Repair of Pressure Equipment and Piping', 'Art. 2.6 full-encirclement sleeves; Art. 4.1 non-metallic composite repairs'],
    R32: ['API 1104 (22nd ed.) Annex B', 'In-service welding', 'Burn-through and hydrogen-cracking control for welding on live lines'],
    R33: ['ISO 15589-1:2015', 'Cathodic protection of pipeline systems — on-land', 'Limiting critical potential (e.g. −1.2 V CSE) to avoid hydrogen embrittlement of susceptible steels'],
    R34: ['IEC 60079-10-1 / 60079-20-1 / 60079-29-1', 'Explosive atmospheres', 'H2: Group IIC, T1 (AIT ≈ 560–585 °C); area classification; gas detector performance'],
    R35: ['NFPA 2 (2023); ISO/TR 15916:2015', 'Hydrogen Technologies Code; Basic considerations for the safety of hydrogen systems', 'H2 properties (LFL 4 %, UFL 75 %, MIE 0.017 mJ), separation distances'],
    R36: ['EN 16726 (2015/2025); UK GS(M)R 1996 as amended 2023', 'Gas quality — Group H; Gas Safety (Management) Regulations', 'Wobbe ranges: CEN proposal 46.44–54.00 MJ/m³; GS(M)R 46.5–51.41 MJ/m³ (from Apr 2025), H2 ≤ 0.1 mol %'],
    R37: ['PNGRB (India) press note 07-Mar-2024; Hydrogen Knowledge Paper; T4S amendment 25-Apr-2024', 'Preliminary limits for hydrogen blending in CGD networks', 'Pipelines/fittings/rubber 10 % (line pipe ≤ X52), CS valves 20 %, CNG compressors 25 %, engines & dispensers 3 %, domestic burners 10 %, CNG cylinders 2 % (IS 15490), meters 10 % with recalibration'],
    R38: ['Topolski K. et al. (2022) NREL/TP-5400-81704', 'Hydrogen Blending into Natural Gas Pipeline Infrastructure: Review of the State of Technology', 'Component tolerances, leakage, energy capacity, materials'],
    R39: ['US DOE HyBlend (2023–24); Briottet et al.', 'Fracture and fatigue of pipeline steels in blends', 'Fracture resistance reduced even at < 1 bar H2; FCG at intermediate ΔK depends on pH2'],
    R40: ['ISO 6976:2016', 'Natural gas — Calculation of calorific values, density, relative density and Wobbe indices from composition', 'Molar CV, summation factors, air properties'],
    R41: ['Smith J.M., Van Ness H.C., Abbott M.M.', 'Introduction to Chemical Engineering Thermodynamics, App. C', 'Ideal-gas heat capacity coefficients'],
    R42: ['Wilke C.R. (1950); Sutherland (1893)', 'A viscosity equation for gas mixtures, J. Chem. Phys. 18', 'Mixture viscosity'],
    R43: ['Coward H.F. & Jones G.W. (1952) USBM Bulletin 503; Zabetakis (1965)', 'Limits of flammability of gases and vapors', 'LFL/UFL; Le Chatelier mixing rule'],
    R44: ['Peng D.-Y. & Robinson D.B. (1976); Jhaveri B.S. & Youngren G.K. (1988)', 'A new two-constant equation of state; three-parameter modification (volume translation)', 'Compressibility Z (validated ±1.5 % vs GERG-2008 at ≤ 100 bar, 0–40 °C — see Verification)'],
    R45: ['Menon E.S. (2005); Colebrook C.F. (1939)', 'Gas Pipeline Hydraulics; Turbulent flow in pipes', 'Isothermal general flow equation with elevation correction; Colebrook-White friction'],
    R46: ['GPSA Engineering Data Book (14th ed.) Sec. 13', 'Compressors and expanders', 'Isentropic head, discharge temperature, multi-staging'],
    R47: ['API Std 617 (9th ed.) / API Std 618 (5th ed.)', 'Centrifugal / reciprocating compressors', 'Head per impeller, discharge-temperature limits (≈ 135–150 °C typical for H2 service)'],
    R48: ['THyGA (EU, 2020–2023); HyDeploy (UK, 2019–2023)', 'Testing H2 admixture for gas appliances; 20 % H2 blending trials', 'Domestic appliances tolerate up to ~20 % H2 without adjustment in most cases'],
    R49: ['Hu E., Huang Z. et al. (2009)', 'Experimental and numerical study on laminar burning characteristics of premixed methane–hydrogen–air flames, Int. J. Hydrogen Energy 34', 'Stoichiometric laminar burning velocity vs H2 fraction'],
    R50: ['EN 437:2021', 'Test gases — Test pressures — Appliance categories', 'G20 (CH4) Ws 50.72; G222 (CH4 + 23 % H2) Ws 47.87 MJ/m³ (light-back test gas)'],
    R51: ['ASME VIII-3 Art. KD-10; ASTM E1681; ASTM E647; ASTM E1820', 'Hydrogen fracture & fatigue testing', 'KIH (threshold) testing, FCGR in gaseous H2, J-R in H2; design cycles ≤ ½ of calculated cycles to critical'],
    R52: ['API RP 14E (1991)', 'Design and installation of offshore production platform piping systems', 'Erosional velocity Ve = C/√ρ (C = 100 continuous)'],
    R53: ['NACE TM0284 / ISO 15156-2', 'HIC test; materials for H2S service', 'Cleanliness/HIC acceptance often used as proxy for H2 trapping resistance'],
    R54: ['API 6D; ISO 15848-1; API 607 / ISO 10497', 'Pipeline valves; fugitive emissions; fire testing', 'Valve qualification incl. helium/H2 tightness classes'],
    R55: ['ISO 17089-1; AGA Report 9; AGA 7; AGA 11; OIML R137', 'Gas flow measurement', 'Ultrasonic, turbine and Coriolis metering'],
    R56: ['ISO 6974 (series); ISO 6975', 'Natural gas — Determination of composition by GC', 'H2 analysis requires argon (or N2) carrier gas channel'],
    R57: ['ISO 23936-2; NORSOK M-710', 'Non-metallic materials — elastomers; rapid gas decompression qualification', 'Seal selection for H2 service'],
    R58: ['UNECE R110; ISO 11439; IS 15490', 'CNG vehicle cylinders', 'H2 ≤ 2 % for steel CNG cylinders'],
    R59: ['DVGW G 260 (2021), G 409, G 464; DVGW SyWeSt H2 (2023)', 'Gas quality incl. 4th gas family; repurposing of steel pipelines; fracture-mechanics evaluation', 'Repurposing via fracture-mechanics assessment of pipeline steels'],
    R60: ['ASME B31.8-2022 Table 841.3.2-1', 'Test requirements', 'Hydrotest pressure ratios by location class (1.25 / 1.1 / 1.25 / 1.4 / 1.4)'],
    R61: ['ISO 15156 / API 5L Annex H Table H.1', 'Chemistry limits for sour service', 'P ≤ 0.020, S ≤ 0.003 %, CEPcm ≤ 0.19–0.22, CEIIW ≤ 0.36–0.43 depending on grade'],
    R62: ['PRCI / HSE / ROSEN (2021) Gallon N. et al.', 'Existing pipeline materials and the transition to hydrogen', 'Repurposing screening: hard spots, LF-ERW seams, vintage girth welds, crack-like features'],
    R63: ['IEC 60534 / ISA-75.01', 'Industrial-process control valves', 'Control valve sizing'],
    R64: ['ISO 13623:2017', 'Pipeline transportation systems', 'General pipeline design principles, velocity and integrity guidance'],
    R65: ['IPCC AR6 WG1 (2021) Ch. 7', 'Global warming potentials', 'GWP100 of fossil methane = 29.8'],
    R66: ['Sand M. et al. (2023)', 'A multi-model assessment of the Global Warming Potential of hydrogen, Commun. Earth Environ. 4:203', 'Indirect GWP100 of hydrogen ≈ 11.6 ± 2.8'],
    R67: ['Cosham A. et al. (2022), IChemE Hazards 32 Paper 01', 'The development of supplements to IGEM/TD/1 Edition 6 for hydrogen pipelines', 'Background to Supplements 1 & 2: 0.5 design-factor cap, Hf, qualification testing'],
    R68: ['EPRG (2023)', 'Hydrogen Pipelines — Integrity Management and Repurposing Guideline', 'Suggests relaxing B31.12 weld hardness to 275 HV10 average / 300 HV10 maximum (limited data; confirm with authority)'],
    R69: ['CSA Z662:23 (9th ed.)', 'Oil and gas pipeline systems — new Clause 17 Hydrogen and hydrogen-blend pipeline systems', 'Engineering assessment of materials, design and operation for H2 and blends; ASME B31.12 referenced as guidance; design pressure P = 2St/D·F·L·J·T (F = 0.8)'],
    R70: ['CSA Group Research (2023)', 'Assessment of Natural Gas Pipeline Materials for Hydrogen Service', 'Applies B31.12 Hf (Table IX-5A) below 2 000 psig; susceptibility factors (grade, hardness, pH2, welds)'],
    R71: ['Alberta Utilities Commission (2022)', 'Hydrogen Inquiry — Final Report', 'Recommended max 20 % by volume blending in distribution systems, starting with lower-level pilots'],
    R72: ['Innovate UK / NRCan / US (2022)', 'Hydrogen Blending Standards: UK–Canada–US knowledge sharing', 'Comparison of blending limits (e.g. UK 2 % transmission / 20 % distribution trials)']
  };

  /* ---- Code tables (defaults; editable in the app) ---- */
  const DEFAULT_TABLES = {
    // ASME B31.12 Table IX-5A — Carbon steel pipeline materials performance factor Hf
    // Columns: design pressure (psig). Rows: specified minimum tensile strength (ksi).
    hf: {
      p_psig: [1000, 2000, 2200, 2400, 2600, 2800, 3000],
      rows: [
        { smts_ksi: 66, label: '≤ 66 ksi (≤ X52)', hf: [1.000, 1.000, 0.954, 0.910, 0.880, 0.840, 0.780] },
        { smts_ksi: 75, label: '75 ksi (X60)', hf: [0.874, 0.874, 0.834, 0.796, 0.770, 0.734, 0.682] },
        { smts_ksi: 82, label: '82 ksi (X70)', hf: [0.776, 0.776, 0.742, 0.706, 0.684, 0.652, 0.606] },
        { smts_ksi: 90, label: '90 ksi (X80)', hf: [0.694, 0.694, 0.662, 0.632, 0.610, 0.584, 0.542] }
      ]
    },
    // Design factors by location class
    loc: ['Class 1 Div 1', 'Class 1 Div 2', 'Class 2', 'Class 3', 'Class 4'],
    F_b318: [0.80, 0.72, 0.60, 0.50, 0.40],   // B31.8 Table 841.1.6-1
    F_A: [0.50, 0.50, 0.50, 0.40, 0.40],      // B31.12 Option A (prescriptive)
    F_B: [0.72, 0.72, 0.60, 0.50, 0.40],      // B31.12 Option B (performance-based)
    hydro: [1.25, 1.10, 1.25, 1.40, 1.40],    // B31.8 Table 841.3.2-1 minimum test / MAOP
    F_IGEM: [0.50, 0.50, 0.30, 0.30, 0.30],   // IGEM/TD/1 Supp 2 cap 0.5 (Class R); S/T classes 0.3 — mapping Class 1→R, 2→S, 3/4→T (verify)
    L_CSA: [1.00, 1.00, 0.90, 0.70, 0.55],    // CSA Z662 location factor L (gas, general) by class 1/1/2/3/4 (verify)
    limits: {
      hvBase: 250, hvWeld: 235, hvHardSpot: 345, ceIIW: 0.43, pcm: 0.22, S: 0.010, P: 0.015,
      cvnMin: 40, cvnRed: 27, kih: 55, smysA: 70, smysB: 80, utsA: 100, utsB: 110,
      stressLow: 30, stressHigh: 50, dentH2: 2.0, dentB318: 6.0, cpLimit: -1.2,
      F_CSA: 0.8, igemBlend: 10, hvWeldEPRG: 275, hvWeldEPRGmax: 300, ceIGEM: 0.43
    },
    fcg: { CL: 3.5e-14, mL: 6.5, rL: 0.4286, CH: 1.5e-11, mH: 3.66, rH: 2.0, pRef: 106, airC: 5.21e-13, airM: 3.0, lifeFactor: 2 },
    pir: { XgNG: 0.20, XgH2: 0.11, eta: 0.35, lambda: 0.33, Cd: 0.62, ends: 2 },
    rad: [
      { q: 1.58, label: 'Continuous exposure, public (API 521)' },
      { q: 4.73, label: 'Emergency actions 2–3 min with clothing (API 521); pain ~20 s' },
      { q: 9.46, label: 'Emergency escape only; 2nd-degree burns ~20 s' },
      { q: 12.5, label: 'Piloted ignition of wood; ~1 % fatality in 1 min' },
      { q: 15.8, label: 'B31.8S PIR threshold (5 000 Btu/h·ft²)' },
      { q: 25.0, label: 'Non-piloted ignition of wood; ~100 % fatality 1 min' },
      { q: 37.5, label: 'Process equipment damage' }
    ],
    op: [
      { kpa: 3.5, label: 'Typical glass breakage (light)' },
      { kpa: 6.9, label: '1 psi — window breakage, minor structural damage' },
      { kpa: 13.8, label: '2 psi — partial collapse of walls/roofs' },
      { kpa: 20.7, label: '3 psi — serious structural damage; steel frame distortion' },
      { kpa: 34.5, label: '5 psi — heavy damage, eardrum rupture threshold' },
      { kpa: 69.0, label: '10 psi — probable total destruction of buildings' }
    ]
  };

  /* ---- API 5L grades (PSL2 minimum values; MPa) ---- */
  const GRADES = [
    { g: 'B (L245)', smys: 245, smts: 415, ymax: 450, tmax: 760 },
    { g: 'X42 (L290)', smys: 290, smts: 415, ymax: 495, tmax: 760 },
    { g: 'X46 (L320)', smys: 320, smts: 435, ymax: 525, tmax: 760 },
    { g: 'X52 (L360)', smys: 360, smts: 460, ymax: 530, tmax: 760 },
    { g: 'X56 (L390)', smys: 390, smts: 490, ymax: 545, tmax: 760 },
    { g: 'X60 (L415)', smys: 415, smts: 520, ymax: 565, tmax: 760 },
    { g: 'X65 (L450)', smys: 450, smts: 535, ymax: 600, tmax: 760 },
    { g: 'X70 (L485)', smys: 485, smts: 570, ymax: 635, tmax: 760 },
    { g: 'X80 (L555)', smys: 555, smts: 625, ymax: 705, tmax: 825 }
  ];
  // nominal OD (mm) of common line pipe sizes; NPS label
  const PIPE_OD = [[4, 114.3], [6, 168.3], [8, 219.1], [10, 273.1], [12, 323.9], [14, 355.6], [16, 406.4], [18, 457.0], [20, 508.0], [22, 559.0], [24, 610.0], [26, 660.0], [28, 711.0], [30, 762.0], [32, 813.0], [36, 914.0], [40, 1016.0], [42, 1067.0], [48, 1219.0]];
  const WALLS = [3.2, 4.0, 4.8, 5.2, 5.6, 6.4, 7.1, 7.9, 8.7, 9.5, 10.3, 11.1, 11.9, 12.7, 14.3, 15.9, 17.5, 19.1, 20.6, 22.2, 23.8, 25.4, 28.6, 31.8];

  /* ---- gas compositions (mol %) ---- */
  const GASES = {
    'RLNG typical (India)': { CH4: 89.9, C2H6: 6.2, C3H8: 2.3, iC4: 0.4, nC4: 0.5, N2: 0.7 },
    'Lean pipeline gas': { CH4: 96.5, C2H6: 1.8, C3H8: 0.4, N2: 0.8, CO2: 0.5 },
    'Rich associated gas': { CH4: 84.0, C2H6: 8.5, C3H8: 3.5, iC4: 0.6, nC4: 0.9, nC5: 0.3, N2: 1.2, CO2: 1.0 },
    'Pure methane': { CH4: 100 },
    'Pure hydrogen': { H2: 100 }
  };

  /* ---- Seam types (repurposing screening) ---- */
  const SEAMS = [
    { k: 'SMLS', l: 'Seamless', s: 'g', note: 'No seam; check wall eccentricity and hardness.' },
    { k: 'HFW', l: 'HFW / HF-ERW (post-1980, seam normalised)', s: 'g', note: 'Generally acceptable; verify seam heat treatment and hardness.' },
    { k: 'HFW70', l: 'HF-ERW 1970–1980 (unknown seam treatment)', s: 'a', note: 'Possible hook cracks/cold welds; seam-specific ILI (EMAT/UT-CD) and hardness checks advised.' },
    { k: 'LFERW', l: 'LF-ERW / DC-ERW (pre-1970)', s: 'r', note: 'Susceptible to selective seam corrosion, cold welds and hook cracks (PHMSA). Generally not recommended for H2 without replacement or full ECA.' },
    { k: 'DSAW', l: 'LSAW / DSAW', s: 'g', note: 'Acceptable; verify weld/HAZ hardness ≤ 235 HV10.' },
    { k: 'SSAW', l: 'Spiral SAW (HSAW)', s: 'a', note: 'Acceptable with checks; residual stresses and seam defect population to be reviewed.' },
    { k: 'FLASH', l: 'Flash welded (A.O. Smith)', s: 'r', note: 'Vintage seam with known defects; high risk in H2.' },
    { k: 'LAP', l: 'Lap-welded / furnace butt-welded', s: 'r', note: 'E = 0.6–0.8; not suitable for H2 service.' }
  ];

  /* ---- End-use & component tolerance to H2 (vol %) ---- */
  const TOLERANCE = [
    { c: 'Steel transmission pipeline (≤ X52, low stress)', pct: 100, src: 'R2, R3', note: 'With B31.12 derating and materials qualification' },
    { c: 'High-strength steel pipeline (X60–X80)', pct: 10, src: 'R2, R39', note: 'Case-by-case; fracture/fatigue testing in H2 (Option B) above this' },
    { c: 'India CGD steel pipeline & fittings (≤ X52)', pct: 10, src: 'R37', note: 'PNGRB preliminary limit (2024)' },
    { c: 'PE80 / PE100 distribution pipe', pct: 100, src: 'R38, R48', note: 'Compatible; permeation higher but small in energy terms' },
    { c: 'Carbon-steel valves (CGD)', pct: 20, src: 'R37', note: 'PNGRB preliminary limit' },
    { c: 'Domestic appliances (EN 437 certified)', pct: 20, src: 'R48, R50', note: 'Tested with G222 (23 % H2); India domestic burners 10 % (R37)' },
    { c: 'India domestic burners', pct: 10, src: 'R37', note: 'PNGRB preliminary limit' },
    { c: 'Diaphragm & rotary meters', pct: 20, src: 'R38, R48', note: 'HyDeploy trials; India 10 % with recalibration (R37)' },
    { c: 'Ultrasonic meters (custody transfer)', pct: 10, src: 'R38, R55', note: 'OEM verification needed above ~10 %; sound speed rises' },
    { c: 'Gas chromatographs', pct: 0.1, src: 'R56', note: 'Standard He-carrier GC cannot quantify H2 — add Ar-carrier channel' },
    { c: 'CNG vehicle cylinders (steel Type 1)', pct: 2, src: 'R58, R37', note: 'UNECE R110 / IS 15490' },
    { c: 'CNG compressors (India)', pct: 25, src: 'R37', note: 'PNGRB preliminary limit' },
    { c: 'Gas engines & CNG dispensers', pct: 3, src: 'R37, R38', note: 'Methane number / knock' },
    { c: 'Gas turbines (standard DLN)', pct: 5, src: 'R38', note: 'OEM-specific; 15–30 % with upgraded combustors' },
    { c: 'Porous underground storage', pct: 2, src: 'R38', note: 'Microbial H2 consumption / H2S generation' }
  ];

  /* ---- CGD Wobbe acceptance ranges (MJ/m³, 15/15 °C) ---- */
  const WOBBE_STD = {
    'UK GS(M)R (from Apr 2025)': [46.5, 51.41],
    'CEN EN 16726 Group H (proposed entry range)': [46.44, 54.0],
    'EN 437 2H family (G20 ± appliance band)': [45.66, 54.76],
    'Custom range': [47.0, 52.0]
  };

  /* ---- Laminar burning velocity, stoichiometric CH4/H2/air, ~1 atm 300 K [R49] ---- */
  const SL_TABLE = [[0, 0.37], [10, 0.40], [20, 0.43], [30, 0.47], [40, 0.53], [50, 0.60], [60, 0.71], [70, 0.86], [80, 1.12], [90, 1.52], [100, 2.10]];

  /* ---- Repair methods vs defect type [R31, R32, R2, R11] ---- */
  const REPAIR_METHODS = [
    { k: 'replace', l: 'Cut-out & replace pipe spool', std: 'ASME B31.12 Part PL; ASME B31.8 §851', h2: 'Preferred permanent repair in H2 service; depressurise, N2 purge, hydrotest or tie-in NDT; new pipe to the H2 line-pipe spec.' },
    { k: 'grind', l: 'Grinding / buff-out', std: 'B31.8 §851.4.3; B31G for remaining wall', h2: 'Removes shallow cracks, gouges and hard-spot surfaces; verify complete removal by MPI and residual wall by B31G. Effective in H2 because it removes crack initiation sites.' },
    { k: 'typeA', l: 'Type A sleeve (non-pressure-containing, not welded to carrier)', std: 'PCC-2 Art. 2.6; PRCI repair manual', h2: 'No welding on the carrier — attractive in H2. Only for non-leaking defects; not for circumferential defects or growing cracks unless epoxy-filled and engineered.' },
    { k: 'typeB', l: 'Type B sleeve (pressure-containing, fillet welded)', std: 'PCC-2 Art. 2.6; API 1104 Annex B', h2: 'In-service welding on H2 lines adds hydrogen-cracking risk (process H2 + weld H). Weld/HAZ ≤ 235 HV10; low-H consumables (H4); qualified procedure; prefer depressurised work.' },
    { k: 'composite', l: 'Composite wrap (engineered)', std: 'PCC-2 Art. 4.1; ISO 24817', h2: 'Good for external metal loss and dents without cracks. Not a repair for cracks or internal defects in H2 (crack growth continues under the wrap).' },
    { k: 'clamp', l: 'Bolted mechanical clamp (leak clamp)', std: 'PCC-2 Art. 3.x', h2: 'Temporary/emergency for leaks; elastomer must be qualified for H2 (RGD, permeation, ISO 23936-2). Plan permanent replacement.' },
    { k: 'hottap', l: 'Hot tap & stopple bypass', std: 'API RP 2201; B31.12; API 1104 Annex B', h2: 'Possible but welding on live H2 is high risk; consider depressurised cold cut. Flow-velocity limits for welding on H2 lines are stricter.' }
  ];
  // suitability: R recommended, C conditional, N not recommended
  const REPAIR_MATRIX = {
    ext_corr: { l: 'External corrosion (metal loss)', replace: 'R', grind: 'N', typeA: 'R', typeB: 'C', composite: 'R', clamp: 'C', hottap: 'N' },
    int_corr: { l: 'Internal corrosion (metal loss)', replace: 'R', grind: 'N', typeA: 'C', typeB: 'C', composite: 'N', clamp: 'C', hottap: 'N' },
    crack: { l: 'Crack / SCC colony / seam crack', replace: 'R', grind: 'C', typeA: 'C', typeB: 'C', composite: 'N', clamp: 'N', hottap: 'N' },
    dent_plain: { l: 'Plain dent', replace: 'R', grind: 'N', typeA: 'R', typeB: 'C', composite: 'R', clamp: 'N', hottap: 'N' },
    dent_ml: { l: 'Dent with gouge / metal loss / on weld', replace: 'R', grind: 'C', typeA: 'C', typeB: 'C', composite: 'N', clamp: 'N', hottap: 'N' },
    hardspot: { l: 'Hard spot (≥ 327 HB)', replace: 'R', grind: 'N', typeA: 'C', typeB: 'N', composite: 'N', clamp: 'N', hottap: 'N' },
    gw: { l: 'Girth-weld defect', replace: 'R', grind: 'C', typeA: 'C', typeB: 'C', composite: 'N', clamp: 'C', hottap: 'N' },
    lam: { l: 'Lamination / blister (HIC-type)', replace: 'R', grind: 'N', typeA: 'C', typeB: 'N', composite: 'N', clamp: 'N', hottap: 'N' },
    leak: { l: 'Through-wall leak', replace: 'R', grind: 'N', typeA: 'N', typeB: 'C', composite: 'N', clamp: 'C', hottap: 'C' }
  };

  /* ---- Instrument & equipment specification library ---- */
  // f: fields [key, label, default (string with {tokens} filled from project), unit]
  const EQUIP = [
    { k: 'mlv', l: 'Mainline block valve (ball)', std: 'API 6D / ISO 14313; ISO 15848-1; API 607 / ISO 10497; ASME B16.34; B31.12', f: [
      ['type', 'Valve type', 'Trunnion-mounted ball, full bore, piggable', ''], ['size', 'Size', '{NPS}"', ''], ['rating', 'Pressure class', '{CLASS}', ''], ['dp', 'Design pressure', '{DP}', 'barg'],
      ['body', 'Body/ends material', 'ASTM A105N / A350 LF2 Cl.1 (hardness ≤ 22 HRC / 237 HB); welded ends to match line pipe', ''], ['trim', 'Ball / stem', 'ENP-coated A105 or 13Cr / 17-4PH H1150 (≤ 33 HRC)', ''],
      ['seat', 'Seats & seals', 'Metal-seated or PEEK; elastomers HNBR/FKM qualified for RGD (ISO 23936-2)', ''], ['fe', 'Fugitive emission', 'ISO 15848-1 Class AH (helium) — tightness class A', ''],
      ['op', 'Operator', 'Gas-over-oil / electro-hydraulic, line-break detection, fail-as-is', ''], ['fire', 'Fire test', 'API 607 / API 6FA', '']],
      h2: ['Specify helium leak test of body/stem seals; H2 permeates elastomers faster than CH4.', 'Hardness limits on all pressure-containing parts (≤ 22 HRC) and welds (≤ 235 HV10).', 'Double block & bleed with body cavity relief; avoid trapped H2 in cavities.', 'Prefer welded-body design to minimise bolted joints.'] },
    { k: 'psv', l: 'Pressure safety valve', std: 'API 520 Pt I/II, API 526, API 527 (seat tightness), ASME VIII', f: [
      ['set', 'Set pressure', '{MAOP}', 'barg'], ['over', 'Overpressure', '10', '%'], ['W', 'Required relief rate', '{RELIEF}', 'kg/h'], ['T', 'Relieving temperature', '{T}', '°C'],
      ['type', 'Valve type', 'Pilot-operated (non-flowing pilot) or spring-loaded conventional', ''], ['mat', 'Body / nozzle / disc', 'A216 WCC / 316 SS nozzle & disc; soft seats qualified for H2', ''], ['disch', 'Discharge', 'To vent stack — vertical, ≥ 3 m above working level; H2 vent stack per CGA G-5.5 / NFPA 2', '']],
      h2: ['Size with real-gas k and Z of the actual H2/blend; H2 orifice is smaller than for NG at equal mass flow.', 'Check vent-stack radiation (H2 flame invisible) and noise; consider N2 snuffing and stack-top ignition risk.', 'Seat tightness to API 527 using helium.'] },
    { k: 'comp', l: 'Compressor package', std: 'API 618 (reciprocating) / API 617 (centrifugal) / API 619; ISO 13631; ASME B31.12', f: [
      ['type', 'Type', '{COMPTYPE}', ''], ['flow', 'Design flow', '{FLOWKGS}', 'kg/s'], ['ps', 'Suction pressure', '{PSUC}', 'barg'], ['pd', 'Discharge pressure', '{PDIS}', 'barg'],
      ['power', 'Estimated shaft power', '{POWER}', 'kW'], ['stages', 'Stages (ratio ≤ 3/stage)', '{STAGES}', ''], ['td', 'Max discharge temperature', '135', '°C'],
      ['mat', 'Materials', 'Cylinders/casings with H2-qualified steels; impeller SMYS limits (API 617 §6 H2 notes); hardness ≤ 22 HRC for wetted CS', ''], ['seal', 'Seals', 'Dry gas seals (tandem, N2 buffer) for centrifugal; distance-piece venting for reciprocating', '']],
      h2: ['Low molecular weight means very high head per unit pressure ratio: centrifugal units need many impellers or high tip speed; reciprocating units are common for pure H2.', 'H2 has a higher isentropic exponent (k ≈ 1.41 vs ≈ 1.30 for NG), so discharge temperature rises faster per stage — limit the ratio per stage and check rod load and valve materials.', 'For blends, re-rate existing centrifugal compressors: head capability falls as gas MW drops.'] },
    { k: 'usm', l: 'Ultrasonic flow meter', std: 'ISO 17089-1, AGA Report 9, OIML R137, API MPMS 14.10', f: [
      ['size', 'Meter size', '{NPS}"', ''], ['vmax', 'Max velocity (design)', '{VMAX}', 'm/s'], ['sos', 'Speed of sound at line conditions', '{SOS}', 'm/s'], ['paths', 'Paths', '≥ 4 chordal paths (custody transfer) + diagnostic', ''],
      ['trans', 'Transducers', 'Titanium-housed, H2-qualified; frequency selected for higher attenuation of H2', ''], ['cal', 'Calibration', 'Flow-calibrated on natural gas; H2-blend correction verified with OEM', '']],
      h2: ['Sound speed in H2 is ~3× NG (≈ 1 300 m/s): transit-time resolution and attenuation limit accuracy; confirm OEM validation for the blend.', 'Energy measurement requires an H2-capable GC or calorimeter.'] },
    { k: 'gc', l: 'Process gas chromatograph', std: 'ISO 6974, ISO 6976, ISO 10723 (performance evaluation)', f: [
      ['range', 'H2 range', '0–100', 'mol %'], ['carrier', 'Carrier gases', 'Helium (hydrocarbons) + argon (H2/He) — dual-carrier configuration', ''], ['cycle', 'Analysis cycle', '≤ 5', 'min'], ['out', 'Outputs', 'Composition, HHV, LHV, relative density, Wobbe, Z (ISO 6976 / AGA 8)', '']],
      h2: ['With He carrier the TCD response to H2 is weak/non-linear — use Ar carrier column for H2.', 'Calibration gas with certified H2 content near operating blend.'] },
    { k: 'ptx', l: 'Pressure / differential-pressure transmitter', std: 'IEC 61298, IEC 61508/61511 (SIL), IEC 60079', f: [
      ['range', 'Range', '0–{RANGE}', 'barg'], ['diaph', 'Diaphragm', 'Gold-plated 316L or Alloy C-276 with gold coating (H2 permeation barrier)', ''], ['fill', 'Fill fluid', 'Silicone (low-H2 solubility types)', ''], ['ex', 'Ex marking', 'Ex d / Ex ia IIC T4 Ga/Gb', '']],
      h2: ['Atomic H permeates thin metal diaphragms and forms bubbles in fill fluid → drift; specify gold plating.'] },
    { k: 'gd', l: 'Fixed gas detector', std: 'IEC 60079-29-1, IEC 60079-29-2, EN 50402 (SIL)', f: [
      ['tech', 'Technology', 'Catalytic bead (poison-resistant) or MOS/thermal-conductivity; electrochemical for ppm H2', ''], ['range', 'Range', '0–100 % LFL (0–4 vol % H2)', ''],
      ['alarm', 'Alarm set-points', '10 % LFL (0.4 vol %) warning / 25 % LFL (1.0 vol %) high', ''], ['loc', 'Location', 'At high points, under roofs/canopies — H2 rises (buoyant)', ''], ['ex', 'Ex marking', 'IIC T1 minimum (T4 typical)', '']],
      h2: ['Infrared detectors cannot detect H2 (no IR absorption).', 'For blends, calibrate on the governing component or use H2-specific cross-calibration.'] },
    { k: 'fd', l: 'Flame detector', std: 'EN 54-10, FM 3260, IEC 60079', f: [
      ['tech', 'Technology', 'UV/IR or multi-spectrum IR tuned to H2 (water-band) emission', ''], ['fov', 'Field of view', '90°', ''], ['resp', 'Response', '< 10 s to reference H2 fire', '']],
      h2: ['Hydrogen flames are almost invisible in daylight and emit little in the CO2 band used by standard IR3 NG detectors.'] },
    { k: 'pig', l: 'Pig launcher / receiver', std: 'ASME VIII Div 1, ASME B31.12, quick-opening closure per ASME VIII UG-35.2', f: [
      ['size', 'Barrel size', '{NPS}" × {NPS2}"', ''], ['dp', 'Design pressure', '{DP}', 'barg'], ['closure', 'Closure', 'Quick-opening with safety interlock & pressure-warning device', ''], ['mat', 'Materials', 'Same H2 requirements as line pipe; hardness ≤ 235 HV10 at welds', '']],
      h2: ['Purge with N2 before opening; H2 MIE 0.017 mJ — static discharge sufficient to ignite.', 'Gas velocity in H2 lines is high: check ILI tool speed control (bypass).'] },
    { k: 'ij', l: 'Monolithic insulating joint', std: 'Company specification (ASME VIII design basis); ISO 15589-1', f: [
      ['size', 'Size', '{NPS}"', ''], ['dp', 'Design pressure', '{DP}', 'barg'], ['test', 'Tests', 'Hydrotest, dielectric 5 kV AC 1 min, helium leak test', ''], ['mat', 'Pup material', 'Line-pipe grade per H2 spec, hardness ≤ 235 HV10', '']],
      h2: ['Helium leak tightness test recommended because H2 permeates seals more easily than NG.'] },
    { k: 'cp', l: 'Cathodic protection system', std: 'ISO 15589-1, NACE SP0169, EN 12954', f: [
      ['crit', 'Protection criterion', '−0.85 V CSE (IR-free)', ''], ['lim', 'Limiting critical potential', '{CPLIM}', 'V CSE'], ['mon', 'Monitoring', 'Coupons + ER probes; CIPS/DCVG surveys', '']],
      h2: ['Over-protection generates atomic H at the external surface; enforce the limiting potential especially for high-strength or hard (≥ 300 HV) zones.'] },
    { k: 'odor', l: 'Odorisation unit (CGD)', std: 'ISO 13734; PNGRB T4S', f: [
      ['odorant', 'Odorant', 'THT or sulphur-free (acrylate) odorant if fuel-cell end users', ''], ['rate', 'Dosing', '{ODOR} mg/Sm³', ''], ['ctrl', 'Control', 'Flow-proportional injection, H2-compatible pump seals', '']],
      h2: ['Odour intensity per volume is maintained, but H2 leaks are faster — verify detectability at ⅕ LFL of the blend.', 'Sulphur odorants poison PEM fuel cells; agree odorant with downstream users.'] },
    { k: 'seal', l: 'Gaskets, seals & elastomers', std: 'ISO 23936-2, NORSOK M-710, ASME B16.20, ISO 15848-1', f: [
      ['gasket', 'Flange gasket', 'Spiral-wound 316L / flexible graphite with inner ring (B16.20)', ''], ['oring', 'O-rings', 'HNBR or FKM qualified for RGD in H2 at design pressure', ''], ['bolt', 'Bolting', 'A193 B7M / A194 2HM (hardness-controlled)', '']],
      h2: ['Rapid gas decompression (explosive decompression) is more severe in H2; qualify elastomers at design pressure/temperature.'] },
    { k: 'ex', l: 'Electrical equipment in hazardous areas', std: 'IEC 60079-10-1, -14, -20-1; ATEX / IECEx; PESO (India)', f: [
      ['grp', 'Gas group', 'IIC', ''], ['tc', 'Temperature class', 'T1 minimum (H2 AIT ≈ 560–585 °C); T3/T4 common for blends', ''], ['zone', 'Zones', 'Per IEC 60079-10-1 release-source assessment', '']],
      h2: ['Natural gas equipment certified IIA is NOT suitable for H2 or blends dominated by H2 ignition properties — use IIC (IIB+H2).'] },
    { k: 'lds', l: 'Leak detection system', std: 'API RP 1130 (CPM, liquids basis), API 1175, EN 1594 guidance', f: [
      ['method', 'Method', 'Rate-of-pressure-drop & line-break valves; acoustic/fibre DAS for leaks; mass-balance CPM', ''], ['thr', 'Target detection', '≤ 1 % of throughput', '']],
      h2: ['H2 leaks have ~2.8× higher volumetric rate than CH4 through the same hole (choked) — energy loss similar, gas inventory falls faster.'] }
  ];

  /* ---- Code requirement matrix: ASME B31.12 vs IGEM/TD/1 Supp 2 vs CSA Z662:23 Cl. 17 vs EIGA ---- */
  const CODES = [
    { k: 'A', l: 'ASME B31.12 Option A', ref: 'R2' }, { k: 'B', l: 'ASME B31.12 Option B', ref: 'R2' },
    { k: 'IGEM', l: 'IGEM/TD/1 Ed. 6 Supplement 2', ref: 'R5' }, { k: 'CSA', l: 'CSA Z662:23 Clause 17', ref: 'R69' }
  ];
  const CODE_REQS = [
    { req: 'Scope / blend threshold', b31: 'Hydrogen and hydrogen mixtures (Part PL)', igem: 'Blends > 10 mol % H2 treated as 100 % H2', csa: 'Hydrogen and hydrogen-blend systems (any H2 content)', eiga: 'Pure H2 and mixtures, 1–21 MPa' },
    { req: 'Maximum design factor', b31: 'Option A 0.5 × Hf; Option B 0.72', igem: '0.5 cap, × Hf for grades above L360; higher only with qualification testing', csa: 'Z662 F·L (0.8 × location factor) subject to engineering assessment; B31.12 cited as guidance', eiga: 'Per national code; low hoop stress recommended' },
    { req: 'Material performance factor', b31: 'Hf from Table IX-5A (Option A)', igem: 'B31.12 Hf for grades above L360, pressures ≤ 137.9 barg', csa: 'Not prescribed — engineering assessment', eiga: '—' },
    { req: 'Weld / HAZ hardness', b31: '≤ 235 HV10', igem: 'Per Supplement 2 (verify); EPRG suggests 275 HV10 avg / 300 max', csa: 'Engineering assessment', eiga: '≈ 250 HB (22 HRC)' },
    { req: 'Carbon equivalent / chemistry', b31: 'Option B: P ≤ 0.015 %, inclusion-shape control', igem: 'CE ≤ 0.43 (UK practice)', csa: 'Engineering assessment', eiga: 'CE ≤ 0.43; S, P limits' },
    { req: 'Fracture toughness in H2', b31: 'Option B: KIH ≥ 55 MPa√m (ASME VIII-3 KD-10)', igem: 'Fracture-toughness testing in H2 required (S5.3.4)', csa: 'Assess toughness reduction in H2', eiga: '—' },
    { req: 'Fatigue', b31: 'Fatigue crack growth in H2 (KD-10 / Code Case 2938 basis)', igem: 'Fatigue-crack-growth assessment in H2', csa: 'Assess pressure cycling in H2', eiga: '—' },
    { req: 'Repurposing existing lines', b31: 'Requalify to Option A or B', igem: 'Repurposing procedure included', csa: 'Lifecycle engineering assessment for conversions', eiga: '—' }
  ];
  /* ---- Regulatory / code blend thresholds (mol % H2) ---- */
  const BLEND_RULES = [
    { c: 'IGEM/TD/1 Supp 2 (UK high-pressure)', lim: 10, above: 'Treated as 100 % H2 — full Supplement 2 requirements', below: 'At or below 10 mol % — check the Supplement 2 blend provisions', src: 'R5, R67' },
    { c: 'CSA Z662:23 Clause 17 (Canada)', lim: 0, above: 'Clause 17 applies — engineering assessment of materials, design and operation', below: 'No hydrogen — Clause 17 not triggered', src: 'R69' },
    { c: 'ASME B31.12 (US)', lim: 0, above: 'Hydrogen service — B31.12 Part PL design / qualification', below: 'Natural gas — ASME B31.8', src: 'R2' },
    { c: 'UK GS(M)R gas quality', lim: 0.1, above: 'Above the 0.1 mol % H2 limit — needs exemption or regulatory change', below: 'Within the GS(M)R limit', src: 'R36, R72' },
    { c: 'Alberta AUC recommendation (distribution)', lim: 20, above: 'Above the 20 vol % recommended maximum', below: 'Within the 20 vol % recommendation (start with lower-level pilots)', src: 'R71' },
    { c: 'India PNGRB preliminary (CGD pipelines ≤ X52)', lim: 10, above: 'Above the 10 % preliminary limit', below: 'Within the preliminary limit', src: 'R37' }
  ];

  root.H2D = { CODES, CODE_REQS, BLEND_RULES, REFS, DEFAULT_TABLES, GRADES, PIPE_OD, WALLS, GASES, SEAMS, TOLERANCE, WOBBE_STD, SL_TABLE, REPAIR_METHODS, REPAIR_MATRIX, EQUIP };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.H2D;
})(typeof window !== 'undefined' ? window : globalThis);
