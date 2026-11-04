import { esMunicipio, MUNICIPIO_PREDETERMINADO, type MunicipioId } from '@muni/design-system'
import { useCallback, useEffect, useState } from 'react'

const CLAVE = 'muni-municipio'

/**
 * Municipio que se está mirando. Se elige en la franja superior y se recuerda en
 * este navegador; `?municipio=curepto` en la URL sirve para compartir un enlace.
 */
function inicial(): MunicipioId {
  const deUrl = new URLSearchParams(window.location.search).get('municipio')
  if (esMunicipio(deUrl)) return deUrl
  try {
    const guardado = window.localStorage.getItem(CLAVE)
    if (esMunicipio(guardado)) return guardado
  } catch {
    // Sin almacenamiento (modo privado): queda el predeterminado.
  }
  return MUNICIPIO_PREDETERMINADO
}

export function useMunicipioElegido(): [MunicipioId, (m: MunicipioId) => void] {
  const [municipio, setEstado] = useState<MunicipioId>(inicial)

  // Los tokens del design system cambian con data-tema en <html>.
  useEffect(() => {
    document.documentElement.dataset.tema = municipio
  }, [municipio])

  const elegir = useCallback((m: MunicipioId) => {
    setEstado(m)
    try {
      window.localStorage.setItem(CLAVE, m)
    } catch {
      // Se usa igual, solo que no se recuerda.
    }
  }, [])

  return [municipio, elegir]
}
