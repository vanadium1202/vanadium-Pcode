# H2 Pipeline Suite — Project Reference

*How the tool was researched, designed, built, verified and published, and how to keep working on it.*

Version 1.1 · October 2026 · Repository `vanadium1202/vanadium-Pcode`, folder `h2-pipeline-suite/`, branch `claude/hydrogen-pipeline-tool-tz9w95`

---

## 1. Purpose of this document

This document records how H2 Pipeline Suite was produced. It explains what was asked for, which decisions were taken and why, how every calculation works, where each number comes from, how the results were checked, and what is still open. Use it as the starting point for any future change. A later engineer, or a later Claude session, should be able to read it, open the source folder and carry on without repeating the groundwork.

The user guide for people who only *use* the tool is a separate document, `docs/User_Manual.html` (also as `dist/User_Manual.pdf`). This document is for the people who *maintain and extend* it.

## 2. The brief

The request was for one interactive tool covering hydrogen transport by pipeline along three routes:

1. conversion (repurposing) of an existing natural-gas pipeline to hydrogen;
2. a new, purpose-built hydrogen pipeline;
3. hydrogen blended into an existing natural-gas pipeline.

For all three, the tool had to deal with the full chain of considerations: the metallurgy of the existing line pipe, the mechanical properties of the steel, the blend percentage expressed as hydrogen partial pressure, permitted hardness, repair of hydrogen pipelines, and operating effects. The energy penalty of carrying a given hydrogen fraction through the same pipeline was named as an example.

Further explicit requirements were:

- upload and download of data files and other documents;
- generation of a line pipe specification for a new hydrogen pipeline;
- specifications for the instruments and equipment such a pipeline needs;
- a separate hydrogen safety module covering both leaks and ruptures, with calculated safe zones;
- a design-calculation option for a hydrogen pipeline;
- a separate module for blending hydrogen into city gas distribution (CGD), showing how the blend changes the Wobbe index;
- references for calculations and values wherever possible;
- synthetic cases for verification;
- a plain-language user manual;
- free choice of language, but the result had to be portable and easy to run on both Windows and Mac laptops.

In a follow-up message the user asked for the hydrogen provisions of **IGEM/TD/1** (UK) and **CSA Z662** (Canada) to be added. Finally the user asked for this reference document.

## 3. How the work proceeded — overview

The work ran in nine stages, in this order:

1. **Research.** Targeted web searches on the governing codes and the key technical correlations. Their purpose was to confirm values and to find out which ones could *not* be confirmed.
2. **Technology decision.** A single self-contained HTML file, assembled from modular source files by a small build script.
3. **Calculation engine.** A library of pure functions with no user interface, so it can be tested on its own in Node.js. It was validated against reference data before any screens were built on top of it.
4. **Reference data library.** References, code tables, grade data, compositions, tolerance tables, the repair matrix and the equipment datasheet library.
5. **User-interface framework.** State handling, form generation, charts, file upload and download, the document library and report export.
6. **Modules.** Eighteen modules in three source files, plus the application shell.
7. **Verification.** Engine tests, independent hand calculations in Python with GERG-2008 reference data, and browser smoke tests at desktop and phone widths in light and dark themes. Defects found were fixed.
8. **Documentation and publishing.** User manual (HTML and PDF), README files, commits to the feature branch and a private hosted copy on claude.ai.
9. **Extension.** IGEM/TD/1 Supplement 2 and CSA Z662:23 Clause 17 added as selectable design bases, followed by this document.

The sections below describe each stage in detail.

## 4. Research

### 4.1 Approach

The aim of the research was narrow. The general physics and the structure of the codes were already known, so the searches were used to pin down specific numbers and to check claims before relying on them. Each search targeted one question, for example "what are the Option A and Option B limits in ASME B31.12?" or "what PIR constant does industry use for hydrogen?". Several important source sites (the PNGRB, IChemE, ScienceDirect and CSA Group servers, and the Dutch mirror of EIGA Doc 121) were blocked by the session's network policy. For those, only the search-engine summaries could be read, not the documents.

### 4.2 What was confirmed

- **ASME B31.12 Option A versus Option B.** Confirmed from a comparison table in an IOCL submission to PNGRB:
  - Option A caps the design factor at 0.5; Option B allows up to 0.72.
  - Option B requires K<sub>IH</sub> ≥ 55 MPa√m; Option A sets no K<sub>IH</sub> requirement.
  - Option B limits phosphorus to ≤ 0.015 % and requires inclusion-shape control.
  - Strength limits are 70/100 ksi (yield/tensile) for Option A and 80/110 ksi for Option B.
  - Weld hardness is capped at 235 HV10 under both options.
