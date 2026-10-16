"""Generador de datos de demostración — Plataforma de Tenencia Responsable.
Todos los datos son FICTICIOS. Semilla fija para resultados reproducibles."""
import json, random, os
from datetime import date, timedelta
random.seed(2026)
HOY = date(2026, 10, 6)
OUT = os.environ.get("OUT", "datos")
os.makedirs(OUT, exist_ok=True)
def d(x): return x.isoformat()
def w(name, obj):
    with open(f"{OUT}/{name}.json", "w", encoding="utf-8") as f:
        json.dump({"_demo": True, "_aviso": "Datos de demostración. No corresponden a registros reales de la Municipalidad.", "datos": obj}, f, ensure_ascii=False, indent=2)

# ---------- territorio ----------
SECT = {
 "hualane":   ("Hualañé",   "urbano-rural", ["Hualañé","La Higuera","El Buche","Mira Río","Barandica","Peralillo","El Rincón","El Molino","El Porvenir"]),
 "patacon":   ("Patacón",   "rural",        ["Patacón","Los Sauces","Quilico","Boquil","Tilicura","Los Cristales","Espinalillo"]),
 "los-coipos":("Los Coipos","rural",        ["Los Coipos","Caone","Barba Rubia","Camarico","El Llano","El Cobre","Alto de Caone"]),
 "la-huerta": ("La Huerta", "rural",        ["La Huerta","Orilla de Valdés","Orilla de Navarro","Remolino","Parronal"]),
}
def slug(s):
    import unicodedata
    s = unicodedata.normalize("NFKD", s).encode("ascii","ignore").decode().lower()
    return "-".join(s.replace("–"," ").split())
sectores, localidades = [], []
for sid,(nom,tipo,locs) in SECT.items():
    sectores.append({"id":sid,"nombre":nom,"tipo":tipo,"poblacion":None,"viviendas":None,
                     "centro":{"lat":None,"lng":None},"coordenadas_estado":"pendiente de validar"})
    for l in locs:
        localidades.append({"id":slug(l),"nombre":l,"sector_id":sid,"lat":None,"lng":None,"coordenadas_estado":"pendiente de validar"})
LOC_BY_SECT = {s:[l["id"] for l in localidades if l["sector_id"]==s] for s in SECT}
COORD = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)),"coordenadas.json"),encoding="utf-8"))
_alias = {"alto-de-caone":"caone"}
for l in localidades:
    c = COORD["localidades"].get(l["id"]) or (COORD["localidades"].get(_alias.get(l["id"],"")))
    if c:
        l["lat"],l["lng"] = c
        l["coordenadas_estado"] = "aproximada" if COORD["localidades"].get(l["id"]) else "aproximada (usa Caone)"
for s in sectores:
    pts=[(l["lat"],l["lng"]) for l in localidades if l["sector_id"]==s["id"] and l["lat"] is not None]
    if pts:
        s["centro"]={"lat":round(sum(a for a,_ in pts)/len(pts),4),"lng":round(sum(b for _,b in pts)/len(pts),4)}
        s["coordenadas_estado"]="promedio de sus localidades"
LOC_XY = {l["id"]:(l["lat"],l["lng"]) for l in localidades}

LUG = [
 ("Plaza de Armas de Hualañé","plaza","hualane","hualane"),
 ("Municipalidad de Hualañé","edificio-municipal","hualane","hualane"),
 ("Estadio Municipal de Hualañé","recinto-deportivo","hualane","hualane"),
 ("Liceo Bicentenario de Hualañé","establecimiento-educacional","hualane","hualane"),
 ("Escuela Monseñor Manuel Larraín Errázuriz","escuela","hualane","hualane"),
 ("Escuela La Huerta de Mataquito","escuela","la-huerta","la-huerta"),
 ("Escuela Orilla de Navarro","escuela","la-huerta","orilla-de-navarro"),
 ("Escuela Carlos Correa Núñez – Mira Río","escuela","hualane","mira-rio"),
 ("Escuela Caone","escuela","los-coipos","caone"),
 ("Sala Multipropósito","espacio-comunitario","hualane","hualane"),
]
lugares = [{"id":slug(n),"nombre":n,"tipo":t,"sector_id":s,"localidad_id":l,"lat":None,"lng":None,
            "coordenadas_estado":"pendiente de validar"} for n,t,s,l in LUG]
