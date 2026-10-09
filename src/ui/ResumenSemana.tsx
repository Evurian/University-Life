import {
  esRutina,
  parcialDeSemana,
  zonaDe,
  type Estado,
  type RegistroSemana,
} from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { useJuego } from '../store/juego.ts'
import { conSigno, DECISIONES_CORTAS, n1, ZONAS } from './textos.ts'

/** Solo merece aviso lo que el indicador de estrés y la tabla no cuentan por sí solos. */
const esNotable = (r: RegistroSemana) => r.perdida !== null || r.crisis !== null || r.notas !== null

function Incidencias({ registro }: { registro: RegistroSemana }) {
  return (
    <>
      {registro.perdida === 'colapso' && 'Colapsaste por el estrés: semana perdida. '}
      {registro.perdida === 'reposo' &&
        `Reposo forzado: la semana se anuló y el estrés bajó ${BALANCE.crisis.alivioReposo} puntos. `}
      {registro.crisis === 'forzar' && 'Seguiste pese a la crisis. '}
      {registro.crisis === 'abandono' && 'Abandonaste la carrera. '}
    </>
  )
}

function TablaParcial({ registro, estado }: { registro: RegistroSemana; estado: Estado }) {
  if (!registro.notas || !registro.detalle) return null
  const zona = zonaDe(registro.estres)
  return (
    <table className="notas">
      <caption>
        Parcial {parcialDeSemana(registro.semana) + 1} · rendido en zona {ZONAS[zona]} (
        {conSigno(BALANCE.zonas[zona].modParcial)} a la nota)
      </caption>
      <thead>
        <tr>
          <th scope="col">Curso</th>
          <th scope="col">Horas</th>
          <th scope="col">Nota</th>
        </tr>
      </thead>
      <tbody>
        {registro.notas.map((nota, i) => {
          const detalle = registro.detalle![i]!
          return (
            <tr key={i}>
              <th scope="row">{estado.asignaturas[i]?.nombre}</th>
              <td>
                {n1(detalle.hor)} / {estado.asignaturas[i]?.horObjetivo}
              </td>
              <td>
                <strong>{n1(nota)}</strong>
                {!detalle.rendido && ' · no rendido, faltaron trabajos'}
                {detalle.bloqueo && ' · bloqueo mental, nota a la mitad'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** Aviso de lo ocurrido al cerrar la semana, cuando hubo algo fuera de lo normal. */
export function ResumenSemana({ estado }: { estado: Estado }) {
  const notables = useJuego((s) => s.resumen).filter(esNotable)
  if (notables.length === 0) return null
  return (
    // La clave hace que el aviso vuelva a entrar animado cada semana.
    <section key={estado.semana} className="panel resumen" aria-label="Qué pasó">
      <h2>Qué pasó</h2>
      <ul>
        {notables.map((registro) => (
          <li key={registro.semana}>
            <strong>Semana {registro.semana}.</strong> <Incidencias registro={registro} />
            <TablaParcial registro={registro} estado={estado} />
          </li>
        ))}
      </ul>
    </section>
  )
}

interface DetalleProps {
  estado: Estado
  semana: number
  onCerrar(): void
}

/** Cómo fue una semana ya jugada: qué se hizo en cada curso y cómo terminó. */
export function DetalleSemana({ estado, semana, onCerrar }: DetalleProps) {
  const registro = estado.historial.find((r) => r.semana === semana)
  if (!registro) return null
  const zona = zonaDe(registro.estres)
  const jugada = registro.perdida === null && registro.decisiones

  return (
    <section key={semana} className="panel resumen detalle" aria-label={`Semana ${semana}`}>
      <h2>
        Semana {semana}
        <button type="button" className="cerrar" onClick={onCerrar}>
          Cerrar
        </button>
      </h2>
      <p>
        <Incidencias registro={registro} />
        Terminaste con estrés {registro.estres} % (zona{' '}
        <span className={`zona ${zona}`}>{ZONAS[zona]}</span>).
      </p>
      {jugada && (
        <ul className="decisiones-semana">
          {jugada.map((d, i) => (
            <li key={i}>
              <i className={`punto ${d}`} aria-hidden="true" />
              <strong>{estado.asignaturas[i]?.nombre}:</strong> {DECISIONES_CORTAS[d]}
            </li>
          ))}
        </ul>
      )}
      {jugada && esRutina(estado, jugada) && (
        <p className="nota">Semana de rutina: la misma decisión en todos los cursos.</p>
      )}
      <TablaParcial registro={registro} estado={estado} />
    </section>
  )
}
