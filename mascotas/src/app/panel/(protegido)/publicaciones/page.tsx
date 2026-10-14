import type { Metadata } from "next";
import Link from "next/link";
import { BotonAccion } from "@/componentes/panel/BotonAccion";
import { EstadoInstagram } from "@/componentes/panel/EstadoInstagram";
import { ResumenPublicacion } from "@/componentes/panel/ResumenPublicacion";
import { requerir } from "@/servidor/auth";
import { aprobarPublicacion, marcarReencontrada, ocultarPublicacion } from "@/servidor/panel/acciones-bandejas";
import { contarPublicaciones, publicacionesBandeja, type GrupoPublicaciones } from "@/servidor/panel/bandejas";
import { estadoIntegracion } from "@/servidor/redes/instagram";
import { estadosInstagram } from "@/servidor/redes/servicio";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Publicaciones · Panel municipal" };

// Responde: ¿qué avisos de vecinos hay que aceptar? Al aceptarlos se publican en el portal y en Instagram.
export default async function PublicacionesPanel({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  await requerir("moderarPublicaciones");
  const { ver } = await searchParams;
  const grupo: GrupoPublicaciones = ver === "vigentes" || ver === "ocultas" ? ver : "pendientes";
  const [lista, cuenta] = await Promise.all([publicacionesBandeja(grupo), contarPublicaciones()]);
  const ids = (tipo: string) => lista.filter((p) => p.tipo === tipo).map((p) => p.id);
  const [perdidas, avistadas] = await Promise.all([estadosInstagram("PERDIDA", ids("PERDIDA")), estadosInstagram("AVISTADA", ids("ENCONTRADA"))]);
  const instagram = { ...perdidas, ...avistadas };
  const configurada = estadoIntegracion().configurada;
  const pestanas: { clave: GrupoPublicaciones; texto: string }[] = [
    { clave: "pendientes", texto: `Por aceptar (${cuenta.pendientes})` },
    { clave: "vigentes", texto: `Publicadas (${cuenta.vigentes})` },
    { clave: "ocultas", texto: `Ocultas (${cuenta.ocultas})` },
  ];

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Publicaciones de mascotas</h1>
        <p>Los avisos que envían las vecinas y vecinos esperan aquí. Al aceptarlos se publican en el portal y en Instagram. Si alguien reporta uno, vuelve a esta bandeja.</p>
      </div>

      <nav aria-label="Estado de moderación" className={estilos.pestanas}>
        {pestanas.map((p) => (
          <Link key={p.clave} href={`/panel/publicaciones?ver=${p.clave}`} aria-current={p.clave === grupo ? "page" : undefined} replace>
            {p.texto}
          </Link>
        ))}
      </nav>

      {lista.length === 0 ? (
        <div className={estilos.vacio}>
          <p>{grupo === "pendientes" ? "No hay avisos por aceptar." : grupo === "vigentes" ? "No hay avisos publicados." : "No hay avisos ocultos."}</p>
        </div>
      ) : (
        <div className={estilos.grilla}>
          {lista.map((p) => (
            <article key={p.id} className={estilos.panel}>
              <ResumenPublicacion p={p} />
              <div className={estilos.accionesCabecera}>
                {p.moderacion !== "APROBADA" && <BotonAccion accion={aprobarPublicacion.bind(null, p.id)} texto={p.moderacion === "OCULTA" ? "Volver a mostrar" : "Aceptar y publicar"} variante="primario" />}
                {p.moderacion === "PENDIENTE" && (
                  <BotonAccion accion={ocultarPublicacion.bind(null, p.id)} texto="No publicar" confirmar="El aviso no se publicará y avisaremos a quien lo envió. ¿Quieres continuar?" textoConfirmar="Sí, no publicar" />
                )}
                {p.moderacion === "APROBADA" && (
                  <BotonAccion accion={ocultarPublicacion.bind(null, p.id)} texto="Ocultar" confirmar="El aviso dejará de verse en el portal y avisaremos a quien lo publicó. Si ya salió en Instagram, bórralo también allí. ¿Quieres ocultarlo?" textoConfirmar="Sí, ocultar" />
                )}
                {p.estado === "ABIERTA" && (
                  <BotonAccion
                    accion={marcarReencontrada.bind(null, p.id)}
                    texto="Marcar como reencontrada"
                    confirmar="Usa esta opción si la persona te avisó por otra vía que la mascota volvió. El aviso dejará de verse en el portal y le avisaremos. ¿Quieres continuar?"
                    textoConfirmar="Sí, volvió a casa"
                  />
                )}
              </div>
              {p.moderacion === "APROBADA" && p.estado === "ABIERTA" && <EstadoInstagram tipo={p.tipo === "PERDIDA" ? "PERDIDA" : "AVISTADA"} id={p.id} estado={instagram[p.id]} configurada={configurada} />}
            </article>
          ))}
        </div>
      )}
      <p className="nota">El panel nunca muestra el contacto de quien publica: los mensajes pasan por la plataforma.</p>
    </div>
  );
}
