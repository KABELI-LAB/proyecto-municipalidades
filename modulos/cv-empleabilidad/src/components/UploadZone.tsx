import { Icon } from '@muni/design-system'
import { useId, useRef, useState, type DragEvent } from 'react'
import s from '../styles/ui.module.css'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
}

/** Zona de carga con el estilo .hds-upload del design system (arrastrar o elegir). */
export function UploadZone({ onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const hintId = useId()

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    const file = e.dataTransfer.files[0]
    if (file && !disabled) onFile(file)
  }

  return (
    <div
      className={`hds-upload ${s.drop} ${over && !disabled ? s.dropOver : ''}`}
      aria-busy={disabled || undefined}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <span className="hds-tile-icon hds-tile-icon--blue">
        <Icon name="file-up" size={26} />
      </span>
      <p className={s.dropTitle}>
        <strong>Elige tu CV</strong>
        <span className={s.soloEscritorio}> o arrástralo aquí</span>
      </p>
      <p id={hintId} className={s.dropHint}>
        PDF o Word (.docx). Máximo 5 MB.
      </p>
      <button
        type="button"
        className="hds-btn hds-btn--primary hds-btn--lg"
        aria-disabled={disabled || undefined}
        onClick={() => !disabled && inputRef.current?.click()}
        aria-describedby={hintId}
      >
        <Icon name="upload" size={22} />
        <span>Subir mi CV</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        hidden
        data-testid="cv-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
