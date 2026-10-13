import type { Metadata } from "next";
import type { ReactNode } from "react";
import { municipioActivo } from "@/lib/municipio";
import "@/estilos/base.css";

export function generateMetadata(): Metadata {
  const municipio = municipioActivo();
  return {
    title: `Tenencia responsable · ${municipio.nombre}`,
    description: `Plataforma de tenencia responsable de la ${municipio.nombreOficial}.`,
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL">
      <body>{children}</body>
    </html>
  );
}
