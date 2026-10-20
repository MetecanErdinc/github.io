"""MAK 4097 - Ic ice borulu isi degistiricisi deneyi hesaplari.

Varsayim olarak isaretlenen degerleri foydeki gercek olculerle degistirip
`python3 hesap.py` ile tum sonuclari yeniden uretebilirsiniz.
"""
import math

# ---------------- Olculen veriler (Tablo 1) ----------------
T_h_in, T_h_out = 76.5, 50.2      # hava giris / cikis, C
T_c_in, T_c_out = 22.1, 24.7      # su giris / cikis, C
dp_hava = 328.7                   # Pa (elektronik manometre)
dp_su_mmSS = 40.0                 # mmSS (U manometre)

# ---------------- Geometri ----------------
DA_su, DB_su = 0.026, 0.016       # su venturisi (olculen)
DA_hava, DB_hava = 0.040, 0.020   # VARSAYIM: hava venturisi (Sekil 1'den alin)
D2 = 0.016                        # ic boru dis capi (hoca notu: 26-16)
D3 = 0.026                        # kovan ic capi
t = 0.001                         # VARSAYIM: ic boru et kalinligi
D1 = D2 - 2 * t                   # ic boru ic capi
L = 1.0                           # VARSAYIM: isi degistirici boyu, m
k_celik = 60.5                    # W/mK, karbon celigi (Incropera Tablo A.1)

# ---------------- Sabitler ----------------
CD, P_atm, R_hava, g = 0.98, 101325.0, 287.0, 9.81

def lin(x, x0, x1, y0, y1):
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0)

# Hava ozellikleri, Incropera Tablo A.4 (300 K ve 350 K arasi interpolasyon)
Tm_h = (T_h_in + T_h_out) / 2 + 273.15
cp_h = lin(Tm_h, 300, 350, 1007, 1009)
mu_h = lin(Tm_h, 300, 350, 184.6e-7, 208.2e-7)
k_h = lin(Tm_h, 300, 350, 26.3e-3, 30.0e-3)
Pr_h = lin(Tm_h, 300, 350, 0.707, 0.700)
rho_h_m = P_atm / (R_hava * Tm_h)

# Su ozellikleri, Incropera Tablo A.6 (295 K ve 300 K arasi interpolasyon)
Tm_c = (T_c_in + T_c_out) / 2 + 273.15
cp_c = lin(Tm_c, 295, 300, 4181, 4179)
mu_c = lin(Tm_c, 295, 300, 959e-6, 855e-6)
k_c = lin(Tm_c, 295, 300, 0.606, 0.613)
Pr_c = lin(Tm_c, 295, 300, 6.62, 5.83)
rho_c = 1 / lin(Tm_c, 295, 300, 1.002e-3, 1.003e-3)
rho_su_venturi = 997.8            # 22.1 C'de su yogunlugu

out = []
def p(s=""):
    out.append(s)

# ---------------- 5.1 Hava debisi ----------------
rho_h_in = P_atm / (R_hava * (T_h_in + 273.15))
beta_h = DB_hava / DA_hava
VB_h = CD * math.sqrt(2 * dp_hava / (rho_h_in * (1 - beta_h**4)))
AB_h = math.pi * DB_hava**2 / 4
m_h = rho_h_in * AB_h * VB_h
p("== Hava debisi ==")
p(f"rho_hava,giris = {rho_h_in:.4f} kg/m3, beta = {beta_h:.4f}, beta^4 = {beta_h**4:.4f}")
p(f"V_B = {VB_h:.3f} m/s, A_B = {AB_h:.4e} m2, m_hava = {m_h:.5f} kg/s")

# ---------------- 5.2 Su debisi ----------------
dp_su = 1000 * g * dp_su_mmSS / 1000
beta_c = DB_su / DA_su
VB_c = CD * math.sqrt(2 * dp_su / (rho_su_venturi * (1 - beta_c**4)))
AB_c = math.pi * DB_su**2 / 4
m_c = rho_su_venturi * AB_c * VB_c
p("== Su debisi ==")
p(f"dp_su = {dp_su:.2f} Pa, beta = {beta_c:.4f}, beta^4 = {beta_c**4:.4f}")
p(f"V_B = {VB_c:.4f} m/s, A_B = {AB_c:.4e} m2, m_su = {m_c:.4f} kg/s")

# ---------------- 6.1 Isi miktarlari ----------------
q_h = m_h * cp_h * (T_h_in - T_h_out)
q_c = m_c * cp_c * (T_c_out - T_c_in)
p("== Isi miktarlari ==")
p(f"Hava: Tm = {Tm_h:.2f} K, cp = {cp_h:.1f}, mu = {mu_h:.4e}, k = {k_h:.4e}, Pr = {Pr_h:.4f}")
p(f"Su:   Tm = {Tm_c:.2f} K, cp = {cp_c:.1f}, mu = {mu_c:.4e}, k = {k_c:.4f}, Pr = {Pr_c:.3f}, rho = {rho_c:.1f}")
p(f"q_hava = {q_h:.1f} W, q_su = {q_c:.1f} W, q_su/q_hava = {q_c/q_h:.2f}")
p(f"Bagil fark (hava esas) = {(q_c-q_h)/q_h*100:.1f} %")
p(f"Enerji dengesi icin gereken m_hava = {q_c/(cp_h*(T_h_in-T_h_out)):.4f} kg/s")
p(f"Enerji dengesi icin gereken su dT = {q_h/(m_c*cp_c):.3f} K")

