// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { crearPartida } from '../core/simulacion.ts'
import { NOMBRES_ASIGNATURAS, useJuego } from '../store/juego.ts'
import { App } from '../ui/App.tsx'

const clic = (nombre: string | RegExp) =>
  fireEvent.click(screen.getByRole('button', { name: nombre }))
const titulo = () => screen.getByRole('heading', { level: 1 }).textContent
const confirmar = () => screen.getByRole('button', { name: 'Confirmar semana' })

/** Deja la partida a una semana balanceada de la crisis. */
function alBordeDeLaCrisis() {
  useJuego.setState({ estado: { ...crearPartida(1, NOMBRES_ASIGNATURAS), estres: 79 } })
  render(<App />)
  clic('Balanceada en todas')
}

beforeEach(() => useJuego.setState({ estado: null, resumen: [] }))
afterEach(cleanup)

describe('interfaz', () => {
  it('permite jugar una partida completa hasta la pantalla final', () => {
    render(<App />)
    clic('Empezar')
    expect(titulo()).toBe('Semana 1 de 16')

    let pasos = 0
    while (!screen.queryByText(/Fin del cuatrimestre/)) {
      if (screen.queryByRole('dialog')) clic('Reposo forzado')
      else {
        clic('Balanceada en todas')
        fireEvent.click(confirmar())
      }
      expect(++pasos).toBeLessThan(40)
    }

    expect(screen.getByText(/Semilla: \d+/)).toBeTruthy()
    expect(screen.getAllByRole('row')).toHaveLength(1 + 4)
    clic('Jugar de nuevo')
    expect(titulo()).toBe('UniversityLife')
  })

  it('respeta la cantidad de asignaturas elegida al empezar', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: /^2/ }))
    clic('Empezar')
    expect(useJuego.getState().estado?.asignaturas).toHaveLength(2)
    expect(screen.queryByRole('group', { name: 'Física' })).toBeNull()
  })

  it('no deja confirmar hasta decidir todas las asignaturas', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    expect(confirmar()).toHaveProperty('disabled', true)

    for (const nombre of NOMBRES_ASIGNATURAS.slice(0, 3)) {
      const fila = screen.getByRole('group', { name: nombre })
      fireEvent.click(within(fila).getByRole('button', { name: 'Intensivo' }))
    }
    expect(confirmar()).toHaveProperty('disabled', true)
    expect(screen.getByText(/faltan asignaturas por decidir/)).toBeTruthy()

    const ultima = screen.getByRole('group', { name: 'Redacción' })
    fireEvent.click(within(ultima).getByRole('button', { name: 'Salud' }))
    expect(confirmar()).toHaveProperty('disabled', false)
    // 20 + 5 + 5 + 5 − 6
    expect(screen.getByText(/Estrés: 20 % →/).textContent).toContain('29 %')
  })

  it('muestra cómo cambia la nota estimada al elegir una decisión', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    const fila = screen.getByRole('group', { name: 'Cálculo' })
    expect(fila.textContent).toContain('Nota estimada del próximo parcial: 5.0')
    fireEvent.click(within(fila).getByRole('button', { name: 'Intensivo' }))
    // 13.2 h en zona verde: 4 + 16 · (13.2 / 40)^0.7 + 1
    expect(fila.textContent).toContain('→ 12.4')
    fireEvent.click(within(fila).getByRole('button', { name: 'Salud' }))
    expect(fila.textContent).toContain('→ 5.0')
  })

  it('un doble clic en confirmar avanza una sola semana', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    clic('Salud en todas')
    fireEvent.click(confirmar())
    fireEvent.click(confirmar())
    expect(titulo()).toBe('Semana 2 de 16')
    expect(useJuego.getState().estado?.historial).toHaveLength(1)
  })

  it('muestra qué pasó tras cerrar la semana', () => {
    useJuego.getState().nueva(4, 1)
    render(<App />)
    clic('Balanceada en todas')
    fireEvent.click(confirmar())
    const resumen = screen.getByRole('region', { name: 'Qué pasó' })
    expect(resumen.textContent).toContain('Semana 1.')
    expect(resumen.textContent).toContain('Cálculo: Balanceada')
    expect(resumen.textContent).toContain('28 %')
  })

  it('avisa antes de confirmar una semana que provoca crisis', () => {
    alBordeDeLaCrisis()
    expect(screen.getByRole('alert').textContent).toContain('entrarás en crisis')
  })

  it('la crisis abre un modal que bloquea las decisiones', () => {
    alBordeDeLaCrisis()
    fireEvent.click(confirmar())

    expect(screen.getByRole('dialog', { name: 'Crisis de estrés' })).toBeTruthy()
    expect(titulo()).toBe('Semana 1 de 16')
    expect(confirmar()).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Salud en todas' })).toHaveProperty('disabled', true)

    clic('Forzar la cursada')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(useJuego.getState().estado?.historial[0]?.crisis).toBe('forzar')
  })

  it('el reposo anula la semana y lo explica en el resumen', () => {
    alBordeDeLaCrisis()
    fireEvent.click(confirmar())
    clic('Reposo forzado')
    expect(titulo()).toBe('Semana 2 de 16')
    expect(screen.getByRole('region', { name: 'Qué pasó' }).textContent).toContain(
      'la semana se anuló',
    )
    expect(useJuego.getState().estado?.asignaturas.every((a) => a.ent === 0)).toBe(true)
  })

  it('abandonar pide confirmación antes de terminar la partida', () => {
    alBordeDeLaCrisis()
    fireEvent.click(confirmar())

    clic('Abandonar la carrera')
    expect(useJuego.getState().estado?.fase).toBe('crisis')
    clic('Volver')
    expect(screen.getByRole('button', { name: 'Reposo forzado' })).toBeTruthy()

    clic('Abandonar la carrera')
    clic('Confirmar abandono')
    expect(titulo()).toBe('Abandono')
  })
})
