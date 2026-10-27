import s from '../styles/cuestionario.module.css'

interface Props {
  adultos: number
  menores: number
  bebes: number
  mayores: number
  mascotas: number
  animales: boolean
  conUbicacion: boolean
}

const MAX_FIGURAS = 8

/**
 * Ilustración plana de la casa que se completa a medida que respondes (7.3).
 * Formas geométricas con la paleta del design system, sin rostros.
 * Es decorativa: el resumen accesible va en texto.
 */
export function CasaEnVivo({ adultos, menores, bebes, mayores, mascotas, animales, conUbicacion }: Props) {
  const ninos = Math.max(0, menores - bebes)
  const figuras: ('adulto' | 'menor' | 'bebe' | 'mayor')[] = [
    ...Array<'adulto'>(Math.max(0, adultos)).fill('adulto'),
    ...Array<'mayor'>(mayores).fill('mayor'),
    ...Array<'menor'>(ninos).fill('menor'),
    ...Array<'bebe'>(bebes).fill('bebe'),
  ].slice(0, MAX_FIGURAS)
  const extra = adultos + mayores + ninos + bebes - figuras.length

  // Posiciones dentro de la casa (viewBox 240 × 180).
  const paso = figuras.length > 0 ? Math.min(26, 168 / figuras.length) : 0
  const inicio = 120 - (paso * (figuras.length - 1)) / 2

  return (
    <svg className={s.casa} viewBox="0 0 240 180" aria-hidden="true" focusable="false">
      {/* Suelo y cauce */}
      <rect x="0" y="160" width="240" height="20" rx="4" fill="var(--green-100)" />
      {/* Casa */}
      <path d="M28 82 L120 22 L212 82 Z" fill="var(--blue-700)" />
      <rect x="40" y="80" width="160" height="82" rx="4" fill="var(--color-surface)" stroke="var(--blue-700)" strokeWidth="4" />
      {/* Pin de ubicación */}
      {conUbicacion && (
        <g className={s.aparece}>
          <path d="M120 2 c-8 0 -13 6 -13 13 c0 9 13 21 13 21 s13 -12 13 -21 c0 -7 -5 -13 -13 -13 z" fill="var(--yellow-400)" stroke="var(--blue-950)" strokeWidth="2" />
          <circle cx="120" cy="15" r="4.5" fill="var(--blue-950)" />
        </g>
      )}
      {/* Integrantes */}
      {figuras.map((tipo, i) => {
        const x = inicio + i * paso
        const g = {
          adulto: { r: 7, h: 30, color: 'var(--blue-500)' },
          mayor: { r: 7, h: 27, color: 'var(--blue-300)' },
          menor: { r: 6, h: 20, color: 'var(--green-500)' },
          bebe: { r: 5, h: 16, color: 'var(--yellow-400)' },
        }[tipo]
        const base = 158
        return (
          <g key={`${tipo}-${i}`} className={s.aparece}>
            <rect x={x - g.r} y={base - g.h + g.r * 2} width={g.r * 2} height={Math.max(4, g.h - g.r * 2)} rx={g.r} fill={g.color} />
            <circle cx={x} cy={base - g.h + g.r - 1} r={g.r} fill={g.color} />
            {tipo === 'mayor' && <line x1={x + g.r + 3} y1={base - 18} x2={x + g.r + 3} y2={base} stroke="var(--blue-700)" strokeWidth="2.5" strokeLinecap="round" />}
          </g>
        )
      })}
      {extra > 0 && (
        <text x="192" y="100" textAnchor="end" fontSize="14" fontWeight="700" fill="var(--blue-700)" fontFamily="var(--font-mono)">
          +{extra}
        </text>
      )}
      {/* Mascotas: círculos pequeños junto a la puerta */}
      {Array.from({ length: Math.min(mascotas, 4) }, (_, i) => (
        <g key={`m-${i}`} className={s.aparece}>
          <rect x={6 + i * 14} y={152} width="12" height="8" rx="4" fill="var(--yellow-700)" />
          <circle cx={16 + i * 14} cy={150} r="4" fill="var(--yellow-700)" />
        </g>
      ))}
      {/* Animales de campo: cerco */}
      {animales && (
        <g className={s.aparece} stroke="var(--green-700)" strokeWidth="3" strokeLinecap="round">
          <line x1="206" y1="140" x2="206" y2="162" />
          <line x1="220" y1="140" x2="220" y2="162" />
          <line x1="234" y1="140" x2="234" y2="162" />
          <line x1="202" y1="146" x2="238" y2="146" />
          <line x1="202" y1="155" x2="238" y2="155" />
        </g>
      )}
    </svg>
  )
}
