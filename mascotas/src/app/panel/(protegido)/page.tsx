import type { Metadata } from "next";
import Link from "next/link";
import { Icono, type NombreIcono } from "@/componentes/Icono";
import { numero } from "@/dominio/formato";
import { puede, type Permiso } from "@/dominio/permisos";
import { requerir } from "@/servidor/auth";
import { fechaLarga } from "@/servidor/formato";
import { pendientesDeRevision, proximosOperativos } from "@/servidor/panel/indicadores";
import { AdornoMascotas, AdornoOperativos, AdornoSos } from "@/app/(portal)/AdornosTarjeta";
import inicio from "@/app/(portal)/inicio.module.css";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Panel municipal" };

// Lo que se usa menos, debajo de los tres bloques (como en el portal de vecinos).
const OTROS: { href: string; titulo: string; icono: NombreIcono; permiso: Permiso }[] = [
  { href: "/panel/vecinos", titulo: "Lo que piden los vecinos", icono: "huella", permiso: "verIndicadores" },
  { href: "/panel/mapa", titulo: "Mapa", icono: "ubicacion", permiso: "verInteligencia" },
  { href: "/panel/avisos", titulo: "Avisos a vecinos", icono: "megafono", permiso: "gestionarAvisos" },
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
  const otros = OTROS.filter((o) => puede(usuario.rol, o.permiso));

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Panel municipal</h1>
        <p>{capitalizar(fechaLarga(new Date()))}.</p>
      </div>

      <ul className={inicio.principales} aria-label="Acciones principales">
        {aprueba && (
          <li>
            <Link href="/panel/aprobar" className={`${inicio.principal} ${inicio.principalAzul}`}>
              <AdornoMascotas />
              <span className={inicio.principalIcono} aria-hidden="true">
                <Icono nombre="check" tamano={32} />
              </span>
              <span className={inicio.principalTexto}>
                <span className={inicio.principalTitulo}>
                  <h2>Por aprobar</h2>
                  {porAprobar > 0 && <span className={inicio.distintivo}>{plural(porAprobar, "pendiente", "pendientes")}</span>}
                </span>
                <span>Perdidos, avistados y adopciones.</span>
              </span>
            </Link>
          </li>
        )}

        {operativos && (
          <li>
            <div className={`${inicio.principal} ${inicio.principalClaro}`}>
              <AdornoOperativos />
              <span className={inicio.principalIcono} aria-hidden="true">
                <Icono nombre="calendario" tamano={32} />
              </span>
              <div className={inicio.principalTexto}>
                <Link href="/panel/operativos" className={inicio.enlaceTitulo}>
                  <h2>Operativos</h2>
                  <Icono nombre="flecha" tamano={24} />
                </Link>
                <span>{proximo ? `Próximo: ${fechaLarga(proximo.fecha)}, ${proximo.lugar.nombre}.` : "No hay operativos próximos."}</span>
              </div>
              {crea && (
                <div className={inicio.atajosMascota}>
                  <Link href="/panel/operativos/nuevo" className={inicio.atajoMascota}>
                    <Icono nombre="servicio" tamano={20} />
                    Crear operativo
                  </Link>
                  <Link href="/panel/operativos" className={inicio.atajoMascota}>
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
            <Link href="/panel/reportes" className={`${inicio.principal} ${inicio.principalSos}`}>
              <AdornoSos />
              <span className={inicio.principalIcono} aria-hidden="true">
                <Icono nombre="salvavidas" tamano={32} />
              </span>
              <span className={inicio.principalTexto}>
                <span className={inicio.principalTitulo}>
                  <h2>Reportes SOS</h2>
                </span>
                <span className={inicio.sosMensaje}>{n.reportes ? plural(n.reportes, "reporte sin revisar", "reportes sin revisar") : "Sin reportes por revisar."}</span>
              </span>
            </Link>
          </li>
        )}
      </ul>

      {!aprueba && !operativos && !reportes && otros.length === 0 && (
        <div className={estilos.vacio}>
          <p>Su cuenta no tiene secciones en el panel. Si necesita acceso, pídalo a Coordinación.</p>
        </div>
      )}

      {otros.length > 0 && (
        <nav aria-label="Otras funciones" className={inicio.otros}>
          <ul>
            {otros.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className={inicio.otro}>
                  <Icono nombre={a.icono} tamano={24} />
                  <b>{a.titulo}</b>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
