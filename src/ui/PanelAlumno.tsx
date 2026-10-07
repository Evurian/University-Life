import {
  notaEstimada,
  promedioProvisional,
  regularidadDe,
  type Estado,
} from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { BarraEstres } from './BarraEstres.tsx'
import { n1, REGULARIDAD } from './textos.ts'

export function PanelAlumno({ estado }: { estado: Estado }) {
  const promedios = estado.asignaturas
    .map(promedioProvisional)
    .filter((p): p is number => p !== null)
  const general = promedios.length ? promedios.reduce((a, b) => a + b, 0) / promedios.length : null

  return (
    <aside className="panel" aria-label="Estado del alumno">
      <h2>Tu cuatrimestre</h2>
      <p className="ovr">
        <span className="ovr-valor">
          {general === null ? '—' : Math.round(BALANCE.ovr.factorPromedio * general)}
        </span>
        <span>
          OVR provisional
          <br />
          <small>
            {general === null
              ? 'Aún no rendiste ningún parcial'
              : `Promedio ${n1(general)} en los parciales rendidos`}
          </small>
        </span>
      </p>

      <BarraEstres estres={estado.estres} />
      {!estado.crisisArmada && (
        <p className="nota">
          Ya tuviste una crisis: no habrá otra hasta que el estrés baje de{' '}
          {BALANCE.crisis.umbralRearme}.
        </p>
      )}

      <h3>Asignaturas</h3>
      <ul className="asignaturas">
        {estado.asignaturas.map((a) => {
          const regularidad = regularidadDe(a, estado.semana)
          return (
            <li key={a.nombre}>
              <strong>{a.nombre}</strong>
              <dl>
                <dt>Horas del tramo</dt>
                <dd>
                  {n1(a.horTramo)} / {BALANCE.nota.horObjetivo}
                </dd>
                <dt>Nota estimada</dt>
                <dd>{n1(notaEstimada(a.horTramo, estado.estres))}</dd>
                <dt>Entregas</dt>
                <dd>
                  {a.ent} / {BALANCE.entregasRegularidad} necesarias
                </dd>
                <dt>Parciales</dt>
                <dd>
                  {BALANCE.semanasParcial
                    .map((_, i) => (a.notas[i] === undefined ? '—' : n1(a.notas[i])))
                    .join(' · ')}
                </dd>
              </dl>
              <span className={`etiqueta ${regularidad}`}>{REGULARIDAD[regularidad]}</span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
