# Backlog — Module Studio

Origen: revisión de la primera parte del libro de Wucius Wong (capítulos 1 a 12) contra los controles de la app, más las decisiones de Diego del 2026-10-04.

**Prioridades:** **P1** siguiente · **P2** backlog · **P3** al final / baja prioridad · **✖** descartado por ahora.

**Principio de trabajo:** primero revisar y consolidar (sección 0), luego dejar bien hechos los controles de modificación de cada capa (un módulo = una figura = una capa). Las funciones que dependen de relacionar capas entre sí van después.

---

## 1. Cola de trabajo

| # | Ítem | Estado |
| :-- | :--- | :--- |
| 1 | Fluctuating alterna la dirección entre celdas vecinas | ✅ Hecho (2026-10-04) |
| 2 | Gradation: *Range* aplica a Scale, Depth y Drift (180 = cantidad original) | ✅ Hecho (2026-10-04) |
| 3 | **Revisión de código y auditoría de lo propuesto** (sección 0, Q1 y Q2) | ✅ Informe hecho: [REVISION_CODIGO.md](./REVISION_CODIGO.md) |
| 3b | **Arreglos de la revisión** (F1 a F9 del informe) | F1 a F9 ✅ (revisión de código completa) |
| 4 | **Design system `.md` desde Figma** (sección 0, Q3) | ✅ Hecho: [DESIGN_SYSTEM_TOKENS.md](./DESIGN_SYSTEM_TOKENS.md) y `css/tokens.css` |
| 4b | **Migrar los paneles Module, Layout, Structure y Similarity al diseño de Figma** (Q3b) | ✅ Hecho (2026-10-04). Q3d también hecho: toda la interfaz usa los tokens |
| 5 | Gradation avanzada (G1 a G6) | ✅ Hecho (G7, gradación de estructura, sigue en P2) |
| 6 | Radiación: centrípeta y centro abierto (R1, R2, R3, R5) | ✅ Hecho (R4, R6 y R7 siguen en P2) |
| 7 | **Estructura y Repetición** (sección 9: E1, E3, RP1, RP3) | ✅ Hecho (E2 radial, E4, RP2 y RP4 siguen en P2) |
| 8 | **Contraste** (sección 5: C8, C4, C2) | **P1, siguiente.** C8 (qué manda cuando Contrast, Gradation, Concentration y Anomaly tocan lo mismo) es pedido explícito; C4 y C2 reutilizan Texture y figura/fondo, que ya existen |
| 9 | Anomalía (sección 7: A1, A3) | P2 |
| 10 | Similitud (sección 8: S1, S2) | P2. S2 se apoya en Line skipping de Texture |
| 11 | Concentración (sección 6: K2, K1, K4) | P2 |
| 12 | Interrelaciones entre capas (sección 2) | P2, después de los modificadores (7 a 11) |
| 13 | Espacio (sección 10) | P3. Es el más complejo; SP5 depende de las interrelaciones |
| 14 | Supermódulos (RP6) | P3, al final de todo |

**Textura** (sección 11) está cerrada: lo propuesto quedó hecho y lo demás se descartó. Las prioridades de cada ítem están en su sección; los de P2 y P3 se mueven hacia arriba solo si el trabajo del paso anterior los hace baratos.

**Regla de diseño:** los controles nuevos se arman con el catálogo de componentes existente (tags, grupo de botones, slider con caja de valor, rejilla de formas, casilla, selector de color, desplegable). Solo entran en el backlog de diseño los que no encajan en ninguno de ellos.

---

