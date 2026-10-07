import { useState } from 'react'
import type { Estado } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { useJuego } from '../store/juego.ts'
import { CRISIS } from './textos.ts'

export function ModalCrisis({ estado }: { estado: Estado }) {
  const resolver = useJuego((s) => s.resolver)
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="fondo-modal">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-crisis">
        <h2 id="titulo-crisis">Crisis de estrés</h2>
        <p>
          Tu estrés llegó a {estado.estres} % en la semana {estado.semana}. Tienes que decidir cómo
          seguir antes de continuar.
        </p>

        {confirmando ? (
          <>
            <p className="aviso peligro">
              Si abandonas, la partida termina y no se puede deshacer. ¿Seguro?
            </p>
            <div className="botones">
              <button type="button" autoFocus onClick={() => setConfirmando(false)}>
                Volver
              </button>
              <button type="button" className="peligro" onClick={() => resolver('abandono')}>
                Confirmar abandono
              </button>
            </div>
          </>
        ) : (
          <ul className="opciones-crisis">
            <li>
              <button type="button" autoFocus onClick={() => resolver('reposo')}>
                {CRISIS.reposo.titulo}
              </button>
              <p>{CRISIS.reposo.texto}</p>
            </li>
            <li>
              <button type="button" onClick={() => resolver('forzar')}>
                {CRISIS.forzar.titulo}
              </button>
              <p>{CRISIS.forzar.texto}</p>
            </li>
            <li>
              <button type="button" className="peligro" onClick={() => setConfirmando(true)}>
                {CRISIS.abandono.titulo}
              </button>
              <p>{CRISIS.abandono.texto}</p>
            </li>
          </ul>
        )}
        <p className="nota">
          No habrá otra crisis hasta que el estrés baje de {BALANCE.crisis.umbralRearme}.
        </p>
      </div>
    </div>
  )
}
