import type { Metadata } from "next";
import Link from "next/link";
import { municipioActivo } from "@/lib/municipio";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Eliminación de datos" };

// Instrucciones para pedir la eliminación de datos (requisito de Meta para la
// app de Instagram y derecho de cada persona según la Ley 19.628).
export default function EliminacionDeDatos() {
  const m = municipioActivo();
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Eliminación de datos</h1>
        <p>Cómo pedir que borremos tus datos.</p>
      </div>

      <article className={estilos.documento}>
        <h2>Tus avisos y trámites</h2>
        <ul>
          <li>
            Entra a <Link href="/mis-solicitudes">Mis solicitudes</Link> con tu correo, y retira tus avisos o propuestas de adopción. Dejan
            de mostrarse de inmediato.
          </li>
          <li>Para borrar también tus datos de contacto, escríbenos desde el correo que usaste en tus trámites.</li>
        </ul>

        <h2>Comentarios y mensajes de Instagram</h2>
        <p>
          Si nos escribiste o comentaste en Instagram y quieres que borremos lo que guardamos (el texto y el identificador de tu cuenta), envíanos un
          mensaje directo pidiéndolo o escríbenos al correo de abajo.
        </p>

        <h2>Cómo pedirlo</h2>
        <p>
          Escribe a [correo de contacto de la Municipalidad] con el asunto «Eliminación de datos». Te respondemos en un plazo de [plazo de respuesta]
          días hábiles y te confirmamos cuando esté hecho.
        </p>
        <p>
          Más detalles en la <Link href="/privacidad">Política de privacidad</Link>.
        </p>

        <p className="nota">
          {m.nombreOficial} · {m.sitioWeb}
        </p>
      </article>
    </div>
  );
}