## 0. Calidad y fundamentos

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| Q1 | **Revisión de código como experto** ✅ | Informe en [REVISION_CODIGO.md](./REVISION_CODIGO.md). Calidad y funcionamiento de todo el código. Todavía no se ha hecho una revisión completa; solo se han corregido cosas sueltas al trabajar. Alcance: arquitectura y estado (global frente a por capa), código muerto, duplicación, rendimiento del render, accesibilidad de los controles, manejo de errores, dependencias por CDN, el flujo de build (`build-pro.py` y el bundle), pruebas y el protocolo de calidad de `STUDIO_RULES.md`. Resultado: informe con hallazgos por gravedad y un plan de arreglos | ✅ |
| Q2 | **Auditoría de lo propuesto frente a lo que la app ya hace** | Varias ideas del backlog pueden existir ya, aunque no de la mejor forma. Antes de implementar cada ítem, comprobar qué hay hoy en el código y en la UI, y decidir si se reemplaza, se mejora o se descarta. Se hace junto con Q1 ✅ (tabla de auditoría en el informe) | P1 |
| Q3 | **Mejor design system `.md` desde Figma** ✅ | Leer variables, estilos y componentes del archivo de Figma (tokens `neutral/…`, `primary/…`, `spacing/…`, `border/…`, `sizing/…`, tipografía y elevación) con el MCP de Figma. Reescribir `docs/DESIGN_SYSTEM_TOKENS.md` con los nombres reales, valores, componentes (switch, tag, slider, value box, toggle item, badge, buttonIcon, snackbar, btn-group) y sus estados. Alinear `css/studio-pro.css` con esos tokens (hoy hay colores y medidas fijos). Resultado: documento y variables CSS | ✅ |
| Q3b | **Migrar los paneles antiguos al diseño de Figma** ✅ | Module, Layout (Repetition y Radiation), Structure y Similarity pasaron a los componentes `.ds-*` (nuevos: grupo de botones, snackbar, pila de campos, selector de color). Se retiraron 17 reglas de CSS antiguas | ✅ |
| Q3d | **Barra superior, tarjetas de capas y riel de herramientas** ✅ | Migrados desde el nodo `5763:1692` de Figma (cabecera, botón, botón de icono, selector, panel de capas, tarjeta de capa, riel y línea de estado). `css/design-system.css` eliminado | ✅ |
| Q3c | **Decisiones de diseño pendientes** | Ver la sección 8 de [DESIGN_SYSTEM_TOKENS.md](./DESIGN_SYSTEM_TOKENS.md): tokens para la caja de valor y la pista del slider, fuente monoespaciada (DM Mono o Roboto Mono), y unificar interruptor y checkbox entre librería y diseño | P2 |

Los hallazgos de la revisión están en [REVISION_CODIGO.md](./REVISION_CODIGO.md), con su plan de arreglos F1 a F9.

---

## 2. Interrelaciones entre capas (capítulo 2, Forma)

Las 8 interrelaciones del libro (distanciamiento, toque, superposición, penetración, unión, sustracción, intersección, coincidencia) se eliminaron junto con Form A / Form B. Sí encajan con capas: la relación se define **por capa, contra el resultado de las capas que tiene debajo**.

| ID | Ítem | Notas |
| :-- | :--- | :--- |
| INT1 | Selector "relación con la capa inferior" | Se dibuja con composición en lienzos auxiliares. Sustracción e intersección se resuelven con operaciones de composición (`destination-out`, `destination-in`). |
| INT2 | Modo trazo (contornos) | Unión, sustracción e intersección en trazo se resuelven recortando el contorno de cada capa con la silueta de la otra (cobertura de líneas ocultas). Penetración dibuja ambos contornos completos. |
| INT3 | Toque, distanciamiento y coincidencia | No son composición sino posición: toque calcula la distancia para que las siluetas se rocen, coincidencia alinea centros. |
| INT4 | Módulos mayores que la celda | El libro los usa con unión, penetración, etc. entre módulos vecinos (cap. 3 y 7). Depende de INT1. |

Estado: **P2**, después de cerrar los controles de modificación. Abre decisiones de interfaz que conviene diseñar en Figma antes de implementar.

---

## 3. Gradación (capítulo 6)

Ya cubierto: rotación en el plano (Rotate), progresión en el plano (Drift), rotación espacial (Depth), progresión espacial (Scale), caminos paralelo y concéntrico, reverse, ciclos.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| G1 | Camino en zigzag | ✅ Hecho: tag *Zigzag* en Pathway (cuadrícula y radial) | ✅ |
| G2 | Ida y vuelta (1-2-3-4-5-4-3-2-1) frente a reinicio (1-2-3-4-5-1-2-3-4-5) | ✅ Hecho: grupo *Sequence* (Restart, Ping-pong) | ✅ |
| G3 | Gradación alternada | ✅ Hecho: casilla *Alternate rows* | ✅ |
| G4 | Velocidad de gradación | ✅ Hecho: slider *Acceleration* (-100 a 100); *Cycles* sigue siendo el número de repeticiones | ✅ |
| G5 | Gradación de figura | ✅ Hecho: atributo *Shape* con la rejilla *Becomes*; interpola los contornos de cualquier pareja de formas | ✅ |
| G6 | Atributo *Texture* | ✅ Hecho: atributo *Texture*; la deformación crece a lo largo del camino | ✅ |
| G7 | Gradación de estructura | Celdas que cambian de tamaño progresivamente (fig. 44). Se relaciona con E4 | P2 |

