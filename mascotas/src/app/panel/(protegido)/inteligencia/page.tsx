import type { Metadata } from "next";
import Link from "next/link";
import { Cifra } from "@/componentes/Cifra";
import { Icono, type NombreIcono } from "@/componentes/Icono";
import { Interruptor } from "@/componentes/panel/Interruptor";
import { requerir } from "@/servidor/auth";
import { fechaCorta } from "@/servidor/formato";
import { guardarIaActiva } from "@/servidor/panel/acciones-ia";
import { estadoInteligencia } from "@/servidor/panel/inteligencia";
import estilos from "@/estilos/paginas.module.css";
import propios from "./inteligencia.module.css";

export const metadata: Metadata = { title: "Inteligencia artificial · Panel municipal" };

// Dónde ayuda la IA: siempre con textos aprobados o cifras agrupadas.
const USOS: { icono: NombreIcono; titulo: string; detalle: string; href: string; enlace: string }[] = [
  { icono: "mensaje", titulo: "Pawni entiende más", detalle: "Elige el tema de lo que escriben o dicen en el portal. Responde con textos aprobados.", href: "/", enlace: "Ver el portal" },
  { icono: "megafono", titulo: "Instagram entiende más", detalle: "Clasifica comentarios y mensajes que las palabras clave no entienden.", href: "/panel/instagram", enlace: "Ver Instagram" },
  { icono: "idea", titulo: "Resumen para el equipo", detalle: "Lo que destaca y qué evaluar, con las cifras de lo que piden los vecinos.", href: "/panel/vecinos", enlace: "Ver el resumen" },
];

// Responde: ¿está encendida la inteligencia artificial y en qué se usa?
export default async function Inteligencia() {
  await requerir("configurarIA");
  const e = await estadoInteligencia();

  return (
    <div className={`contenedor ${estilos.pagina}`}>
      <div className={estilos.cabecera}>
        <h1>Inteligencia artificial</h1>
        <p>ChatGPT ayuda a entender y resumir. Nunca decide ni publica solo.</p>
      </div>

      <section className={propios.tarjeta} aria-labelledby="estado">
        <div className={propios.titulo}>
          <span className={propios.cerebro} aria-hidden="true">
            <Icono nombre="cerebro" tamano={28} />
          </span>
          <h2 id="estado">Estado</h2>
          {e.configurada ? (
            <span className={`${propios.insignia} ${propios.ok}`}>
              <Icono nombre="check" tamano={14} />
              Conectada · <span className="dato">{e.modelo}</span>
            </span>
          ) : (
            <span className={`${propios.insignia} ${propios.falta}`}>
              <Icono nombre="alerta" tamano={14} />
              Falta configurar
            </span>
          )}
        </div>
        <Interruptor
          id="usar-ia"
          etiqueta="Usar inteligencia artificial (ChatGPT)"
          descripcion="Apagada, todo funciona igual con reglas de palabras clave. Solo se envían textos y cifras agrupadas, nunca datos de personas."
          inicial={e.encendida}
          guardar={guardarIaActiva}
        />
        {!e.configurada && <p className={propios.nota}>Para usarla falta configurar en el servidor: OPENAI_API_KEY.</p>}
      </section>

      <ul className={propios.usos} aria-label="Dónde ayuda">
        {USOS.map((u) => (
          <li key={u.titulo}>
            <span className={propios.recuadro} aria-hidden="true">
              <Icono nombre={u.icono} tamano={24} />
            </span>
            <b>{u.titulo}</b>
            <span className={propios.nota}>{u.detalle}</span>
            <Link href={u.href} className={propios.enlace}>
              {u.enlace}
              <Icono nombre="flecha" tamano={18} />
            </Link>
          </li>
        ))}
      </ul>

      <section className={propios.tarjeta} aria-labelledby="uso">
        <div className={propios.titulo}>
          <h2 id="uso">Uso en 30 días</h2>
        </div>
        <dl className={propios.cifras}>
          <div>
            <dt>Entendidos con IA</dt>
            <dd className={propios.cifra}>
              <Cifra valor={e.uso.conIA} />
            </dd>
            <dd className={propios.nota}>de {e.uso.interacciones} comentarios y mensajes de Instagram</dd>
          </div>
          <div>
            <dt>Resúmenes escritos</dt>
            <dd className={propios.cifra}>
              <Cifra valor={e.uso.resumenes} />
            </dd>
            <dd className={propios.nota}>{e.uso.ultimoResumen ? `El último, el ${fechaCorta(e.uso.ultimoResumen)}` : "Aún no hay resúmenes"}</dd>
          </div>
        </dl>
        <p className={propios.nota}>Las preguntas a Pawni no se guardan, por eso no se cuentan aquí.</p>
      </section>
    </div>
  );
}