- **Potential impact radius (PIR) constants.** A 2025 PHMSA-funded report states the constants industry uses in r = k·d·√p (ft, in, psi): 0.47 for hydrogen, 0.69 for lean natural gas, 0.73 for rich natural gas.
- **India, PNGRB 2024 preliminary CGD limits:**
  - pipelines, fittings and rubber 10 %, with line pipe restricted to X52;
  - carbon-steel valves 20 %;
  - CNG compressors 25 %;
  - engines and dispensers 3 %;
  - domestic burners 10 %;
  - CNG cylinders 2 % (IS 15490);
  - meters 10 % with recalibration.

  Pilots have run at 2–8 %, for example 8 % at NTPC Kawas. No final national cap had been notified.
- **API 5L 47th edition.** Published in June 2026. No hydrogen annex is evident from the announcements, so the specification generator treats API 5L PSL2 plus supplementary hydrogen requirements as the base.
- **Code Case 2938.** Gives fatigue crack growth design curves for ferritic steels in gaseous hydrogen. They were derived at about 106 MPa, and a fugacity-based pressure correction exists in CC2938-1 and B31.12 Code Case 220. At low ΔK the rates depend on pressure; at high ΔK they are nominally pressure-independent.
- **EIGA Doc 121/14.** Hardness about 250 HB (22 HRC), CE ≤ 0.43, preference for X52/L360 or lower and normalised steels. Scope 1–21 MPa and −40 to 175 °C.
- **Gas quality.** The UK GS(M)R Wobbe range is 46.5–51.41 MJ/m³ from April 2025, with H2 ≤ 0.1 mol %. CEN's proposed EN 16726 entry range is 46.44–54.00 MJ/m³.
- **Hydrogen effects in blends** (DOE HyBlend, NREL): fracture resistance falls even below 1 bar of H2 partial pressure.
- **Large hydrogen jet flames.** A radiant fraction of about 0.16 is supported by Ekoto et al. The Froude-number flame-length framework of Schefer/Houf, with L\* = 23 in the momentum regime (Delichatsios), holds up to 413 bar.
- **IGEM/TD/1 Ed. 6 Supplement 2** (follow-up research):
  - it is based on ASME B31.12;
  - the design factor is capped at 0.5;
  - the B31.12 Hf is applied to grades above L360, with Hf taken for pressures ≤ 137.9 barg;
  - blends above 10 mol % H2 are treated as 100 % H2;
  - fracture-toughness testing in hydrogen is required (clause S5.3.4);
  - a repurposing procedure is included;
  - UK practice uses CE ≤ 0.43.
  - Separately, the EPRG guideline suggests relaxing weld hardness to 275 HV10 average and 300 HV10 maximum.
- **CSA Z662:23** (9th edition):
  - it added a new Clause 17 for hydrogen and hydrogen-blend pipeline systems;
  - the clause works through engineering assessments, not fixed numeric limits;
  - it cites ASME B31.12 as guidance;
  - CSA Group's own research applies the B31.12 Hf below 2 000 psig.

### 4.3 What could not be confirmed (and how the tool handles it)

These items are typed into the tool from memory or from secondary sources. All of them are **editable** in the *Code tables* module and flagged in the tool and the manual:

- **B31.12 Table IX-5A Hf values.** The four rows (≤ 66, 75, 82, 90 ksi) and seven pressure columns (1 000 to 3 000 psig) are from recollection of the table. No primary source was available.
- **B31.12 Option B design factors by class.** Only the 0.72 maximum is confirmed. The class-by-class values 0.72/0.72/0.60/0.50/0.40 are assumed.
- **Code Case 2938 constants.** C = 3.5×10⁻¹⁴, m = 6.5 with f(R) = (1 + 0.4286R)/(1 − R) at low ΔK, and C = 1.5×10⁻¹¹, m = 3.66 with f(R) = (1 + 2R)/(1 − R) at high ΔK. The √(pH2/106 MPa) pressure scaling is the tool's approximation of the fugacity correction.
- **IGEM design factors for location classes S and T** (0.3), and the mapping Class 1 → R, Class 2 → S, Classes 3–4 → T.
- **CSA Z662 location factors** L = 1.0/1.0/0.9/0.7/0.55 with F = 0.8, and the decision to govern Clause 17 by the lower of the Z662 F·L and the B31.12 Option A factor. This is the tool's interpretation, stated as such in the interface.
- **EIGA hardness.** The source states it in HB (≈ 250 HB). The tool screens base metal at 250 HV10, the ISO 3183 Annex H convention.