---

## 4. Radiación (capítulo 7)

Ya cubierto: centrífuga, concéntrica, espiral y doble centro, con rayos, anillos, torsión y centro excéntrico.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| R1 | Estructura **centrípeta** | ✅ Hecho: esquema *Centripetal* (ángulos hacia el centro, guías en chevrones anidados) | ✅ |
| R2 | Centro abierto | ✅ Hecho: slider *Open center* (las líneas tangentes al agujero poligonal quedan para R4) | ✅ |
| R3 | Anillos rotados entre sí | ✅ Hecho: slider *Ring rotation* | ✅ |
| R4 | Anillos poligonales | Cuadrados, polígonos en lugar de círculos (fig. 49b, g) | P2 |
| R5 | Orientación del módulo | ✅ Hecho: tags *Module orientation* (Auto, Outward, Inward, Tangent, Fixed) | ✅ |
| R6 | Separación de anillos en gradación | Hoy es lineal | P2 |
| R7 | Más de dos centros | Hoy doble centro simétrico | P2 |

---

## 5. Contraste (capítulo 9)

Ya cubierto: dominancia de la mayoría y énfasis de la minoría, dimensiones Scale, Shape y Angle, color de acento elegible.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| C1 | Dimensión posición | Arriba/abajo, céntrico/excéntrico | P2 |
| C2 | Dimensión espacio | Ocupado/vacío, positivo/negativo (figura y fondo invertidos en la minoría) | **P1** |
| C3 | Dimensión gravedad | Estable/inestable, ligero/pesado | P2 |
| C4 | Dimensión textura | Aplicar Texture solo a la minoría | **P1** |
| C5 | Dimensión color | Más allá del acento | P3 |
| C6 | Minoría por zonas y equilibrio | El libro reparte la mayoría sobre una zona mayor y la minoría tira desde el borde (fig. 61b) | P3 |
| C7 | Revisar "Tone" | Hoy es trazo contra relleno, más cercano a contraste de espacio que de color | P2 |
| **C8** | **Revisar la interacción con otros modificadores** | **Pedido explícito, primero de Contraste.** Orden de aplicación y multiplicadores con Gradation, Concentration y Anomaly (todos tocan escala, dirección o color). Definir qué manda cuando coinciden | **P1** |

---

## 6. Concentración (capítulo 10)

Ya cubierto: hacia un punto (Point), desde un punto (Void), hacia una línea (Line), libre (Hotspots, 2 focos).

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| K1 | Desde una línea | Inverso de Line | P2 |
| K2 | Superconcentración y desconcentración | Densidad alta o baja en todo el diseño, con o sin transición a los bordes | P2 |
| K3 | Más de dos focos | Hoy Hotspots son dos focos simétricos | P3 |
| K4 | Concentrar por ausencias | Módulos que desaparecen según un campo de densidad; es el mecanismo que el libro usa dentro de estructuras formales | P2 |
| K5 | Varios módulos por celda | Cambios cuantitativos reales | P3 |

---

## 7. Anomalía (capítulo 8)

Ya cubierto: focal, rupture, swell, void, radio, severidad, resaltado con color elegible, reticle.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| A1 | Anomalías esparcidas | Aliviar la monotonía: distribuir anomalías por todo el diseño, de forma regular o aleatoria (fig. 56b) | P2 |
| A2 | Zona con otra regularidad | "Transformar la regularidad" (fig. 56c) | P3 |
| A3 | Elegir qué atributos se desvían | El libro: una anomalía puede desviarse en uno o dos elementos y respetar los demás | P2 |
| A4 | Deformar las líneas de estructura visibles | Hoy solo se deforman los módulos | P3 |

---

## 8. Similitud (capítulo 5)

