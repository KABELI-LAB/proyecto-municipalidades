"""Datos de demostración de otros municipios, derivados del escenario de demo/datos/.

Uso: python demo/municipios/derivar.py curepto   (o vichuquen; sin argumento, todos)

Toma el mismo escenario ficticio (personas, animales, avisos, adopciones,
operativos, reportes, solicitudes) y lo traslada al territorio real del
municipio, descrito en demo/municipios/<id>/territorio.json:
- cada localidad del escenario pasa a una localidad del municipio (los sectores
  base se reparten en los sectores indicados en «mapa_sectores»);
- cada lugar de referencia pasa al lugar indicado en «mapa_lugares»;
- los puntos se recalculan desde las coordenadas nuevas con el mismo desplazamiento;
- ids, correos, RUT y códigos TR llevan una serie propia, para no chocar con
  los de otros municipios en la misma base;
- la prioridad por sector y el resumen se recalculan con las fórmulas de demo/generar.py.
Escribe demo/municipios/<id>/datos/ y demo/municipios/<id>/asignacion.json (las
mismas fotos de demo/fotos/, asignadas a los mismos animales). Nada se inventa:
las coordenadas vienen del territorio, con su fuente.
"""
import json, os, sys
from datetime import date

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BASE = os.path.join(RAIZ, "demo", "datos")
AVISO = "Datos de demostración. No corresponden a registros reales de la Municipalidad."
ENTIDADES = ["personas", "animales", "solicitudes", "reportes", "publicaciones", "adopcion", "adopciones_realizadas",
             "postulaciones", "perros_comunitarios", "operativos", "atenciones", "avisos", "usuarios"]
COPIAR = ["catalogos", "propuestas_adopcion"] + ENTIDADES


def leer(nombre):
    return json.load(open(os.path.join(BASE, f"{nombre}.json"), encoding="utf8"))["datos"]


def dv(n):
    t, m = 0, 2
    for c in reversed(str(n)):
        t += int(c) * m
        m = 2 if m == 7 else m + 1
    r = 11 - t % 11
    return "0" if r == 11 else "K" if r == 10 else str(r)


def fmt_rut(n):
    return f"{n:,}".replace(",", ".") + f"-{dv(n)}"


