// En el navegador: reduce una foto antes de enviarla (lado mayor de 1600 px,
// JPEG). Así pesa menos de 1 MB y pierde los metadatos de la cámara, incluida
// la ubicación GPS. El servidor la valida y la vuelve a codificar igual.
const LADO_MAXIMO = 1600;

export async function reducirFoto(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("Sin lienzo");
  ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();
  return new Promise((ok, mal) => lienzo.toBlob((b) => (b ? ok(b) : mal(new Error("Sin imagen"))), "image/jpeg", 0.82));
}