Ya cubierto: Elastic (tensión/compresión), 3D tilt (distorsión espacial), Wobble, Scale, Hibrid, intensidad, jitter de celda.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| S1 | Asociación | Formas de una misma familia mezcladas | P2 |
| S2 | Imperfección | Formas cortadas o quebradas. Puede apoyarse en Line skipping de Texture | P2 |
| S3 | Retícula de celdas irregulares | "Subdivisiones estructurales similares" (fig. 33) | P3 |
| S4 | Distribución visual libre | Sin retícula, con espacio similar para cada módulo | P3 |

---

## 9. Estructura y Repetición (capítulos 3 y 4)

Ya cubierto: retícula básica, sliding, sheared, curved, zigzag, triangular; estructura activa (recorte), visible (líneas) y alternancia positivo/negativo; proporción rítmica.

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| E1 | Líneas visibles positivas o negativas | ✅ Hecho: tags *Line tone* (Guide, Positive, Negative) | ✅ |
| E2 | Grosor de las líneas | ✅ Hecho en la cuadrícula (*Line width*, F6); falta el radial | P2 |
| E3 | Horizontales y verticales por separado | ✅ Hecho: *Line direction* y *Line spacing* (Every other) | ✅ |
| E4 | Estructura de múltiple repetición | Dos clases de subdivisión entretejidas (fig. 23) | P2 |
| RP1 | Retícula hexagonal | ✅ Hecho: tag *Hexagonal* (panal con recorte y líneas hexagonales) | ✅ |
| RP0 | Mostrar en pantalla las retículas triangular, zigzag y alternada | ✅ Hecho (F6), con el parámetro de cada variación y el grosor de líneas | ✅ |
| RP2 | Subdivisión y combinación de celdas | | P2 |
| RP3 | Reflexión | ✅ Hecho: tags *Reflection* (None, Columns, Rows, Both) | ✅ |
| RP4 | Selector de dirección | Repetida, alternada o indefinida | P2 |
| RP5 | Superposición de estructuras | Ya posible con capas | ✅ |
| RP6 | **Supermódulos** | Un grupo de módulos que se repite como unidad. La app trabaja un módulo = una capa, así que hay que decidir cómo (por ejemplo, grupos de capas que comparten retícula) | **P3, al final de todo** |

---

## 10. Espacio (capítulo 12)

Ya cubierto: isométrico, 3D tilt, fluctuante, paradójico; profundidad, ángulo, contraste de facetas, guías isométricas; figura y fondo invertibles.

Se considera complejo; entero en backlog (P3).

| ID | Ítem | Prioridad |
| :-- | :--- | :-- |
| SP1 | Perspectiva con disminución de tamaño | P3 |
| SP2 | Sombra unida o separada | P3 |
| SP3 | Pistas de profundidad: tamaño, tono y textura | P3 |
| SP4 | Planos transparentes (marcos espaciales) | P3 |
| SP5 | Profundidad por capa | P3, depende de INT |

---

## 11. Textura (capítulo 11)

Ya cubierto: textura espontánea mediante deformación de geometría (Jitter, Line skipping, Strand crossing, Perimeter undulation).

| ID | Ítem | Estado |
| :-- | :--- | :--- |
| T1 | Texturas decorativa y mecánica (grano, semitono, estriado, tipografía) | ✖ Descartadas por ahora; se eliminaron al reemplazar el control. Reabrir solo si aparece un uso claro |
| T2 | Gradación de textura | Ver G6 |

---

## 12. Otros

| ID | Ítem | Notas | Prioridad |
| :-- | :--- | :--- | :-- |
| O1 | Exportar SVG vectorial real | ✅ Hecho (F9): el motor dibuja sobre un contexto que graba trazos SVG. También se puede reabrir el proyecto (botón Open) | ✅ |
| O2 | Controles de Contrast sin mockup | Minority Shape y Clash Angle usan la rejilla de formas y el slider con caja de valor del catálogo | ✅ Cerrado (regla de diseño) |
| O4 | Aleatorizar parámetros (botón Random) | Se eliminaron los presets y el botón. Si se retoma, generar combinaciones válidas al azar de los controles de capa (la prueba de 400 combinaciones ya sabe hacerlo). Sin presets prediseñados | P3, baja prioridad |
| O3 | Controles extra sin mockup | Eje de línea, color de acento, variaciones de Layout, Radiation y Gradation: todos salen del catálogo de componentes existente | ✅ Cerrado (regla de diseño) |
