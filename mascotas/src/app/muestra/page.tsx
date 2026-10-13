import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { Boton } from "@/componentes/Boton";
import { EtiquetaSeccion } from "@/componentes/EtiquetaSeccion";
import { FirmaInstitucional } from "@/componentes/FirmaInstitucional";
import { BloqueTarjeta, Tarjeta } from "@/componentes/Tarjeta";
import { municipioActivo } from "@/lib/municipio";
import estilos from "./muestra.module.css";

export const metadata: Metadata = { title: "Muestra del sistema de diseño" };

type Token = { name: string; value: string; usage: string };
type EstiloTipo = {
  name: string;
  family?: string;
  fontSize: string;
  lineHeight: number;
  fontWeight: number;
  sample: string;
  usage: string;
};
type Tokens = {
  color: { tokens: Token[] };
  type: { groups: { name: string; family: string; styles: EstiloTipo[] }[] };
};

function leerTokens(): Tokens {
  const ruta = join(process.cwd(), "design-system", "tokens.json");
  return JSON.parse(readFileSync(ruta, "utf8")) as Tokens;
}

/** «21.33px» → «21,33 px»; «1.1» → «1,1». */
const formatoChileno = (valor: string | number) =>
  String(valor).replace(".", ",").replace(/px$/, " px");

const nombreFamilia = (familia: string) =>
  familia === "titulos" ? "Montserrat" : "Source Sans 3";

const nombrePeso: Record<number, string> = { 400: "Regular", 600: "SemiBold", 700: "Bold" };

