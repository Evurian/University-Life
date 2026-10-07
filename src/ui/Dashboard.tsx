import type { Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { ListaSemanas } from './ListaSemanas.tsx'
import { ModalCrisis } from './ModalCrisis.tsx'
import { PanelAlumno } from './PanelAlumno.tsx'
import { PanelDecision } from './PanelDecision.tsx'
import { ResumenSemana } from './ResumenSemana.tsx'

export function Dashboard({ estado }: { estado: Estado }) {
  const enCrisis = estado.fase === 'crisis'
  return (
    <>
      <div className="dashboard" inert={enCrisis}>
        <PanelAlumno estado={estado} />
        <main className="panel">
          <h1>
            Semana {estado.semana} de {BALANCE.semanasTotales}
          </h1>
          <ResumenSemana estado={estado} />
          {/* La clave reinicia las decisiones elegidas al cambiar de semana. */}
          <PanelDecision key={estado.semana} estado={estado} />
        </main>
        <ListaSemanas estado={estado} />
      </div>
      {enCrisis && <ModalCrisis estado={estado} />}
    </>
  )
}
