import Image from "next/image";
import Link from "next/link";
import { Cifra } from "@/componentes/Cifra";
import { Icono, type NombreIcono } from "@/componentes/Icono";
import { fotoDeAviso } from "@/componentes/portal/fotoAviso";
import { ESPECIE, TIPO_AVISO } from "@/dominio/etiquetas";
import { numero } from "@/dominio/formato";
import { municipioActivo } from "@/lib/municipio";
import { fechaCorta } from "@/servidor/formato";
import { avisosVigentes, posiblesReencuentros, proximoOperativo } from "@/servidor/portal/consultas";
import { impactoEnCache, mapaPublicoEnCache, mosaicoEnCache, retratoEnCache } from "@/servidor/portal/enCache";
import inicio from "./inicio.module.css";
import { AdornoMascotas, AdornoOperativos, AdornoSos } from "./AdornosTarjeta";
import { MapaMiniatura } from "./MapaMiniatura";

// Las demás funciones, debajo de las tres protagonistas. Mapa y avisos ya
// tienen su tarjeta más abajo; «Adopción» lleva a adoptar y a dar en adopción.
const OTROS: { href: string; titulo: string; icono: NombreIcono }[] = [
  { href: "/adoptar", titulo: "Adopción", icono: "corazon" },
  { href: "/servicio", titulo: "Solicitar un servicio", icono: "servicio" },
  { href: "/comunitarios", titulo: "Perros comunitarios", icono: "casa" },
];

const ICONO_AVISO: Record<string, NombreIcono> = { OPERATIVO: "calendario", CAMBIO: "info", CAMPANA: "megafono", ALERTA: "alerta", INFORMACION: "info" };

const plural = (n: number, uno: string, varios: string) => `${numero(n)} ${n === 1 ? uno : varios}`;

