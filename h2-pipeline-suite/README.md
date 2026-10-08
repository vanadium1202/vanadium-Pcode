# H2 Pipeline Suite

Screening-level engineering workbook for hydrogen transport by pipeline. It runs as **one HTML file** in any browser (Windows / macOS), offline, with no installation.

**Use it:** open `dist/H2_Pipeline_Suite.html`. Manual: `dist/User_Manual.html` or `dist/User_Manual.pdf`.

## Modules

| Group | Module | What it does |
|---|---|---|
| Setup | Project & scenario | Shared pipeline data; compares NG, blend and repurposed H2 under B31.12 A/B, IGEM/TD/1 Supp 2 and CSA Z662 |
| | Gas properties | ISO 6976 CV/Wobbe/density, PR-EOS Z (volume-translated), viscosity, flammability, CO₂ |
| Transport routes | Repurposing (100 % H2) | ~20-item metallurgy/condition screening; MAOP re-rating (B31.8 → B31.12 Option A/B, IGEM/TD/1 Supp 2, CSA Z662:23 Cl. 17); code-requirements comparison |
| | Blending in NG pipeline | Energy capacity, compression energy ("energy loss"), leakage, line pack, velocity, pH2, end-use tolerances, code/regulatory thresholds (IGEM 10 %, CSA Cl. 17, GS(M)R, AUC, PNGRB) |
| | New H2 pipeline design | NPS screening, wall thickness (B31.12 A/B, IGEM Supp 2 or CSA Z662), hydrotest, BTCM fracture arrest, compression, pressure profile |
| | CGD blending & Wobbe | Wobbe vs H2 %, appliance heat input, burning velocity, standards ranges, PNGRB/CGD component limits |
| Integrity | ILI & defects | CSV upload; Modified B31G, crack K vs KIH, dents, hard spots, laminations |
| | Fatigue & fracture | CC2938 H2 crack growth vs air; SCADA pressure upload with rainflow (ASTM E1049) |
| | Repair | Method matrix for H2 service, CE/Pcm/CET, EN 1011-2 preheat |
| | Operations | Inventory, blowdown, venting GHG, purging, IM programme |
| Safety | Hydrogen safety | Leak: release, flame length, radiation, LFL/½LFL, VCE. Rupture: PIR, thermal and overpressure zones, zone diagrams |
| Specifications | Line pipe specification | API 5L PSL2 supplementary spec for H2 (HTML/.doc) with code-specific consistency checks |
| | Instruments & equipment | 15 datasheets with H2 requirements; API 520 PSV sizing |
| Data & QA | Files, code tables, verification, references | Project save/open (JSON), document library, editable code tables, 19 verification cases, 72 references |

## Develop / verify

```bash
python3 build.py                                   # src/ -> dist/H2_Pipeline_Suite.html
node tests/run_tests.js                            # engine tests incl. 19 verification cases
python3 tests/hand_calcs.py                        # independent hand calcs (pip install CoolProp for V17)
NODE_PATH=$(npm root -g) node tests/smoke_ui.js    # browser smoke test (Playwright)
```

Source layout: `src/engine.js` (pure calculations), `src/data.js` (references, code tables, libraries), `src/ui.js` (forms, charts, files), `src/modules1-3.js` (modules), `src/app.js` (shell), `src/style.css`, `src/shell.html`.

> Code values (ASME B31.12 Hf table, IGEM/TD/1 and CSA Z662 factors, limits) are transcribed from public sources and are editable in the app. Verify against licensed standards. Results require review by a competent engineer.
