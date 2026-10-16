import { useId } from 'react'
import { zonaDe } from '../core/simulacion.ts'
import { BALANCE } from '../data/balance.ts'
import { conSigno, ZONAS } from './textos.ts'
import { Valor } from './Valor.tsx'

interface Props {
  estres: number
  /** Cuánto cambió el estrés en el último cierre de semana (o en la semana en curso, en una crisis). */
  cambio?: number
  /** A qué semana se refiere ese cambio. */
  cuando?: string
}

// Geometría del dibujo: el cerebro ocupa de y = 8 (100 % de estrés) a y = 92 (0 %).
const ARRIBA = 8
const ALTO = 84
const y = (estres: number) => ARRIBA + ALTO * (1 - estres / BALANCE.estresMax)

const CONTORNO =
  'M30 80 C12 80 6 64 14 54 C4 44 12 26 28 26 C32 10 52 6 62 16 C74 6 96 12 98 28 ' +
  'C112 32 116 50 106 60 C112 74 100 86 86 82 C80 92 62 92 58 82 C50 90 34 90 30 80 Z'
const SURCOS =
  'M60 17 C55 32 66 44 60 58 C56 68 62 74 58 82 M26 42 C36 37 44 45 39 54 ' +
  'M83 30 C76 40 87 47 80 57 M38 68 C46 62 53 67 49 74 M90 64 C83 67 85 74 78 74 ' +
  'M40 22 C44 28 40 34 46 38 M74 20 C70 26 76 30 72 36'

/** Cerebro que se llena de estrés: el nivel sube con el estrés y toma el color de la zona. */
export function BarraEstres({ estres, cambio = 0, cuando = 'la semana pasada' }: Props) {
  const recorte = useId()
  const zona = zonaDe(estres)
  const { verde, amarilla } = BALANCE.zonas
  const crisis = BALANCE.crisis.umbralDisparo

  return (
    <div className="estres">
      <svg
        className="cerebro"
        viewBox="0 0 150 100"
        role="progressbar"
        aria-label="Estrés"
        aria-valuemin={BALANCE.estresMin}
        aria-valuemax={BALANCE.estresMax}
        aria-valuenow={estres}
        aria-valuetext={`${estres} %, zona ${ZONAS[zona]}; la crisis empieza en ${crisis} %`}
      >
        <clipPath id={recorte}>
          <path d={CONTORNO} />
        </clipPath>
        <g clipPath={`url(#${recorte})`}>
          <rect className="banda verde" x="0" width="120" y={y(verde.hasta)} height={ALTO} />
          <rect
            className="banda amarilla"
            x="0"
            width="120"
            y={y(amarilla.hasta)}
            height={y(verde.hasta) - y(amarilla.hasta)}
          />
          <rect
            className="banda roja"
            x="0"
            width="120"
            y={ARRIBA}
            height={y(amarilla.hasta) - ARRIBA}
          />
          <rect
            className={`nivel ${zona}`}
            x="0"
            width="120"
            y={ARRIBA}
            height={ALTO + 10}
            style={{ transform: `translateY(${y(estres) - ARRIBA}px)` }}
          />
          {/* Límites entre zonas, para que se lean aunque los colores se parezcan. */}
          {[verde.hasta, amarilla.hasta].map((limite) => (
            <line
              key={limite}
              className="limite-zona"
              x1="0"
              x2="120"
              y1={y(limite)}
              y2={y(limite)}
            />
          ))}
        </g>
        <path className="surcos" d={SURCOS} />
        <path className="contorno" d={CONTORNO} />
        <line className="linea-crisis" x1="2" x2="124" y1={y(crisis)} y2={y(crisis)} />
        <text className="etiqueta-crisis" x="60" y={y(crisis) - 3} textAnchor="middle">
          Crisis {crisis} %
        </text>
        {/* Escala 0–100 a la derecha del cerebro. */}
        <line
          className="eje"
          x1="128"
          x2="128"
          y1={y(BALANCE.estresMin)}
          y2={y(BALANCE.estresMax)}
        />
        {[BALANCE.estresMin, verde.hasta, amarilla.hasta, BALANCE.estresMax].map((marca) => (
          <g key={marca}>
            <line className="eje" x1="126" x2="130" y1={y(marca)} y2={y(marca)} />
            <text className="escala" x="133" y={y(marca) + 3.5}>
              {marca}
            </text>
          </g>
        ))}
        <polygon
          className="aguja-escala"
          points={`124,${y(estres)} 119,${y(estres) - 3.5} 119,${y(estres) + 3.5}`}
        />
      </svg>

      <div className="estres-lectura">
        <span className="estres-titulo">Estrés</span>
        <strong>
          <Valor className={`estres-valor zona ${zona}`}>{`${estres} %`}</Valor>
        </strong>
        <span>
          Zona <span className={`zona ${zona}`}>{ZONAS[zona]}</span>
        </span>
        {cambio !== 0 && (
          <span className="estres-cambio">
            {cambio > 0 ? '▲' : '▼'} {conSigno(cambio)} {cuando}
          </span>
        )}
      </div>
    </div>
  )
}
