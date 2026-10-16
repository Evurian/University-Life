import { useEffect, useRef, type RefObject } from 'react'

const ENFOCABLES =
  'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'

/**
 * Comportamiento de diálogo modal: lleva el foco dentro, lo mantiene atrapado con Tab,
 * cierra con Escape si se permite y, al desmontarse, devuelve el foco a donde estaba.
 */
export function useDialogo(ref: RefObject<HTMLElement | null>, alEscapar?: () => void) {
  // La función de Escape puede cambiar entre renders sin reiniciar el diálogo.
  const escapar = useRef(alEscapar)
  useEffect(() => {
    escapar.current = alEscapar
  })

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return
    const previo = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const enfocables = () => [...dialogo.querySelectorAll<HTMLElement>(ENFOCABLES)]
    if (!dialogo.contains(document.activeElement)) enfocables()[0]?.focus()

    const alTeclear = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape' && escapar.current) {
        ev.preventDefault()
        escapar.current()
        return
      }
      if (ev.key !== 'Tab') return
      const lista = enfocables()
      const primero = lista[0]
      const ultimo = lista.at(-1)
      if (!primero || !ultimo) return
      if (ev.shiftKey && document.activeElement === primero) {
        ev.preventDefault()
        ultimo.focus()
      } else if (!ev.shiftKey && document.activeElement === ultimo) {
        ev.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      if (previo?.isConnected) previo.focus()
    }
  }, [ref])
}
