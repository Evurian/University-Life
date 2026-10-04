# UniversityLife — Reglas del MVP

Especificación de la Fase 0. Los tests de `src/core` se escriben contra este documento y los números viven en `src/data/balance.ts`. Si cambia una fórmula, se actualizan los dos.

Estado de cada regla: **Cerrada** (decidida), **Supuesto** (valor por defecto pendiente de confirmar) o **A calibrar** (se ajusta en la Fase 1 con el bot de balance).

## Cómo se gana y cómo se pierde

El jugador cursa un cuatrimestre de 16 semanas con hasta 4 asignaturas. Cada semana elige, para cada asignatura, una de tres decisiones. Las decisiones mueven tres recursos: horas de estudio (HOR) y entregas (ENT), que son propias de cada asignatura, y el estrés, que es uno solo para el alumno. Las HOR suben la nota de los parciales, las ENT mantienen la regularidad y el estrés penaliza todo si se descontrola.

- **Se gana** aprobando todas las asignaturas; el mejor resultado es la beca.
- **Se pierde** desaprobando todas las asignaturas o abandonando en una crisis.

## 1. Alcance

| # | Regla | Valor | Estado |
|---|---|---|---|
| 1 | Duración de una partida | Un cuatrimestre | Cerrada |
| 2 | Asignaturas | Varias, máximo 4 | Cerrada |
| 2a | Cantidad por partida | El jugador elige entre 2 y 4 al empezar; por defecto 4 | Cerrada |
| 2b | Diferencias entre asignaturas | Solo el nombre; todas usan las mismas fórmulas | Cerrada |
| 3 | Finanzas como recurso | No | Cerrada |
| 4 | Eventos aleatorios | No | Cerrada |
| 5 | Duración objetivo | 10–15 minutos | Cerrada |

## 2. Turno y calendario

| # | Regla | Valor | Estado |
|---|---|---|---|
| 6 | Semanas con decisión | 1 a 15; la 16 es solo cierre | Cerrada |
| 7 | Momento del parcial | Después de las decisiones de esa semana, con el estrés resultante | Cerrada |
| 8 | Entregas posibles por asignatura | 12: una por semana, salvo las semanas 5, 10 y 15 | Cerrada |
| 9 | Estrés inicial | 20 | A calibrar |

Parciales: semana 5 (Parcial 1), semana 10 (Parcial 2), semana 15 (Parcial 3). Todas las asignaturas rinden en las mismas semanas.

Orden de resolución de una semana:

1. El jugador asigna una decisión a cada asignatura y confirma.
2. Se aplican HOR y ENT de cada asignatura y se suma el estrés de todas.
3. Si el estrés cruza el umbral de crisis, se resuelve la crisis.
4. Si la semana es de parcial, se evalúa cada asignatura.
5. Se muestra el resumen y avanza la semana.

## 3. Recursos y decisiones

| # | Regla | Valor | Estado |
|---|---|---|---|
| 10 | Efecto de cada decisión | Ver tabla | A calibrar |
| 11 | HOR tras cada parcial | Se reinician a 0 en cada asignatura | Cerrada |
| 12 | Recuperación pasiva de estrés | 0 por semana | A calibrar |
| 13 | Zonas de estrés | Ver tabla | Cerrada |
| 14 | Multiplicador de HOR por zona | Ver tabla | A calibrar |

Efecto de una decisión sobre **una** asignatura:

| Decisión | HOR | ENT | Estrés |
|---|---|---|---|
| Estudio Intensivo | +12 | 0 | +4 |
| Cursada Balanceada | +6 | +1 | +1 |
| Priorizar Salud Mental | 0 | 0 | −5 |

- El estrés de la semana es la suma de las decisiones de todas las asignaturas. Con 4 asignaturas va de −20 (todas en salud) a +16 (todas en intensivo).
- Cursar menos asignaturas genera menos estrés: la cantidad funciona como nivel de dificultad.
- En semana de parcial no hay entrega: Cursada Balanceada da 0 ENT.

| Zona | Estrés | Multiplicador de HOR | Modificador en parcial |
|---|---|---|---|
| Verde | 0–40 | ×1.10 | +1 |
| Amarilla | 41–75 | ×0.85 | 0 |
| Roja | 76–100 | ×0.60 | −5 |

El multiplicador de HOR usa la zona en la que estaba el jugador **antes** de aplicar las decisiones de la semana, y es el mismo para todas las asignaturas. El estrés siempre se acota a 0–100.

## 4. Notas y resultado

