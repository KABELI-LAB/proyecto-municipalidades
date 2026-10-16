// La voz de Pawni:
//   - «Escuchar»: si el servidor tiene configurada la voz de Pawni (Azure
//     Speech), reproduce ese audio, igual en todos los equipos; si no, usa la
//     voz del navegador, femenina y lo más aguda posible, como la de una niña;
//   - el micrófono: convierte lo que dices en texto. En Chrome y Edge ese
//     reconocimiento lo hace el servicio del navegador; en Firefox no existe y
//     el botón no aparece.

// Voces en español conocidas por sonar más suaves, en orden de preferencia.
const SUAVES = [/catalina/i, /paulina/i, /dalia/i, /helena/i, /elvira/i, /sabina/i, /laura/i, /monica|mónica/i, /google español de estados unidos/i, /google español/i];

function elegirVoz(voces: SpeechSynthesisVoice[]) {
  const espanol = voces.filter((v) => v.lang.toLowerCase().startsWith("es"));
  for (const patron of SUAVES) {
    const v = espanol.find((x) => patron.test(x.name));
    if (v) return v;
  }
  return espanol.find((v) => v.lang === "es-CL") ?? espanol.find((v) => /female|mujer/i.test(v.name)) ?? espanol[0];
}

let audioActual: HTMLAudioElement | null = null;

/** Dice el texto: con la voz del servidor si viene firmado; si falla, con la del navegador. */
export function decir(texto: string, firma?: string, alTerminar?: () => void) {
  callar();
  if (!firma) return decirConNavegador(texto, alTerminar);
  const audio = new Audio(`/api/pawni/voz?t=${encodeURIComponent(texto)}&f=${encodeURIComponent(firma)}`);
  audioActual = audio;
  let respaldo = false;
  const usarRespaldo = () => {
    if (respaldo || audioActual !== audio) return;
    respaldo = true;
    audioActual = null;
    decirConNavegador(texto, alTerminar);
  };
  audio.onended = () => {
    if (audioActual === audio) audioActual = null;
    alTerminar?.();
  };
  audio.onerror = usarRespaldo;
  audio.play().catch(usarRespaldo);
}

function decirConNavegador(texto: string, alTerminar?: () => void) {
  if (!hayVoz()) return alTerminar?.();
  const sintesis = window.speechSynthesis;
  const frase = new SpeechSynthesisUtterance(texto);
  const elegida = elegirVoz(sintesis.getVoices());
  frase.lang = elegida?.lang ?? "es-CL";
  if (elegida) frase.voice = elegida;
  // Lo más aguda que permite el navegador y algo más rápida: voz de niña.
  frase.pitch = 2;
  frase.rate = 1.1;
  if (alTerminar) frase.onend = frase.onerror = () => alTerminar();
  sintesis.speak(frase);
}

export function callar() {
  if (audioActual) {
    audioActual.pause();
    audioActual = null;
  }
  if (hayVoz()) window.speechSynthesis.cancel();
}

export const hayVoz = () => typeof window !== "undefined" && "speechSynthesis" in window;

// El reconocimiento de voz no está en los tipos de TypeScript de todos los navegadores.
type Reconocimiento = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type ConstructorReconocimiento = new () => Reconocimiento;

const constructor = (): ConstructorReconocimiento | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: ConstructorReconocimiento; webkitSpeechRecognition?: ConstructorReconocimiento };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const hayMicrofono = () => constructor() !== null;

/**
 * Escucha una frase. Va mostrando lo que entiende (parcial) y al terminar
 * entrega el texto final. Devuelve una función para detener.
 */
export function escuchar(o: { parcial: (texto: string) => void; final: (texto: string) => void; error: (motivo: string) => void; fin: () => void }) {
  const Clase = constructor();
  if (!Clase) {
    o.error("sin-soporte");
    o.fin();
    return () => {};
  }
  callar();
  const r = new Clase();
  r.lang = "es-CL";
  r.interimResults = true;
  r.maxAlternatives = 1;
  r.continuous = false;
  let entregado = false;
  r.onresult = (e) => {
    let texto = "";
    let terminado = false;
    for (let i = 0; i < e.results.length; i++) {
      texto += e.results[i][0].transcript;
      terminado = e.results[i].isFinal;
    }
    if (terminado && !entregado) {
      entregado = true;
      o.final(texto.trim());
    } else o.parcial(texto);
  };
  r.onerror = (e) => o.error(e.error);
  r.onend = () => o.fin();
  r.start();
  return () => r.stop();
}
