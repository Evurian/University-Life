import { parcialDeSemana, zonaDe, type Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { n1, ZONAS } from './textos.ts'

export function ListaSemanas({ estado }: { estado: Estado }) {
  const semanas = Array.from({ length: BALANCE.semanasTotales }, (_, i) => i + 1)
  return (
    <aside className="panel" aria-label="Calendario">
      <h2>Calendario</h2>
      <ol className="semanas">
        {semanas.map((semana) => {
          const registro = estado.historial.find((r) => r.semana === semana)
          const parcial = parcialDeSemana(semana)
          const actual = semana === estado.semana
          const tipo =
            parcial !== -1
              ? `Parcial ${parcial + 1}`
              : semana === BALANCE.semanasTotales
                ? 'Cierre'
                : 'Cursada'
          return (
            <li
              key={semana}
              className={[actual && 'actual', registro && 'pasada', parcial !== -1 && 'parcial']
                .filter(Boolean)
                .join(' ')}
              aria-current={actual ? 'step' : undefined}
            >
              <span className="semana-num">{String(semana).padStart(2, '0')}</span>
              <span className="semana-tipo">
                {parcial !== -1 && <span aria-hidden="true">★ </span>}
                {tipo}
                {actual && ' · ahora'}
              </span>
              <span className="semana-dato">
                {registro?.perdida === 'colapso' && 'Colapso · '}
                {registro?.perdida === 'reposo' && 'Reposo · '}
                {registro?.notas && `${registro.notas.map(n1).join(' · ')} · `}
                {registro && `${registro.estres} % ${ZONAS[zonaDe(registro.estres)]}`}
              </span>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