lugares[-1]["nota"] = "Sector asignado por defecto a Hualañé; confirmar ubicación."
for L in lugares:
    c = COORD["lugares"].get(L["id"]) or LOC_XY.get(L["localidad_id"])
    if c and c[0] is not None:
        L["lat"],L["lng"]=c
        L["coordenadas_estado"]="propia" if COORD["lugares"].get(L["id"]) else "aproximada (coordenada de la localidad)"
LUG_IDS = {l["id"] for l in lugares}
REF_XY = dict(LOC_XY); REF_XY.update({L["id"]:(L["lat"],L["lng"]) for L in lugares})
import math
def ubicar(ref_id, pos):
    lat,lng = REF_XY.get(ref_id,(None,None))
    if lat is None: return pos
    pos["lat"]=round(lat+pos["dy_m"]/111320,5)
    pos["lng"]=round(lng+pos["dx_m"]/(111320*math.cos(math.radians(lat))),5)
    return pos

def offset(spread=600):
    """Desplazamiento en metros respecto del punto de referencia (localidad o lugar).
    lat/lng final = referencia + offset, cuando las coordenadas estén validadas."""
    return {"dx_m": round(random.gauss(0, spread)), "dy_m": round(random.gauss(0, spread))}

# ---------- personas ficticias ----------
def dv(n):
    t,m=0,2
    for c in reversed(str(n)):
        t+=int(c)*m; m=2 if m==7 else m+1
    r=11-t%11
    return "0" if r==11 else "K" if r==10 else str(r)
def fmt_rut(n):
    s=f"{n:,}".replace(",",".")
    return f"{s}-{dv(n)}"
personas, n_per = [], 0
def nueva_persona(sector_id, localidad_id):
    global n_per; n_per += 1
    num = 11111000 + n_per          # serie fija y reconocible, solo para demostración
    p = {"id":f"per-{n_per:03d}","nombre":f"Vecino/a demo {n_per:03d}","rut":fmt_rut(num),
         "telefono":f"+56 9 0000 {n_per:04d}","correo":f"vecino{n_per:03d}@demo.invalid",
         "sector_id":sector_id,"localidad_id":localidad_id,"demo":True}
    personas.append(p); return p

# ---------- catálogos ----------
NOMBRES_P = ["Canela","Chocolate","Toby","Bobby","Manchas","Rucio","Cholo","Kira","Mota","Rocky","Bruno","Café","Pancho","Chispa","Duque","Zeus","Lola","Princesa","Pirata","Simón","Coco","Max","Frida","Oliva","Pimienta","Mora","Nala","Luna","Copito","Tango"]
NOMBRES_G = ["Michi","Pelusa","Tigre","Bigote","Nieve","Mishka","Sombra","Pantera","Mandarina","Canelo","Tomasa","Félix","Gaspar","Morita","Ceniza"]
COLORES_P = ["café","negro","blanco","amarillo","negro con blanco","café con blanco","gris","atigrado"]
COLORES_G = ["negro","blanco","naranjo","gris","tricolor","atigrado","blanco con negro"]
TAM = ["pequeño","mediano","grande"]
RASGOS = ["collar rojo","collar azul","mancha blanca en el pecho","oreja caída","cola corta","cicatriz en la pata","pañuelo al cuello","ojos claros","pata trasera blanca","sin rasgos visibles"]
CARACTER = ["muy sociable","tranquilo","juguetón","tímido al principio","cariñoso con niños","ideal para patio","se lleva bien con otros perros","independiente","dormilón","guardián pero amistoso"]
_used = set()
def nombre(especie):
    pool = NOMBRES_P if especie=="perro" else NOMBRES_G
    libres = [n for n in pool if (especie,n) not in _used] or pool
    n = random.choice(libres); _used.add((especie,n)); return n

def rand_date(a, b):
    return a + timedelta(days=random.randint(0, (b-a).days))
def peso_mes(m):  # estacionalidad de pérdidas: Año Nuevo y Fiestas Patrias
    return {1:3.0,9:3.5,12:1.6,2:1.2,10:1.2}.get(m,1.0)
