import { useState } from 'react'
import {
  efectoDecision,
  esRutina,
  estresPrevisto,
  margenEntregas,
  notaEstimada,
  parcialDeSemana,
  provocaCrisis,
  regularidadDe,
  zonaDe,
  type Asignatura,
  type Estado,
} from '../core/simulacion.ts'
import { BALANCE, type DecisionId } from '../data/balance.ts'
import { useJuego } from '../store/juego.ts'
import { conSigno, DECISIONES_CORTAS, n1, ZONAS } from './textos.ts'
import { Valor } from './Valor.tsx'

const DECISIONES = Object.keys(BALANCE.decisiones) as DecisionId[]
const NECESARIOS = BALANCE.entregasRegularidad

const exigencia = (horObjetivo: number) =>
  horObjetivo > BALANCE.nota.horObjetivo
    ? 'Exigente'
    : horObjetivo < BALANCE.nota.horObjetivo
      ? 'Ligero'
      : 'Medio'

/** Trabajos entregados de un curso frente a los necesarios, y cuánto margen queda. */
function Trabajos({ curso, semana, suma }: { curso: Asignatura; semana: number; suma: number }) {
  const estado = regularidadDe(curso, semana)
  const margen = margenEntregas(curso, semana)
  return (
    <span className="dato trabajos" data-etiqueta="Trabajos">
      <small>Trabajos entregados (necesitas {NECESARIOS})</small>
      <span>
        {curso.ent}
        {suma > 0 && (
          <>
            {' → '}
            <Valor className="nuevo">{curso.ent + suma}</Valor>
          </>
        )}{' '}
        / {NECESARIOS}
      </span>
      <span className="pips" aria-hidden="true">
        {Array.from({ length: NECESARIOS }, (_, i) => (
          <i
            key={i}
            className={i < curso.ent ? 'hecho' : i < curso.ent + suma ? 'previsto' : undefined}
          />
        ))}
      </span>
      {estado === 'asegurada' && <small className="bien">✓ Completos</small>}
      {estado === 'perdida' && <small className="mal">✕ Ya no alcanzas los {NECESARIOS}</small>}
      {estado === 'posible' && margen === 0 && (
        <small className="alerta">⚠ No puedes fallar ninguno más</small>
      )}
      {estado === 'posible' && margen > 0 && (
        <small>
          Puedes saltarte {margen} {margen === 1 ? 'semana' : 'semanas'}
        </small>
      )}
    </span>
  )
}

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
  const rutina = esRutina(estado, completas)
  const previsto = estresPrevisto(estado, completas)
  const zonaPrevista = zonaDe(previsto)
  const costeRutina = `${conSigno(-BALANCE.rutina.alivioEstres)} de estrés, pero ${conSigno(Math.round((BALANCE.rutina.multHor - 1) * 100))} % de horas`

  return (
    <section className="panel" aria-label="Decisiones de la semana">
      <h2>
        <span className={`paso ${lista ? 'hecho' : 'activo'}`}>1</span>
        Elige qué hacer en cada curso
      </h2>
      {esParcial && (
        <p className="aviso">
          Semana de parcial: se rinde al confirmar y no hay trabajo que entregar.
        </p>
      )}

      <ul className="leyenda" aria-label="Efecto de cada decisión esta semana">
        {DECISIONES.map((d) => {
          const efecto = efectoDecision(estado, d)
          return (
            <li key={d}>
              <strong>
                <i className={`punto ${d}`} aria-hidden="true" /> {DECISIONES_CORTAS[d]}
              </strong>
              <span>
                {efecto.hor ? `+${n1(efecto.hor)} h de estudio` : 'sin estudio'}
                {efecto.ent ? ' · entregas el trabajo' : ''} · {conSigno(efecto.estres)} estrés
              </span>
            </li>
          )
        })}
      </ul>

      <div className="tabla-cursos">
        {estado.asignaturas.map((a, i) => {
          const elegida = elegidas[i] ?? null
          const efecto = elegida && efectoDecision(estado, elegida, rutina)
          return (
            <div key={a.nombre} className="curso" role="group" aria-label={a.nombre}>
              <span className="nombre">
                {a.nombre}
                <small>
                  {exigencia(a.horObjetivo)} · {a.horObjetivo} h por parcial
                </small>
                {a.notas.length > 0 && <small>Parciales: {a.notas.map(n1).join(' · ')}</small>}
              </span>
              <span className="dato" data-etiqueta="Nota estimada">
                <small>Nota estimada</small>
                <span>
                  {n1(notaEstimada(a.horTramo, estado.estres, a.horObjetivo))}
                  {efecto && (
                    <>
                      {' → '}
                      <Valor className="nuevo">
                        {n1(notaEstimada(a.horTramo + efecto.hor, previsto, a.horObjetivo))}
                      </Valor>
                    </>
                  )}
                </span>
              </span>
              <Trabajos curso={a} semana={estado.semana} suma={efecto ? efecto.ent : 0} />
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

        <div className="atajo">
          <span className="nombre">
            Atajo
            <small>Rutina: {costeRutina}</small>
          </span>
          <span className="botones">
            {DECISIONES.map((d) => (
              <button
                key={d}
                type="button"
                disabled={bloqueado}
                onClick={() => fijar(estado.asignaturas.map(() => d))}
              >
                {DECISIONES_CORTAS[d]} en todos
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
          {ZONAS[zonaPrevista]}){!lista && ' · faltan cursos por decidir'}
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
      {rutina && (
        <p className="aviso">
          Semana de rutina: la misma decisión en todos te da {costeRutina}. Cambia una para
          evitarlo.
        </p>
      )}
      {lista && !provocaCrisis(estado, completas) && previsto >= BALANCE.crisis.umbralDisparo && (
        <p className="aviso peligro" role="alert">
          Con el estrés en {BALANCE.crisis.umbralDisparo} % o más, cada semana hay un{' '}
          {BALANCE.crisis.probColapso * 100} % de colapsar y perderla entera.
        </p>
      )}
      {lista && provocaCrisis(estado, completas) && (
        <p className="aviso peligro" role="alert">
          Con estas decisiones el estrés llega a {BALANCE.crisis.umbralDisparo} % o más: entrarás en
          crisis.
        </p>
      )}
    </section>
  )
}
