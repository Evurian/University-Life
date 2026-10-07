import { zonaDe } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { ZONAS } from './textos.ts'

export function BarraEstres({ estres }: { estres: number }) {
  const zona = zonaDe(estres)
  const { verde, amarilla } = BALANCE.zonas
  return (
    <div className="estres">
      <p className="estres-texto">
        Estrés <strong>{estres} %</strong> · Zona{' '}
        <span className={`zona ${zona}`}>{ZONAS[zona]}</span>
      </p>
      <div
        className="estres-barra"
        role="progressbar"
        aria-label="Estrés"
        aria-valuemin={BALANCE.estresMin}
        aria-valuemax={BALANCE.estresMax}
        aria-valuenow={estres}
        aria-valuetext={`${estres} %, zona ${ZONAS[zona]}`}
      >
        <span className="tramo verde" style={{ width: `${verde.hasta}%` }} />
        <span className="tramo amarilla" style={{ width: `${amarilla.hasta - verde.hasta}%` }} />
        <span className="tramo roja" style={{ width: `${BALANCE.estresMax - amarilla.hasta}%` }} />
        <span className="marca-crisis" style={{ left: `${BALANCE.crisis.umbralDisparo}%` }} />
        <span className="aguja" style={{ left: `${estres}%` }} />
      </div>
      <p className="estres-escala" aria-hidden="true">
        <span>0</span>
        <span style={{ left: `${verde.hasta}%` }}>{verde.hasta}</span>
        <span style={{ left: `${amarilla.hasta}%` }}>{amarilla.hasta}</span>
        <span style={{ right: 0 }}>{BALANCE.estresMax}</span>
      </p>
      <p className="nota">La línea negra marca la crisis: {BALANCE.crisis.umbralDisparo} %.</p>
    </div>
  )
}
