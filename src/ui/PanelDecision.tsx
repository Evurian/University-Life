import { useState } from 'react'
import {
  efectoDecision,
  estresPrevisto,
  notaEstimada,
  parcialDeSemana,
  provocaCrisis,
  zonaDe,
  type Estado,
} from '../core/simulacion.ts'
import { BALANCE, type DecisionId } from '../data/balance.ts'
import { useJuego } from '../store/juego.ts'
import { conSigno, DECISIONES_CORTAS, n1, ZONAS } from './textos.ts'

const DECISIONES = Object.keys(BALANCE.decisiones) as DecisionId[]

export function PanelDecision({ estado }: { estado: Estado }) {
  const decidir = useJuego((s) => s.decidir)
  const [elegidas, setElegidas] = useState<(DecisionId | null)[]>(() =>
    estado.asignaturas.map(() => null),
  )
  const bloqueado = estado.fase !== 'decision'
  const completas = elegidas.filter((d): d is DecisionId => d !== null)
  const lista = completas.length === elegidas.length
  const esParcial = parcialDeSemana(estado.semana) !== -1

  const previsto = estresPrevisto(estado, completas)
  const zonaPrevista = zonaDe(previsto)

  const elegir = (indice: number, decision: DecisionId) =>
    setElegidas((actual) => actual.map((d, i) => (i === indice ? decision : d)))

  return (
    <section aria-label="Decisiones de la semana">
      <h2>¿Qué haces esta semana?</h2>
      {esParcial && (
        <p className="aviso">
          Semana de parcial: no hay entrega y se rinde al cerrar la semana, con el estrés que te
          quede.
        </p>
      )}

      <p className="nota">
        Las horas de estudio suben la nota del próximo parcial (el máximo se alcanza con{' '}
        {BALANCE.nota.horObjetivo} en el tramo). Las entregas mantienen la regularidad. El estrés se
        suma entre todas las asignaturas.
      </p>

      <table className="efectos">
        <caption>Efecto de cada decisión sobre una asignatura, esta semana</caption>
        <thead>
          <tr>
            <th scope="col">Decisión</th>
            <th scope="col">Horas de estudio</th>
            <th scope="col">Entrega</th>
            <th scope="col">Estrés</th>
          </tr>
        </thead>
        <tbody>
          {DECISIONES.map((d) => {
            const efecto = efectoDecision(estado, d)
            return (
              <tr key={d}>
                <th scope="row">{BALANCE.decisiones[d].nombre}</th>
                <td>{efecto.hor ? `+${n1(efecto.hor)}` : '—'}</td>
                <td>{efecto.ent ? `+${efecto.ent}` : '—'}</td>
                <td>{conSigno(efecto.estres)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="fila-decision atajo">
        <span>Todas</span>
        <div className="botones">
          {DECISIONES.map((d) => (
            <button
              key={d}
              type="button"
              disabled={bloqueado}
              onClick={() => setElegidas(estado.asignaturas.map(() => d))}
            >
              {DECISIONES_CORTAS[d]} en todas
            </button>
          ))}
        </div>
      </div>

      {estado.asignaturas.map((a, i) => {
        const elegida = elegidas[i]
        const ahora = notaEstimada(a.horTramo, estado.estres)
        const despues =
          elegida && notaEstimada(a.horTramo + efectoDecision(estado, elegida).hor, previsto)
        return (
          <div key={a.nombre} className="fila-decision" role="group" aria-label={a.nombre}>
            <span>{a.nombre}</span>
            <div className="botones">
              {DECISIONES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={elegidas[i] === d ? 'elegida' : undefined}
                  aria-pressed={elegidas[i] === d}
                  disabled={bloqueado}
                  onClick={() => elegir(i, d)}
                >
                  {DECISIONES_CORTAS[d]}
                </button>
              ))}
            </div>
            <p className="estimacion">
              Nota estimada del próximo parcial: {n1(ahora)}
              {despues !== null && despues !== undefined && (
                <>
                  {' '}
                  → <strong>{n1(despues)}</strong>
                </>
              )}
            </p>
          </div>
        )
      })}

      <p className="nota">
        La estimación supone rendir con el estrés que tendrías al cerrar esta semana; la nota real
        varía hasta ±{BALANCE.nota.ruido}.
      </p>

      <p className="previsto" aria-live="polite">
        Estrés: {estado.estres} % → <strong>{previsto} %</strong> (zona{' '}
        <span className={`zona ${zonaPrevista}`}>{ZONAS[zonaPrevista]}</span>)
        {!lista && ' · faltan asignaturas por decidir'}
      </p>
      {lista && provocaCrisis(estado, completas) && (
        <p className="aviso peligro" role="alert">
          Con estas decisiones el estrés llega a {BALANCE.crisis.umbralDisparo} o más: entrarás en
          crisis.
        </p>
      )}

      <button
        type="button"
        className="principal"
        disabled={bloqueado || !lista}
        onClick={() => decidir(completas)}
      >
        Confirmar semana
      </button>
    </section>
  )
}
