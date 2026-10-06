# Backlog — Module Studio

> **Los IDs de este backlog son los de [`design-concepts-in-app.md`](./design-concepts-in-app.md)**, el mapa de conceptos de diseño. Un ID es un concepto (R12 es siempre "anillos poligonales"). Aquí solo se guardan las **prioridades** de lo pendiente y las decisiones de trabajo; lo que ya está hecho se ve en ese mapa.

**Prioridades:** **P2** siguiente · **P3** baja prioridad · **Al final** cuando todo lo demás esté afinado · **➖** descartado.

**Principio de trabajo:** primero dejar bien hechos los controles de modificación de cada capa (un módulo = una figura = una capa); lo que depende de relacionar capas entre sí va después. Antes de añadir un control nuevo, el filtro de siempre: *¿sirve para jugar o solo completa la teoría?* Lo que solo completa la teoría va a *Advanced* o se descarta.

**Regla de diseño:** los controles nuevos se arman con el catálogo de componentes existente (chips, dropdown, grupo de botones, slider con caja de valor, rejilla de formas, casilla, selector de color, sección *Advanced*). Solo entran en el backlog de diseño si ningún componente encaja.

---

## 1. Pendientes por prioridad

Sale de las filas ⏳ del mapa de conceptos, más las mejoras de filas 🟡 que ya habíamos priorizado.

### P3 — ideas que parecen divertidas (probar primero)
| ID | Concepto | Notas |
| :-- | :-- | :-- |
| — | **Plano ondulado** (idea de Abstract Studio / UJI): una onda armónica sobre todo el plano, no módulo por módulo | Sin control dedicado: con los controles que hay. (1) *Layout › Curved* con un segundo parámetro **Cycles** y que deforme también las filas: líneas, celdas y módulos ya siguen la misma curva. (2) *Gradation › Drift* con **dirección** (a lo largo o transversal al recorrido), con *Cycles* y *Ping-pong*. Resuelve de paso A8 en esas variaciones |
| — | **Cadena acumulativa estilo UJI**: cientos o miles de copias donde cada una hereda escala, giro y movimiento de la anterior | Modo de Layout nuevo; hay que medir el rendimiento antes (render por lotes y limitar los repintados). Las letras A, S, R y los números son la semilla natural |

### P3 — por evaluar con el filtro de juego
| ID | Concepto | Notas |
| :-- | :-- | :-- |
| A8 | Deformar las líneas de estructura visibles | Hoy solo se deforman los módulos |
| C4 | Contraste cálido/frío entre zonas | La gradación de color ya está hecha (Gradation › Color) |
| SP9 | Sombra unida o separada | |
| SP11 | Perspectiva con disminución de tamaño | |
| SP12 | Planos transparentes (marcos espaciales) | |
| SP14, SP15 | Planos de textura uniforme y planos de color o textura en gradación | |
| SP6 | Pistas de profundidad por tamaño, tono y textura | |
| G9, S5 | Unión o sustracción dentro de la figura (en gradación y en similitud) | Ligado a las interrelaciones |
| F5 | Formas rectilíneas e irregulares propias | La app trabaja con una biblioteca fija de 22 formas |

### Al final de todo
| ID | Concepto | Notas |
| :-- | :-- | :-- |
| INT2, INT5 a INT9 | Interrelaciones entre capas: toque, unión, sustracción, intersección, coincidencia y sus efectos espaciales | Se resuelven con composición (`destination-out`, `destination-in`) y posición. Abren decisiones de interfaz que conviene diseñar antes en Figma |
| RP7 | Módulos mayores que su celda, con unión o penetración entre vecinos | Depende de las interrelaciones |
| RP8, RP9, RP10, E29, R26 | **Supermódulos** (y submódulos): un grupo de módulos que se repite como unidad | La app trabaja un módulo por capa; hay que decidir cómo (por ejemplo, grupos de capas que comparten retícula) |
| SP18 | Profundidad por capa | Depende de las interrelaciones |
| O4 | Botón Random («Sorpréndeme») y presets | Al final, cuando la herramienta esté afinada con todos los controles. Se eliminaron los presets anteriores; si se retoma, generar combinaciones válidas al azar sin presets prediseñados |

