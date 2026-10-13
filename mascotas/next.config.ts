import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que `next dev` agregue sus propias reglas a CLAUDE.md del proyecto.
  agentRules: false,
  // Hay un package-lock.json en la carpeta de usuario; la raíz es este proyecto.
  turbopack: { root: __dirname },
  // Las fotos de demo/fotos/ (servidas en /fotos/) pesan cerca de 900 KB: Next las entrega reducidas.
  images: { localPatterns: [{ pathname: "/fotos/**" }] },
  // SOS Mascotas envía una foto opcional; el portal la reduce antes (a menos de 1 MB) y el servidor acepta hasta 3 MB.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
  // El servidor lee estos archivos al funcionar (configuración del municipio,
  // fotos de la demo, escudo y fuentes de las piezas de Instagram): en Netlify
  // tienen que viajar dentro de las funciones.
  outputFileTracingIncludes: {
    "/**": ["./config/municipios/**/*", "./demo/fotos/**/*", "./design-system/assets/**/*", "./design-system/tokens.json", "./src/servidor/redes/fuentes/**/*"],
  },
};

export default nextConfig;