| # | Regla | Valor | Estado |
|---|---|---|---|
| 15 | Fórmula de la nota | Ver abajo; se calcula por asignatura | A calibrar |
| 16 | Modificador por zona | +1 / 0 / −5 | A calibrar |
| 17 | Bloqueo mental | En zona roja, 20 % de probabilidad por asignatura; la nota se divide entre 2 | A calibrar |
| 18 | Ruido en la nota | Uniforme en ±1, con semilla, independiente por asignatura | Cerrada |
| 19 | Escala y nota de aprobación | Escala 0–20. Una asignatura se aprueba con promedio ≥ 10.5, que se redondea a 11 | Cerrada |
| 20 | Regularidad | 9 de 12 entregas (75 %), por asignatura | Cerrada |
| 21 | Sin regularidad | No se rinde el Parcial 3 de esa asignatura (cuenta como 0) y queda desaprobada | Cerrada |
| 22 | Pesos del promedio | 30 % / 30 % / 40 % | Cerrada |
| 23 | OVR | Escala 0–100, ver abajo | Cerrada |
| 24 | Recuperatorio | No | Cerrada |

Por asignatura:

```
nota     = clamp(4 + 16 · min(1, HOR_tramo / 40)^0.7 + mod_zona + ruido, 0, 20)
           si hay bloqueo mental: nota = nota / 2

promedio = 0.3 · P1 + 0.3 · P2 + 0.4 · P3     (escala 0–20, con decimales)
final    = redondear(promedio)                 (entero; 0.5 redondea hacia arriba)
aprobada = final ≥ 11 y regularidad
```

Del alumno:

```
promedio_general = media de los promedios de sus asignaturas   (sin redondear)
OVR = 5 · promedio_general − 5 · (asignaturas sin regularidad)  (escala 0–100, mínimo 0)
```

- `HOR_tramo` son las horas acumuladas en esa asignatura desde el parcial anterior, ya multiplicadas por zona.
- Las notas de los parciales se guardan con decimales; solo se redondea el promedio de cada asignatura. Un promedio de 10.5 da final 11 y aprueba; un 10.49 da final 10 y no aprueba.
- La regularidad se comprueba antes del Parcial 3: si al llegar a la semana 15 la asignatura tiene menos de 9 entregas, ese parcial no se rinde.

## 5. Crisis

| # | Regla | Valor | Estado |
|---|---|---|---|
| 25 | Disparo y rearme | Se dispara al cruzar 80 hacia arriba; se rearma al bajar de 60 | Cerrada |
| 26 | Opciones | Forzar, Reposo forzado, Abandono | Cerrada |
| 27 | Coste de forzar | Cada semana que empieza con estrés ≥ 80 hay 25 % de colapso | A calibrar |
| 28 | Coste del reposo forzado | −40 de estrés; la semana siguiente se pierde | A calibrar |
| 29 | Crisis en semana de parcial | Los parciales se rinden igual, tras resolver la crisis | Cerrada |

- **Colapso:** la semana se pierde en todas las asignaturas. No hay decisiones, no se suman HOR ni ENT y el estrés no cambia.
- **Semana perdida por reposo:** igual que un colapso, pero el estrés ya bajó 40.
- **Abandono:** termina la partida con el final Abandono. Requiere confirmación.
- Mientras la crisis no se rearme, no vuelve a dispararse aunque el estrés siga por encima de 80.
- El retiro de una asignatura y el semestre sabático quedan fuera del MVP y entran en la Fase 3.

## 6. Finales y persistencia

| # | Regla | Valor | Estado |
|---|---|---|---|
| 30 | Finales | Beca, Aprobado, Aprobado parcial, Desaprobado, Abandono | Cerrada |
| 31 | Beca | Cursar 4 asignaturas, aprobarlas todas, OVR ≥ 85 (promedio general ≥ 17) y ningún parcial por debajo de 10.5 | A calibrar |
| 32 | Aprobado | Todas las asignaturas aprobadas | Cerrada |
| 32a | Aprobado parcial | Al menos una asignatura aprobada, pero no todas | Cerrada |
| 32b | Desaprobado | Ninguna asignatura aprobada | Cerrada |
| 33 | Guardado de partida | No | Cerrada |
| 34 | Semilla | Visible en la pantalla final; no elegible | Cerrada |

Prioridad al evaluar el final: Abandono, Beca, Aprobado, Aprobado parcial y, en cualquier otro caso, Desaprobado.

## Criterios de balance para la Fase 1

Con 10 000 partidas simuladas por estrategia y 4 asignaturas:

- Ninguna estrategia de un solo botón (la misma decisión en todas las asignaturas, todas las semanas) obtiene Beca.
- La estrategia aleatoria termina en Aprobado o Beca menos de la mitad de las veces.
- Existe al menos una estrategia mixta que llega a Beca.

## Pendiente de confirmar

Nada. Todas las reglas están cerradas o a calibrar en la Fase 1.
