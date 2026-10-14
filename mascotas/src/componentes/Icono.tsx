// Íconos del sistema de diseño: set Lucide, trazo de 2 px, puntas redondeadas.
// Siempre acompañan a un texto (navegación, estados, acciones).
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  FileText,
  Heart,
  House,
  Info,
  LifeBuoy,
  MapPin,
  Megaphone,
  MessageCircle,
  PawPrint,
  Search,
  Stethoscope,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";

const ICONOS = {
  huella: PawPrint,
  salvavidas: LifeBuoy,
  corazon: Heart,
  calendario: CalendarDays,
  servicio: Stethoscope,
  megafono: Megaphone,
  alerta: TriangleAlert,
  check: Check,
  reloj: Clock,
  cerrar: X,
  info: Info,
  flecha: ArrowRight,
  volver: ArrowLeft,
  casa: House,
  buscar: Search,
  documento: FileText,
  mensaje: MessageCircle,
  ubicacion: MapPin,
} satisfies Record<string, LucideIcon>;

export type NombreIcono = keyof typeof ICONOS;

type Props = { nombre: NombreIcono; tamano?: number; className?: string };

export function Icono({ nombre, tamano = 24, className }: Props) {
  const Componente = ICONOS[nombre];
  return <Componente className={className} size={tamano} strokeWidth={tamano >= 40 ? 1.75 : 2} aria-hidden="true" focusable="false" />;
}
