import { useState } from 'react'

interface Props {
  children: string | number
  className?: string
}

/** Muestra un valor y lo resalta un instante cada vez que cambia. */
export function Valor({ children, className = '' }: Props) {
  const [visto, setVisto] = useState({ valor: children, cambios: 0 })
  if (visto.valor !== children) setVisto({ valor: children, cambios: visto.cambios + 1 })

  // La clave reinicia la animación en cada cambio; el primer render no se resalta.
  return (
    <span key={visto.cambios} className={`${className} ${visto.cambios ? 'destello' : ''}`.trim()}>
      {children}
    </span>
  )
}