def fecha_estacional(desde, hasta):
    while True:
        x = rand_date(desde, hasta)
        if random.random() < peso_mes(x.month)/3.5: return x

SECT_W = {"hualane":0.42,"patacon":0.2,"los-coipos":0.16,"la-huerta":0.22}
def sector_al_azar(pesos=SECT_W):
    return random.choices(list(pesos), weights=list(pesos.values()))[0]

animales, n_animal = [], 0
def nuevo_animal(especie=None, **kw):
    global n_animal
    n_animal += 1
    especie = especie or random.choices(["perro","gato"],[0.65,0.35])[0]
    a = {"id":f"ani-{n_animal:03d}","nombre":nombre(especie),"especie":especie,
         "sexo":random.choice(["macho","hembra"]),"edad_aprox_anios":random.choice([0.5,1,2,3,4,5,6,8,10]),
         "color":random.choice(COLORES_P if especie=="perro" else COLORES_G),
         "tamano":random.choice(TAM) if especie=="perro" else "pequeño",
         "esterilizado":random.random()<0.35,"vacunas_al_dia":random.random()<0.5,"microchip":random.random()<0.25,
         "rasgos":random.choice(RASGOS),"foto":None}
    a.update(kw); animales.append(a); return a

# ---------- perros comunitarios ----------
COMUN = [
 ("plaza-de-armas-de-hualane","La cuidan locatarios y vecinos de la plaza"),
 ("plaza-de-armas-de-hualane","La alimenta el kiosco de la esquina"),
 ("estadio-municipal-de-hualane","Lo cuidan los encargados del recinto"),
 ("liceo-bicentenario-de-hualane","Lo alimentan estudiantes y apoderados"),
 ("municipalidad-de-hualane","Lo conocen funcionarios y vecinos del centro"),
 ("escuela-la-huerta-de-mataquito","Lo cuida la comunidad escolar"),
 ("escuela-caone","Lo alimentan vecinos del sector"),
 ("escuela-carlos-correa-nunez-mira-rio","Lo cuidan vecinos de Mira Río"),
]
APODOS = ["la guardiana de la plaza","la de la esquina","el del estadio","la mascota del liceo","el vecino del centro","la regalona de la escuela","el de la ruta","el compañero de los niños"]
comunitarios = []
for i,(lug,cuida) in enumerate(COMUN):
    L = next(l for l in lugares if l["id"]==lug)
    a = nuevo_animal("perro", edad_aprox_anios=random.choice([3,4,5,6,7,8]), tamano=random.choice(["mediano","grande"]))
    # Lola y Luna (com-01 y com-02) son hembras; se fija después del sorteo para no alterar el resto de los datos.
    if i in (0,1): a["sexo"] = "hembra"
    a["esterilizado"] = i not in (2,6,7); a["vacunas_al_dia"] = i not in (3,6); a["microchip"] = i in (0,1,5)
    comunitarios.append({"id":f"com-{i+1:02d}","animal_id":a["id"],"apodo":APODOS[i],"lugar_id":lug,
        "sector_id":L["sector_id"],"cuidadores":cuida,"ultimo_control":d(HOY-timedelta(days=random.randint(20,320))),
        "necesita_atencion": (not a["esterilizado"]) or (not a["vacunas_al_dia"]),"posicion":ubicar(lug,offset(80))})

# ---------- adopción ----------
adopcion = []
for i in range(14):
    a = nuevo_animal(edad_aprox_anios=random.choice([0.5,1,1,2,3,4,6]))
    a["vacunas_al_dia"]=True
    estado = "adoptado" if i < 12 and random.random()<0.0 else "disponible"
    pub = rand_date(HOY-timedelta(days=150), HOY-timedelta(days=3))
    adopcion.append({"id":f"adp-{i+1:02d}","animal_id":a["id"],"caracter":random.choice(CARACTER),
        "convive_con_ninos":random.random()<0.7,"convive_con_animales":random.random()<0.6,
        "publicado":d(pub),"estado":"disponible"})
