import { BALANCE, type DecisionId } from '../data/balance.ts'
import { conSigno, DECISIONES_CORTAS } from './textos.ts'

const DECISIONES = Object.keys(BALANCE.decisiones) as DecisionId[]

const PARA_QUE: Record<DecisionId, string> = {
  intensivo: 'Muchas horas de estudio para subir la nota, a costa de bastante estrés.',
  balanceada: 'Entregas el trabajo de la semana y estudias un poco, con algo de estrés.',
  salud: 'No estudias ni entregas, pero el estrés baja.',
}

/** Reglas del juego en corto. Se muestra antes de empezar y queda a mano durante la partida. */
export function ComoSeJuega() {
  const { rutina, crisis, beca, nota } = BALANCE
  return (
    <div className="como-se-juega">
      <p>
        Cada semana eliges, curso por curso, una de estas tres opciones. Hay parciales en las
        semanas {BALANCE.semanasParcial.join(', ')}.
      </p>
      <ul className="leyenda">
        {DECISIONES.map((d) => (
          <li key={d}>
            <strong>
              <i className={`punto ${d}`} aria-hidden="true" /> {DECISIONES_CORTAS[d]}
            </strong>
            <span>{PARA_QUE[d]}</span>
          </li>
        ))}
      </ul>
      <ul className="reglas">
        <li>
          <strong>Para aprobar un curso</strong> necesitas promedio {beca.parcialMin} o más sobre{' '}
          {nota.max} y {BALANCE.entregasRegularidad} trabajos entregados.
        </li>
        <li>
          <strong>El estrés es uno solo</strong> para todos los cursos. Cuanto más alto, peor
          estudias; al llegar a {crisis.umbralDisparo} % entras en crisis.
        </li>
        <li>
          <strong>Cada curso exige distinto:</strong> los exigentes necesitan más horas para la
          misma nota.
        </li>
        <li>
          <strong>Rutina:</strong> elegir lo mismo en todos da {conSigno(-rutina.alivioEstres)} de
          estrés, pero {conSigno(Math.round((rutina.multHor - 1) * 100))} % de horas.
        </li>
      </ul>
    </div>
  )
}
