import { resultado, type Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { useJuego } from '../store/juego.ts'
import { FINALES, n1 } from './textos.ts'

export function PantallaFinal({ estado }: { estado: Estado }) {
  const salir = useJuego((s) => s.salir)
  const r = resultado(estado)
  const final = FINALES[r.final]
  const crisis = estado.historial.filter((s) => s.crisis !== null).length
  const perdidas = estado.historial.filter((s) => s.perdida !== null).length

  return (
    <main className="pantalla">
      <p className="nota">Fin del cuatrimestre</p>
      <h1>{final.titulo}</h1>
      <p>{final.texto}</p>

      <p className="ovr">
        <span className="ovr-valor">{Math.round(r.ovr)}</span>
        <span>
          Rendimiento final
          <br />
          <small>Promedio general {n1(r.promedioGeneral)} sobre 20</small>
        </span>
      </p>

      <table className="notas">
        <caption>Resultado por curso</caption>
        <thead>
          <tr>
            <th scope="col">Curso</th>
            {BALANCE.semanasParcial.map((_, i) => (
              <th key={i} scope="col">
                P{i + 1}
              </th>
            ))}
            <th scope="col">Promedio</th>
            <th scope="col">Final</th>
            <th scope="col">Trabajos</th>
            <th scope="col">Resultado</th>
          </tr>
        </thead>
        <tbody>
          {r.asignaturas.map((a, i) => {
            const datos = estado.asignaturas[i]!
            return (
              <tr key={a.nombre}>
                <th scope="row">{a.nombre}</th>
                {BALANCE.semanasParcial.map((_, p) => (
                  <td key={p}>{datos.notas[p] === undefined ? '—' : n1(datos.notas[p])}</td>
                ))}
                <td>{n1(a.promedio)}</td>
                <td>{a.final}</td>
                <td>
                  {datos.ent} / {BALANCE.entregasRegularidad}
                </td>
                <td>{a.aprobada ? 'Aprobado' : a.regular ? 'Desaprobado' : 'Faltaron trabajos'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <p className="nota">
        Semanas jugadas: {estado.historial.length} · Crisis: {crisis} · Semanas perdidas: {perdidas}{' '}
        · Semilla: {estado.semilla}
      </p>
      <p className="nota">
        Un curso se aprueba con final {BALANCE.finalAprobatorio} o más y{' '}
        {BALANCE.entregasRegularidad} trabajos entregados. La beca pide rendimiento{' '}
        {BALANCE.beca.ovrMin}, los {BALANCE.beca.asignaturasRequeridas} cursos aprobados y ningún
        parcial por debajo de {BALANCE.beca.parcialMin}.
      </p>

      <button type="button" className="principal" onClick={salir}>
        Jugar de nuevo
      </button>
    </main>
  )
}
