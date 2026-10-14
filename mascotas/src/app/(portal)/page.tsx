import Image from "next/image";
import Link from "next/link";
import { Cauce } from "@/componentes/Cauce";
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
import { MapaMiniatura } from "./MapaMiniatura";

// Las demás funciones, debajo de las tres protagonistas, como mosaicos de
// servicio del sistema de diseño (ícono en recuadro de color + título + una línea).
const OTROS: { href: string; titulo: string; detalle: string; icono: NombreIcono; tono: "azul" | "verde" | "amarillo" }[] = [
  { href: "/adoptar", titulo: "Adopción", detalle: "Adopta o da en adopción", icono: "corazon", tono: "verde" },
  { href: "/servicio", titulo: "Solicitar un servicio", detalle: "Vacunas, chip y esterilización", icono: "servicio", tono: "azul" },
  { href: "/comunitarios", titulo: "Perros comunitarios", detalle: "Los cuidamos entre todos", icono: "casa", tono: "amarillo" },
];

const ICONO_AVISO: Record<string, NombreIcono> = { OPERATIVO: "calendario", CAMBIO: "info", CAMPANA: "megafono", ALERTA: "alerta", INFORMACION: "info" };

const plural = (n: number, uno: string, varios: string) => `${numero(n)} ${n === 1 ? uno : varios}`;

