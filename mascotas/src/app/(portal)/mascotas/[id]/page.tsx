import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EnlaceBoton } from "@/componentes/Boton";
import { Icono } from "@/componentes/Icono";
import { FotoAnimal } from "@/componentes/portal/FotoAnimal";
import { fotoDeAviso } from "@/componentes/portal/fotoAviso";
import { TarjetaMascota } from "@/componentes/portal/TarjetaMascota";
import { ESPECIE, SEXO, SI_NO_SE, TAMANO, textoResguardo, TIPO_PUBLICACION, tipoAviso, tituloAviso } from "@/dominio/etiquetas";
import { fechaCorta, haceDias } from "@/servidor/formato";
import { avistamientosVinculados, coincidenciasDe, publicacion as buscarPublicacion } from "@/servidor/portal/consultas";
import tarjetas from "@/componentes/portal/tarjetas.module.css";
import estilos from "@/estilos/paginas.module.css";
import { BotonReportar, FormularioMensaje } from "./Contacto";

export const metadata: Metadata = { title: "Aviso de mascota" };

export default async function PaginaMascota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await buscarPublicacion(id);
  if (!p) notFound();
  const perdida = p.tipo === "PERDIDA";
  const [coincidencias, avistamientos] = await Promise.all([coincidenciasDe(p), perdida ? avistamientosVinculados(p.id) : Promise.resolve([])]);

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <p className={`${tarjetas.tipoMascota} ${perdida ? tarjetas.perdida : tarjetas.encontrada}`}>
          <Icono nombre={perdida ? "buscar" : "huella"} tamano={18} />
          {tipoAviso(p.tipo, p.sexo)}
        </p>
        <h1>
          {tituloAviso(p)} en {p.sector.nombre}
        </h1>
        <p>
          Publicado {haceDias(p.creadaEn)}. Código {p.codigo}.
        </p>
      </div>

      <div className={estilos.grillaDos}>
        <section className={estilos.panel} aria-labelledby="datos">
          <FotoAnimal foto={null} alt={`${ESPECIE[p.especie]} ${p.colorPrincipal}`} subida={fotoDeAviso(p) ?? undefined} />
          <h2 id="datos">Datos del animal</h2>
          <dl className={estilos.datos}>
            <dt>Especie</dt>
            <dd>{ESPECIE[p.especie]}</dd>
            <dt>Color principal</dt>
            <dd>{p.colorPrincipal}</dd>
            <dt>Tamaño</dt>
            <dd>{p.tamano ? TAMANO[p.tamano] : "No informado"}</dd>
            <dt>Sexo</dt>
            <dd>{SEXO[p.sexo]}</dd>
            {p.nombreAnimal && (
              <>
                <dt>Nombre</dt>
                <dd>Responde a «{p.nombreAnimal}»</dd>
              </>
            )}
            <dt>Collar</dt>
            <dd>{p.collar === "SI" ? `Sí${p.colorCollar ? `, ${p.colorCollar}` : ""}` : p.collar ? SI_NO_SE[p.collar] : "No informado"}</dd>
            {perdida && p.microchip && (
              <>
                <dt>Microchip</dt>
                <dd>{p.microchip === "SI" ? "Sí: una veterinaria o el municipio puede leerlo" : SI_NO_SE[p.microchip]}</dd>
              </>
            )}
            <dt>Señas particulares</dt>
            <dd>{p.senas ?? "No informadas"}</dd>
            <dt>{perdida ? "Se perdió" : "Se vio"}</dt>
            <dd>
              {fechaCorta(p.fechaEvento)}, en {p.sector.nombre}
            </dd>
            {!perdida && p.resguardada !== null && (
              <>
                <dt>Dónde está ahora</dt>
                <dd>{textoResguardo(p)}</dd>
              </>
            )}
          </dl>
          <BotonReportar publicacionId={p.id} />
        </section>

        <section className={estilos.seccion} aria-labelledby="contacto">
          <h2 id="contacto">{perdida ? "¿La ha visto?" : "¿Es su mascota?"}</h2>
          {perdida && (
            <div>
              <EnlaceBoton href={`/mascotas/publicar?tipo=ENCONTRADA&aviso=${p.id}`}>Informar que la vi</EnlaceBoton>
              <p className="nota">Indique dónde y cuándo la vio. Quedará vinculado a este aviso como posible coincidencia, sin asegurar que sea el mismo animal.</p>
            </div>
          )}
          <p>
            Escriba a la persona que publicó. Su mensaje pasa por la plataforma: ninguna de las dos partes ve el
            teléfono ni el correo de la otra.
          </p>
          <FormularioMensaje publicacionId={p.id} />
        </section>
      </div>

      {avistamientos.length > 0 && (
        <section className={estilos.seccion} aria-labelledby="avistamientos">
          <div className={estilos.cabecera}>
            <h2 id="avistamientos">Avistamientos informados para este aviso</h2>
            <p>Personas que vieron una mascota parecida y la vincularon a este aviso. Puede ser el mismo animal o no: revíselos.</p>
          </div>
          <div className={estilos.grilla}>
            {avistamientos.map((a) => (
              <TarjetaMascota key={a.id} publicacion={a} />
            ))}
          </div>
        </section>
      )}

      {coincidencias.length > 0 && (
        <section className={estilos.seccion} aria-labelledby="coincidencias">
          <div className={estilos.cabecera}>
            <h2 id="coincidencias">Posible coincidencia — función experimental</h2>
            <p>
              Estas publicaciones podrían corresponder al mismo animal según especie, sector, fecha, color, tamaño,
              collar y señas particulares. No podemos asegurar que se trate del mismo animal.
            </p>
          </div>
          <div className={estilos.grilla}>
            {coincidencias.map((c) => (
              <div key={c.id} className={estilos.seccion}>
                <TarjetaMascota publicacion={c.publicacion} />
                <p className="nota">Por qué: {c.motivos.join(", ").toLowerCase()}.</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