---

## 2. Descartados
| ID | Concepto | Motivo |
| :-- | :-- | :-- |
| B12, C9 | Gravedad (elemento y contraste) | Se consigue con *Contrast › Position* a 90º |
| T1, T3 | Texturas decorativa y mecánica (grano, semitono, estriado, tipografía) | Se eliminaron al reemplazar el control de textura; reabrir solo si aparece un uso claro |
| — | Separación de anillos en gradación (antes R6) | Casi no se notaría; no sirve para jugar |

---

## 3. Calidad y diseño

| ID | Ítem | Estado |
| :-- | :-- | :-- |
| Q1 | Revisión de código | ✅ Informe histórico en [REVISION_CODIGO.md](./REVISION_CODIGO.md); sus arreglos (F1 a F9) están hechos |
| Q2 | Auditoría de lo propuesto frente a lo que la app ya hace | ✅ Hecha en cada ítem; el mapa de conceptos la formaliza |
| Q3 | Design system desde Figma | ✅ [DESIGN_SYSTEM_TOKENS.md](./DESIGN_SYSTEM_TOKENS.md) y `css/tokens.css` |
| Q3b, Q3d | Migrar paneles, barra superior, tarjetas de capas y riel al diseño de Figma | ✅ |
| Q3c | Decisiones de diseño pendientes: tokens para la caja de valor y la pista del slider, fuente monoespaciada (DM Mono o Roboto Mono), unificar interruptor y checkbox entre librería y diseño | ⏳ **En espera**: Diego revisará el diseño en Figma (por ejemplo, reducir el alto de los campos para un estilo más de software) y lo pasará |
| U1 | Reorganizar los controles: lo esencial visible, lo demás en *Advanced*, dropdowns, guías con color global | ✅ Ver [AUDITORIA_CONTROLES.md](./AUDITORIA_CONTROLES.md) |

## 4. Otros
| ID | Ítem | Estado |
| :-- | :-- | :-- |
| O1 | Exportar SVG vectorial real y reabrir el proyecto | ✅ |
| O2, O3 | Controles de Contrast, eje de línea, color de acento y variaciones sin mockup | ✅ Cerrado (regla de diseño: salen del catálogo de componentes) |

---

## 5. Equivalencias con los IDs antiguos
Hasta el 5 de octubre de 2026 el backlog numeraba **tareas** (R4, E2, G7...). Desde entonces los IDs son los de los conceptos. Para leer commits y conversaciones anteriores:

| ID antiguo | ID actual | | ID antiguo | ID actual |
| :-- | :-- | :-- | :-- | :-- |
| E1 | E11 | | R1 | R20 |
| E2 | E10 | | R2 | R7 |
| E3 | E12 | | R3 | R17 |
| E4 | E24, E25 | | R4 | R12 |
| RP1 | E23 | | R5 | R3 |
| RP2 | E20, E21 | | R6 | descartado |
| RP3 | RP11 | | R7 | R9 |
| RP4 | RP2 a RP4 | | C1 | C7 |
| RP5 | INT3, E28, R23 | | C2 | C8 |
| RP6 | RP8 a RP10, E29, R26 | | C3 | B12, C9 (descartado) |
| G1 | G15 | | C4 | Contraste cálido/frío entre zonas | La gradación de color ya está hecha (Gradation › Color) |
| G2 | G16 | | C5 | C4, G3 |
| G3 | G21 | | C6 | G4 | G12 | | C7 | C4 |
| G5 | G1 | | K1 | K7 |
| G6 | G4, T10 | | K2 | K9, K10 |
| G7 | G17 | | K3 | K8 |
| A1 | A2, A6 | | K4 | K1 |
| A2 | A3 | | K5 | K3 |
| A3 | A9 | | S1 | S2 |
| A4 | A8 | | S2 | S3 |
| S3 | SP1 | SP5, SP11 | | SP2 | SP9 |
| SP3 | SP6, SP14, SP15 | | SP4 | SP12 |
| SP5 | SP18 | | T1, T2 | T1 y T3 (descartados), T10 |
| INT1 | INT5 a INT7 | | INT2 | INT4 |
| INT3 | INT2, INT8 | | INT4 | RP7, E7, R27 |
