"""Independent hand calculations used as expected values for the synthetic
verification cases (V09, V16, V17, V18) in the H2 Pipeline Suite.

These are written separately from src/engine.js (different language, different
solver, CoolProp/GERG-2008 for compressibility) so that the in-app checks
compare two independent implementations.

Run:  python3 tests/hand_calcs.py          (CoolProp optional; needed for V17)
"""
import math


def mod_b31g(D, t, d, L, smys):
    """Modified B31G (0.85dL), Kiefner & Vieth 1989 / ASME B31G-2012 Level 1."""
    sflow = smys + 68.95
    z = L ** 2 / (D * t)
    M = math.sqrt(1 + 0.6275 * z - 0.003375 * z ** 2) if z <= 50 else 0.032 * z + 3.3
    sf = sflow * (1 - 0.85 * d / t) / (1 - 0.85 * d / t / M)
    return 2 * sf * t / D


def preheat_en1011(CET, d, HD, Q):
    """EN 1011-2:2001 Annex C, method B, Eq. (C.5)."""
    return 697 * CET + 160 * math.tanh(d / 35) + 62 * HD ** 0.35 + (53 * CET - 32) * Q - 328


def general_flow_ch4(D=0.5906, L=100e3, p1=70e5 + 101325, p2=50e5 + 101325, T=288.15, eps=4.57e-5):
    """Isothermal general flow equation, Darcy friction (Colebrook, Newton-solved),
    Z from CoolProp (GERG/Setzmann-Wagner methane) at the average pressure."""
    import CoolProp.CoolProp as CP
    R, M = 8.314462618, 0.0160425
    pavg = 2 / 3 * (p1 + p2 - p1 * p2 / (p1 + p2))
    Z = CP.PropsSI('Z', 'T', T, 'P', pavg, 'Methane')
    mu = CP.PropsSI('V', 'T', T, 'P', pavg, 'Methane')
    A = math.pi * D ** 2 / 4
    f = 0.015
    for _ in range(60):
        mdot = A * math.sqrt((p1 ** 2 - p2 ** 2) * D * M / (f * L * Z * R * T))
        Re = mdot / A * D / mu
        # Newton iteration on Colebrook in x = 1/sqrt(f)
        x = 1 / math.sqrt(f)
        for _ in range(50):
            g = x + 2 * math.log10(eps / D / 3.7 + 2.51 * x / Re)
            dg = 1 + 2 / math.log(10) * (2.51 / Re) / (eps / D / 3.7 + 2.51 * x / Re)
            x -= g / dg
        f = 1 / x ** 2
    return mdot, Z


def cc2938(dK, R):
    low = 3.5e-14 * (1 + 0.4286 * R) / (1 - R) * dK ** 6.5
    high = 1.5e-11 * (1 + 2.0 * R) / (1 - R) * dK ** 3.66
    return min(low, high)


if __name__ == '__main__':
    print('V09 Modified B31G Pf [MPa]   :', round(mod_b31g(610, 9.5, 4.75, 200, 358.5), 4))
    print('V15 CC2938 da/dN [m/cycle]   :', '%.4e' % cc2938(10, 0.5))
    print('V16 EN 1011-2 preheat [C]    :', round(preheat_en1011(0.30, 20, 5, 1.0), 2))
    try:
        m, Z = general_flow_ch4()
        print('V17 General flow mdot [kg/s] :', round(m, 3), '(Z_avg GERG =', round(Z, 4), ')')
    except ImportError:
        print('V17 needs CoolProp:  pip install CoolProp')