### 4.4 Principal sources

| Source | Link |
|---|---|
| IOCL submission to PNGRB (B31.12 A/B) | https://pngrb.gov.in/pdf/press-note/IOCL_20241017.pdf |
| PHMSA, PIR in blended H2-NG pipelines (2025) | https://primis.phmsa.dot.gov/rd/FileGet/20878/2025-03-30%20Public%20Quarterly%20Report%202%20-%20PIR%20in%20Blended%20H2-NG%20Pipelines.pdf |
| PNGRB Hydrogen Knowledge Paper | https://pngrb.gov.in/pdf/hydrogen-corner/PNGRB_Hydrogen_Knowledge_Paper.pdf |
| PNGRB press note March 2024 | https://pngrb.gov.in/pdf/press-note/PressRelease07032024.pdf |
| API 5L 47th edition | https://www.api.org/news-policy-and-issues/news/2026/06/02/api-announces-47th-edition-of-api-specification-5l |
| Sandia, FCG rules in hydrogen | https://www.sandia.gov/research/publications/details/technical-basis-for-fatigue-crack-growth-rules-in-gaseous-hydrogen-for-asme-2024-01-01/ |
| National Gas, gas quality | https://nationalgas.com/data-and-operations/quality |
| NREL TP-5400-81704 | https://www.nrel.gov/docs/fy23osti/81704.pdf |
| Structural Integrity, blending effects | https://www.structint.com/news-views-volume-52-understanding-the-effects-of-hydrogen-blending-on-pipeline-integrity/ |
| Cosham et al., IGEM/TD/1 supplements | https://www.icheme.org/media/29620/hazards-32-paper-01-cosham.pdf |
| IGEM/TD/1 Supplement 2 | https://www.igem.org.uk/resource/igem-td-1-edition-6-supplement-2-high-pressure-hydrogen-pipelines.html |
| EPRG hydrogen guideline | https://www.eprg.net/fileadmin/EPRG_Dokumente/EPRG_Hydrogen_Pipelines_Integrity_Management_and_Repurposing_Guideline.pdf |
| CSA Group, NG pipeline materials for H2 | https://www.csagroup.org/article/research/assessment-of-natural-gas-pipeline-materials-for-hydrogen-service/ |
| CSA Z662:23 | https://www.csagroup.org/store/product/2430394/ |
| AUC Hydrogen Inquiry | https://open.alberta.ca/dataset/8fbe8453-8975-4ede-afa1-bbfaade17afb/resource/29d9fd21-36ad-4459-aa55-effd627df09d/download/energy-auc-hydrogen-inquiry-final-report-2022.pdf |

The tool itself carries 72 tagged references (R1–R72) in `src/data.js`. Each result in the interface shows the tags of the sources behind it.

## 5. Technology decision

The user left the choice of language open but required easy portability to Windows and Mac. Python would have needed an interpreter, packages and either a terminal or a GUI toolkit on each laptop. A compiled desktop application would have needed separate builds for each operating system. A **single HTML file** runs in the browser every laptop already has. It needs no installation and works offline, and it can still hold rich interaction, charts and file handling. That is why HTML was chosen.

The design that follows from that choice:

- **One file, built from many.** The source is split into readable files under `src/`. `build.py` concatenates them into `dist/H2_Pipeline_Suite.html` (about 250 kB) and also writes a body-only version to `build/artifact/index.html` for the hosted copy.
- **No external libraries.** Charts are drawn by a small SVG routine in `ui.js`. This keeps the file self-contained and avoids version and CDN problems. The only external request is the IBM Plex web font. If it is unavailable, system fonts are used.
- **Storage.** Inputs are saved automatically in the browser's local storage. Uploaded documents are kept in the browser's IndexedDB. For anything durable the user saves a **project file** (`.h2proj.json`), which can optionally include the documents encoded inside it.
- **Downloads.** From a local file, normal browser downloads are used. In the hosted claude.ai viewer, plain downloads are blocked. There the page uses the platform's `downloads` capability, which asks the viewer to confirm each save. Word exports are saved as `.html` because the platform does not accept `.doc`. If saving fails, a dialog shows the content for copy and paste.
- **Phone and tablet use.** The layout collapses to one column below about 860 px and was tested at 400 px width without horizontal scrolling.