postulaciones, n_pos = [], 0
for ad in adopcion:
    for k in range(random.choice([0,0,1,1,2,3])):
        n_pos+=1; sp=sector_al_azar(); lp=random.choice(LOC_BY_SECT[sp])
        postulaciones.append({"id":f"pos-{n_pos:03d}","adopcion_id":ad["id"],"persona_id":nueva_persona(sp,lp)["id"],
            "fecha":d(rand_date(date.fromisoformat(ad["publicado"]),HOY)),"estado":random.choice(["recibida","en evaluacion"]),
            "tipo_vivienda":random.choice(["casa con patio","casa sin patio","parcela","departamento"]),
            "experiencia_previa":random.random()<0.7,"otros_animales":random.random()<0.5,
            # Las fichas las proponen vecinos: quien postula acepta compartir su contacto si le eligen.
            "acepta_compartir_contacto":True})
# 12 adopciones concretadas en los últimos 12 meses
adopciones_realizadas = []
for i in range(12):
    a = nuevo_animal(edad_aprox_anios=random.choice([0.5,1,2,3]))
    pub = rand_date(HOY-timedelta(days=360), HOY-timedelta(days=40))
    fin = pub + timedelta(days=random.randint(7,75))
    adopciones_realizadas.append({"id":f"adr-{i+1:02d}","animal_id":a["id"],"publicado":d(pub),"adoptado":d(min(fin,HOY)),
        "sector_adoptante_id":(sa:=sector_al_azar()),"adoptante_id":nueva_persona(sa,random.choice(LOC_BY_SECT[sa]))["id"],"dias_en_espera":(min(fin,HOY)-pub).days,
        "genero_solicitud_esterilizacion": not a["esterilizado"]})

# ---------- perdidas y encontradas ----------
publicaciones, n_pub = [], 0
def pub(tipo, a, sect, loc, fecha, estado, **kw):
    global n_pub; n_pub += 1
    p = {"id":f"pub-{n_pub:03d}","tipo":tipo,"animal_id":a["id"],"sector_id":sect,"localidad_id":loc,
         "fecha":d(fecha),"estado":estado,"posicion":ubicar(loc,offset(500)),"contacto":"protegido","persona_id":nueva_persona(sect,loc)["id"]}
    p.update(kw); publicaciones.append(p); return p
# pares que se reencontraron (algunos gracias a coincidencia sugerida)
for i in range(16):
    s = sector_al_azar(); loc = random.choice(LOC_BY_SECT[s])
    f = fecha_estacional(HOY-timedelta(days=365), HOY-timedelta(days=10))
    a = nuevo_animal()
    via = random.random()<0.6
    p1 = pub("perdida", a, s, loc, f, "reencontrada", resuelta=d(f+timedelta(days=random.randint(1,9))), via_coincidencia=via)
    a2 = dict(a); a2["id"]=a["id"]
    pub("encontrada", a, s, random.choice(LOC_BY_SECT[s]), f+timedelta(days=random.randint(0,4)), "reencontrada", par_id=p1["id"])
# activas
for i in range(14):
    s = sector_al_azar(); loc = random.choice(LOC_BY_SECT[s])
    tipo = random.choice(["perdida","perdida","encontrada"])
    f = rand_date(HOY-timedelta(days=28), HOY-timedelta(days=1))
    pub(tipo, nuevo_animal(), s, loc, f, "activa", resguardado=(tipo=="encontrada" and random.random()<0.6) or None)
# un par activo que el sistema debería sugerir como coincidencia (escena demo)
a = nuevo_animal("perro", color="café", tamano="mediano", rasgos="collar rojo")
pa = pub("perdida", a, "la-huerta", "orilla-de-valdes", HOY-timedelta(days=4), "activa", nota_demo="Escena demo: coincidencia sugerida")
b = nuevo_animal("perro", nombre="(sin nombre)", color="café", tamano="mediano", rasgos="collar rojo", sexo=a["sexo"])
pub("encontrada", b, "la-huerta", "la-huerta", HOY-timedelta(days=2), "activa", resguardado=True, nota_demo="Escena demo: coincidencia sugerida", coincidencia_con=pa["id"])
# históricas archivadas
for i in range(10):
    s = sector_al_azar(); f = fecha_estacional(HOY-timedelta(days=365), HOY-timedelta(days=40))
    pub(random.choice(["perdida","encontrada"]), nuevo_animal(), s, random.choice(LOC_BY_SECT[s]), f, "archivada")

