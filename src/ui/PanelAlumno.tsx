import { promedioProvisional, type Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { BarraEstres } from './BarraEstres.tsx'
import { ComoSeJuega } from './ComoSeJuega.tsx'
import { n1 } from './textos.ts'
import { Valor } from './Valor.tsx'

export function PanelAlumno({ estado }: { estado: Estado }) {
  const promedios = estado.asignaturas
    .map(promedioProvisional)
    .filter((p): p is number => p !== null)
  const general = promedios.length ? promedios.reduce((a, b) => a + b, 0) / promedios.length : null

  // El cambio se mide entre cierres de semana, para no mezclarlo con el efecto de un evento.
  // En plena crisis la semana aún no se cerró: se compara con el último cierre.
  const cierres = estado.historial
  const enCrisis = estado.fase === 'crisis'
  const hasta = enCrisis ? estado.estres : cierres.at(-1)?.estres
  const desde = (enCrisis ? cierres.at(-1) : cierres.at(-2))?.estres ?? BALANCE.estresInicial
  const cambio = hasta === undefined ? 0 : hasta - desde

  return (
    <aside className="panel estado" aria-label="Estado del alumno">
      <BarraEstres
        estres={estado.estres}
        cambio={cambio}
        cuando={enCrisis ? 'esta semana' : 'la semana pasada'}
      />
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
        <ComoSeJuega />
      </details>
    </aside>
  )
}