## 6. Architecture

### 6.1 Source files

| File | Role |
|---|---|
| `src/engine.js` | Pure calculation functions (SI units internally). Exported as `window.H2E` in the browser and as a Node.js module for tests. |
| `src/data.js` | References, default code tables, grades, pipe sizes and walls, gas presets, seam types, tolerance tables, Wobbe ranges, burning-velocity table, repair matrix, equipment library, IGEM/CSA requirement matrix and blend rules (`window.H2D`). |
| `src/ui.js` | State, persistence, number formatting, reference chips, tables, SVG line charts, toasts, file download/upload, CSV parser, IndexedDB library, form generation, report export (`window.H2U`). |
| `src/modules1.js` | Project, Gas properties, Repurposing, Blending, New design, CGD. |
| `src/modules2.js` | ILI, Fatigue & fracture, Hydrogen safety, Repair, Operations. |
| `src/modules3.js` | Line pipe specification, Instruments & equipment, Files & data, Code tables, Verification, References, About. |
| `src/app.js` | Navigation, routing by URL hash, page rendering, toolbar actions, theme. |
| `src/style.css` | Design tokens with light and dark themes, layout, components, charts, safe-zone diagrams, responsive rules. |
| `src/shell.html` | Page skeleton into which CSS and JS are inserted. |
| `build.py` | Assembles the deliverables. |
| `tests/` | `run_tests.js` (engine), `hand_calcs.py` (independent checks), `smoke_ui.js` (browser). |
| `docs/` | User manual and this reference document. |
| `dist/` | Built deliverables for the user. |

### 6.2 State model

All user data lives in one state object `S`:

- `meta` — project title, client, engineer, revision, date;
- `settings` — energy basis HHV/LHV, metering reference, Z calibration factor, theme;
- `tables` — the editable code tables;
- `gasName` and `gas` — the base natural-gas composition shared by all modules;
- `m` — inputs per module, keyed by module id;
- `ili` — the uploaded ILI listing;
- `press` — the uploaded pressure history;
- `design` — the selected new-pipeline design. The design module writes it; the specification and equipment modules read it.

When saved data is loaded, the default code tables are merged underneath it. Older project files therefore pick up any table added later, such as the IGEM and CSA factors.

### 6.3 The module contract

Every module is an object pushed onto the `window.H2M` list. It has these members:

- `id`, `group`, `nav`, `title`, `intro` — identity and texts;
- `sections` — an array, or a function returning one, of `{title, fields}`. Each field is `{k, l, u, t, v, o, h, ref, share}`:
  - `k`: key;
  - `l`: label;
  - `u`: unit;
  - `t`: type — `num`, `sel`, `txt`, `chk` or `area`;
  - `v`: default value, which may be a function;
  - `o`: options;
  - `h`: help text;
  - `ref`: reference tags;
  - `share`: the project key it can be filled from.
- `compute(values)` — returns `{html, csv}`. The framework calls it again about 180 ms after each edit.
- Optional `extra()` and `bind()` — add custom input widgets, for example the composition grid or the upload buttons.
- Optional `after()` — attaches handlers to buttons inside the results, for example the specification export.
- Pages without a calculation (Files, Code tables, Verification, References, About) supply `page()` and `bindPage()` instead.

The toolbar comes from the framework and is the same for every module:

- *Fill from project* copies the `share` fields from the Project module;
- *Reset inputs*;
- report export as HTML and for Word;
- CSV of the main results table.

A report contains the inputs, the results and only the references actually cited in those results.

## 7. Calculation methods

All internal calculations use SI units. Pressures enter in barg and are converted to pascals absolute by adding 101 325 Pa.

### 7.1 Gas properties

