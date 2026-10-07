import { parcialDeSemana, zonaDe, type Estado, type RegistroSemana } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { useJuego } from '../store/juego.ts'
import { conSigno, n1, ZONAS } from './textos.ts'

/** Solo merece aviso lo que el termómetro y la tabla no cuentan por sí solos. */
const esNotable = (r: RegistroSemana) => r.perdida !== null || r.crisis !== null || r.notas !== null

function Registro({ registro, estado }: { registro: RegistroSemana; estado: Estado }) {
  const zona = zonaDe(registro.estres)
  return (
    <li>
      <strong>Semana {registro.semana}.</strong>{' '}
      {registro.perdida === 'colapso' && 'Colapsaste por el estrés: semana perdida.'}
      {registro.perdida === 'reposo' &&
        `Reposo forzado: la semana se anuló y el estrés bajó ${BALANCE.crisis.alivioReposo} puntos.`}
      {registro.crisis === 'forzar' && 'Seguiste pese a la crisis.'}
      {registro.notas && registro.detalle && (
        <table className="notas">
          <caption>
            Parcial {parcialDeSemana(registro.semana) + 1} · rendido en zona {ZONAS[zona]} (
            {conSigno(BALANCE.zonas[zona].modParcial)} a la nota)
          </caption>
          <thead>
            <tr>
              <th scope="col">Asignatura</th>
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
                    {n1(detalle.hor)} / {BALANCE.nota.horObjetivo}
                  </td>
                  <td>
                    <strong>{n1(nota)}</strong>
                    {!detalle.rendido && ' · no rendido, sin regularidad'}
                    {detalle.bloqueo && ' · bloqueo mental, nota a la mitad'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </li>
  )
}

export function ResumenSemana({ estado }: { estado: Estado }) {
  const notables = useJuego((s) => s.resumen).filter(esNotable)
  if (notables.length === 0) return null
  return (
    // La clave hace que el aviso vuelva a entrar animado cada semana.
    <section key={estado.semana} className="panel resumen" aria-label="Qué pasó">
      <h2>Qué pasó</h2>
      <ul>
        {notables.map((registro) => (
          <Registro key={registro.semana} registro={registro} estado={estado} />
        ))}
      </ul>
    </section>
  )
}
