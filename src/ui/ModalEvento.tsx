import { efectoDeOpcion, type Estado } from '../core/simulacion.ts'
import { eventoPorId, type EfectoEvento } from '../data/eventos.ts'
import { useJuego } from '../store/juego.ts'
import { conSigno, n1, textoEvento } from './textos.ts'

/** Efectos de una opción como frases cortas, con el curso afectado por su nombre. */
function describir(efecto: EfectoEvento, curso: string): { texto: string; bueno: boolean }[] {
  const frases: { texto: string; bueno: boolean }[] = []
  if (efecto.estres) {
    frases.push({ texto: `${conSigno(efecto.estres)} estrés`, bueno: efecto.estres < 0 })
  }
  if (efecto.horas) {
    const horas = efecto.horas > 0 ? `+${n1(efecto.horas)}` : `−${n1(-efecto.horas)}`
    frases.push({ texto: `${horas} h en ${curso}`, bueno: efecto.horas > 0 })
  }
  if (efecto.trabajos) {
    frases.push({
      texto: `${conSigno(efecto.trabajos)} trabajo en ${curso}`,
      bueno: efecto.trabajos > 0,
    })
  }
  if (efecto.multHoras !== undefined && efecto.multHoras !== 1) {
    const cambio = Math.round((efecto.multHoras - 1) * 100)
    frases.push({
      texto: `Horas de esta semana ${conSigno(cambio)} %`,
      bueno: cambio > 0,
    })
  }
  return frases
}

interface Props {
  estado: Estado
  /** Solo para volver a mirar un evento ya resuelto. */
  onCerrar?: () => void
}

/** Card del evento de la semana: un dilema con dos opciones y el efecto real de cada una. */
export function ModalEvento({ estado, onCerrar }: Props) {
  const elegir = useJuego((s) => s.elegirEvento)
  const activo = estado.evento
  if (!activo) return null
  const datos = eventoPorId(activo.id)
  const curso = estado.asignaturas[activo.curso]?.nombre ?? ''
  const resuelto = activo.elegida !== null

  return (
    <div className="fondo-modal">
      <div
        className={`modal evento ${datos.tipo}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Evento: ${datos.titulo}`}
      >
        <p className="antetitulo">Semana {estado.semana} · Evento</p>
        <h2>{datos.titulo}</h2>
        <p>{textoEvento(datos.situacion, curso)}</p>

        <ul className="opciones-evento">
          {datos.opciones.map((opcion, i) => {
            const efecto = efectoDeOpcion(estado, i)
            const contenido = (
              <>
                <strong>{textoEvento(opcion.texto, curso)}</strong>
                <span className="efectos">
                  {efecto &&
                    describir(efecto, curso).map((f) => (
                      <span key={f.texto} className={f.bueno ? 'baja' : 'sube'}>
                        {f.texto}
                      </span>
                    ))}
                </span>
              </>
            )
            return (
              <li key={i}>
                {resuelto ? (
                  <div
                    className={`opcion-evento ${activo.elegida === i ? 'elegida' : 'descartada'}`}
                  >
                    {contenido}
                    {activo.elegida === i && <small>Lo que elegiste</small>}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="opcion-evento"
                    autoFocus={i === 0}
                    onClick={() => elegir(i)}
                  >
                    {contenido}
                  </button>
                )}
              </li>
            )
          })}
        </ul>

        {resuelto ? (
          <button type="button" autoFocus onClick={onCerrar}>
            Cerrar
          </button>
        ) : (
          <p className="nota">Elige una opción para planificar la semana.</p>
        )}
      </div>
    </div>
  )
}
