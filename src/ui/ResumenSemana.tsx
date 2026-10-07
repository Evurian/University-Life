import { parcialDeSemana, zonaDe, type Estado, type RegistroSemana } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { useJuego } from '../store/juego.ts'
import { CRISIS, DECISIONES_CORTAS, n1, ZONAS } from './textos.ts'

function Registro({ registro, estado }: { registro: RegistroSemana; estado: Estado }) {
  const zona = zonaDe(registro.estres)
  const modificador = BALANCE.zonas[zona].modParcial
  return (
    <li>
      <strong>Semana {registro.semana}.</strong>{' '}
      {registro.perdida === 'colapso' &&
        'Colapsaste por el estrés y perdiste la semana entera: sin horas ni entregas.'}
      {registro.perdida === 'reposo' &&
        `Reposo forzado: la semana se anuló y el estrés bajó ${BALANCE.crisis.alivioReposo} puntos.`}
      {registro.perdida === null &&
        registro.decisiones &&
        registro.decisiones
          .map((d, i) => `${estado.asignaturas[i]?.nombre}: ${DECISIONES_CORTAS[d]}`)
          .join(' · ')}
      {registro.crisis === 'forzar' && ` ${CRISIS.forzar.titulo}: seguiste pese a la crisis.`}{' '}
      Estrés al cierre: {registro.estres} % (zona {ZONAS[zona]}).
      {registro.notas && registro.detalle && (
        <table className="notas">
          <caption>
            Parcial {parcialDeSemana(registro.semana) + 1}, rendido en zona {ZONAS[zona]} (
            {modificador > 0 ? `+${modificador}` : modificador} a la nota)
          </caption>
          <thead>
            <tr>
              <th scope="col">Asignatura</th>
              <th scope="col">Horas del tramo</th>
              <th scope="col">Nota</th>
              <th scope="col">Observación</th>
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
                  <td>{n1(nota)}</td>
                  <td>
                    {!detalle.rendido && 'No rendido: sin regularidad'}
                    {detalle.bloqueo && 'Bloqueo mental: nota a la mitad'}
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
  const resumen = useJuego((s) => s.resumen)
  if (resumen.length === 0) return null
  return (
    <section className="resumen" aria-label="Qué pasó">
      <h2>Qué pasó</h2>
      <ul>
        {resumen.map((registro) => (
          <Registro key={registro.semana} registro={registro} estado={estado} />
        ))}
      </ul>
    </section>
  )
}