# ---------- operativos y atenciones ----------
SERV = ["esterilizacion","vacunacion","microchip"]
OPS = [  # (sector, lugar, fecha, cupos{serv:n}, asistencia)
 ("la-huerta","escuela-la-huerta-de-mataquito", HOY-timedelta(days=214), {"esterilizacion":6,"vacunacion":8,"microchip":6}),
 ("los-coipos","escuela-caone",                 HOY-timedelta(days=150), {"esterilizacion":5,"vacunacion":6,"microchip":5}),
 ("patacon","sala-multiproposito",              HOY-timedelta(days=95),  {"esterilizacion":5,"vacunacion":6,"microchip":5}),
 ("hualane","estadio-municipal-de-hualane",     HOY-timedelta(days=21),  {"esterilizacion":8,"vacunacion":10,"microchip":8}),
]
operativos, atenciones, cupos = [], [], []
n_at = 0
for i,(s,lug,f,cap) in enumerate(OPS):
    oid=f"ope-{i+1:02d}"
    tot_ins=0; res={}
    for sv,c in cap.items():
        ins = c if random.random()<0.8 else c-1
        asis = max(0, ins - random.randint(0,2))
        res[sv]={"cupos":c,"inscritos":ins,"asistieron":asis}
        tot_ins+=ins
        for k in range(asis):
            n_at+=1
            atenciones.append({"id":f"ate-{n_at:03d}","operativo_id":oid,"servicio":sv,"sector_id":s,"fecha":d(f),
                "especie":random.choices(["perro","gato"],[0.6,0.4])[0],"resultado":"realizado"})
    espera = random.randint(2,9) if s=="la-huerta" else random.randint(0,3)
    operativos.append({"id":oid,"nombre":f"Operativo {SECT[s][0]}","sector_id":s,"lugar_id":lug,"fecha":d(f),
        "horario":"09:00 a 14:00","servicios":list(cap),"estado":"cerrado","resultados":res,"lista_espera_no_cubierta":espera})
# el operativo de La Huerta se presenta en la demo: borrador listo para crear
operativos.append({"id":"ope-05","nombre":"Operativo La Huerta","sector_id":"la-huerta","lugar_id":"escuela-la-huerta-de-mataquito",
    "fecha":d(HOY+timedelta(days=18)),"horario":"09:00 a 14:00","servicios":SERV,
    "cupos":{"esterilizacion":20,"vacunacion":40,"microchip":40},"estado":"borrador",
    "nota_demo":"Se crea en vivo durante la demostración a partir de la recomendación."})
# completar hasta 83 atenciones en el período con atenciones en oficina municipal
while len(atenciones) < 83:
    n_at+=1
    atenciones.append({"id":f"ate-{n_at:03d}","operativo_id":None,"servicio":random.choice(SERV),"sector_id":sector_al_azar(),
        "fecha":d(rand_date(HOY-timedelta(days=330),HOY-timedelta(days=2))),"especie":random.choice(["perro","gato"]),
        "resultado":"realizado","lugar_id":"municipalidad-de-hualane"})
assert len(atenciones)==83, len(atenciones)

# ---------- solicitudes de servicio (46 pendientes) ----------
PEND = {"la-huerta":{"esterilizacion":18,"vacunacion":2,"microchip":2},
        "hualane":{"esterilizacion":6,"vacunacion":4,"microchip":2},
        "patacon":{"esterilizacion":4,"vacunacion":2,"microchip":1},
        "los-coipos":{"esterilizacion":3,"vacunacion":1,"microchip":1}}
solicitudes, n_sol = [], 0
for s,dd in PEND.items():
    for sv,n in dd.items():
        for k in range(n):
            n_sol+=1
            esp = "gato" if (sv=="esterilizacion" and random.random()<0.55) else random.choice(["perro","gato"])
            loc=random.choice(LOC_BY_SECT[s]); per=nueva_persona(s,loc); ani=nuevo_animal(esp)
            if sv=="esterilizacion": ani["esterilizado"]=False
            solicitudes.append({"id":f"sol-{n_sol:03d}","codigo":f"TR-{n_sol:04d}","servicio":sv,"especie":esp,
                "persona_id":per["id"],"animal_id":ani["id"],"sector_id":s,"localidad_id":loc,
                "fecha":d(rand_date(HOY-timedelta(days=200 if s=="la-huerta" else 120), HOY-timedelta(days=1))),"estado":"recibida"})
