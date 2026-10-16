import { useState } from 'react'
import type { Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { eventoPorId } from '../data/eventos.ts'
import { Calendario, LeyendaCalendario } from './Calendario.tsx'
import { ModalCrisis } from './ModalCrisis.tsx'
import { ModalEvento } from './ModalEvento.tsx'
import { PanelAlumno } from './PanelAlumno.tsx'
import { PanelDecision } from './PanelDecision.tsx'
import { DetalleSemana, ResumenSemana } from './ResumenSemana.tsx'
import { TIPO_EVENTO } from './textos.ts'

function proximoParcial(semana: number): string {
  const indice = BALANCE.semanasParcial.findIndex((s) => s >= semana)
  if (indice === -1) return 'Ya rendiste todos los parciales'
  const faltan = BALANCE.semanasParcial[indice]! - semana
  if (faltan === 0) return `Esta semana rindes el Parcial ${indice + 1}`
  return `Parcial ${indice + 1} en ${faltan} ${faltan === 1 ? 'semana' : 'semanas'}`
}

export function Dashboard({ estado }: { estado: Estado }) {
  const [vista, setVista] = useState<number | null>(null)
  // Semana cuyo evento, ya resuelto, se está volviendo a mirar.
  const [eventoAbierto, setEventoAbierto] = useState<number | null>(null)
  const enCrisis = estado.fase === 'crisis'
  const eventoPendiente = estado.fase === 'evento'
  const eventoResuelto = estado.evento !== null && estado.evento.elegida !== null
  const mirandoEvento = eventoResuelto && eventoAbierto === estado.semana

  return (
    <>
      <div className="dashboard" inert={enCrisis || eventoPendiente || mirandoEvento}>
        <header className="cabecera">
          <div>
            <h1>
              Semana {estado.semana} de {BALANCE.semanasTotales}
            </h1>
            <p className="proximo">{proximoParcial(estado.semana)}</p>
            {eventoResuelto && (
              <button
                type="button"
                className={`ver-evento ${eventoPorId(estado.evento!.id).tipo}`}
                aria-label={`Ver evento: ${eventoPorId(estado.evento!.id).titulo}`}
                onClick={() => setEventoAbierto(estado.semana)}
              >
                <span className="marca-evento" aria-hidden="true">
                  {TIPO_EVENTO[eventoPorId(estado.evento!.id).tipo].marca}
                </span>
                <span>
                  <small>
                    {TIPO_EVENTO[eventoPorId(estado.evento!.id).tipo].nombre} de esta semana
                  </small>
                  {eventoPorId(estado.evento!.id).titulo}
                </span>
              </button>
            )}
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
      {(eventoPendiente || mirandoEvento) && (
        <ModalEvento estado={estado} onCerrar={() => setEventoAbierto(null)} />
      )}
    </>
  )
}
