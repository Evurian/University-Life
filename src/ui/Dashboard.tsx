import { useState } from 'react'
import type { Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { Calendario, LeyendaCalendario } from './Calendario.tsx'
import { ModalCrisis } from './ModalCrisis.tsx'
import { PanelAlumno } from './PanelAlumno.tsx'
import { PanelDecision } from './PanelDecision.tsx'
import { DetalleSemana, ResumenSemana } from './ResumenSemana.tsx'

function proximoParcial(semana: number): string {
  const indice = BALANCE.semanasParcial.findIndex((s) => s >= semana)
  if (indice === -1) return 'Ya rendiste todos los parciales'
  const faltan = BALANCE.semanasParcial[indice]! - semana
  if (faltan === 0) return `Esta semana rindes el Parcial ${indice + 1}`
  return `Parcial ${indice + 1} en ${faltan} ${faltan === 1 ? 'semana' : 'semanas'}`
}

export function Dashboard({ estado }: { estado: Estado }) {
  const [vista, setVista] = useState<number | null>(null)
  const enCrisis = estado.fase === 'crisis'
  return (
    <>
      <div className="dashboard" inert={enCrisis}>
        <header className="cabecera">
          <div>
            <h1>
              Semana {estado.semana} de {BALANCE.semanasTotales}
            </h1>
            <p className="proximo">{proximoParcial(estado.semana)}</p>
          </div>
          <div>
            <Calendario estado={estado} vista={vista} onVer={setVista} />
            <LeyendaCalendario />
          </div>
        </header>
        <PanelAlumno estado={estado} />
        <main className="centro">
          {vista !== null && (
            <DetalleSemana estado={estado} semana={vista} onCerrar={() => setVista(null)} />
          )}
          <ResumenSemana estado={estado} />
          <PanelDecision estado={estado} />
        </main>
      </div>
      {enCrisis && <ModalCrisis estado={estado} />}
    </>
  )
}
