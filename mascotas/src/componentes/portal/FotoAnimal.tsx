// Foto de un animal desde demo/fotos/ (o una foto subida, por su dirección
// completa) o, si no tiene, un marcador neutro.
import Image from "next/image";
import { Icono } from "@/componentes/Icono";
import estilos from "./tarjetas.module.css";

export function FotoAnimal({ foto, alt, subida }: { foto: string | null | undefined; alt: string; subida?: { src: string; subida?: boolean } }) {
  // Las fotos subidas no pasan por el optimizador: su ruta comprueba en cada pedido si se pueden mostrar.
  if (subida) return <Image className={estilos.foto} src={subida.src} alt={alt} width={800} height={600} sizes="(max-width: 640px) 100vw, 400px" unoptimized={subida.subida !== false} />;
  if (!foto) {
    return (
      <div className={estilos.sinFoto} role="img" aria-label="Sin fotografía">
        <Icono nombre="huella" tamano={40} />
        <span>Sin fotografía</span>
      </div>
    );
  }
  return <Image className={estilos.foto} src={`/fotos/${foto}`} alt={alt} width={800} height={600} sizes="(max-width: 640px) 100vw, 400px" />;
}
