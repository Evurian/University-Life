import { describe, expect, it } from 'vitest'
import { BALANCE } from '../data/balance.ts'

describe('BALANCE', () => {
  it('los pesos de los parciales suman 1', () => {
    const suma = BALANCE.pesosParciales.reduce((a, b) => a + b, 0)
    expect(suma).toBeCloseTo(1)
  })

  it('hay un peso por cada parcial', () => {
    expect(BALANCE.pesosParciales).toHaveLength(BALANCE.semanasParcial.length)
  })

  it('las entregas posibles son las semanas con decisión menos las de parcial', () => {
    expect(BALANCE.entregasPosibles).toBe(
      BALANCE.semanasConDecision - BALANCE.semanasParcial.length,
    )
  })

  it('las zonas cubren todo el rango de estrés en orden', () => {
    const { verde, amarilla, roja } = BALANCE.zonas
    expect(verde.hasta).toBeLessThan(amarilla.hasta)
    expect(amarilla.hasta).toBeLessThan(roja.hasta)
    expect(roja.hasta).toBe(BALANCE.estresMax)
  })

  it('la crisis se rearma por debajo del umbral de disparo', () => {
    expect(BALANCE.crisis.umbralRearme).toBeLessThan(BALANCE.crisis.umbralDisparo)
  })

  it('la nota máxima sin modificadores no supera la escala', () => {
    expect(BALANCE.nota.base + BALANCE.nota.rango).toBeLessThanOrEqual(BALANCE.nota.max)
  })

  it('la beca es alcanzable dentro de la escala de OVR', () => {
    expect(BALANCE.ovr.factorPromedio * BALANCE.nota.max).toBe(BALANCE.ovr.max)
    expect(BALANCE.beca.ovrMin).toBeLessThanOrEqual(BALANCE.ovr.max)
  })
})
