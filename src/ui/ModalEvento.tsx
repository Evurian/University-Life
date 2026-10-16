import { useRef, useState } from 'react'
import {
  efectoDeOpcion,
  parcialDeSemana,
  resolverEvento,
  zonaDe,
  type Estado,
} from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { eventoPorId, type EfectoEvento } from '../data/eventos.ts'
import { useJuego } from '../store/juego.ts'
import { conSigno, n1, rendimientoHoras, textoEvento, TIPO_EVENTO, ZONAS } from './textos.ts'
import { useDialogo } from './useDialogo.ts'

interface Frase {
  texto: string
  bueno: boolean
}

/**
 * Efectos de una opción como frases cortas. Con `antes` y `despues` (el estado real tras elegirla,
 * calculado por el núcleo) cada frase dice además qué cambia de verdad en la partida.
 */
function describir(
  efecto: EfectoEvento,
  curso: number,
  antes: Estado,
  despues: Estado | null,
): Frase[] {
  const frases: Frase[] = []
  const a = antes.asignaturas[curso]
  const d = despues?.asignaturas[curso]
  const nombre = a?.nombre ?? ''
  const necesarios = BALANCE.entregasRegularidad

  if (efecto.estres) {
    const contexto = despues ? ` (${antes.estres} → ${despues.estres} %)` : ''
    frases.push({ texto: `${conSigno(efecto.estres)} estrés${contexto}`, bueno: efecto.estres < 0 })
  }
  if (efecto.horas && a) {
    const horas = efecto.horas > 0 ? `+${n1(efecto.horas)}` : `−${n1(-efecto.horas)}`
    let contexto = ''
    if (d && d.horTramo === a.horTramo)
      contexto = ' (no tienes horas en este tramo: no cambia nada)'
    else if (d) contexto = ` (tramo ${n1(a.horTramo)} → ${n1(d.horTramo)} de ${a.horObjetivo})`
    frases.push({ texto: `${horas} h en ${nombre}${contexto}`, bueno: efecto.horas > 0 })
  }
  if (efecto.trabajos && a) {
    let contexto = ''
    if (d && d.ent === a.ent) contexto = ' (no tienes ninguno: no cambia nada)'
    else if (d && efecto.trabajos > 0 && a.ent >= necesarios) {
      contexto = ` (ya tienes ${a.ent}/${necesarios}: no cambia nada para aprobar)`
    } else if (d) contexto = ` (quedarías en ${d.ent}/${necesarios})`
    frases.push({
      texto: `${conSigno(efecto.trabajos)} trabajo en ${nombre}${contexto}`,
      bueno: efecto.trabajos > 0,
    })
  }
  if (efecto.multHoras !== undefined && efecto.multHoras !== 1) {
    frases.push({
      texto: `Esta semana ${rendimientoHoras(efecto.multHoras)}`,
      bueno: efecto.multHoras > 1,
    })
  }
  return frases
}

interface Props {
  estado: Estado
  /** Solo para volver a mirar un evento ya resuelto. */
  onCerrar?: () => void
}

/**
 * Card del evento de la semana: un dilema con dos opciones y el efecto real de cada una.
 * Elegir una opción la marca; la elección se aplica al confirmar.
 */
export function ModalEvento({ estado, onCerrar }: Props) {
  const elegir = useJuego((s) => s.elegirEvento)
  const [seleccion, setSeleccion] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const activo = estado.evento
  const resuelto = activo !== null && activo.elegida !== null
  useDialogo(ref, resuelto ? onCerrar : undefined)
  if (!activo) return null

  const datos = eventoPorId(activo.id)
  const tipo = TIPO_EVENTO[datos.tipo]
  const curso = estado.asignaturas[activo.curso]
  const nombreCurso = curso?.nombre ?? ''
  const tocaCurso = datos.opciones.some(
    (o) => o.efecto.horas !== undefined || o.efecto.trabajos !== undefined,
  )
  const sumaEstres = datos.opciones.some((o) => (o.efecto.estres ?? 0) > 0)
  const zona = zonaDe(estado.estres)

  return (
    <div className="fondo-modal">
      <div
        ref={ref}
        className={`modal evento ${datos.tipo}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Evento: ${datos.titulo}`}
      >
        <p className="antetitulo">
          <span className={`marca-evento ${datos.tipo}`} aria-hidden="true">
            {tipo.marca}
          </span>{' '}
          Semana {estado.semana} · {tipo.nombre}
        </p>
        <h2>{datos.titulo}</h2>
        <p>{textoEvento(datos.situacion, nombreCurso)}</p>

        {!resuelto && (
          <ul className="contexto-evento" aria-label="Tu situación">
            <li>
              Estrés ahora: <strong>{estado.estres} %</strong> (zona{' '}
              <span className={`zona ${zona}`}>{ZONAS[zona]}</span>)
            </li>
            {tocaCurso && (
              <li>
                Curso afectado: <strong>{nombreCurso}</strong>
              </li>
            )}
            {parcialDeSemana(estado.semana) !== -1 && (
              <li>
                <strong>Semana de parcial</strong>
              </li>
            )}
          </ul>
        )}

        <ul className="opciones-evento">
          {datos.opciones.map((opcion, i) => {
            const efecto = efectoDeOpcion(estado, i)
            const despues = resuelto ? null : resolverEvento(estado, i)
            const frases = efecto ? describir(efecto, activo.curso, estado, despues) : []
            const contenido = (
              <>
                <strong>{textoEvento(opcion.texto, nombreCurso)}</strong>
                <span className="efectos">
                  {frases.map((f) => (
                    <span key={f.texto} className={f.bueno ? 'baja' : 'sube'}>
                      {f.texto}
                    </span>
                  ))}
                </span>
              </>
            )
            if (resuelto) {
              const elegida = activo.elegida === i
              return (
                <li key={i}>
                  <div className={`opcion-evento ${elegida ? 'elegida' : 'descartada'}`}>
                    {contenido}
                    <small className="estado-opcion">
                      {elegida ? '✓ Lo que elegiste' : 'Descartada'}
                    </small>
                  </div>
                </li>
              )
            }
            const marcada = seleccion === i
            return (
              <li key={i}>
                <button
                  type="button"
                  className={`opcion-evento ${marcada ? 'elegida' : ''}`}
                  aria-pressed={marcada}
                  onClick={() => setSeleccion(i)}
                >
                  {contenido}
                  {marcada && <small className="estado-opcion">✓ Seleccionada</small>}
                </button>
              </li>
            )
          })}
        </ul>

        {!resuelto && sumaEstres && (
          <p className="nota">
            Un evento no puede hacerte entrar en crisis por sí solo: el estrés que suma se detiene
            en {BALANCE.crisis.umbralDisparo - 1} %.
          </p>
        )}

        <div className="pie-modal">
          {resuelto ? (
            <button type="button" onClick={onCerrar}>
              Cerrar
            </button>
          ) : (
            <>
              <span className="nota">
                {seleccion === null
                  ? 'Elige una opción; podrás cambiarla antes de confirmar.'
                  : 'Puedes cambiar de opción antes de confirmar.'}
              </span>
              <button
                type="button"
                className="principal"
                disabled={seleccion === null}
                onClick={() => seleccion !== null && elegir(seleccion)}
              >
                Confirmar elección
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
