import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next } from "next/font/google";
import type { ReactNode } from "react";
import { municipioActivo } from "@/lib/municipio";
import "@/estilos/base.css";

// Tipografías del sistema de diseño, servidas desde el propio sitio.
const sans = Atkinson_Hyperlegible_Next({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--fuente-sans", display: "swap", adjustFontFallback: false });
const mono = Atkinson_Hyperlegible_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--fuente-mono", display: "swap", adjustFontFallback: false });

export function generateMetadata(): Metadata {
  const municipio = municipioActivo();
  return {
    title: `Tenencia responsable · ${municipio.nombre}`,
    description: `Plataforma de tenencia responsable de la ${municipio.nombreOficial}.`,
    icons: { icon: municipio.identidad.marcaDigital },
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CL" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
