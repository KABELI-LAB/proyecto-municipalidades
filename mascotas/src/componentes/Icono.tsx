// Íconos provisorios de trazo simple: el municipio aún no define su set
// (design-system/README.md, Iconografía). Siempre acompañan a un texto.
const TRAZOS = {
  huella: (
    <>
      <circle cx="12" cy="16" r="4" />
      <circle cx="5.5" cy="10" r="2" />
      <circle cx="18.5" cy="10" r="2" />
      <circle cx="9" cy="4.5" r="2" />
      <circle cx="15" cy="4.5" r="2" />
    </>
  ),
  // Salvavidas: pedir ayuda (SOS Mascotas).
  salvavidas: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6" />
    </>
  ),
  corazon: <path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />,
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="1" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  servicio: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  megafono: (
    <>
      <path d="M3 10v4h4l7 4V6l-7 4H3z" />
      <path d="M18 9a4 4 0 0 1 0 6" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3 2 20h20L12 3z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.5" />
    </>
  ),
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  volver: <path d="M19 12H5M11 6l-6 6 6 6" />,
  casa: <path d="M4 11.5 12 5l8 6.5M6.5 9.5V19h11V9.5M10 19v-5h4v5" />,
  buscar: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </>
  ),
  documento: (
    <>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M9 10h6M9 14h6M9 18h4" />
    </>
  ),
  mensaje: <path d="M4 5h16v11H9l-5 4z" />,
  ubicacion: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
} as const;

export type NombreIcono = keyof typeof TRAZOS;

type Props = { nombre: NombreIcono; tamano?: number; className?: string };

export function Icono({ nombre, tamano = 24, className }: Props) {
  return (
    <svg
      className={className}
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {TRAZOS[nombre]}
    </svg>
  );
}
