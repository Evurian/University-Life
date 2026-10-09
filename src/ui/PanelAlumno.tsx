import { promedioProvisional, type Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { BarraEstres } from './BarraEstres.tsx'
import { n1 } from './textos.ts'
import { Valor } from './Valor.tsx'

export function PanelAlumno({ estado }: { estado: Estado }) {
  const promedios = estado.asignaturas
    .map(promedioProvisional)
    .filter((p): p is number => p !== null)
  const general = promedios.length ? promedios.reduce((a, b) => a + b, 0) / promedios.length : null

  // En plena crisis la semana aún no se cerró: el último registro es el de la semana anterior.
  const cierres = estado.historial
  const anterior = estado.fase === 'crisis' ? cierres.at(-1) : cierres.at(-2)
  const previo =
    estado.fase === 'crisis' || cierres.length
      ? (anterior?.estres ?? BALANCE.estresInicial)
      : undefined

  return (
    <aside className="panel estado" aria-label="Estado del alumno">
      <BarraEstres estres={estado.estres} previo={previo} />
      {!estado.crisisArmada && (
        <p className="nota">Sin nueva crisis hasta bajar de {BALANCE.crisis.umbralRearme} %.</p>
      )}

      <p className="ovr">
        <Valor className="ovr-valor">
          {general === null ? '—' : Math.round(BALANCE.ovr.factorPromedio * general)}
        </Valor>
        <span>
          Rendimiento
          <br />
          <small>{general === null ? 'Sin parciales aún' : `Promedio ${n1(general)} / 20`}</small>
        </span>
      </p>

      <details className="ayuda">
        <summary>Cómo se juega</summary>
        <ul>
          <li>
            <strong>Horas de estudio</strong> suben la nota del próximo parcial. Los cursos
            exigentes necesitan más horas para la misma nota.
          </li>
          <li>
            <strong>Rutina:</strong> la misma decisión en todos baja un poco el estrés, pero
            estudias peor.
          </li>
          <li>
            <strong>Trabajos:</strong> necesitas entregar {BALANCE.entregasRegularidad} en cada
            curso para poder aprobarlo.
          </li>
          <li>
            <strong>Estrés:</strong> con más estrés estudias peor; al llegar a{' '}
            {BALANCE.crisis.umbralDisparo} % entras en crisis.
          </li>
          <li>
            Apruebas un curso con promedio {BALANCE.beca.parcialMin} o más sobre {BALANCE.nota.max}.
          </li>
        </ul>
      </details>
    </aside>
  )
}