for k in range(30):  # históricas ya atendidas
    n_sol+=1; s=sector_al_azar(); loc=random.choice(LOC_BY_SECT[s]); esp=random.choice(["perro","gato"])
    per=nueva_persona(s,loc); ani=nuevo_animal(esp)
    solicitudes.append({"id":f"sol-{n_sol:03d}","codigo":f"TR-{n_sol:04d}","servicio":random.choice(SERV),
        "especie":esp,"persona_id":per["id"],"animal_id":ani["id"],"sector_id":s,"localidad_id":loc,
        "fecha":d(rand_date(HOY-timedelta(days=360),HOY-timedelta(days=60))),"estado":"atendida"})

# ---------- reportes (34 en los últimos 30 días) con puntos recurrentes ----------
TIPOS = ["abandono","animal herido","jauria","atropello","maltrato","animal comunitario sin atencion"]
HOT = [  # puntos recurrentes inventados, anclados a lugares o localidades
 {"ref":"orilla-de-valdes","tipo":"abandono","sector":"la-huerta","peso":5,"nota":"Camino rural: abandono recurrente (ficticio)"},
 {"ref":"estadio-municipal-de-hualane","tipo":"jauria","sector":"hualane","peso":4,"nota":"Jauría en horario nocturno (ficticio)"},
 {"ref":"remolino","tipo":"atropello","sector":"la-huerta","peso":3,"nota":"Tramo de ruta con atropellos (ficticio)"},
 {"ref":"plaza-de-armas-de-hualane","tipo":"animal comunitario sin atencion","sector":"hualane","peso":3,"nota":"Perros comunitarios sin control (ficticio)"},
 {"ref":"caone","tipo":"abandono","sector":"los-coipos","peso":2,"nota":"Abandono de camadas (ficticio)"},
]
reportes, n_rep = [], 0
def rep(fecha, hot=None):
    global n_rep; n_rep+=1
    if hot:
        ref=hot["ref"]; tipo=hot["tipo"]; s=hot["sector"]
    else:
        s=sector_al_azar({"la-huerta":0.38,"hualane":0.32,"patacon":0.15,"los-coipos":0.15})
        ref=random.choice(LOC_BY_SECT[s]); tipo=random.choice(TIPOS)
    reportes.append({"id":f"rep-{n_rep:03d}","tipo":tipo,"sector_id":s,
        "referencia":{"tipo":"lugar" if ref in LUG_IDS else "localidad","id":ref},
        "posicion":ubicar(ref,offset(150 if hot else 700)),"fecha":d(fecha),
        "estado":random.choice(["abierto","en revision","cerrado"]) if (HOY-fecha).days<30 else "cerrado",
        "descripcion":f"Reporte de {tipo} (texto de demostración)."})
hw=[h["peso"] for h in HOT]
for k in range(34): rep(rand_date(HOY-timedelta(days=29),HOY), random.choices(HOT,hw)[0] if random.random()<0.55 else None)
for k in range(70): rep(rand_date(HOY-timedelta(days=365),HOY-timedelta(days=30)), random.choices(HOT,hw)[0] if random.random()<0.5 else None)

# ---------- avisos ----------
avisos = [
 {"id":"avi-01","tipo":"campana","titulo":"Antes de Fiestas Patrias, identifique a su mascota","texto":"Los fuegos artificiales asustan a perros y gatos. Le recomendamos usar collar con placa y mantenerlos en un lugar seguro.","sectores":"todos","desde":d(HOY-timedelta(days=40)),"hasta":d(HOY-timedelta(days=15))},
 {"id":"avi-02","tipo":"operativo","titulo":"Próximo operativo en La Huerta","texto":"Esterilización, vacunación y microchip en la Escuela La Huerta de Mataquito. Cupos limitados. Fecha: [fecha].","sectores":["la-huerta"],"desde":d(HOY),"hasta":d(HOY+timedelta(days=18)),"nota_demo":"Se publica durante la demostración"},
 {"id":"avi-03","tipo":"informacion","titulo":"Tenencia responsable: lo que dice la ley","texto":"Conozca sus deberes como tutor de una mascota según la Ley 21.020.","sectores":"todos","desde":d(HOY-timedelta(days=90)),"hasta":d(HOY+timedelta(days=90))},
 {"id":"avi-04","tipo":"alerta","titulo":"Precaución por perros sueltos cerca del estadio","texto":"Se han reportado perros sueltos en horario nocturno. Le pedimos precaución y reportar en la plataforma.","sectores":["hualane"],"desde":d(HOY-timedelta(days=5)),"hasta":d(HOY+timedelta(days=10))},
]

