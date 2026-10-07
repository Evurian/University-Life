import type { Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { Calendario } from './Calendario.tsx'
import { ModalCrisis } from './ModalCrisis.tsx'
import { PanelAlumno } from './PanelAlumno.tsx'
import { PanelDecision } from './PanelDecision.tsx'
import { ResumenSemana } from './ResumenSemana.tsx'

export function Dashboard({ estado }: { estado: Estado }) {
  const enCrisis = estado.fase === 'crisis'
  return (
    <>
      <div className="dashboard" inert={enCrisis}>
        <header className="cabecera">
          <h1>
            Semana {estado.semana} de {BALANCE.semanasTotales}
          </h1>
          <Calendario estado={estado} />
        </header>
        <PanelAlumno estado={estado} />
        <main className="centro">
          <ResumenSemana estado={estado} />
          <PanelDecision estado={estado} />
        </main>
      </div>
      {enCrisis && <ModalCrisis estado={estado} />}
    </>
  )
}
