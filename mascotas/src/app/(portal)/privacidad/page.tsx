import type { Metadata } from "next";
import Link from "next/link";
import { municipioActivo } from "@/lib/municipio";
import estilos from "@/estilos/paginas.module.css";

export const metadata: Metadata = { title: "Política de privacidad" };

// Política de privacidad del portal y de la cuenta de Instagram del programa.
// Los datos de contacto que aún no están en la configuración van entre corchetes.
export default function Privacidad() {
  const m = municipioActivo();
  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Política de privacidad</h1>
        <p>Qué datos pedimos, para qué y quién los ve.</p>
      </div>

      <article className={estilos.documento}>
        <p>
          Esta plataforma es del programa de tenencia responsable de la {m.nombreOficial}. Pedimos solo los datos necesarios para cada trámite y nunca
          los vendemos ni los usamos con fines comerciales.
        </p>

        <h2>Qué datos pedimos</h2>
        <ul>
          <li>Tu nombre y un teléfono o correo, para avisarte del estado de tu trámite.</li>
          <li>Tu RUT, solo en los trámites que lo requieren (por ejemplo, inscribirte en un operativo o publicar una mascota perdida).</li>
          <li>Tu localidad o sector. Nunca pedimos ni mostramos una dirección exacta.</li>
          <li>Los datos y fotos del animal que tú decidas publicar. Las fotos se guardan sin la información de ubicación del teléfono.</li>
        </ul>

        <h2>Quién los ve</h2>
        <ul>
          <li>En el portal solo se publica lo necesario para encontrar o ayudar a un animal: sus datos, la foto y el sector.</li>
          <li>Tu teléfono, correo y RUT no se publican. Cuando alguien quiere contactarte, el mensaje pasa por la plataforma.</li>
          <li>El equipo municipal del programa ve tus datos para revisar y responder tus trámites.</li>
          <li>Los reportes de SOS Mascotas solo los ve el equipo municipal.</li>
        </ul>

        <h2>Instagram</h2>
        <p>
          Publicamos en Instagram los operativos, las adopciones y los avisos de mascotas perdidas o avistadas que el equipo municipal aprueba, sin datos
          personales. Si comentas o nos escribes por Instagram, guardamos el texto y el identificador que Instagram asigna a tu cuenta, solo para
          responderte. No guardamos tu nombre de usuario.
        </p>

        <h2>Cuánto tiempo los guardamos</h2>
        <p>Mientras tu trámite esté vigente y el tiempo que exija la normativa municipal: [plazo de conservación].</p>

        <h2>Tus derechos</h2>
        <p>
          Puedes pedir ver, corregir o eliminar tus datos. Revisa cómo en <Link href="/eliminacion-de-datos">Eliminación de datos</Link> o escríbenos a
          [correo de contacto de la Municipalidad]. Esta política se rige por la Ley 19.628 sobre protección de la vida privada.
        </p>

        <p className="nota">
          {m.nombreOficial} · {m.sitioWeb} · Última actualización: [fecha]
        </p>
      </article>
    </div>
  );
}