# ---------- indicadores y prioridad ----------
def norm(v):
    lo,hi=min(v.values()),max(v.values()); return {k:(0 if hi==lo else (x-lo)/(hi-lo)) for k,x in v.items()}
D={s:sum(1 for x in solicitudes if x["sector_id"]==s and x["estado"]=="recibida") for s in SECT}
R={s:sum(1 for x in reportes if x["sector_id"]==s and (HOY-date.fromisoformat(x["fecha"])).days<=90) for s in SECT}
T={s:min((HOY-date.fromisoformat(o["fecha"])).days for o in operativos if o["sector_id"]==s and o["estado"]=="cerrado") for s in SECT}
E={s:sum(o["lista_espera_no_cubierta"] for o in operativos if o["sector_id"]==s and o["estado"]=="cerrado") for s in SECT}
nD,nR,nT,nE=norm(D),norm(R),norm(T),norm(E)
PES={"D":0.40,"R":0.25,"T":0.20,"E":0.15}
prioridad=[]
for s in SECT:
    P=round(PES["D"]*nD[s]+PES["R"]*nR[s]+PES["T"]*nT[s]+PES["E"]*nE[s],2)
    nivel="alta" if P>=0.66 else "media" if P>=0.33 else "baja"
    est=sum(1 for x in solicitudes if x["sector_id"]==s and x["estado"]=="recibida" and x["servicio"]=="esterilizacion")
    prioridad.append({"sector_id":s,"indice":P,"nivel":nivel,
        "factores":{"demanda_pendiente":D[s],"reportes_90_dias":R[s],"dias_sin_intervencion":T[s],"demanda_no_cubierta":E[s]},
        "explicacion":f"{est} solicitudes de esterilización pendientes, {R[s]} reportes en 90 días y {T[s]} días desde el último operativo.",
        "recomendacion":"Se recomienda evaluar un operativo territorial con énfasis en esterilización." if nivel=="alta" else
                        "Se recomienda mantener seguimiento." if nivel=="media" else "Sin acción recomendada por ahora."})
prioridad.sort(key=lambda x:-x["indice"])

reportes_30=sum(1 for x in reportes if (HOY-date.fromisoformat(x["fecha"])).days<30)
perros=sum(1 for a in animales if a["especie"]=="perro"); gatos=len(animales)-perros
meses={}
for p in publicaciones:
    if p["tipo"]=="perdida":
        m=p["fecha"][:7]; meses[m]=meses.get(m,0)+1
resumen={"fecha_corte":d(HOY),
 "situacion_actual":{"solicitudes_pendientes":sum(D.values()),"reportes_recientes_30_dias":reportes_30,
                     "atenciones_realizadas_12_meses":len(atenciones),"adopciones_12_meses":len(adopciones_realizadas)},
 "retrato_comuna":{"animales_en_plataforma":len(animales),"perros":perros,"gatos":gatos,
   "esterilizados":sum(a["esterilizado"] for a in animales),"con_microchip":sum(a["microchip"] for a in animales),
   "reencuentros_12_meses":sum(1 for p in publicaciones if p["tipo"]=="perdida" and p["estado"]=="reencontrada"),
   "perros_comunitarios":len(comunitarios),"comunitarios_que_necesitan_atencion":sum(c["necesita_atencion"] for c in comunitarios),
   "nota":"Cifras sobre animales registrados en la plataforma de demostración, no sobre la población total de la comuna."},
 "perdidas_por_mes":dict(sorted(meses.items())),
 "pesos_prioridad":PES,
 "sector_prioritario":prioridad[0]["sector_id"]}