- **Heating value, density, relative density and Wobbe index** follow ISO 6976:2016. Molar gross and net heating values at 15 °C combustion are combined with the summation-factor compressibility at the reference state. Hydrogen and helium have positive second virial coefficients, so they are added as a small positive term instead of through the squared summation. Metering references of 15 °C, 0 °C, 60 °F and 20 °C are available. The values reproduce the ISO 6976 entries for methane (37.78 MJ/m³) and hydrogen (12.10 MJ/m³). They also reproduce the EN 437 test-gas Wobbe indices for G20 (50.72) and G222 (47.87).
- **Compressibility at line conditions** uses the Peng–Robinson equation with literature binary interaction parameters, including H2–CH4.
  - The first version was plain Peng–Robinson. It was compared with GERG-2008 and Leachman values from CoolProp on a grid: methane, hydrogen, 10/20/50 % blends and two natural gases, at 10–150 bar and 0–40 °C. The mean error was 2.2 % and the maximum 4.8 %, which is not good enough.
  - Several variants were then tested: Soave–Redlich–Kwong, quantum-corrected hydrogen critical constants, and a Peneloux-type volume translation.
  - Peng–Robinson with Jhaveri–Youngren volume translation gave the best result: mean error 0.6 %, maximum about 1.5 % up to 100 bar. Methane at 70 bar comes out at 0.864 against 0.871; hydrogen at 100 bar at 1.0626 against 1.0615.
  - A user Z multiplier is provided so that results can be matched to a company AGA 8 or GERG value.
- **Viscosity** uses Sutherland's law per component and Wilke mixing. The methane constant was tuned so that methane matches CoolProp within 0.2 %.
- **Heat capacity and isentropic exponent** use ideal-gas polynomials from Smith–Van Ness–Abbott.
- **Flammability limits** of mixtures use Le Chatelier's rule. The stoichiometric air requirement and fuel mass fraction come from the combustion reactions.

### 7.2 Hydraulics and the energy penalty

- **Pipe flow** uses the isothermal general flow equation in mass form, p₁² − e^s·p₂² = f·Lₑ·G²·Z·R·T / (D·M). Here f is the Darcy friction factor from Colebrook–White, Z is evaluated at the standard average pressure, and an elevation correction is applied through s and Lₑ. A pipeline efficiency factor scales the friction. The tool can solve for flow from both pressures, outlet pressure from flow, or inlet pressure from flow. The tests check that the three solvers invert each other to better than 0.02 bar.
- **Compression** is modelled as multi-stage isentropic compression with intercooling. The stage ratio is limited to 3. The head uses the mean Z and the ideal isentropic exponent, an isentropic efficiency is applied, and a driver efficiency converts shaft power into fuel or electricity.
- **Energy loss** — the user's example question — is defined explicitly. It is the driver energy needed to restore the pressure drop of the pipeline segment, as a percentage of the energy delivered. It is computed for any blend on two bases: equal energy delivered, where the tool finds the flow and inlet pressure, or equal pressures, which gives maximum capacity. The results are also expressed per 100 km.
- **Other blend effects** reported alongside: leakage energy for choked (orifice) or laminar leaks, line-pack energy, outlet velocity against the API RP 14E erosional velocity, Wobbe change and hydrogen partial pressure.
- A sanity test confirms that pure hydrogen carries 75–85 % of the natural-gas energy at equal pressures. The tool gives 78.7 %, in line with the literature.

### 7.3 Strength, codes and MAOP

- **Barlow design pressure:** P = 2·S·t/D·F·E·T·Hf, with the B31.8 temperature derating table.
- **B31.12 Option A** solves P = P₀·Hf(P) by bisection, because Hf depends on pressure.
- **Hf rows are strength bands, not an interpolation axis.** The first version interpolated between rows and gave Hf = 0.99 for X52 PSL2, whose SMTS of 66.7 ksi is just above the 66 ksi row. That was corrected: a grade now uses the first band whose SMTS it does not exceed, with 1 ksi tolerance, and interpolation applies only across pressure.
- **One function handles all four code bases.** `codeFactor` and `codeAllowP` in `engine.js` cover B31.12 Option A, Option B, IGEM/TD/1 Supplement 2 and CSA Z662 Clause 17, so every module uses the same logic.
- **The hydrotest ratio follows B31.8 by class,** with a floor of 1.25 for hydrogen service. The floor is a tool default, not a code value.

### 7.4 Repurposing screening

About 20 checks are run, each with a value, a criterion, a status, the reference and the action to take:

- base-metal and weld/HAZ hardness;
- hard spots, using the 49 CFR §192.309 definition;
- seam type and vintage;
- grade and maximum strength limits of each option;
- CE(IIW) and Pcm;
- sulphur and phosphorus;
- Charpy energy and DWTT;
- K<sub>IH</sub> in hydrogen;
- crack-like features;
- dents;
- metal loss;
- girth-weld practice;
- hydrotest record;
- cathodic-protection potential;
- hoop stress at the hydrogen MAOP;
- pressure cycling.

