import { parcialDeSemana, zonaDe, type Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { DECISIONES_CORTAS, n1, ZONAS } from './textos.ts'

interface Props {
  estado: Estado
  /** Semana pasada cuyo detalle está abierto, si hay alguna. */
  vista: number | null
  onVer(semana: number | null): void
}

/** Tira de las 16 semanas. Las pasadas muestran qué se hizo y se pueden abrir para ver el detalle. */
export function Calendario({ estado, vista, onVer }: Props) {
  const semanas = Array.from({ length: BALANCE.semanasTotales }, (_, i) => i + 1)
  return (
    <ol className="calendario" aria-label="Calendario del cuatrimestre">
      {semanas.map((semana) => {
        const registro = estado.historial.find((r) => r.semana === semana)
        const parcial = parcialDeSemana(semana)
        const actual = semana === estado.semana
        const zona = registro && zonaDe(registro.estres)
        const etiqueta =
          parcial !== -1 ? `★ P${parcial + 1}` : semana === BALANCE.semanasTotales ? 'Fin' : ''
        const promedio =
          registro?.notas && registro.notas.reduce((a, b) => a + b, 0) / registro.notas.length

        const contenido = (
          <>
            <span className="dia">{semana}</span>
            <span className="tipo">{etiqueta}</span>
            <span className="marcas" aria-hidden="true">
              {registro?.perdida && <span className="perdida">✕</span>}
              {!registro?.perdida &&
                registro?.decisiones?.map((d, i) => <i key={i} className={`punto ${d}`} />)}
            </span>
            {promedio !== undefined && promedio !== null && (
              <span className="media">{n1(promedio)}</span>
            )}
          </>
        )
        const clases = [actual && 'actual', zona, parcial !== -1 && 'parcial']
          .filter(Boolean)
          .join(' ')

        if (!registro || !zona) {
          return (
            <li key={semana} className={clases} aria-current={actual ? 'step' : undefined}>
              <div className="casilla">{contenido}</div>
            </li>
          )
        }
        const descripcion = [
          `Semana ${semana}`,
          parcial !== -1 && `parcial ${parcial + 1}`,
          registro.perdida && `perdida por ${registro.perdida}`,
          `cerró con estrés ${registro.estres} %, zona ${ZONAS[zona]}`,
        ]
          .filter(Boolean)
          .join(', ')
        return (
          <li key={semana} className={clases}>
            <button
              type="button"
              className="casilla"
              aria-label={descripcion}
              aria-pressed={vista === semana}
              onClick={() => onVer(vista === semana ? null : semana)}
            >
              {contenido}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function LeyendaCalendario() {
  return (
    <p className="leyenda-calendario">
      {(Object.keys(DECISIONES_CORTAS) as (keyof typeof DECISIONES_CORTAS)[]).map((d) => (
        <span key={d}>
          <i className={`punto ${d}`} aria-hidden="true" /> {DECISIONES_CORTAS[d]}
        </span>
      ))}
      <span>Borde: zona de estrés al cerrar</span>
      <span>Pulsa una semana pasada para ver cómo fue</span>
    </p>
  )
}