// Inicio responde: ¿qué puedo hacer aquí? Arriba, la bienvenida y el collage
// de fotos reales, con el Cauce del escudo como transición; luego las tres
// funciones protagonistas (operativos, mascotas perdidas y avistadas, SOS
// Mascotas) y bajo ellas las demás; al final, mapa, retrato y avisos.
// Mis solicitudes está en la barra superior.
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
    <div className={inicio.pagina}>
      {/* 1. Bienvenida y collage. */}
      <section className={inicio.portada} aria-labelledby="titulo-inicio">
        <div className={`contenedor ${inicio.portadaInterior}`}>
          <div className={inicio.mensaje}>
            <p className="sobretitulo">Tenencia responsable · {municipio.nombre}</p>
            <h1 id="titulo-inicio">Cuidamos juntos a nuestros animales</h1>
            <p className={inicio.bajada}>Avisa si perdiste o viste una mascota, pide ayuda para un animal e inscríbete en los operativos.</p>
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
        </div>
        <Cauce className={inicio.cauce} />
      </section>

      <div className={`contenedor ${inicio.contenido}`}>
        {/* 2. Las tres funciones protagonistas. */}
        <section aria-labelledby="que-necesitas">
          <h2 id="que-necesitas" className={inicio.tituloSeccion}>
            ¿Qué necesitas hacer?
          </h2>
          <ul className={inicio.principales}>
            <li>
              <Link href="/operativos" className={`${inicio.principal} ${inicio.tonoAzul}`}>
                <span className={inicio.principalIcono} aria-hidden="true">
                  <Icono nombre="calendario" tamano={28} />
                </span>
                <span className={inicio.principalTitulo}>
                  <h3>Operativos</h3>
                  {conCupos && (
                    <span className={inicio.distintivo}>
                      <Icono nombre="check" tamano={14} />
                      Cupos disponibles
                    </span>
                  )}
                </span>
                <span className={inicio.principalDetalle}>Revisa fechas, servicios y cupos, e inscríbete.</span>
                <span className={inicio.ir}>
                  Ver operativos
                  <Icono nombre="flecha" tamano={20} />
                </span>
              </Link>
            </li>

            <li>
              <div className={`${inicio.principal} ${inicio.tonoVerde}`}>
                <span className={inicio.principalIcono} aria-hidden="true">
                  <Icono nombre="huella" tamano={28} />
                </span>
                <Link href="/mascotas" className={inicio.enlaceTitulo}>
                  <h3>Mascotas perdidas y avistadas</h3>
                  <Icono nombre="flecha" tamano={20} />
                </Link>
                <span className={inicio.principalDetalle}>Publica un aviso y te ayudamos a difundirlo.</span>
                <div className={inicio.atajos}>
                  <Link href="/mascotas/publicar?tipo=PERDIDA" className={inicio.atajo}>
                    <Icono nombre="buscar" tamano={20} />
                    Perdí mi mascota
                  </Link>
                  <Link href="/mascotas/publicar?tipo=ENCONTRADA" className={inicio.atajo}>
                    <Icono nombre="huella" tamano={20} />
                    Vi una mascota
                  </Link>
                </div>
              </div>
            </li>

            <li>
              <Link href="/reportar" className={`${inicio.principal} ${inicio.tonoRojo}`}>
                <span className={inicio.principalIcono} aria-hidden="true">
                  <Icono nombre="salvavidas" tamano={28} />
                </span>
                <span className={inicio.principalTitulo}>
                  <h3>SOS Mascotas</h3>
                </span>
                <span className={inicio.principalDetalle}>¿Viste un animal herido, abandonado o en peligro?</span>
                <span className={inicio.ir}>
                  Pedir ayuda
                  <Icono nombre="flecha" tamano={20} />
                </span>
              </Link>
            </li>
          </ul>

          {/* 3. Las demás funciones, debajo de las protagonistas. */}
          <nav aria-label="Otras funciones">
            <ul className={inicio.otros}>
              {OTROS.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className={inicio.otro}>
                    <span className={`${inicio.recuadro} ${inicio[a.tono]}`} aria-hidden="true">
                      <Icono nombre={a.icono} tamano={24} />
                    </span>
                    <span>
                      <b>{a.titulo}</b>
                      <span className={inicio.otroDetalle}>{a.detalle}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>

        {/* 4. Mapa, retrato y avisos. */}
        <div className={inicio.fila}>
          <section className={inicio.tarjeta} aria-labelledby="comuna-mapa">
            <div className={inicio.tituloBloque}>
              <div>
                <p className="sobretitulo">Mapa</p>
                <h2 id="comuna-mapa">{municipio.nombre} en el mapa</h2>
              </div>
              <Link href="/mapa" className={inicio.verTodo}>
                Ver mapa
                <Icono nombre="flecha" tamano={18} />
              </Link>
            </div>
            <p className={inicio.detalleBloque}>{plural(totalAvisos, "aviso activo", "avisos activos")} de perdidas y avistadas, por sector.</p>
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
                  <span className={inicio.otroDetalle}>
                    {ESPECIE[c.perdida.especie]} {c.perdida.colorPrincipal}: perdido en {c.perdida.localidad?.nombre ?? c.perdida.sector.nombre}, visto en{" "}
                    {c.encontrada.localidad?.nombre ?? c.encontrada.sector.nombre}
                  </span>
                </span>
              </Link>
            ))}
          </section>

          <section className={inicio.tarjeta} aria-labelledby="retrato">
            <div className={inicio.tituloBloque}>
              <div>
                <p className="sobretitulo">Últimos 12 meses</p>
                <h2 id="retrato">Retrato de la comuna</h2>
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
                    {x.servicio} <b className="dato">{numero(x.cantidad)}</b>
                  </span>
                ))}
              </p>
            )}
            <p className={inicio.detalleBloque}>{numero(retrato.animales)} animales registrados en la plataforma; no es la población total de la comuna.</p>
          </section>

          <section className={inicio.tarjeta} aria-labelledby="avisos">
            <div className={inicio.tituloBloque}>
              <div>
                <p className="sobretitulo">Municipalidad</p>
                <h2 id="avisos">Avisos municipales</h2>
              </div>
              <Link href="/avisos" className={inicio.verTodo}>
                Ver todos
                <Icono nombre="flecha" tamano={18} />
              </Link>
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
                        <span className={inicio.otroDetalle}>
                          {TIPO_AVISO[a.tipo]} · {fechaCorta(a.vigenteDesde)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={inicio.detalleBloque}>No hay avisos vigentes en este momento.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
