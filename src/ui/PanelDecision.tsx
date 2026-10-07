import { useState } from 'react'
import {
  efectoDecision,
  estresPrevisto,
  notaEstimada,
  parcialDeSemana,
  provocaCrisis,
  regularidadDe,
  zonaDe,
  type Estado,
} from '../core/simulacion.ts'
import { BALANCE, type DecisionId } from '../data/balance.ts'
import { useJuego } from '../store/juego.ts'
import { conSigno, DECISIONES_CORTAS, n1, ZONAS } from './textos.ts'
import { Valor } from './Valor.tsx'

const DECISIONES = Object.keys(BALANCE.decisiones) as DecisionId[]

type Elegidas = (DecisionId | null)[]

export function PanelDecision({ estado }: { estado: Estado }) {
  const decidir = useJuego((s) => s.decidir)
  const vacias: Elegidas = estado.asignaturas.map(() => null)
  // Las elecciones valen solo para la semana en que se hicieron.
  const [seleccion, setSeleccion] = useState({ semana: estado.semana, elegidas: vacias })
  const elegidas = seleccion.semana === estado.semana ? seleccion.elegidas : vacias
  const fijar = (nuevas: Elegidas) => setSeleccion({ semana: estado.semana, elegidas: nuevas })

  const bloqueado = estado.fase !== 'decision'
  const completas = elegidas.filter((d): d is DecisionId => d !== null)
  const lista = completas.length === elegidas.length
  const esParcial = parcialDeSemana(estado.semana) !== -1
  const previsto = estresPrevisto(estado, completas)
  const zonaPrevista = zonaDe(previsto)

  return (
    <section className="panel" aria-label="Decisiones de la semana">
      <h2>
        <span className={`paso ${lista ? 'hecho' : 'activo'}`}>1</span>
        Elige qué hacer en cada asignatura
      </h2>
      {esParcial && (
        <p className="aviso">Semana de parcial: se rinde al confirmar y no hay entrega.</p>
      )}

      <ul className="leyenda" aria-label="Efecto de cada decisión esta semana">
        {DECISIONES.map((d) => {
          const efecto = efectoDecision(estado, d)
          return (
            <li key={d}>
              <strong>{DECISIONES_CORTAS[d]}</strong>
              <span>
                {efecto.hor ? `+${n1(efecto.hor)} h` : 'sin estudio'}
                {efecto.ent ? ' · entrega' : ''} · {conSigno(efecto.estres)} estrés
              </span>
            </li>
          )
        })}
      </ul>

      <div className="tabla-asignaturas">
        <div className="fila encabezado" aria-hidden="true">
          <span>Asignatura</span>
          <span>Nota estimada</span>
          <span>Entregas</span>
          <span>Esta semana</span>
        </div>

        {estado.asignaturas.map((a, i) => {
          const elegida = elegidas[i] ?? null
          const efecto = elegida && efectoDecision(estado, elegida)
          const regularidad = regularidadDe(a, estado.semana)
          return (
            <div key={a.nombre} className="fila" role="group" aria-label={a.nombre}>
              <span className="nombre">
                {a.nombre}
                {a.notas.length > 0 && <small>Parciales: {a.notas.map(n1).join(' · ')}</small>}
              </span>
              <span className="dato" data-etiqueta="Nota estimada">
                {n1(notaEstimada(a.horTramo, estado.estres))}
                {efecto && (
                  <>
                    {' → '}
                    <Valor className="nuevo">
                      {n1(notaEstimada(a.horTramo + efecto.hor, previsto))}
                    </Valor>
                  </>
                )}
              </span>
              <span className="dato" data-etiqueta="Entregas">
                {a.ent} / {BALANCE.entregasRegularidad}
                {efecto && efecto.ent > 0 && (
                  <>
                    {' → '}
                    <Valor className="nuevo">{a.ent + efecto.ent}</Valor>
                  </>
                )}
                {regularidad === 'asegurada' && <small className="bien">✓ regular</small>}
                {regularidad === 'perdida' && <small className="mal">✕ sin regularidad</small>}
              </span>
              <span className="botones">
                {DECISIONES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={elegida === d ? 'elegida' : undefined}
                    aria-pressed={elegida === d}
                    disabled={bloqueado}
                    onClick={() => fijar(elegidas.map((actual, j) => (j === i ? d : actual)))}
                  >
                    {DECISIONES_CORTAS[d]}
                  </button>
                ))}
              </span>
            </div>
          )
        })}

        <div className="fila atajo">
          <span className="nombre">Atajo</span>
          <span className="botones">
            {DECISIONES.map((d) => (
              <button
                key={d}
                type="button"
                disabled={bloqueado}
                onClick={() => fijar(estado.asignaturas.map(() => d))}
              >
                {DECISIONES_CORTAS[d]} en todas
              </button>
            ))}
          </span>
        </div>
      </div>

      <h2>
        <span className={`paso ${lista ? 'activo' : ''}`}>2</span>
        Confirma la semana
      </h2>
      <div className="cierre">
        <p className="previsto" aria-live="polite">
          Estrés: {estado.estres} % →{' '}
          <Valor className={`zona ${zonaPrevista}`}>{`${previsto} %`}</Valor> (zona{' '}
          {ZONAS[zonaPrevista]}){!lista && ' · faltan asignaturas por decidir'}
        </p>
        <button
          type="button"
          className={`principal ${lista && !bloqueado ? 'lista' : ''}`}
          disabled={bloqueado || !lista}
          onClick={() => decidir(completas)}
        >
          Confirmar semana
        </button>
      </div>
      {lista && provocaCrisis(estado, completas) && (
        <p className="aviso peligro" role="alert">
          Con estas decisiones el estrés llega a {BALANCE.crisis.umbralDisparo} % o más: entrarás en
          crisis.
        </p>
      )}
    </section>
  )
}
