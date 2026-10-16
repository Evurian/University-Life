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
  type Efecto,
  type Estado,
} from '../core/simulacion.ts'
import { BALANCE, type DecisionId } from '../data/balance.ts'
import { eventoPorId } from '../data/eventos.ts'
import { useJuego } from '../store/juego.ts'
import { CardDecision } from './CardDecision.tsx'
import { conSigno, DECISIONES_CORTAS, exigencia, n1, rendimientoHoras, ZONAS } from './textos.ts'
import { Valor } from './Valor.tsx'

const DECISIONES = Object.keys(BALANCE.decisiones) as DecisionId[]
const NECESARIOS = BALANCE.entregasRegularidad

type Elegidas = (DecisionId | null)[]
type Vista = 'todos' | 'uno'

// En pantallas estrechas no caben todos los cursos con sus cards: se empieza de uno en uno.
const vistaInicial = (): Vista =>
  typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 700px)').matches
    ? 'uno'
    : 'todos'

/** Nota estimada de un curso. Sin horas en el tramo no hay nada que estimar todavía. */
function NotaEstimada({
  curso,
  estado,
  efecto,
  previsto,
}: {
  curso: Asignatura
  estado: Estado
  efecto: Efecto | null
  previsto: number
}) {
  const ahora =
    curso.horTramo > 0 ? n1(notaEstimada(curso.horTramo, estado.estres, curso.horObjetivo)) : '—'
  const sumaHoras = efecto !== null && efecto.hor > 0
  return (
    <div className="metrica">
      <span className="metrica-etiqueta">Nota estimada</span>
      <span className="metrica-valor">
        {ahora}
        {sumaHoras && (
          <>
            {' → '}
            <Valor className="nuevo">
              {n1(notaEstimada(curso.horTramo + efecto.hor, previsto, curso.horObjetivo))}
            </Valor>
          </>
        )}
      </span>
      {curso.horTramo === 0 && !sumaHoras && <small>Sin horas en este tramo</small>}
    </div>
  )
}

/** Trabajos entregados de un curso frente a los necesarios, y cuánto margen queda. */
function Trabajos({ curso, semana, suma }: { curso: Asignatura; semana: number; suma: number }) {
  const estado = regularidadDe(curso, semana)
  const margen = margenEntregas(curso, semana)
  return (
    <div className="metrica trabajos">
      <span className="metrica-etiqueta">Trabajos (necesitas {NECESARIOS})</span>
      <span className="metrica-valor">
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
    </div>
  )
}

interface CursoProps {
  estado: Estado
  curso: Asignatura
  elegida: DecisionId | null
  /** Efecto de la decisión elegida, ya con la rutina aplicada si corresponde. */
  efecto: Efecto | null
  previsto: number
  bloqueado: boolean
  grande?: boolean
  onElegir(decision: DecisionId): void
}

/** Un curso: las tres acciones posibles esta semana, con sus datos al lado. */
function Curso({
  estado,
  curso,
  elegida,
  efecto,
  previsto,
  bloqueado,
  grande,
  onElegir,
}: CursoProps) {
  return (
    <div className={`curso ${grande ? 'grande' : ''}`} role="group" aria-label={curso.nombre}>
      <div className="curso-datos">
        <span className="nombre">
          {curso.nombre}
          <small>
            {exigencia(curso.horObjetivo)} · {curso.horObjetivo} h por parcial
          </small>
          {curso.notas.length > 0 && <small>Parciales: {curso.notas.map(n1).join(' · ')}</small>}
        </span>
        <div className="metricas">
          <NotaEstimada curso={curso} estado={estado} efecto={efecto} previsto={previsto} />
          <Trabajos curso={curso} semana={estado.semana} suma={efecto ? efecto.ent : 0} />
        </div>
      </div>
      <div className="cards">
        {DECISIONES.map((d) => (
          <CardDecision
            key={d}
            decision={d}
            efecto={efectoDecision(estado, d)}
            elegida={elegida === d}
            disabled={bloqueado}
            grande={grande}
            onElegir={() => onElegir(d)}
          />
        ))}
      </div>
    </div>
  )
}