export default function Muestra() {
  const municipio = municipioActivo();
  const tokens = leerTokens();
  const impresion = tokens.type.groups.find((g) => g.name === "Impresión");

  return (
    <>
      <header className={estilos.encabezado}>
        <div className={estilos.contenedor}>
          <FirmaInstitucional municipio={municipio} sobreAzul />
          <div>
            <EtiquetaSeccion numero={0} nombre="Plataforma de tenencia responsable" sobreAzul />
            <h1>Muestra del sistema de diseño</h1>
          </div>
        </div>
      </header>

      <main className={estilos.principal}>
        <div className={estilos.contenedor}>
          <section className={estilos.seccion} aria-labelledby="paleta">
            <div className={estilos.cabeceraSeccion}>
              <EtiquetaSeccion numero={1} nombre="Color" />
              <h2 id="paleta">Paleta</h2>
              <p>
                Valores tomados de <code>design-system/tokens.json</code>. El fondo de página es
                marfil institucional; las tarjetas y paneles van en blanco encima.
              </p>
            </div>
            <div className={estilos.paleta}>
              {tokens.color.tokens.map((t) => (
                <article key={t.name} className={estilos.muestraColor}>
                  <div className={estilos.bloqueColor} style={{ background: `var(--${t.name})` }} />
                  <div className={estilos.datosColor}>
                    <h3>{t.name}</h3>
                    <span className={estilos.codigo}>{t.value}</span>
                    <p className="nota">{t.usage}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={estilos.seccion} aria-labelledby="tipografia">
            <div className={estilos.cabeceraSeccion}>
              <EtiquetaSeccion numero={2} nombre="Tipografía" />
              <h2 id="tipografia">Escala tipográfica</h2>
              <p>
                Montserrat para títulos y Source Sans 3 para texto, formularios y tablas, ambas
                cargadas desde <code>design-system/fonts/</code>. En pantalla usamos la escala de
                impresión en px; en pantallas angostas h1 baja a 32 px. Esta escala web es una
                propuesta pendiente de validación.
              </p>
            </div>
            <Tarjeta>
              <div className={estilos.escala}>
                {impresion?.styles.map((s) => {
                  const familia = s.family ?? impresion.family;
                  const Elemento = (s.name === "cuerpo" || s.name === "nota" ? "p" : s.name) as
                    | "h1"
                    | "h2"
                    | "h3"
                    | "p";
                  return (
                    <div key={s.name} className={estilos.estiloTipo}>
                      <div className={`${estilos.fichaTipo} nota`}>
                        <b>{s.name}</b>
                        <span>
                          {nombreFamilia(familia)} {nombrePeso[s.fontWeight] ?? s.fontWeight}
                        </span>
                        <span>
                          {formatoChileno(s.fontSize)} · interlineado {formatoChileno(s.lineHeight)}
                        </span>
                      </div>
                      <Elemento
                        className={s.name === "nota" ? "nota" : undefined}
                        // Los encabezados de muestra no deben entrar al árbol de títulos.
                        role={Elemento === "p" ? undefined : "presentation"}
                      >
                        {s.sample}
                      </Elemento>
                    </div>
                  );
                })}
              </div>
            </Tarjeta>
          </section>

          <section className={estilos.seccion} aria-labelledby="componentes">
            <div className={estilos.cabeceraSeccion}>
              <EtiquetaSeccion numero={3} nombre="Componentes" />
              <h2 id="componentes">Tarjeta, botón y etiqueta de sección</h2>
            </div>
            <div className={estilos.grillaDos}>
              <Tarjeta como="article">
                <BloqueTarjeta titulo="Operativo de esterilización">
                  <p>
                    Se realizará el sábado [fecha], de 10:00 a 14:00 horas, en [lugar]. Quedan
                    [N] cupos disponibles.
                  </p>
                </BloqueTarjeta>
                <BloqueTarjeta titulo="Requisitos">
                  <p>Ayuno de [horas] y edad mínima de [edad]. Consulte los documentos requeridos en la ficha del operativo.</p>
                </BloqueTarjeta>
              </Tarjeta>

              <div className={estilos.panelMuestra}>
                <Tarjeta>
                  <BloqueTarjeta titulo="Botones">
                    <div className={estilos.fila}>
                      <Boton>Solicitar cupo</Boton>
                      <Boton variante="secundario">Ver requisitos</Boton>
                      <Boton disabled>Sin cupos</Boton>
                    </div>
                    <p className="nota">
                      El sistema de diseño aún no define botón: esta versión se arma solo con
                      tokens y queda pendiente de validación.
                    </p>
                  </BloqueTarjeta>
                </Tarjeta>
                <Tarjeta>
                  <EtiquetaSeccion numero={4} nombre="Operativos" />
                  <h2>Próximos operativos</h2>
                </Tarjeta>
                <div className={estilos.panelAzul}>
                  <EtiquetaSeccion numero={5} nombre="Avisos" sobreAzul />
                  <h2>Avisos vigentes</h2>
                </div>
              </div>
            </div>
          </section>

          <section className={estilos.seccion} aria-labelledby="escudo">
            <div className={estilos.cabeceraSeccion}>
              <EtiquetaSeccion numero={6} nombre="Identificador" />
              <h2 id="escudo">Escudo y firma institucional</h2>
              <p>
                El escudo se carga desde los archivos originales. Sobre fondos claros usamos la
                versión a color; sobre azul institucional, la versión negativa.
              </p>
            </div>
            <div className={estilos.escudos}>
              <div className={estilos.escudoClaro}>
                <img src={municipio.identidad.escudoColor} alt={`Escudo de ${municipio.nombre}, a color`} />
                <span className="nota">escudo-color.png</span>
              </div>
              <div className={estilos.escudoAzul}>
                <img
                  src={municipio.identidad.escudoNegativo}
                  alt={`Escudo de ${municipio.nombre}, versión negativa`}
                />
                <span className="nota">escudo-negativo.png</span>
              </div>
            </div>
            <div className={estilos.grillaDos}>
              <Tarjeta>
                <FirmaInstitucional municipio={municipio} />
              </Tarjeta>
              <div className={estilos.panelAzul}>
                <FirmaInstitucional municipio={municipio} sobreAzul />
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