// Inicio responde: ¿qué puedo hacer aquí? Arriba, la bienvenida y el collage
// de fotos reales; luego las tres funciones protagonistas (operativos,
// mascotas perdidas y avistadas, SOS Mascotas) y bajo ellas las demás; al
// final, mapa, retrato y avisos. Mis solicitudes está en la
// barra superior.
export default async function Inicio() {
  const municipio = municipioActivo();
  const [mosaico, reencuentros, mapa, retrato, impacto, proximo, avisos] = await Promise.all([
    mosaicoEnCache(7),
    posiblesReencuentros(1),
    mapaPublicoEnCache(),
    retratoEnCache(),
    impactoEnCache(),
    proximoOperativo(),
    avisosVigentes({ limite: 3 }),
  ]);
  const totalAvisos = mapa.sectores.reduce((t, s) => t + s.perdidas + s.encontradas, 0);
  const abierto = proximo?.estado === "PUBLICADO";
  const conCupos = abierto && proximo.servicios.some((s) => s.disponibles > 0);

  return (
    <div className={`contenedor ${inicio.pagina}`}>
      {/* 1. Bienvenida y collage. */}
      <section className={inicio.portada} aria-labelledby="titulo-inicio">
        <div className={inicio.mensaje}>
          <p className={inicio.antetitulo}>
            <Icono nombre="huella" tamano={20} />
            Tenencia responsable de mascotas en {municipio.nombre}
          </p>
          <h1 id="titulo-inicio">
            Cuidamos juntos <span className={inicio.salto}>a nuestros animales</span>
          </h1>
        </div>
        {mosaico.length > 0 && (
          <ul className={inicio.mosaico} aria-label="Animales de la comuna">
            {mosaico.map((m, i) => {
              const contenido = (
                <>
                  <Image src={m.foto} alt={m.alt} width={600} height={600} sizes={i === 0 ? "(max-width: 899px) 60vw, 400px" : "(max-width: 899px) 60vw, 240px"} priority={i < 3} unoptimized={m.subida} />
                  <span className={inicio.etiquetaFoto}>{m.etiqueta}</span>
                </>
              );
              return <li key={m.clave}>{m.href ? <Link href={m.href}>{contenido}</Link> : <div>{contenido}</div>}</li>;
            })}
          </ul>
        )}
      </section>

      {/* 2. Las tres funciones protagonistas: cada bloque completo es el enlace. */}
      <ul className={inicio.principales} aria-label="Acciones principales">
        <li>
          <Link href="/operativos" className={`${inicio.principal} ${inicio.principalAzul}`}>
            <AdornoOperativos />
            <span className={inicio.principalIcono} aria-hidden="true">
              <Icono nombre="calendario" tamano={32} />
            </span>
            <span className={inicio.principalTexto}>
              <span className={inicio.principalTitulo}>
                <h2>Operativos</h2>
                {conCupos && (
                  <span className={inicio.distintivo}>
                    <Icono nombre="check" tamano={16} />
                    Cupos disponibles
                  </span>
                )}
              </span>
              <span>Fechas, servicios y cupos.</span>
            </span>
          </Link>
        </li>

        <li>
          <div className={`${inicio.principal} ${inicio.principalClaro}`}>
            <AdornoMascotas />
            <span className={inicio.principalIcono} aria-hidden="true">
              <Icono nombre="buscar" tamano={32} />
            </span>
            <div className={inicio.principalTexto}>
              <Link href="/mascotas" className={inicio.enlaceTitulo}>
                <h2>Mascotas perdidas y avistadas</h2>
                <Icono nombre="flecha" tamano={24} />
              </Link>
            </div>
            <div className={inicio.atajosMascota}>
                <Link href="/mascotas/publicar?tipo=PERDIDA" className={inicio.atajoMascota}>
                  <Icono nombre="buscar" tamano={20} />
                  Perdí mi mascota
                </Link>
                <Link href="/mascotas/publicar?tipo=ENCONTRADA" className={inicio.atajoMascota}>
                  <Icono nombre="huella" tamano={20} />
                  Vi una mascota
                </Link>
            </div>
          </div>
        </li>

        <li>
          <Link href="/reportar" className={`${inicio.principal} ${inicio.principalSos}`}>
            <AdornoSos />
            <span className={inicio.principalIcono} aria-hidden="true">
              <Icono nombre="salvavidas" tamano={32} />
            </span>
            <span className={inicio.principalTexto}>
              <span className={inicio.principalTitulo}>
                <h2>SOS Mascotas</h2>
              </span>
              <span className={inicio.sosMensaje}>¿Vio un animal que necesita ayuda?</span>
            </span>
          </Link>
        </li>
      </ul>

      {/* 3. Las demás funciones, debajo de las protagonistas. */}
      <nav aria-label="Otras funciones" className={inicio.otros}>
        <ul>
          {OTROS.map((a) => (
            <li key={a.href}>
              <Link href={a.href} className={inicio.otro}>
                <Icono nombre={a.icono} tamano={24} />
                <b>{a.titulo}</b>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 4. Mapa, retrato y avisos. El próximo operativo se ve desde «Ver operativos». */}
      <div className={inicio.fila}>
        <section className={inicio.tarjeta} aria-labelledby="comuna-mapa">
          <div className={inicio.tituloBloque}>
            <Icono nombre="ubicacion" tamano={28} />
            <div>
              <h2 id="comuna-mapa">{municipio.nombre} en el mapa</h2>
              <p className="nota">{plural(totalAvisos, "aviso activo", "avisos activos")} de perdidas y avistadas, por sector.</p>
            </div>
            <Link href="/mapa">Ver mapa</Link>
          </div>
          <MapaMiniatura sectores={mapa.sectores} localidades={mapa.localidades} />
          {reencuentros.map((c) => (
            <Link key={c.id} href={`/mascotas/${c.perdida.id}`} className={inicio.par}>
              <span className={inicio.miniaturas}>
                {[c.perdida, c.encontrada].map((p) => {
                  const f = fotoDeAviso(p);
                  return f ? <Image key={p.id} src={f.src} alt="" width={120} height={120} sizes="40px" unoptimized={f.subida} /> : null;
                })}
              </span>
              <span>
                <b>Posible reencuentro</b>
                <span className="nota">
                  {ESPECIE[c.perdida.especie]} {c.perdida.colorPrincipal}: perdido en {c.perdida.localidad?.nombre ?? c.perdida.sector.nombre}, visto en{" "}
                  {c.encontrada.localidad?.nombre ?? c.encontrada.sector.nombre}
                </span>
              </span>
            </Link>
          ))}
        </section>

        <section className={inicio.tarjeta} aria-labelledby="retrato">
          <div className={inicio.tituloBloque}>
            <Icono nombre="huella" tamano={28} />
            <div>
              <h2 id="retrato">Retrato de la comuna</h2>
              <p className="nota">Lo que hizo el programa de tenencia responsable en los últimos 12 meses.</p>
            </div>
          </div>
          <dl className={inicio.cifras}>
            {[
              { valor: impacto.operativos, uno: "operativo realizado", varios: "operativos realizados" },
              { valor: impacto.atenciones, uno: "atención a mascotas", varios: "atenciones a mascotas" },
              { valor: impacto.adopciones, uno: "mascota adoptada", varios: "mascotas adoptadas" },
              { valor: impacto.reencuentros, uno: "mascota volvió a casa", varios: "mascotas volvieron a casa" },
            ].map((c) => (
              <div key={c.uno}>
                <dd className={inicio.cifra}>
                  <Cifra valor={c.valor} />
                </dd>
                <dt>{c.valor === 1 ? c.uno : c.varios}</dt>
              </div>
            ))}
          </dl>
          {impacto.atencionesPorServicio.length > 0 && (
            <p className={inicio.desglose}>
              {impacto.atencionesPorServicio.map((x) => (
                <span key={x.servicio}>
                  {x.servicio}: <b>{numero(x.cantidad)}</b>
                </span>
              ))}
            </p>
          )}
          <p className="nota">{numero(retrato.animales)} animales registrados en la plataforma; no es la población total de la comuna.</p>
        </section>

        <section className={inicio.tarjeta} aria-labelledby="avisos">
          <div className={inicio.tituloBloque}>
            <Icono nombre="megafono" tamano={28} />
            <div>
              <h2 id="avisos">Avisos municipales</h2>
            </div>
            <Link href="/avisos">Ver todos</Link>
          </div>
          {avisos.length > 0 ? (
            <ul className={inicio.avisos}>
              {avisos.map((a) => (
                <li key={a.id}>
                  <Link href="/avisos" className={a.tipo === "ALERTA" ? `${inicio.aviso} ${inicio.avisoAlerta}` : inicio.aviso}>
                    <span className={inicio.avisoIcono} aria-hidden="true">
                      <Icono nombre={ICONO_AVISO[a.tipo] ?? "info"} tamano={20} />
                    </span>
                    <span>
                      <b>{a.titulo}</b>
                      <span className="nota">
                        {TIPO_AVISO[a.tipo]} · {fechaCorta(a.vigenteDesde)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={inicio.vacio}>No hay avisos vigentes en este momento.</p>
          )}
        </section>
      </div>

    </div>
  );
}