export function PanelDecision({ estado }: { estado: Estado }) {
  const decidir = useJuego((s) => s.decidir)
  const [vista, setVista] = useState<Vista>(vistaInicial)
  const vacias: Elegidas = estado.asignaturas.map(() => null)
  // Las elecciones y el curso abierto valen solo para la semana en que se hicieron.
  const [seleccion, setSeleccion] = useState({ semana: estado.semana, elegidas: vacias, curso: 0 })
  const vigente = seleccion.semana === estado.semana
  const elegidas = vigente ? seleccion.elegidas : vacias
  const abierto = vigente ? seleccion.curso : 0
  const fijar = (nuevas: Elegidas, curso = abierto) =>
    setSeleccion({ semana: estado.semana, elegidas: nuevas, curso })

  const bloqueado = estado.fase !== 'decision'
  const completas = elegidas.filter((d): d is DecisionId => d !== null)
  const lista = completas.length === elegidas.length
  const faltan = elegidas.length - completas.length
  const esParcial = parcialDeSemana(estado.semana) !== -1
  const rutina = esRutina(estado, completas)
  const previsto = estresPrevisto(estado, completas)
  const zonaPrevista = zonaDe(previsto)
  const costeRutina = `${conSigno(-BALANCE.rutina.alivioEstres)} de estrés, pero ${conSigno(Math.round((BALANCE.rutina.multHor - 1) * 100))} % de horas de estudio`
  const evento = estado.evento && eventoPorId(estado.evento.id)

  const curso = (i: number, grande = false) => {
    const a = estado.asignaturas[i]!
    const elegida = elegidas[i] ?? null
    return (
      <Curso
        key={a.nombre}
        estado={estado}
        curso={a}
        elegida={elegida}
        efecto={elegida && efectoDecision(estado, elegida, rutina)}
        previsto={previsto}
        bloqueado={bloqueado}
        grande={grande}
        onElegir={(d) => fijar(elegidas.map((actual, j) => (j === i ? d : actual)))}
      />
    )
  }
  const ultimo = estado.asignaturas.length - 1

  return (
    <section className="panel panel-decision" aria-label="Decisiones de la semana">
      <div className="encabezado-panel">
        <h2>
          <span className={`paso ${lista ? 'hecho' : 'activo'}`}>1</span>
          Elige qué hacer en cada curso
        </h2>
        <div className="selector-vista" role="group" aria-label="Vista de los cursos">
          {(['todos', 'uno'] as const).map((v) => (
            <button key={v} type="button" aria-pressed={vista === v} onClick={() => setVista(v)}>
              {v === 'todos' ? 'Todos los cursos' : 'Uno a uno'}
            </button>
          ))}
        </div>
      </div>

      {esParcial && (
        <p className="aviso">
          Semana de parcial: se rinde al confirmar y no hay trabajo que entregar.
        </p>
      )}
      {estado.modificadores.multHoras !== 1 && (
        <p className="aviso">
          Por el evento «{evento?.titulo}», esta semana{' '}
          {rendimientoHoras(estado.modificadores.multHoras)}.
        </p>
      )}

      <div className="atajo">
        <div>
          <strong>Atajo: la misma acción en todos los cursos</strong>
          <p>
            Elegir lo mismo en todos —con estos botones o a mano— hace la semana de rutina:{' '}
            {costeRutina}.
          </p>
        </div>
        <div className="botones">
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
        </div>
      </div>

      {vista === 'todos' ? (
        <div className="lista-cursos">{estado.asignaturas.map((_, i) => curso(i))}</div>
      ) : (
        <div className="uno-a-uno">
          <ol className="pasos-cursos" aria-label="Cursos">
            {estado.asignaturas.map((a, i) => (
              <li key={a.nombre}>
                <button
                  type="button"
                  className={elegidas[i] ? 'decidido' : undefined}
                  aria-label={`Ir a ${a.nombre}`}
                  aria-current={i === abierto ? 'step' : undefined}
                  onClick={() => fijar(elegidas, i)}
                >
                  {a.nombre}
                  <small>{elegidas[i] ? DECISIONES_CORTAS[elegidas[i]] : 'Sin decidir'}</small>
                </button>
              </li>
            ))}
          </ol>
          {curso(abierto, true)}
          <div className="navegacion-cursos">
            <button
              type="button"
              disabled={abierto === 0}
              onClick={() => fijar(elegidas, abierto - 1)}
            >
              ← Anterior
            </button>
            <span>
              Curso {abierto + 1} de {estado.asignaturas.length}
            </span>
            <button
              type="button"
              className={elegidas[abierto] && abierto < ultimo ? 'sugerido' : undefined}
              disabled={abierto === ultimo}
              onClick={() => fijar(elegidas, abierto + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Barra fija abajo: el resultado previsto se ve mientras se decide. */}
      <div className="barra-confirmar">
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
            Con estas decisiones el estrés llega a {BALANCE.crisis.umbralDisparo} % o más: entrarás
            en crisis.
          </p>
        )}
        <div className="cierre">
          <h2>
            <span className={`paso ${lista ? 'activo' : ''}`}>2</span>
            Confirma la semana
          </h2>
          <p className="previsto" aria-live="polite">
            Estrés: {estado.estres} % →{' '}
            <Valor className={`zona ${zonaPrevista}`}>{`${previsto} %`}</Valor> (zona{' '}
            {ZONAS[zonaPrevista]}){!lista && <small> · faltan cursos por decidir ({faltan})</small>}
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
      </div>
    </section>
  )
}
