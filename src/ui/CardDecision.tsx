import { useId } from 'react'
import type { Efecto } from '../core/simulacion.ts'
import type { DecisionId } from '../data/balance.ts'
import { conSigno, DECISIONES_CORTAS, INTENCION, n1 } from './textos.ts'

const TRAZOS: Record<DecisionId, string> = {
  // Libro abierto
  intensivo:
    'M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5m0-13c2-1.5 5-2 8-1.5v13c-3-.5-6 0-8 1.5m0-13v13',
  // Hoja con visto bueno
  balanceada: 'M7 3h7l4 4v14H7zM14 3v4h4M9.5 14.5l2 2 3.5-4',
  // Luna
  salud: 'M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z',
}

export function IconoDecision({ decision }: { decision: DecisionId }) {
  return (
    <svg className={`icono ${decision}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={TRAZOS[decision]} />
    </svg>
  )
}

/** Efectos de una acción como etiquetas cortas con unidades. */
export function Efectos({ efecto }: { efecto: Efecto }) {
  return (
    <span className="efectos">
      <span>{efecto.hor ? `+${n1(efecto.hor)} h` : 'Sin estudio'}</span>
      {efecto.ent > 0 && <span>{efecto.ent} trabajo</span>}
      <span className={efecto.estres > 0 ? 'sube' : 'baja'}>{conSigno(efecto.estres)} estrés</span>
    </span>
  )
}

interface Props {
  decision: DecisionId
  efecto: Efecto
  elegida: boolean
  disabled: boolean
  /** La versión grande añade la línea que explica para qué sirve la acción. */
  grande?: boolean
  onElegir(): void
}

/** Una acción posible para un curso: qué es, qué efecto tiene esta semana y si está elegida. */
export function CardDecision({ decision, efecto, elegida, disabled, grande, onElegir }: Props) {
  const detalle = useId()
  return (
    <button
      type="button"
      className={`card-decision ${decision} ${grande ? 'grande' : ''} ${elegida ? 'elegida' : ''}`}
      aria-label={DECISIONES_CORTAS[decision]}
      aria-describedby={detalle}
      aria-pressed={elegida}
      disabled={disabled}
      onClick={onElegir}
    >
      <span className="card-titulo">
        <IconoDecision decision={decision} />
        {DECISIONES_CORTAS[decision]}
        <span className="visto" aria-hidden="true">
          ✓
        </span>
      </span>
      <span id={detalle} className="card-detalle">
        {grande && <span className="intencion">{INTENCION[decision]}</span>}
        <Efectos efecto={efecto} />
      </span>
    </button>
  )
}
