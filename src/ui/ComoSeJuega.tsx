import { BALANCE, type DecisionId } from '../data/balance.ts'
import { IconoDecision } from './CardDecision.tsx'
import { conSigno, DECISIONES_CORTAS, INTENCION } from './textos.ts'

const DECISIONES = Object.keys(BALANCE.decisiones) as DecisionId[]

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
              <IconoDecision decision={d} /> {DECISIONES_CORTAS[d]}
            </strong>
            <span>{INTENCION[d]}</span>
          </li>
        ))}
      </ul>
      <ul className="reglas">
        <li>
          <strong>Para aprobar un curso</strong> necesitas dos cosas: promedio {beca.parcialMin} o
          más sobre {nota.max} en los parciales y {BALANCE.entregasRegularidad} trabajos entregados.
        </li>
        <li>
          <strong>Trabajos:</strong> cada semana que eliges «{DECISIONES_CORTAS.balanceada}» en un
          curso entregas 1 trabajo de ese curso. Hay {BALANCE.entregasPosibles} semanas con trabajo
          (en las de parcial no hay), así que en cada curso puedes saltarte{' '}
          {BALANCE.entregasPosibles - BALANCE.entregasRegularidad}. Sin los{' '}
          {BALANCE.entregasRegularidad} trabajos el curso se desaprueba, tengas la nota que tengas.
        </li>
        <li>
          <strong>El estrés es uno solo</strong> para todos los cursos. Cuanto más alto, peor
          estudias; al llegar a {crisis.umbralDisparo} % entras en crisis.
        </li>
        <li>
          <strong>Eventos:</strong> algunas semanas empiezan con un imprevisto y dos formas de
          afrontarlo. La dificultad decide cuántos son buenos y cuántos malos.
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
