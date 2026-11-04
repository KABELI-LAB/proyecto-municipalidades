// Tipografías servidas desde el propio sitio (next/font). Viven fuera de
// src/app/[municipio]/: next/font no acepta corchetes en la ruta del módulo.
import { Atkinson_Hyperlegible_Mono, Atkinson_Hyperlegible_Next, IBM_Plex_Mono, Lexend, Roboto, Roboto_Condensed } from "next/font/google";

// Las del sistema de diseño.
const sans = Atkinson_Hyperlegible_Next({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--fuente-sans", display: "swap", adjustFontFallback: false });
const mono = Atkinson_Hyperlegible_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--fuente-mono", display: "swap", adjustFontFallback: false });
// Las de los temas de demostración (Curepto y Vichuquén): no se precargan, solo se bajan si se elige ese tema.
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "500", "700", "900"], variable: "--fuente-roboto", display: "swap", preload: false });
const robotoCondensada = Roboto_Condensed({ subsets: ["latin"], weight: ["400", "700"], variable: "--fuente-roboto-condensada", display: "swap", preload: false });
const lexend = Lexend({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--fuente-lexend", display: "swap", preload: false });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--fuente-plex-mono", display: "swap", preload: false });

/** Clases que definen las variables de todas las tipografías, para <html>. */
export const clasesFuentes = [sans, mono, roboto, robotoCondensada, lexend, plexMono].map((f) => f.variable).join(" ");
