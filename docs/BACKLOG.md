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
| — | **Plano ondulado** (idea de Abstract Studio / UJI) — *el 7 oct 2026 se hizo la parte del módulo: Texture › Plane wave dobla cada módulo como una hoja; queda la ola continua entre módulos y líneas (opción 3), que toca Layout*: una onda armónica sobre todo el plano, no módulo por módulo | Sin control dedicado: con los controles que hay. (1) *Layout › Curved* con un segundo parámetro **Cycles** y que deforme también las filas: líneas, celdas y módulos ya siguen la misma curva. (2) *Gradation › Drift* con **dirección** (a lo largo o transversal al recorrido), con *Cycles* y *Ping-pong*. Resuelve de paso A8 en esas variaciones |
| — | **Cadena acumulativa estilo UJI**: cientos o miles de copias donde cada una hereda escala, giro y movimiento de la anterior | Modo de Layout nuevo; hay que medir el rendimiento antes (render por lotes y limitar los repintados). Las letras A, S, R y los números son la semilla natural |

| — | **Posición individual de cada foco** (Concentration › Hotspots) | Hoy X / Y y el puntero mueven solo el foco 1; los demás son copias suyas giradas alrededor del centro (2 focos = espejo). Propuesta: una fila de chips 1, 2, 3… para elegir el foco que mueven los sliders y el puntero (cada foco guarda su posición), y un interruptor **Regular / Free** que mantiene la figura regular actual o activa posiciones libres. Con *Regular* nada cambia y los proyectos viejos se ven igual |

| — | **Composition container (antes Block), clic para mover** (hechas el 7 oct 2026: tamaño y desfase en px, marco punteado mientras el panel Layout está abierto, y el corte de lo que sobresale, también en Actual size) | **Clic en el lienzo para mover el bloque** con el panel Layout abierto (como el foco de Anomaly y el atractor de Concentration): el clic fijaría el desfase del centro del bloque |

| — | **Art log como JSON y editor interno** (idea del 7 oct 2026, pendiente de definir cómo se usaría) | Hoy el Art log es una receta de texto (con *Copy*). Idea: darle **dos pestañas**, *Recipe* (la actual, en las unidades de la interfaz) y *JSON* (el proyecto compacto, con todas las capas y solo lo activo, en los valores internos exactos). Como la app rellena con valores por defecto lo que falta, un JSON compacto ya es un proyecto válido. Luego, un **editor en tiempo real** (fase 2): editar el JSON dentro de la app con un botón *Apply* que valide y cargue con la misma lógica que *Open* (que ya limpia valores dañados) y deje un paso de deshacer. Es una evolución de la app: definir antes el flujo (pegar recetas entre proyectos, pasárselas a un asistente, editar a mano). Ojo con las unidades: el JSON usa valores internos (jitter en px, Speed con el signo contrario, el composition container (`block`) en %, *Col B size* como factor) que no coinciden con los de los sliders |

### Ideas de diseño para una rama aparte (no tocan `main` hasta validarlas)
| ID | Concepto | Notas |
| :-- | :-- | :-- |
| — | **Módulo "smart"** (como los smart objects de Photoshop): el módulo es una pieza de papel con su propio canvas y hasta 4 shapes, editada en su propio ambiente; sustituye al módulo actual | **Prueba de concepto funcionando en la rama `smart-module`** (aún no en `main`). Modelo, glosario y pendientes en [`IDEA_SMART_MODULE.md`](./IDEA_SMART_MODULE.md) |

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

### Rendimiento (solo si se amplían los rangos o llega la cadena acumulativa)
Medido el 6 oct 2026 (círculo en trazo, Fit to canvas, 600 px): 100 módulos 2 ms · 900 → 9 ms · 3 600 → 32 ms · 10 000 → 213 ms · 3 600 con Texture 147 ms · con Similarity y Gradation 60 ms · con Space 61 ms. Los límites subieron el 7 oct 2026 (100 × 100 columnas y filas = 10 000 módulos; radial 60 × 20 = 1 200): una retícula llena de 10 000 módulos tarda ~213 ms por dibujo, así que al arrastrar un slider con ella se siente a unos 5 cuadros por segundo. Es el momento de valorar las mejoras de abajo si se nota. **Cada acción ya dibuja una sola vez** (comprobado: un evento = un dibujo), así que agrupar repintados por cuadro no aporta nada.
| Mejora | Cuándo |
| :-- | :-- |
| Un solo trazo para los módulos del mismo estilo (el mayor salto) | Junto con las interrelaciones entre capas, para no hacerlo dos veces |
| Caché de las figuras aplanadas de Texture | Si Texture con miles de módulos se siente lento |
| No dibujar los módulos que quedan fuera del lienzo | Con Actual size y retículas mucho más grandes que el lienzo |

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
| Q4 | Revisión de salud del código (7 oct 2026) | ✅ Sin errores de JavaScript ni ids duplicados. Los tres pendientes menores también se hicieron: se borraron los manejadores del panel *Structure* antiguo, se quitó Tailwind (sus 18 clases de utilidad y el reset base viven en `css/studio-pro.css`; se comprobó elemento por elemento que ningún estilo cambió en los nueve paneles, el encabezado y la lista de capas) y el Art log lista los valores en uso de cada modificador. Queda de la revisión #9: empaquetar iconos y fuentes en el repositorio para que la app funcione sin conexión |
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
