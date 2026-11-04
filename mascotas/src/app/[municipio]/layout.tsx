import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { clasesFuentes } from "@/estilos/fuentes";
import { idsMunicipios, municipioActivo } from "@/lib/municipio";
import "@/estilos/base.css";

export async function generateMetadata(): Promise<Metadata> {
  const municipio = (await municipioActivo());
  return {
    title: `${municipio.plataforma} · ${municipio.nombre}`,
    description: `${municipio.plataforma}: todo para cuidar a las mascotas de la comuna. ${municipio.nombreOficial}.`,
    icons: { icon: municipio.identidad.marcaDigital },
  };
}

// Cada municipio configurado (config/municipios/) tiene sus páginas bajo /<id>/…;
// las direcciones sin municipio las reescribe src/proxy.ts. Se declaran todos
// para que sus páginas se puedan guardar armadas.
export function generateStaticParams() {
  return idsMunicipios().map((municipio) => ({ municipio }));
}

export default async function RootLayout({ children, params }: { children: ReactNode; params: Promise<{ municipio: string }> }) {
  const { municipio } = await params;
  if (!idsMunicipios().includes(municipio)) notFound();
  return (
    // data-tema: colores y tipografía propios del municipio, si los tiene (design-system/temas/<id>/).
    <html lang="es-CL" className={clasesFuentes} data-tema={municipio}>
      <body>{children}</body>
    </html>
  );
}
