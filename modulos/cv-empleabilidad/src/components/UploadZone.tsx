import { useId, useRef, useState, type DragEvent } from 'react'
import s from '../styles/ui.module.css'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
}

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
      className={`${s.drop} ${over ? s.dropOver : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    >
      <svg className={s.dropIcon} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 16V4m0 0-4 4m4-4 4 4M5 20h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className={s.dropTitle}>Arrastre su CV aquí</p>
      <p id={hintId} className={s.nota}>
        PDF o Word (.docx), hasta 5 MB
      </p>
      <button type="button" className={s.btnPrimary} disabled={disabled} onClick={() => inputRef.current?.click()} aria-describedby={hintId}>
        Seleccionar archivo
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