The overall verdict counts the red and amber results. The module also states the new MAOP under all four code bases and the energy capacity after conversion. It shows the code-requirements matrix (B31.12, IGEM, CSA, EIGA) with checks against the entered data.

### 7.5 Defects, fatigue and fracture

- **Metal loss** is assessed by Modified B31G (0.85dL, flow stress SMYS + 69 MPa), giving failure pressure, safe pressure and ERF.
- **Crack-like flaws** use the Newman–Raju semi-elliptical surface-crack stress intensity at the deepest and surface points, multiplied by a Folias-based bulging factor (API 579 form). The result is compared with K<sub>IH</sub>.
- **Fatigue crack growth** integrates the Code Case 2938 two-segment law (minimum of the low- and high-ΔK expressions) or the BS 7910 air law. Depth and length grow independently over load blocks. A block is either constant-amplitude cycling or the rainflow-counted (ASTM E1049) uploaded SCADA history, binned to 0.5 bar. Growth stops when Kmax reaches K<sub>IH</sub> or the depth reaches 80 % of wall. Allowable life is the calculated life divided by 2, following the ASME VIII-3 KD-10 convention; the factor is editable.
- **Ductile fracture arrest** uses the Battelle two-curve method. The gas decompression wave speed comes from ideal-gas isentropic expansion using the mixture's isentropic exponent and sound speed. The fracture-velocity and arrest-stress relations are written with Charpy energy per ligament area: J/mm² in the velocity term and N/mm in the arrest term. A unit error at this point was caught during development by checking that the arrest pressure came out realistic. The Leis correction is applied above 95 J. The tests confirm that pure hydrogen, with its fast decompression, needs far less arrest toughness than a rich natural gas.

### 7.6 Safety

- **Leak.** Choked or subsonic orifice discharge is calculated first. A Birch (1987) notional nozzle conserves mass and momentum. Visible flame length uses the Delichatsios/Schefer–Houf Froude correlation, with L\* = 23 in the momentum regime. Radiation uses a point source at mid-flame. The radiant fraction defaults to an energy-weighted value between 0.16 (large hydrogen flames) and 0.20 (natural gas).
- **Flammable cloud.** Distances to LFL and ½ LFL along the jet axis use Chen–Rodi centreline decay. The flammable mass in the jet is estimated by integrating jet transit time. It feeds a TNT-equivalence overpressure estimate using the Mills fit. Fatality distances use the Eisenberg probit.
- **Rupture.** The potential impact radius uses the generalised Stephens (C-FER/GRI) model: release-rate decay 0.33, Cd 0.62, two ends, combustion efficiency 0.35 and an emissivity factor.
  - With the textbook natural-gas emissivity of 0.2 the model gives k = 0.72, within 4 % of the B31.8S constant 0.69.
  - The hydrogen emissivity was calibrated to 0.11 so that pure hydrogen reproduces the industry constant 0.47.
  - For blends the emissivity is interpolated by energy fraction. The code-constant PIR is shown next to the model value.
  - Thermal radii for every threshold and a delayed-ignition explosion estimate (assumption-driven, clearly labelled) complete the rupture case.
- **Safe-zone diagrams** for leak and rupture are drawn to scale in SVG.

### 7.7 CGD blending

The Wobbe index is computed across the blend sweep and checked against the selected acceptance range and an appliance tolerance band. The module also reports:

- appliance heat-input change (proportional to Wobbe at fixed nozzle and pressure);
- the extra volume needed for the same energy (relevant to volumetric billing);
- network energy capacity (also proportional to Wobbe);
- stoichiometric laminar burning velocity from the Hu et al. (2009) data, as a flashback indicator;
- CO₂ reduction per unit of energy;
- component and end-use limits, including the PNGRB preliminary limits.

### 7.8 Repair, operations, specifications

