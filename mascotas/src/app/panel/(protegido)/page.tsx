import type { Metadata } from "next";
import Link from "next/link";
import { Icono, type NombreIcono } from "@/componentes/Icono";
import { numero } from "@/dominio/formato";
import { puede, type Permiso } from "@/dominio/permisos";
import { PERMISO_RED } from "@/dominio/redes";
import { requerir } from "@/servidor/auth";
import { fechaLarga } from "@/servidor/formato";
import { pendientesDeRevision, proximosOperativos } from "@/servidor/panel/indicadores";
import inicio from "@/app/(portal)/inicio.module.css";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Panel municipal" };

// Lo que se usa menos, debajo de los tres bloques (como en el portal de vecinos).
// Cada acceso se muestra si la persona tiene alguno de sus permisos.
const OTROS: { href: string; titulo: string; detalle: string; icono: NombreIcono; tono: "azul" | "verde" | "amarillo"; permisos: Permiso[] }[] = [
  { href: "/panel/vecinos", titulo: "Lo que piden los vecinos", detalle: "Solicitudes y temas frecuentes", icono: "huella", tono: "verde", permisos: ["verIndicadores"] },
  { href: "/panel/mapa", titulo: "Mapa", detalle: "Avisos y reportes por sector", icono: "ubicacion", tono: "azul", permisos: ["verInteligencia"] },
  { href: "/panel/avisos", titulo: "Avisos a vecinos", detalle: "Publicar y quitar avisos", icono: "megafono", tono: "amarillo", permisos: ["gestionarAvisos"] },
  {
    href: "/panel/instagram",
    titulo: "Instagram",
    detalle: "Publicación y pendientes",
    icono: "ajustes",
    tono: "azul",
    permisos: ["configurarRedes", ...new Set(Object.values(PERMISO_RED))],
  },
];

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const plural = (n: number, uno: string, varios: string) => `${numero(n)} ${n === 1 ? uno : varios}`;

// Responde: ¿qué hay que hacer? Tres bloques: aprobar lo que envían los vecinos,
// operativos y reportes SOS. Cada bloque completo es el enlace.
export default async function InicioPanel() {
  const usuario = await requerir();
  const aprueba = puede(usuario.rol, "moderarPublicaciones") || puede(usuario.rol, "gestionarAdopciones");
  const operativos = puede(usuario.rol, "verOperativos");
  const crea = puede(usuario.rol, "gestionarOperativos");
  const reportes = puede(usuario.rol, "verReportes");
  const [n, proximos] = await Promise.all([pendientesDeRevision(), operativos ? proximosOperativos() : Promise.resolve([])]);
  const porAprobar = (puede(usuario.rol, "moderarPublicaciones") ? n.publicaciones : 0) + (puede(usuario.rol, "gestionarAdopciones") ? n.propuestas : 0);
  const proximo = proximos.find((o) => o.estado !== "BORRADOR");
  const otros = OTROS.filter((o) => o.permisos.some((x) => puede(usuario.rol, x)));

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Panel municipal</h1>
        <p>{capitalizar(fechaLarga(new Date()))}.</p>
      </div>

      <ul className={inicio.principales} aria-label="Acciones principales">
        {aprueba && (
          <li>
            <Link href="/panel/aprobar" className={`${inicio.principal} ${inicio.tonoAzul}`}>
              <span className={inicio.principalIcono} aria-hidden="true">
                <Icono nombre="check" tamano={28} />
              </span>
              <span className={inicio.principalTitulo}>
                <h2>Por aprobar</h2>
                {porAprobar > 0 && <span className={inicio.distintivo}>{plural(porAprobar, "pendiente", "pendientes")}</span>}
              </span>
              <span className={inicio.principalDetalle}>Perdidas, avistadas y adopciones que enviaron las vecinas y vecinos.</span>
              <span className={inicio.ir}>
                Revisar
                <Icono nombre="flecha" tamano={20} />
              </span>
            </Link>
          </li>
        )}

        {operativos && (
          <li>
            <div className={`${inicio.principal} ${inicio.tonoVerde}`}>
              <span className={inicio.principalIcono} aria-hidden="true">
                <Icono nombre="calendario" tamano={28} />
              </span>
              <Link href="/panel/operativos" className={inicio.enlaceTitulo}>
                <h2>Operativos</h2>
                <Icono nombre="flecha" tamano={20} />
              </Link>
              <span className={inicio.principalDetalle}>{proximo ? `Próximo: ${fechaLarga(proximo.fecha)}, ${proximo.lugar.nombre}.` : "No hay operativos próximos."}</span>
              {crea && (
                <div className={inicio.atajos}>
                  <Link href="/panel/operativos/nuevo" className={inicio.atajo}>
                    <Icono nombre="servicio" tamano={20} />
                    Crear operativo
                  </Link>
                  <Link href="/panel/operativos" className={inicio.atajo}>
                    <Icono nombre="documento" tamano={20} />
                    Ver inscritos
                  </Link>
                </div>
              )}
            </div>
          </li>
        )}

        {reportes && (
          <li>
            <Link href="/panel/reportes" className={`${inicio.principal} ${inicio.tonoRojo}`}>
              <span className={inicio.principalIcono} aria-hidden="true">
                <Icono nombre="salvavidas" tamano={28} />
              </span>
              <span className={inicio.principalTitulo}>
                <h2>Reportes SOS</h2>
              </span>
              <span className={inicio.principalDetalle}>{n.reportes ? plural(n.reportes, "reporte sin revisar", "reportes sin revisar") : "Sin reportes por revisar."}</span>
              <span className={inicio.ir}>
                Ver reportes
                <Icono nombre="flecha" tamano={20} />
              </span>
            </Link>
          </li>
        )}
      </ul>

      {!aprueba && !operativos && !reportes && otros.length === 0 && (
        <div className={estilos.vacio}>
          <p>Tu cuenta no tiene secciones en el panel. Si necesitas acceso, pídelo a Coordinación.</p>
        </div>
      )}

      {otros.length > 0 && (
        <nav aria-label="Otras funciones">
          <ul className={inicio.otros}>
            {otros.map((o) => (
              <li key={o.href}>
                <Link href={o.href} className={inicio.otro}>
                  <span className={`${inicio.recuadro} ${inicio[o.tono]}`} aria-hidden="true">
                    <Icono nombre={o.icono} tamano={24} />
                  </span>
                  <span>
                    <b>{o.titulo}</b>
                    <span className={inicio.otroDetalle}>{o.detalle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
