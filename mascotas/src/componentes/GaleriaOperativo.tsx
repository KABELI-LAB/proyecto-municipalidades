// Fotos de un operativo cerrado, desde demo/fotos/ (asignación aprobada).
import Image from "next/image";
import estilos from "./GaleriaOperativo.module.css";

export function GaleriaOperativo({ fotos, sector }: { fotos: string; sector: string }) {
  const lista = fotos.split(",").filter(Boolean);
  if (lista.length === 0) return null;
  return (
    <ul className={estilos.galeria} aria-label="Fotos del operativo">
      {lista.map((f) => (
        <li key={f}>
          <Image src={`/fotos/${f}`} alt={`Atención durante el operativo en ${sector}`} width={800} height={600} sizes="(max-width: 640px) 100vw, 400px" />
        </li>
      ))}
    </ul>
  );
}