- **Repair.** A matrix of seven methods against nine defect types (recommended, conditional, not recommended), with hydrogen-specific notes. Welding indices CE(IIW), Pcm and CET, the EN 1011-2 method B preheat, and warnings for live welding on hydrogen and burn-through risk.
- **Operations.** Section inventory and vent-limited blowdown time (isothermal, choked), vented energy and greenhouse impact (GWP100: CH4 29.8, H2 11.6), purge guidance, and a comparison of the integrity-management programme for natural gas and hydrogen.
- **Line pipe specification.** An API 5L PSL2 supplement for hydrogen:
  - chemistry limits in the Annex H style;
  - Y/T ≤ 0.90;
  - hardness ≤ 250/235 HV10;
  - Charpy taken from the fracture-arrest result, plus DWTT;
  - hydrogen tests: K<sub>IH</sub>, fatigue crack growth and J-R in hydrogen, HIC as a cleanliness check, microstructure;
  - NDT, hydrotest, coating and documentation.

  Consistency checks are code-aware; IGEM requires toughness testing, for example. The specification exports as HTML or for Word.
- **Equipment datasheets.** Fifteen datasheets filled from the design data, each with hydrogen-specific requirements and standards. API 520 PSV sizing (critical gas flow) selects the API 526 orifice.

## 8. Verification

### 8.1 Synthetic test cases

The *Verification* module and `tests/run_tests.js` run 19 cases. All pass. Their expected values come from three kinds of source:

- **Published values:**
  - ISO 6976 heating values of methane and hydrogen;
  - EN 437 Wobbe of G20 and G222;
  - the API 520 worked example (3 698 mm²);
  - the ASTM E1049 rainflow example;
  - the B31.8S PIR constant 0.69 and the hydrogen PIR constant 0.47.
- **Independent calculations** (`tests/hand_calcs.py`, a separate implementation in Python):
  - Modified B31G;
  - EN 1011-2 preheat;
  - the Code Case 2938 rate;
  - the general flow equation, solved with Newton–Colebrook and GERG-2008 compressibility from CoolProp. The JavaScript result is within 0.5 % of it.
- **Hand checks:** Barlow; the IGEM allowable pressure (0.5, no Hf at L360); the CSA F·L pressure; and the Mills overpressure fit.

Eleven further consistency tests check that:

- the flow solvers invert each other;
- Wobbe falls with increasing hydrogen;
- hydrogen energy capacity lies in the expected range;
- Hf behaves correctly for X52 and X70;
- BTCM ranks hydrogen against rich gas correctly;
- fatigue life in hydrogen is shorter than in air;
- the 25 mm hydrogen release rate is plausible;
- the Le Chatelier LFL is correct.

The built-in synthetic project cases are:

- a 24″ X52 HFW line, 120 km, MAOP 70 barg, re-rating to about 56 barg under Option A;
- a 20 % blend in the same line;
- a 500 t/d pure-hydrogen line, 150 km, 60 → 30 barg (selects 16″ × 7.9 mm X52);
- a 12-anomaly ILI listing;
- a 60-day hourly SCADA pressure history;
- a 10 % RLNG CGD case.

### 8.2 Browser tests

`tests/smoke_ui.js` (Playwright with Chromium) runs these checks:

1. Opens the built file and loads the synthetic ILI and pressure data.
2. Visits every module and fails on any console error or any NaN, "undefined" or error text in the output.
3. Switches the equipment module to the PSV and checks the sizing.
4. Checks for horizontal overflow at 400 px width.

Screenshots of every module in light and dark themes were inspected visually. Separate scripts exercised the IGEM and CSA options in the repurposing and design modules.

### 8.3 Defects found and fixed during development

- The page's `[hidden]` dialog was still displayed in the standalone file, so it blocked clicks. Fixed with a global `[hidden]{display:none}`.
- Key–value result tables overflowed at phone width. They now stack, and long text values wrap.
- Hf was interpolated between strength rows (X52 gave 0.99). Changed to band selection.
- The fatigue chart showed R = 1.00, because rounding in the rainflow bins made pmax equal pmin. Degenerate bins are now removed and the dominant cycle is used for display.
- Long text in the materials-exposure table overflowed. Values longer than about 26 characters are now shown as wrapping text.
- The first version of the PIR model omitted the 0.35 combustion efficiency and over-predicted by about 75 %. It was corrected before release.
- The suite README was missing from the first commit because an earlier command in the same shell chain failed. It was written and committed with v1.1.

## 9. Deliverables and where they are