def derivar(mid):
    carpeta = os.path.join(RAIZ, "demo", "municipios", mid)
    t = json.load(open(os.path.join(carpeta, "territorio.json"), encoding="utf8"))
    pref = t["prefijo"]

    # ── Territorio nuevo ──
    sector_de_loc = {l["id"]: s["id"] for s in t["sectores"] for l in s["localidades"]}
    loc_nueva = {l["id"]: l for s in t["sectores"] for l in s["localidades"]}
    lugar_nuevo = {l["id"]: {**l, "sector_id": sector_de_loc[l["localidad"]]} for l in t["lugares"]}
    sector_nuevo = {s["id"]: s for s in t["sectores"]}

    # ── Correspondencias desde el escenario base ──
    base_locs = leer("localidades")
    base_lugares = leer("lugares")
    base_sectores = leer("sectores")
    loc_map = {}
    for bs in base_sectores:
        destinos = [sector_nuevo[x]["localidades"] for x in t["mapa_sectores"][bs["id"]]]
        # Se alternan los sectores de destino para repartir el escenario entre ellos.
        intercaladas = [l["id"] for grupo in zip(*[g + [None] * (max(map(len, destinos)) - len(g)) for g in destinos]) for l in grupo if l]
        propias = [l["id"] for l in base_locs if l["sector_id"] == bs["id"]]
        for i, b in enumerate(propias):
            loc_map[b] = intercaladas[i % len(intercaladas)]
    lug_map = t["mapa_lugares"]
    sec_map = {b: v[0] for b, v in t["mapa_sectores"].items()}
    faltan = [l["id"] for l in base_lugares if l["id"] not in lug_map]
    if faltan:
        raise SystemExit(f"{mid}: faltan lugares en mapa_lugares: {faltan}")

    ids = {}
    for n in ENTIDADES:
        for r in leer(n):
            ids[r["id"]] = f"{pref}-{r['id']}"

    # Nombres del escenario → nombres del municipio (los más largos primero).
    nombres = [(a, b) for a, b in t.get("reemplazos", [])]
    nombres += sorted(((l["nombre"], lugar_nuevo[lug_map[l["id"]]]["nombre"]) for l in base_lugares), key=lambda x: -len(x[0]))
    nombres += sorted(((l["nombre"], loc_nueva[loc_map[l["id"]]]["nombre"]) for l in base_locs), key=lambda x: -len(x[0]))
    nombres += sorted(((s["nombre"], sector_nuevo[sec_map[s["id"]]]["nombre"]) for s in base_sectores), key=lambda x: -len(x[0]))

    def texto(s):
        if s in ids:
            return ids[s]
        for a, b in nombres:
            s = s.replace(a, b)
        return s

    def pasar(x, clave=None):
        if isinstance(x, dict):
            return {k: pasar(v, k) for k, v in x.items()}
        if isinstance(x, list):
            return [pasar(v, clave) for v in x]
        if isinstance(x, str):
            if clave == "localidad_id":
                return loc_map[x]
            if clave == "lugar_id":
                return lug_map[x]
            if clave in ("sector_id", "sector_adoptante_id", "sector", "sectores"):
                return sec_map.get(x, x)
            return texto(x)
        return x

    def coord(tipo, ref):
        p = loc_nueva[ref] if tipo == "localidad" else lugar_nuevo[ref]
        return p["lat"], p["lng"]

    def ubicar(pos, tipo, ref):
        import math
        lat, lng = coord(tipo, ref)
        return {"dx_m": pos["dx_m"], "dy_m": pos["dy_m"], "lat": round(lat + pos["dy_m"] / 111320, 5), "lng": round(lng + pos["dx_m"] / (111320 * math.cos(math.radians(lat))), 5)}

    datos = {n: pasar(leer(n)) for n in COPIAR}
    datos["puntos_recurrentes"] = leer("puntos_recurrentes")
    avisos_base = {a["id"]: a for a in leer("avisos")}

    # ── Sector de cada registro: el de su localidad o lugar nuevo ──
    personas = {p["id"]: p for p in datos["personas"]}
    for i, p in enumerate(datos["personas"], start=1):
        p["sector_id"] = sector_de_loc[p["localidad_id"]]
        n = t["rut_base"] + i
        p["rut"] = fmt_rut(n)
        p["telefono"] = f"+56 9 {t['desfase_tr'] // 1000:04d} {i:04d}"
        p["correo"] = p["correo"].replace("@demo.invalid", f"@{t['dominio_correo']}")
    # La cuenta de demostración del panel: la del territorio (por ejemplo, admin@curepto.cl).
    for u in datos["usuarios"]:
        u["correo"] = t.get("correo_cuenta") or u["correo"].replace("@demo.invalid", f"@{t['dominio_correo']}")
    for r in datos["solicitudes"]:
        r["sector_id"] = sector_de_loc[r["localidad_id"]]
    for r in datos["publicaciones"]:
        r["sector_id"] = sector_de_loc[r["localidad_id"]]
        r["posicion"] = ubicar(r["posicion"], "localidad", r["localidad_id"])
    for r in datos["reportes"]:
        ref = r["referencia"]
        ref["id"] = loc_map.get(ref["id"]) if ref["tipo"] == "localidad" else lug_map[ref["id"]]
        r["sector_id"] = sector_de_loc[ref["id"]] if ref["tipo"] == "localidad" else lugar_nuevo[ref["id"]]["sector_id"]
        r["posicion"] = ubicar(r["posicion"], ref["tipo"], ref["id"])
    for c in datos["perros_comunitarios"]:
        c["sector_id"] = lugar_nuevo[c["lugar_id"]]["sector_id"]
        c["posicion"] = ubicar(c["posicion"], "lugar", c["lugar_id"])
    operativo_sector = {}
    for o in datos["operativos"]:
        o["sector_id"] = lugar_nuevo[o["lugar_id"]]["sector_id"]
        o["nombre"] = f"Operativo {sector_nuevo[o['sector_id']]['nombre']}"
        operativo_sector[o["id"]] = o["sector_id"]
    for a in datos["atenciones"]:
        if a.get("operativo_id"):
            a["sector_id"] = operativo_sector[a["operativo_id"]]
    for a in datos["adopciones_realizadas"]:
        a["sector_adoptante_id"] = personas[a["adoptante_id"]]["sector_id"]
    for r in datos["solicitudes"] + datos["propuestas_adopcion"]:
        if r.get("codigo", "").startswith("TR-"):
            r["codigo"] = f"TR-{int(r['codigo'][3:]) + t['desfase_tr']:04d}"
    # Avisos de un sector: el del operativo o lugar al que se refieren, si lo hay.
    for a in datos["avisos"]:
        b = avisos_base[a["id"].split("-", 1)[1]]
        if b["sectores"] != "todos":
            a["sectores"] = sorted({sec_map[s] for s in b["sectores"]})
    for h in datos["puntos_recurrentes"]:
        es_lugar = h["ref"] in lug_map
        h["ref"] = lug_map[h["ref"]] if es_lugar else loc_map[h["ref"]]
        h["sector"] = lugar_nuevo[h["ref"]]["sector_id"] if es_lugar else sector_de_loc[h["ref"]]

    # ── Territorio en el formato de demo/datos ──
    sectores, localidades, lugares = [], [], []
    for orden, s in enumerate(t["sectores"]):
        pts = [(l["lat"], l["lng"]) for l in s["localidades"]]
        sectores.append({"id": s["id"], "nombre": s["nombre"], "tipo": s["tipo"], "poblacion": None, "viviendas": None,
                         "centro": {"lat": round(sum(a for a, _ in pts) / len(pts), 4), "lng": round(sum(b for _, b in pts) / len(pts), 4)},
                         "coordenadas_estado": "promedio de sus localidades", "fuente": s["fuente"]})
        for l in s["localidades"]:
            localidades.append({"id": l["id"], "nombre": l["nombre"], "sector_id": s["id"], "lat": l["lat"], "lng": l["lng"], "coordenadas_estado": "aproximada (OpenStreetMap)", "fuente": l["fuente"]})
    for l in t["lugares"]:
        lugares.append({"id": l["id"], "nombre": l["nombre"], "tipo": l["tipo"], "sector_id": lugar_nuevo[l["id"]]["sector_id"], "localidad_id": l["localidad"], "lat": l["lat"], "lng": l["lng"], "coordenadas_estado": "propia (OpenStreetMap)", "fuente": l["fuente"]})

    # ── Prioridad y resumen (fórmulas de demo/generar.py) ──
    resumen = leer("resumen")
    hoy = date.fromisoformat(resumen["fecha_corte"])
    dias = lambda f: (hoy - date.fromisoformat(f)).days
    S = [s["id"] for s in t["sectores"]]
    D = {s: sum(1 for x in datos["solicitudes"] if x["sector_id"] == s and x["estado"] == "recibida") for s in S}
    R = {s: sum(1 for x in datos["reportes"] if x["sector_id"] == s and dias(x["fecha"]) <= 90) for s in S}
    cerrados = {s: [o for o in datos["operativos"] if o["sector_id"] == s and o["estado"] == "cerrado"] for s in S}
    T = {s: min(dias(o["fecha"]) for o in cerrados[s]) if cerrados[s] else None for s in S}
    E = {s: sum(o["lista_espera_no_cubierta"] for o in cerrados[s]) for s in S}
    # Sin operativos: cuenta como lo más alejado (el mayor de los conocidos).
    maximo_t = max((v for v in T.values() if v is not None), default=0)
    Tn = {s: maximo_t if v is None else v for s, v in T.items()}

    def norm(v):
        lo, hi = min(v.values()), max(v.values())
        return {k: (0 if hi == lo else (x - lo) / (hi - lo)) for k, x in v.items()}

    nD, nR, nT, nE = norm(D), norm(R), norm(Tn), norm(E)
    PES = resumen["pesos_prioridad"]
    prioridad = []
    for s in S:
        P = round(PES["D"] * nD[s] + PES["R"] * nR[s] + PES["T"] * nT[s] + PES["E"] * nE[s], 2)
        nivel = "alta" if P >= 0.66 else "media" if P >= 0.33 else "baja"
        est = sum(1 for x in datos["solicitudes"] if x["sector_id"] == s and x["estado"] == "recibida" and x["servicio"] == "esterilizacion")
        sin = "sin operativos registrados" if T[s] is None else f"{T[s]} días desde el último operativo"
        prioridad.append({"sector_id": s, "indice": P, "nivel": nivel,
                          "factores": {"demanda_pendiente": D[s], "reportes_90_dias": R[s], "dias_sin_intervencion": T[s] if T[s] is not None else "sin operativos", "demanda_no_cubierta": E[s]},
                          "explicacion": f"{est} solicitudes de esterilización pendientes, {R[s]} reportes en 90 días y {sin}.",
                          "recomendacion": "Se recomienda evaluar un operativo territorial con énfasis en esterilización." if nivel == "alta" else
                          "Se recomienda mantener seguimiento." if nivel == "media" else "Sin acción recomendada por ahora."})
    prioridad.sort(key=lambda x: -x["indice"])
    resumen["sector_prioritario"] = prioridad[0]["sector_id"]

    datos.update({"municipio": t["municipio"], "sectores": sectores, "localidades": localidades, "lugares": lugares, "prioridad": prioridad, "resumen": resumen})
    salida = os.path.join(carpeta, "datos")
    os.makedirs(salida, exist_ok=True)
    for n, v in datos.items():
        json.dump({"_demo": True, "_aviso": AVISO, "_origen": f"Derivado de demo/datos/ con demo/municipios/derivar.py para {mid}.", "datos": v},
                  open(os.path.join(salida, f"{n}.json"), "w", encoding="utf8"), ensure_ascii=False, indent=2)

    # ── Fotos: las mismas, para los mismos animales con sus ids nuevos ──
    asig = json.load(open(os.path.join(RAIZ, "demo", "fotos", "asignacion.json"), encoding="utf8"))
    for grupo in ("animales", "comunitarios", "operativos"):
        for x in asig.get(grupo, []):
            for k in ("animal_id", "comunitario_id", "operativo_id"):
                if k in x:
                    x[k] = ids[x[k]]
    asig["_origen"] = f"Asignación de demo/fotos/asignacion.json con los ids de {mid} (derivar.py)."
    json.dump(asig, open(os.path.join(carpeta, "asignacion.json"), "w", encoding="utf8"), ensure_ascii=False, indent=2)
    print(f"{mid}: {len(sectores)} sectores, {len(localidades)} localidades, {len(lugares)} lugares; prioritario {resumen['sector_prioritario']}")
    for p in prioridad:
        print("  ", p["sector_id"], p["indice"], p["nivel"], p["factores"])


if __name__ == "__main__":
    elegidos = sys.argv[1:] or sorted(d for d in os.listdir(os.path.join(RAIZ, "demo", "municipios")) if os.path.isfile(os.path.join(RAIZ, "demo", "municipios", d, "territorio.json")))
    for m in elegidos:
        derivar(m)
