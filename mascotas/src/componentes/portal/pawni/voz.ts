// «Escuchar»: lee el texto con la voz del propio dispositivo (sin servicios
// externos). Prefiere una voz en español de Chile y, si no hay, cualquiera en español.
export function decir(texto: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voz = window.speechSynthesis;
  voz.cancel();
  const frase = new SpeechSynthesisUtterance(texto);
  const voces = voz.getVoices();
  const elegida = voces.find((v) => v.lang === "es-CL") ?? voces.find((v) => v.lang.startsWith("es"));
  frase.lang = elegida?.lang ?? "es-CL";
  if (elegida) frase.voice = elegida;
  frase.rate = 0.95;
  voz.speak(frase);
}

export function callar() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

export const hayVoz = () => typeof window !== "undefined" && "speechSynthesis" in window;