usuarios=[
 {"id":"usr-01","nombre":"Coordinación demo","rol":"coordinador","correo":"coordinacion@demo.invalid"},
 {"id":"usr-02","nombre":"Terreno demo","rol":"terreno","correo":"terreno@demo.invalid","operativos_asignados":["ope-05"]},
 {"id":"usr-03","nombre":"Comunicaciones demo","rol":"comunicaciones","correo":"comunicaciones@demo.invalid"},
 {"id":"usr-04","nombre":"Dirección demo","rol":"directivo","correo":"direccion@demo.invalid"},
 {"id":"usr-05","nombre":"Administración demo","rol":"administrador","correo":"admin@demo.invalid"}]
# Categorías de SOS Mascotas; los tipos anteriores quedan inactivos: clasifican los reportes de la demo.
TIPOS_REPORTE=[{"id":"animal herido","nombre":"Animal herido o enfermo","publico":False},
 {"id":"maltrato o abandono","nombre":"Posible maltrato o abandono","publico":False},
 {"id":"animal agresivo","nombre":"Animal agresivo o en peligro","publico":False},
 {"id":"animal comunitario sin atencion","nombre":"Perro comunitario que necesita atención","publico":False},
 {"id":"animal atrapado","nombre":"Animal atrapado o en una situación de riesgo","publico":False},
 {"id":"otro","nombre":"Otra situación de bienestar animal","publico":False},
 {"id":"abandono","nombre":"Abandono","publico":False,"activo":False},{"id":"jauria","nombre":"Jauría","publico":False,"activo":False},
 {"id":"atropello","nombre":"Atropello","publico":False,"activo":False},{"id":"maltrato","nombre":"Maltrato","publico":False,"activo":False}]
SERVICIOS=[{"id":"esterilizacion","nombre":"Esterilización"},{"id":"vacunacion","nombre":"Vacunación"},{"id":"microchip","nombre":"Microchip"}]
# ---------- quién propuso cada ficha de adopción ----------
# Sin azar (no cambia el resto de los datos): un vecino que no postula ni adopta, con su código TR.
def propuestas_de_vecinos(adopcion, adopciones_realizadas, postulaciones, personas):
    ocupadas = {p["persona_id"] for p in postulaciones} | {a["adoptante_id"] for a in adopciones_realizadas}
    elegibles = sorted(p["id"] for p in personas if p["id"] not in ocupadas)
    relaciones = ["PROPIO", "RESCATADO", "HOGAR_TEMPORAL", "PROPIO", "COMUNITARIO"]
    fichas = [f["id"] for f in adopcion] + [f["id"] for f in adopciones_realizadas]
    usadas, salida = set(), []
    for i, fid in enumerate(fichas):
        j = (i * 11) % len(elegibles)
        while elegibles[j] in usadas:
            j = (j + 1) % len(elegibles)
        usadas.add(elegibles[j])
        salida.append({"adopcion_id": fid, "persona_id": elegibles[j], "codigo": f"TR-{101 + i:04d}", "relacion": relaciones[i % len(relaciones)]})
    return salida
propuestas_adopcion = propuestas_de_vecinos(adopcion, adopciones_realizadas, postulaciones, personas)

w("personas",personas); w("postulaciones",postulaciones); w("usuarios",usuarios); w("propuestas_adopcion",propuestas_adopcion)
w("catalogos",{"tipos_reporte":TIPOS_REPORTE,"servicios":SERVICIOS,"colores_perro":COLORES_P,"colores_gato":COLORES_G,"tamanos":TAM})
w("municipio",{"id":"hualane","nombre":"Ilustre Municipalidad de Hualañé","region":"Maule","modo":"demostracion"})
w("sectores",sectores); w("localidades",localidades); w("lugares",lugares)
w("animales",animales); w("perros_comunitarios",comunitarios); w("adopcion",adopcion)
w("adopciones_realizadas",adopciones_realizadas); w("publicaciones",publicaciones)
w("operativos",operativos); w("atenciones",atenciones); w("solicitudes",solicitudes)
w("reportes",reportes); w("puntos_recurrentes",HOT); w("avisos",avisos)
w("prioridad",prioridad); w("resumen",resumen)
print(json.dumps(resumen["situacion_actual"],ensure_ascii=False))
print(json.dumps(resumen["retrato_comuna"],ensure_ascii=False))
for p in prioridad: print(p["sector_id"],p["indice"],p["nivel"],p["factores"])