# ---------------- 6.2 Deneysel U ----------------
dT1 = T_h_in - T_c_out
dT2 = T_h_out - T_c_in
dTlm = (dT1 - dT2) / math.log(dT1 / dT2)
A2 = math.pi * D2 * L
U_den = q_h / (A2 * dTlm)
p("== Deneysel U ==")
p(f"dT1 = {dT1:.2f}, dT2 = {dT2:.2f}, dTlm = {dTlm:.3f} K")
p(f"A2 = {A2:.5f} m2, U_deneysel = {U_den:.2f} W/m2K, UA = {U_den*A2:.3f} W/K")

# ---------------- 6.3 Re, Nu, h ----------------
A1 = math.pi * D1**2 / 4
V_h = m_h / (rho_h_m * A1)
Re_h = rho_h_m * V_h * D1 / mu_h
Nu_h = 0.023 * Re_h**0.8 * Pr_h**0.3            # hava sogutuluyor
h_ic = Nu_h * k_h / D1

Dh = D3 - D2
Aan = math.pi * (D3**2 - D2**2) / 4
V_c = m_c / (rho_c * Aan)
Re_c = rho_c * V_c * Dh / mu_c
Nu_c = 0.023 * Re_c**0.8 * Pr_c**0.4            # su isiniyor
h_dis = Nu_c * k_c / Dh
p("== Re, Nu, h ==")
p(f"Hava (ic boru): A = {A1:.4e} m2, rho = {rho_h_m:.4f}, V = {V_h:.2f} m/s, Re = {Re_h:.0f}, L/D = {L/D1:.1f}")
p(f"   Nu = {Nu_h:.2f}, h_ic = {h_ic:.2f} W/m2K")
p(f"Su (halka): Dh = {Dh:.4f} m, A = {Aan:.4e} m2, V = {V_c:.4f} m/s, Re = {Re_c:.0f}, L/Dh = {L/Dh:.1f}")
p(f"   Nu = {Nu_c:.2f}, h_dis = {h_dis:.1f} W/m2K")

def gnielinski(Re, Pr):
    f = (0.790 * math.log(Re) - 1.64) ** -2
    return (f / 8) * (Re - 1000) * Pr / (1 + 12.7 * math.sqrt(f / 8) * (Pr ** (2 / 3) - 1)), f
Nu_cG, f_c = gnielinski(Re_c, Pr_c)
h_disG = Nu_cG * k_c / Dh
p(f"   Gnielinski (su): f = {f_c:.5f}, Nu = {Nu_cG:.2f}, h_dis = {h_disG:.1f} W/m2K")

# ---------------- 6.3 Teorik U ----------------
r1, r2 = D1 / 2, D2 / 2
R_ic = r2 / (r1 * h_ic)
R_cidar = r2 / k_celik * math.log(r2 / r1)
R_dis = 1 / h_dis
U_teo = 1 / (R_ic + R_cidar + R_dis)
q_teo = U_teo * A2 * dTlm
p("== Teorik U ==")
p(f"r2/(r1 h_ic) = {R_ic:.4e}, r2/k ln(r2/r1) = {R_cidar:.4e}, 1/h_dis = {R_dis:.4e} m2K/W")
Rt = R_ic + R_cidar + R_dis
p(f"Pay: ic %{R_ic/Rt*100:.1f}, cidar %{R_cidar/Rt*100:.2f}, dis %{R_dis/Rt*100:.1f}")
p(f"U_teorik = {U_teo:.2f} W/m2K, q (denk.16) = {q_teo:.1f} W")
U_teoG = 1 / (R_ic + R_cidar + 1 / h_disG)
p(f"U_teorik (su icin Gnielinski) = {U_teoG:.2f} W/m2K")
p(f"Fark (U_teo - U_den)/U_teo = {(U_teo-U_den)/U_teo*100:.1f} %")

# Etkinlik - NTU kontrolu
C_h, C_c = m_h * cp_h, m_c * cp_c
Cmin, Cmax = min(C_h, C_c), max(C_h, C_c)
eps = q_h / (Cmin * (T_h_in - T_c_in))
p("== e-NTU ==")
p(f"C_hava = {C_h:.3f} W/K, C_su = {C_c:.2f} W/K, Cr = {Cmin/Cmax:.4f}, etkinlik = {eps:.3f}, NTU_den = {U_den*A2/Cmin:.3f}")

print("\n".join(out))