| Deliverable | Location |
|---|---|
| Tool (double-click to open) | `h2-pipeline-suite/dist/H2_Pipeline_Suite.html` |
| User manual | `dist/User_Manual.html`, `dist/User_Manual.pdf` (source `docs/User_Manual.html`) |
| This reference | `docs/Project_Reference.md` (also published as a page) |
| Source and tests | `src/`, `tests/`, `build.py` |
| Hosted copy (private to the owner) | https://claude.ai/artifact/K6feyY8qHt49agJVQoV24p |
| Git | branch `claude/hydrogen-pipeline-tool-tz9w95` of `vanadium1202/vanadium-Pcode`. No pull request has been opened. |

To use the tool on the home Mac, open the hosted link. Alternatively, download `dist/H2_Pipeline_Suite.html` from the branch on GitHub and double-click it. To carry inputs between computers, use *Files & data → Save project* on one machine and *Open project* on the other.

## 10. How to maintain and extend

### Rebuild and test after any change

```
cd h2-pipeline-suite
python3 build.py
node tests/run_tests.js
python3 tests/hand_calcs.py                       # needs: pip install CoolProp
NODE_PATH=$(npm root -g) node tests/smoke_ui.js   # needs Playwright + Chromium
```

### Typical changes

- **Correct a code value** (for example the Hf table after checking the licensed B31.12). Users can change it in the *Code tables* module, and it is saved with their project. To change the shipped default, edit `DEFAULT_TABLES` in `src/data.js` and rebuild. Then check whether verification case V08 or V11 needs a new expected value.
- **Add a reference.** Add `Rnn: [source, title, used-for]` to `REFS` in `data.js`, then cite it with `ref('Rnn')` in a module. It appears in reports automatically whenever it is used.
- **Add a module.** Push a new object that follows the module contract (section 6.3) in one of the module files. Navigation, toolbar, persistence and reports come from the framework. Add its id to the manual and, if it calculates something new, add a verification case.
- **Add a verification case.** Add a line to `verificationCases()` in `engine.js` with the computed expression, the expected value, a tolerance, and the basis of the expected value. Where possible, compute the expected value independently in `tests/hand_calcs.py`.
- **Add a code basis.** Extend `codeFactor()` in `engine.js` and `CODES` in `data.js`. The repurposing, design and project modules pick it up automatically.
- **Update the hosted copy.** Republish `build/artifact/index.html` (with `docs/User_Manual.html` as a supporting file) to the same artifact URL.

### Conventions

- Inputs are in barg, °C, mm and km; the engine works in SI.
- Every number taken from a standard carries a reference tag.
- Any value that could not be confirmed is editable and labelled "verify".
- Interface wording uses plain language.

## 11. Known limitations and open items

- **Unverified code values.** The values in section 4.3 must be checked against licensed copies, above all the B31.12 Hf table, the IGEM S/T factors and the CSA location factors.
- **Compressibility.** Z is within about ±1.5 % of GERG-2008 up to 100 bar. Above that, or for unusual gases, calibrate it.
- **Hydraulics** are steady and isothermal. Transients, Joule–Thomson cooling and line-pack dynamics are not modelled.
- **Consequence models** ignore wind, terrain, obstacles and crater formation, and use a single point source for radiation. The delayed-ignition explosion estimate depends on assumptions.
- **Fatigue** uses flat-plate surface-flaw solutions with bulging. Residual stress and misalignment are not included.
- **IGEM and CSA content** comes from public summaries. The CSA Clause 17 "lower of" rule is the tool's interpretation.

## 12. Suggested next steps

1. Check every value in section 4.3 against your licensed standards and update the defaults.
2. Add a second-tier compressibility option (AGA 8 Detail / GERG-2008) for high-pressure work.
3. Add DNV-ST-F101/DNV-RP-F123 or EN 1594 / DVGW G 409 bases if those markets matter.
4. Add a transient blowdown and pressure-cycling generator for fatigue screening of new designs.
5. Add a multi-segment network model for CGD (MP and LP networks with regulators) instead of the Wobbe-proportional capacity estimate.
6. Open a pull request once you are satisfied, so the work is merged into the main branch.

## 13. Change log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 8 Oct 2026 | First release: 18 modules, 66 references, 17 verification cases, user manual, hosted copy. |
| 1.0.1 | 8 Oct 2026 | Hosted copy uses the platform downloads capability. |
| 1.1 | 8 Oct 2026 | IGEM/TD/1 Supplement 2 and CSA Z662:23 Clause 17 as design bases; code-requirements and blend-threshold tables; editable IGEM/CSA factors; V18 and V19; references R67–R72; manual v1.1; suite README; this reference document. |
