import { parcialDeSemana, zonaDe, type Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { ZONAS } from './textos.ts'

/** Tira de las 16 semanas: las pasadas toman el color de la zona en que cerraron. */
export function Calendario({ estado }: { estado: Estado }) {
  const semanas = Array.from({ length: BALANCE.semanasTotales }, (_, i) => i + 1)
  return (
    <ol className="calendario" aria-label="Calendario del cuatrimestre">
      {semanas.map((semana) => {
        const registro = estado.historial.find((r) => r.semana === semana)
        const parcial = parcialDeSemana(semana)
        const actual = semana === estado.semana
        const zona = registro && zonaDe(registro.estres)
        const tipo =
          parcial !== -1 ? `P${parcial + 1}` : semana === BALANCE.semanasTotales ? 'Fin' : ''
        const descripcion = [
          `Semana ${semana}`,
          parcial !== -1 && `parcial ${parcial + 1}`,
          actual && 'en curso',
          registro?.perdida && `perdida por ${registro.perdida}`,
          registro && zona && `cerró con estrés ${registro.estres} %, zona ${ZONAS[zona]}`,
        ]
          .filter(Boolean)
          .join(', ')

        return (
          <li
            key={semana}
            className={[actual && 'actual', zona, parcial !== -1 && 'parcial']
              .filter(Boolean)
              .join(' ')}
            aria-current={actual ? 'step' : undefined}
            aria-label={descripcion}
            title={descripcion}
          >
            <span className="dia">{semana}</span>
            <span className="tipo">{registro?.perdida ? '✕' : tipo}</span>
          </li>
        )
      })}
    </ol>
  )
}
