// mulberry32: generador determinista cuyo estado cabe en un entero de 32 bits,
// de modo que se guarda dentro del estado de la partida y es serializable.

/** Devuelve un valor en [0, 1) y el estado siguiente del generador. */
export function siguiente(estado: number): [valor: number, estado: number] {
  const s = (estado + 0x6d2b79f5) | 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s]
}
