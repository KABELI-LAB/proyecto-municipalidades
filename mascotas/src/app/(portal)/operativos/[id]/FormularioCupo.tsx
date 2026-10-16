"use client";
// Inscripción en un operativo, en tres pasos breves: servicio y mascota, sus
// datos, y confirmar. Las reglas (un servicio por inscripción, lista de
// espera, límite por hogar) y la validación son las de siempre: esquemaCupo
// en el navegador y solicitarCupo en el servidor.
import { useState } from "react";
import { ANIMAL_VACIO, BloqueAnimal, BloquePersona, CAMPOS_ANIMAL, CAMPOS_PERSONA, filasAnimal, filasPersona, AYUDA_ESPECIE_ATENDIDA, OPCIONES_ESPECIE_ATENDIDA, PERSONA_VACIA, type SectorOpcion } from "@/componentes/formulario/Bloques";
import { CampoOpciones } from "@/componentes/formulario/Campos";
import { MarcoPasos, Resumen } from "@/componentes/formulario/MarcoPasos";
import { ResultadoTramite } from "@/componentes/formulario/ResultadoTramite";
import { useTramite } from "@/componentes/formulario/useTramite";
import { Icono, type NombreIcono } from "@/componentes/Icono";
import { esquemaCupo } from "@/lib/esquemas";
import { solicitarCupo, type ResultadoCupo } from "@/servidor/portal/acciones";
import formulario from "@/componentes/formulario/formulario.module.css";
import estilos from "@/componentes/portal/operativos.module.css";

type Props = {
  operativoId: string;
  sectores: SectorOpcion[];
  servicios: { id: string; nombre: string; clave: string; disponibles: number }[];
  requisitos: string;
  /** Animales que puede inscribir cada hogar en un mismo operativo (configuración del municipio). */
  limitePorHogar: number;
  /** Para el resumen: fecha, horario y lugar ya escritos. */
  operativo: { fecha: string; horario: string; lugar: string };
};

const TITULOS = ["Servicio y mascota", "Tus datos", "Confirmar"] as const;
const PASOS = [["servicioId", "especie", ...CAMPOS_ANIMAL], [...CAMPOS_PERSONA], []] as const;

/** Ícono y una frase breve por servicio (claves del catálogo). */
const SERVICIO: Record<string, { icono: NombreIcono; detalle: string }> = {
  esterilizacion: { icono: "corazon", detalle: "Evita camadas no deseadas." },
  vacunacion: { icono: "servicio", detalle: "Cuida la salud de tu mascota." },
  microchip: { icono: "documento", detalle: "Identificación permanente." },
};

export function FormularioCupo({ operativoId, sectores, servicios, requisitos, limitePorHogar, operativo }: Props) {
  const t = useTramite(esquemaCupo, { operativoId, servicioId: "", ...ANIMAL_VACIO, ...PERSONA_VACIA }, PASOS);
  const [hecho, setHecho] = useState<Extract<ResultadoCupo, { ok: true }> | null>(null);
  const { valores: v, errores, cambiar } = t;
  const servicio = servicios.find((s) => s.id === v.servicioId);

  if (hecho) {
    const confirmado = hecho.estado === "CONFIRMADO";
    return (
      <ResultadoTramite titulo={confirmado ? "¡Listo! Tu cupo está confirmado" : "Quedó en lista de espera"} codigo={hecho.codigo}>
        {confirmado ? (
          <p>
            {hecho.servicio}: {hecho.fecha}, {hecho.horario}, en {hecho.lugar.toLowerCase()}. Te enviaremos un recordatorio 48
            horas antes; si no puedes asistir, avísanos para liberar el cupo.
          </p>
        ) : (
          <p>
            Los cupos de {hecho.servicio.toLowerCase()} están completos y quedaste en el lugar {hecho.posicion} de la lista de
            espera. Si se libera un cupo, te avisaremos.
          </p>
        )}
      </ResultadoTramite>
    );
  }

  return (
    <MarcoPasos
      titulos={TITULOS}
      paso={t.paso}
      tituloRef={t.titulo}
      mensaje={t.mensaje}
      enviando={t.enviando}
      alAvanzar={t.avanzar}
      alVolver={t.volver}
      alConfirmar={() => t.enviar(solicitarCupo, (r) => setHecho(r))}
      textoConfirmar="Inscribirme"
    >
      {t.paso === 0 && (
        <>
          <fieldset className={`${formulario.grupo} ${formulario.anchoCompleto}`} aria-describedby={`servicioId-ayuda${errores.servicioId ? " servicioId-error" : ""}`} aria-invalid={errores.servicioId ? true : undefined}>
            <legend className={formulario.etiqueta}>¿Qué servicio necesitas?</legend>
            <div className={estilos.opcionesServicio}>
              {servicios.map((s, i) => {
                const info = SERVICIO[s.clave];
                const lleno = s.disponibles <= 0;
                return (
                  <label key={s.id} className={estilos.opcionServicio}>
                    <input type="radio" id={i === 0 ? "servicioId" : undefined} name="servicioId" value={s.id} checked={v.servicioId === s.id} onChange={() => cambiar("servicioId", s.id)} />
                    <span className={estilos.opcionServicioIcono} aria-hidden="true">
                      <Icono nombre={info?.icono ?? "servicio"} tamano={22} />
                    </span>
                    <b>{s.nombre}</b>
                    {info && <span className={estilos.detalle}>{info.detalle}</span>}
                    <span className={`${estilos.cuposOpcion} ${lleno ? estilos.esperaOpcion : ""}`}>
                      <Icono nombre={lleno ? "reloj" : "check"} tamano={16} />
                      {lleno ? "Lista de espera" : `${s.disponibles} ${s.disponibles === 1 ? "cupo" : "cupos"}`}
                    </span>
                  </label>
                );
              })}
            </div>
            <p id="servicioId-ayuda" className={formulario.ayuda}>
              Elige un servicio por inscripción. Para otro servicio u otro animal, inscríbete de nuevo.
            </p>
            {errores.servicioId && (
              <p id="servicioId-error" className={formulario.error}>
                <Icono nombre="alerta" tamano={18} />
                {errores.servicioId}
              </p>
            )}
          </fieldset>
          <CampoOpciones id="especie" etiqueta="Tu mascota es" valor={v.especie} alCambiar={(x) => cambiar("especie", x)} error={errores.especie} opciones={OPCIONES_ESPECIE_ATENDIDA} ayuda={AYUDA_ESPECIE_ATENDIDA} />
          {v.especie && <BloqueAnimal valores={v} errores={errores} cambiar={cambiar} />}
        </>
      )}
      {t.paso === 1 && (
        <>
          <p className={formulario.ayuda}>Los usamos solo para tu inscripción y para avisarte. No se publican.</p>
          <BloquePersona valores={v} errores={errores} cambiar={cambiar} sectores={sectores} />
        </>
      )}
      {t.paso === 2 && (
        <div className={estilos.grupos}>
          <section className={estilos.grupo} aria-labelledby="resumen-operativo">
            <div className={estilos.grupoCabecera}>
              <h3 id="resumen-operativo">
                <Icono nombre="calendario" tamano={20} />
                Operativo
              </h3>
            </div>
            <Resumen filas={[["Fecha", operativo.fecha], ["Horario", operativo.horario], ["Lugar", operativo.lugar]]} />
          </section>
          <section className={estilos.grupo} aria-labelledby="resumen-servicio">
            <div className={estilos.grupoCabecera}>
              <h3 id="resumen-servicio">
                <Icono nombre="huella" tamano={20} />
                Servicio y mascota
              </h3>
              <button type="button" className={estilos.editar} onClick={() => t.irA(0)}>
                Editar
              </button>
            </div>
            <Resumen filas={[["Servicio", servicio ? `${servicio.nombre}${servicio.disponibles <= 0 ? " (lista de espera)" : ""}` : ""], ...filasAnimal(v)]} />
          </section>
          <section className={estilos.grupo} aria-labelledby="resumen-datos">
            <div className={estilos.grupoCabecera}>
              <h3 id="resumen-datos">
                <Icono nombre="documento" tamano={20} />
                Tus datos
              </h3>
              <button type="button" className={estilos.editar} onClick={() => t.irA(1)}>
                Editar
              </button>
            </div>
            <Resumen filas={filasPersona(v, sectores)} />
          </section>
          <div className={formulario.nota}>
            <Icono nombre="info" tamano={20} />
            <p>
              <b>Requisitos.</b> {requisitos} Cada hogar puede inscribir hasta {limitePorHogar} animales en este operativo.
            </p>
          </div>
        </div>
      )}
    </MarcoPasos>
  );
}
