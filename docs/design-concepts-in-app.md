# Design concepts in app — mapa de cobertura de Wong

Este documento recorre **todo el libro** (*Fundamentos del diseño bi- y tridimensional*, Wucius Wong; primera parte, capítulos 1 a 12) y dice, concepto por concepto, **qué control de la app lo implementa**, o por qué no. Es la fuente única de la cobertura: [`BACKLOG.md`](./BACKLOG.md) guarda solo las prioridades y apunta a estos IDs, y [`../STUDIO_CONTROLS_GUIDE.md`](../STUDIO_CONTROLS_GUIDE.md) explica cómo funciona cada control.

**Columnas.** *Cap.*: capítulo del libro. *ID*: capítulo.número (la letra o la figura del libro va en la definición). *Concepto*: qué es, según Wong. *Grupo*: la clase de concepto a la que pertenece dentro del capítulo. *Control en la app*: panel › control. *Estado*. *Notas*: ID del backlog, figura del libro o límites.

**Estados.** ✅ hecho · 🟡 parcial (se cubre una parte o con otro mecanismo) · ⏳ pendiente (con su ID del backlog, o sin él si aún no se ha priorizado) · ➖ descartado (con el motivo) · 🚫 fuera de alcance (la app es bidimensional y digital; no aplica).

**Nota sobre el escaneo.** La primera página del capítulo 3 (p. 19) no está en el PDF escaneado, así que sus conceptos se deducen de las figuras 13 a 16 y del resto del capítulo.

---

## Capítulo 1 · Introducción (elementos de diseño)

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 1 | 1.1 | **Punto**: indica posición; no tiene largo ni ancho (fig. 1a) | Elementos conceptuales | Module › Shape (círculo pequeño) y Width / Height | 🟡 | Un punto es un módulo muy pequeño; no hay "punto" como elemento aparte |
| 1 | 1.2 | **Línea**: recorrido de un punto; largo, sin ancho (fig. 1b) | Elementos conceptuales | Module › Shape `line`, Width, Stroke width | ✅ | La línea solo tiene largo; el ancho es el grosor del trazo |
| 1 | 1.3 | **Plano**: recorrido de una línea; largo y ancho, sin grosor (fig. 1c) | Elementos conceptuales | Module › Shape (círculo, cuadrado, triángulo, hexágono...) | ✅ | |
| 1 | 1.4 | **Volumen**: recorrido de un plano; en 2D es ilusorio (fig. 1d) | Elementos conceptuales | Space › Mode (Isometric, 3D tilt, Fluctuating, Paradox) | ✅ | Ver cap. 12 |
| 1 | 1.5 | **Forma**: todo lo que se ve tiene forma (fig. 2a) | Elementos visuales | Module › Shape (15 formas) | ✅ | |
| 1 | 1.6 | **Medida**: tamaño de una forma (fig. 2b) | Elementos visuales | Module › Width, Height (5 a 2000 px) | ✅ | |
| 1 | 1.7 | **Color**: blanco, negro, grises y cromáticos (fig. 2c) | Elementos visuales | Module › Shape color; Contrast › Tone y Accent color; botón de invertir figura/fondo | 🟡 | Un color por capa. Más colores con varias capas. Color por zonas: C5 |
| 1 | 1.8 | **Textura**: cualidades de la superficie (fig. 2d) | Elementos visuales | Texture › Jitter, Line skipping, Strand crossing, Perimeter undulation | ✅ | Deforma la geometría; ver cap. 11 |
| 1 | 1.9 | **Dirección**: depende de cómo se relaciona la forma con el observador o el marco (fig. 3a) | Elementos de relación | Module › Rotation; Layout › Direction; Contrast › Angle; Gradation › Rotate | ✅ | |
| 1 | 1.10 | **Posición**: se juzga por su relación con el marco o la estructura (fig. 3b) | Elementos de relación | Module › Offset X / Y; Layout › Module placement; Contrast › Position; Anomaly | ✅ | |
| 1 | 1.11 | **Espacio**: ocupado o vacío, liso o ilusorio (fig. 3c) | Elementos de relación | Space (panel entero); Checkerboard inversion; botón de figura/fondo | ✅ | Ver cap. 12 |
| 1 | 1.12 | **Gravedad**: sensación psicológica de pesadez o liviandad (fig. 3d) | Elementos de relación | — | ➖ | C3: se consigue con Contrast › Position a 90º |
| 1 | 1.13 | **Representación, significado y función** | Elementos prácticos | — | 🚫 | Son del diseño aplicado, fuera del alcance del libro y de la app |
| 1 | 1.14 | **Referencia al marco**: los límites del diseño | Marco | Canvas › Aspect ratio (1:1, 9:16, 4:3, 3:4, 16:9) | ✅ | |
| 1 | 1.15 | **Plano de la imagen**: la superficie sobre la que se pinta | Marco | Canvas (lienzo) | ✅ | |
| 1 | 1.16 | **Forma y estructura**: la estructura gobierna la organización | Principio | Layout (Repetition y Radiation) | ✅ | Ver cap. 4 |

## Capítulo 2 · Forma

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 2 | 2.1 | **La forma como punto**: reconocida por ser pequeña y simple (figs. 4, 5) | Forma y elementos conceptuales | Module › Width / Height | 🟡 | Ver 1.1 |
| 2 | 2.2 | **La forma como línea**: total, cuerpo y extremidades (fig. 6) | Forma y elementos conceptuales | Module › Shape `line`, Stroke width | 🟡 | La forma total sí; el cuerpo y las extremidades de la línea no tienen control propio |
| 2 | 2.3 | **La forma como plano — geométricas**: construidas matemáticamente (fig. 7a) | Formas planas | Module › Shape (círculo, cuadrado, triángulo, hexágono, paralelogramo, cruz) | ✅ | |
| 2 | 2.4 | **Formas planas — orgánicas**: curvas libres (fig. 7b) | Formas planas | Module › Shape (onda, herradura, creciente, gota) | 🟡 | Hay cuatro; no se dibujan formas libres |
| 2 | 2.5 | **Formas planas — rectilíneas e irregulares** (figs. 7c, 7d) | Formas planas | — | ⏳ | Sin ID: la app no permite dibujar formas propias; solo la biblioteca de 15 |
| 2 | 2.6 | **Formas planas — manuscritas y accidentales** (figs. 7e, 7f) | Formas planas | Texture › Jitter y Perimeter undulation | 🟡 | La textura de geometría imita el trazo a mano |
| 2 | 2.7 | **La forma como volumen**: ilusoria, se trata en el cap. 12 | Forma y elementos conceptuales | Space | ✅ | |
| 2 | 2.8 | **Formas positivas y negativas**: ocupa un espacio / es un espacio vacío (fig. 8) | Figura y fondo | Botón de invertir figura/fondo; Layout › Checkerboard inversion; Contrast › Space | ✅ | |
| 2 | 2.9 | **Distribución del color**: forma blanca/negra sobre fondo blanco/negro (figs. 9, 10, 11) | Figura y fondo | Botón de invertir figura/fondo; Module › Stroke / Fill; Shape color | 🟡 | Las cuatro combinaciones de dos colores sí; las 16 variantes de cuatro zonas no |
| 2 | 2.10 | **Distanciamiento** de dos formas (fig. 12a) | Interrelación de formas | Capas (Offset X / Y de cada capa) | 🟡 | INT3 |
| 2 | 2.11 | **Toque**: las formas empiezan a tocarse (fig. 12b) | Interrelación de formas | — | ⏳ | INT3 (calcular la distancia para que se rocen) |
| 2 | 2.12 | **Superposición**: una forma parece estar encima de la otra (fig. 12c) | Interrelación de formas | Capas (orden de capas) | ✅ | RP5. Cada capa tapa a la inferior |
| 2 | 2.13 | **Penetración**: ambas formas transparentes, contornos visibles (fig. 12d) | Interrelación de formas | Capas en modo Stroke | 🟡 | INT2 |
| 2 | 2.14 | **Unión**: reunidas en una forma nueva y mayor (fig. 12e) | Interrelación de formas | — | ⏳ | INT1 |
| 2 | 2.15 | **Sustracción**: una forma invisible tapa a la visible (fig. 12f) | Interrelación de formas | — | ⏳ | INT1 (`destination-out`) |
| 2 | 2.16 | **Intersección**: solo se ve la parte común (fig. 12g) | Interrelación de formas | — | ⏳ | INT1 (`destination-in`) |
| 2 | 2.17 | **Coincidencia**: las dos formas se convierten en una (fig. 12h) | Interrelación de formas | — | ⏳ | INT3 (alinear centros) |
| 2 | 2.18 | **Efectos espaciales de las interrelaciones**: cada una produce un efecto espacial distinto | Interrelación de formas | — | ⏳ | INT1 a INT4. Van al final de todo |

## Capítulo 3 · Repetición

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 3 | 3.1 | **Repetición de módulos** de igual figura, tamaño, color y textura (figs. 13, 17) | Repetición básica | Layout › Repetition (Columns, Rows, Module size) | ✅ | |
| 3 | 3.2 | **Direcciones repetidas**: todos mirando igual (fig. 14a) | Repetición de dirección | Layout › Advanced › Direction `Repeated` | ✅ | RP4 |
| 3 | 3.3 | **Direcciones indefinidas**: cada uno distinto (fig. 14b) | Repetición de dirección | Layout › Advanced › Direction `Undefined` | ✅ | RP4 |
| 3 | 3.4 | **Direcciones alternadas** (fig. 14c) | Repetición de dirección | Layout › Direction `Alternated`; variación de retícula *Alternating* | ✅ | RP4 |
| 3 | 3.5 | **Direcciones en gradación** (fig. 14d) | Repetición de dirección | Gradation › Attribute `Rotate` | ✅ | |
| 3 | 3.6 | **Direcciones similares** (fig. 14e) | Repetición de dirección | Similarity › `Wobble` | ✅ | |
| 3 | 3.7 | **Variaciones espaciales**: superposición, penetración, unión de módulos vecinos | Repetición de posición | Módulos mayores que su celda (se superponen) | 🟡 | INT4: unión, penetración y sustracción entre vecinos |
| 3 | 3.8 | **Submódulos**: módulos compuestos de elementos menores repetidos | Submódulos y supermódulos | — | ⏳ | RP6 |
| 3 | 3.9 | **Supermódulos**: grupos de módulos que se usan como un solo módulo | Submódulos y supermódulos | — | ⏳ | RP6 (al final). La app trabaja un módulo por capa |
| 3 | 3.10 | **El encuentro de los cuatro círculos**: disposición lineal, cuadrada o rectangular, en rombo, triangular y circular (fig. 15) | Submódulos y supermódulos | — | ⏳ | RP6 (generador de supermódulos) |
| 3 | 3.11 | **Reflexión**: una forma espejada, con rotaciones distintas a la original (fig. 16) | Repetición y reflexión | Layout › Advanced › Reflection (None, Columns, Rows, Both) | ✅ | RP3 |
| 3 | 3.12 | **Simetría**: una parte componente y su reflexión | Repetición y reflexión | Layout › Reflection | 🟡 | Se espeja el módulo, no se construye la forma simétrica |

## Capítulo 4 · Estructura

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 4 | 4.1 | **Estructura formal**: líneas rígidas y matemáticas; repetición, gradación, radiación | Tipos de estructura | Layout (Repetition y Radiation) | ✅ | |
| 4 | 4.2 | **Estructura semiformal**: casi regular; similitud, anomalía, concentración | Tipos de estructura | Similarity, Anomaly, Concentration | ✅ | |
| 4 | 4.3 | **Estructura informal**: sin líneas estructurales, organización libre | Tipos de estructura | Concentration › Hotspots; Contrast | 🟡 | S4: distribución visual libre, sin retícula |
| 4 | 4.4 | **Estructura inactiva**: líneas solo conceptuales; no dividen el espacio (fig. 19a) | Activa / inactiva | Layout con *Visible lines* apagado (por defecto) | ✅ | |
| 4 | 4.5 | **Estructura activa — subdivisiones independientes**: cada módulo en su espacio, con fondo propio o alternancia positivo/negativo (fig. 19b) | Estructura activa | Layout › Advanced › Checkerboard inversion; Clip cell | ✅ | |
| 4 | 4.6 | **Estructura activa — módulo excéntrico y recortado** por los límites (fig. 19c) | Estructura activa | Module › Offset X / Y con Layout › Clip cell | ✅ | |
| 4 | 4.7 | **Estructura activa — el módulo penetra la subdivisión vecina** (fig. 19d) | Estructura activa | Módulo mayor que la celda, sin Clip cell | 🟡 | INT4 |
| 4 | 4.8 | **Estructura activa — espacio aislado reunido con el de un vecino** (fig. 19e) | Estructura activa | Layout › Cell mix `Merged` | 🟡 | Solo bloques de 2×2 en retícula básica y alternada |
| 4 | 4.9 | **Estructura invisible**: líneas conceptuales, sin grosor | Visible / invisible | Layout con *Visible lines* apagado | ✅ | |
| 4 | 4.10 | **Estructura visible — líneas reales** con grosor, que interactúan con los módulos (fig. 20a) | Visible / invisible | Layout › Advanced › Visible lines (Line color, Line width) | ✅ | E2. Son diseño y se exportan |
| 4 | 4.11 | **Líneas visibles positivas y negativas** (fig. 20b, 20c) | Visible / invisible | Visible lines › Line color (el color del fondo da la línea negativa) | ✅ | E1 |
| 4 | 4.12 | **Solo verticales u horizontales, o alternadas** (fig. 20d) | Visible / invisible | Visible lines › Line direction, Line spacing | ✅ | E3 |
| 4 | 4.13 | **Estructura de repetición**: módulos con espacio igual alrededor | Estructura de repetición | Layout › Repetition | ✅ | |
| 4 | 4.14 | **El enrejado básico** (fig. 21) | Estructura de repetición | Layout › Grid structure variation `Grid` | ✅ | |
| 4 | 4.15 | **Cambio de proporción**: subdivisiones rectangulares (fig. 22a) | Variaciones del enrejado | Layout › Advanced › Col ratio / Row ratio (ritmo A:B); Columns y Rows distintos | ✅ | |
| 4 | 4.16 | **Cambio de dirección**: líneas inclinadas (fig. 22b) | Variaciones del enrejado | Layout › `Diagonal` con Shear angle | ✅ | |
| 4 | 4.17 | **Deslizamiento**: cada fila corrida (fig. 22c) | Variaciones del enrejado | Layout › `Brick` con Row offset | ✅ | |
| 4 | 4.18 | **Curvatura o quebrantamiento** (fig. 22d) | Variaciones del enrejado | Layout › `Curved`, `Zigzag` con Wave amount | ✅ | |
| 4 | 4.19 | **Reflexión de las subdivisiones**: fila espejada, alternada o regular (fig. 22e) | Variaciones del enrejado | Layout › Reflection | 🟡 | Se espeja el módulo, no las líneas de la estructura |
| 4 | 4.20 | **Combinación**: subdivisiones unidas en formas mayores (fig. 22f) | Variaciones del enrejado | Layout › Cell mix `Merged` | 🟡 | RP2. Solo bloques de 2×2 |
| 4 | 4.21 | **Divisiones ulteriores**: subdivisiones divididas en formas menores (fig. 22g) | Variaciones del enrejado | Layout › Cell mix `Divided` | 🟡 | RP2. Solo bloques de 2×2 |
| 4 | 4.22 | **El enrejado triangular** (fig. 22h) | Variaciones del enrejado | Layout › `Triangular` | ✅ | |
| 4 | 4.23 | **El enrejado hexagonal** (fig. 22i) | Variaciones del enrejado | Layout › `Hexagonal` | ✅ | RP1 |
| 4 | 4.24 | **Estructura de múltiple repetición**: más de una clase de subdivisión, entretejidas (fig. 23) | Estructura de repetición | Layout › Module placement `Both` con Intersection size | 🟡 | E4. Dos clases de módulo entretejidas; no dos retículas de formas distintas |
| 4 | 4.25 | **Módulos en el centro o en las intersecciones** de las subdivisiones | Módulos y subdivisiones | Layout › Module placement `Centers`, `Intersections`, `Both` | ✅ | E4 |
| 4 | 4.26 | **Módulos que ajustan, o más pequeños o más grandes** que la subdivisión | Módulos y subdivisiones | Layout › Module size; Module › Width / Height; Container | ✅ | |
| 4 | 4.27 | **Repetición de posición**: todos colocados igual dentro de su subdivisión | Repetición de posición | Layout (por defecto); Contrast › Position rompe la regla | ✅ | |
| 4 | 4.28 | **Superposición de estructuras de repetición** (fig. 24) | Superposición | Varias capas con su propia retícula | ✅ | RP5 |
| 4 | 4.29 | **Supermódulos en estructuras activas** | Submódulos y supermódulos | — | ⏳ | RP6 |

## Capítulo 5 · Similitud

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 5 | 5.1 | **Similitud de módulos**: parecidos en figura, tamaño, color y textura | Similitud de módulos | Similarity › Visual kinship type, Fluctuation intensity | ✅ | |
| 5 | 5.2 | **Asociación**: formas de una misma familia, clasificación común (fig. 27) | Similitud de figura | Similarity › Advanced › Association (Round, Angular, Lines, Numbers) con Association mix | ✅ | S1 |
| 5 | 5.3 | **Imperfección**: variaciones de una figura ideal, cortada o quebrada (fig. 28) | Similitud de figura | Similarity › Advanced › Imperfection (Cut, Broken) con Imperfect modules | ✅ | S2 |
| 5 | 5.4 | **Distorsión espacial**: la figura vista desde otro ángulo (fig. 29) | Similitud de figura | Similarity › `3D tilt` | ✅ | |
| 5 | 5.5 | **Unión o sustracción**: formas compuestas de formas menores unidas o restadas (fig. 30) | Similitud de figura | — | ⏳ | Sin ID; ligado a INT1 |
| 5 | 5.6 | **Tensión o compresión**: la forma estirada o apretada, como algo elástico (fig. 31) | Similitud de figura | Similarity › `Elastic` | ✅ | |
| 5 | 5.7 | **Similitud y gradación**: la similitud no debe mostrar un cambio sistemático (fig. 32) | Diferenciar conceptos | Similarity frente a Gradation (paneles separados) | ✅ | |
| 5 | 5.8 | **Subdivisiones estructurales similares**: cuadriláteros, triángulos o hexágonos de lados desiguales (fig. 33) | Estructura de similitud | — | ⏳ | S3: retícula de celdas irregulares |
| 5 | 5.9 | **Distribución visual**: módulos sin retícula, con espacio similar para cada uno | Estructura de similitud | Similarity › Spatial cell jitter | 🟡 | S4: distribución libre de verdad |

## Capítulo 6 · Gradación

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 6 | 6.1 | **Gradación de figura** de un módulo a otro (figs. 36, 37) | Gradación de módulos | Gradation › Attribute `Shape` con Becomes | ✅ | G5. Interpola contornos entre cualquier pareja de formas |
| 6 | 6.2 | **Gradación de tamaño** | Gradación de módulos | Gradation › Attribute `Scale` | ✅ | |
| 6 | 6.3 | **Gradación de color** | Gradación de módulos | — | ⏳ | Sin ID. Relacionada con C5 |
| 6 | 6.4 | **Gradación de textura** | Gradación de módulos | Gradation › Attribute `Texture` | ✅ | G6 |
| 6 | 6.5 | **Rotación en el plano**: cambio gradual de dirección (fig. 35a) | Gradación en el plano | Gradation › `Rotate` | ✅ | |
| 6 | 6.6 | **Progresión en el plano**: cambio gradual de posición dentro de la subdivisión (fig. 35b) | Gradación en el plano | Gradation › `Drift` | ✅ | |
| 6 | 6.7 | **Rotación espacial**: el módulo gira respecto al plano de la imagen (fig. 35c) | Gradación espacial | Gradation › `Depth` | ✅ | |
| 6 | 6.8 | **Progresión espacial**: el aumento o disminución de tamaño sugiere profundidad (fig. 35d) | Gradación espacial | Gradation › `Scale` | ✅ | |
| 6 | 6.9 | **Unión o sustracción en la figura**: cambio gradual de posición de sub-módulos (fig. 35e) | Gradación en la figura | — | ⏳ | Sin ID |
| 6 | 6.10 | **Tensión o compresión en la figura** (fig. 35f) | Gradación en la figura | Gradation › `Shape` | 🟡 | Cambia la figura, no una deformación elástica |
| 6 | 6.11 | **Camino de la gradación**: directo o indirecto, por figuras intermedias (fig. 36) | Camino | Gradation › `Shape` › Becomes | 🟡 | Solo directo; el indirecto se hace con capas |
| 6 | 6.12 | **Velocidad de gradación**: pocos pasos = rápida, muchos = lenta (figs. 37, 38) | Velocidad | Gradation › Range, Cycles, Acceleration | ✅ | G4 |
| 6 | 6.13 | **Movimiento paralelo** (fig. 39) | Modelos de gradación | Gradation › Pathway `Horizontal`, `Vertical`, `Diagonal` | ✅ | |
| 6 | 6.14 | **Movimiento concéntrico** (fig. 40) | Modelos de gradación | Gradation › Pathway `Concentric` | ✅ | |
| 6 | 6.15 | **Movimiento en zigzag** (fig. 41) | Modelos de gradación | Gradation › Pathway `Zigzag` | ✅ | G1 |
| 6 | 6.16 | **Reinicio o ida y vuelta** (1-2-3-4-5-1... frente a 1-2-3-4-5-4-3-2-1) (fig. 42) | Modelos de gradación | Gradation › Advanced › Sequence (Restart, Ping-pong) | ✅ | G2 |
| 6 | 6.17 | **Cambio de tamaño y/o proporción de las subdivisiones** (fig. 44a) | Estructura de gradación | Layout › Advanced › Col gradation, Row gradation | ✅ | G7 |
| 6 | 6.18 | **Cambio de dirección, deslizamiento y curvatura** de la estructura de gradación (fig. 44b, c, d) | Estructura de gradación | Layout › `Diagonal`, `Brick`, `Curved`, `Zigzag` con la gradación de estructura | ✅ | |
| 6 | 6.19 | **Reflexión, combinación y división ulterior** en gradación (fig. 44e, f, g) | Estructura de gradación | Layout › Reflection, Cell mix | 🟡 | Sin gradación de tamaño dentro de cada bloque |
| 6 | 6.20 | **Enrejados triangular y hexagonal en gradación** (fig. 44h, i) | Estructura de gradación | Layout › `Triangular`, `Hexagonal` | 🟡 | La gradación de estructura no aplica al panal |
| 6 | 6.21 | **Gradación alternada**: filas A y B en sentidos opuestos (figs. 43, 45b) | Gradación alternada | Gradation › Advanced › Alternate rows | ✅ | G3 |
| 6 | 6.22 | **Gradación inversa**: los módulos que disminuyen dejan sitio a un conjunto inverso (fig. 45a) | Gradación alternada | Dos capas: una con Scale ascendente y otra con Reverse | 🟡 | Sin control propio |
| 6 | 6.23 | **Módulos y estructuras en gradación**: módulos en gradación sobre una estructura de repetición, módulos repetidos sobre una estructura de gradación, o ambas | Relación | Gradation (atributos) + Layout › gradación de estructura | ✅ | Se combinan libremente |

## Capítulo 7 · Radiación

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 7 | 7.1 | **Características**: multisimétrica, con foco vigoroso, genera energía óptica | Estructura de radiación | Layout › Radiation | ✅ | |
| 7 | 7.2 | **Centro de radiación**: no siempre es el centro físico del diseño | Estructura de radiación | Estado `centerX / centerY` | 🟡 | Existe en el estado, sin control en la interfaz |
| 7 | 7.3 | **Direcciones de radiación**: de las líneas estructurales y de los módulos | Estructura de radiación | Radiation › Advanced › Module orientation, Direction | ✅ | R5 |
| 7 | 7.4 | **Centrífuga básica**: líneas rectas desde el centro (fig. 48a) | Estructura centrífuga | Radiation › Scheme `Centrifugal` | ✅ | |
| 7 | 7.5 | **Curvatura o quebrantamiento de líneas** (fig. 48b) | Estructura centrífuga | Radiation › Spiral twist (curvatura) | 🟡 | Curvas sí, quebrantamiento no |
| 7 | 7.6 | **Centro en posición excéntrica** (fig. 48c) | Estructura centrífuga | Estado `centerX / centerY` | 🟡 | Sin control en la interfaz |
| 7 | 7.7 | **Apertura del centro** redondo, ovalado, triangular, cuadrado o poligonal (fig. 48d) | Estructura centrífuga | Radiation › Advanced › Open center (+ Ring shape) | ✅ | R2. Las líneas tangentes al agujero poligonal no |
| 7 | 7.8 | **Centros múltiples, abriendo el centro** (fig. 48e) | Estructura centrífuga | — | ⏳ | Sin ID |
| 7 | 7.9 | **Centros múltiples, dividiendo y deslizando el centro** (fig. 48f) | Estructura centrífuga | Radiation › Scheme `Multi-center` con Centers (2 a 6) | ✅ | R7 |
| 7 | 7.10 | **Centros múltiples ocultos**, combinando sectores excéntricos (fig. 48g) | Estructura centrífuga | — | ⏳ | Sin ID |
| 7 | 7.11 | **Concéntrica básica**: capas de círculos espaciados (fig. 49a) | Estructura concéntrica | Radiation › Scheme `Concentric` | ✅ | |
| 7 | 7.12 | **Enderezamiento, curvatura o quebrantamiento** de las capas: cuadrados, polígonos (fig. 49b) | Estructura concéntrica | Radiation › Advanced › Ring shape (Triangle, Square, Hexagon) | ✅ | R4 |
| 7 | 7.13 | **Traslado de los centros** de cada círculo a lo largo de una línea (fig. 49c) | Estructura concéntrica | — | ⏳ | Sin ID |
| 7 | 7.14 | **La espiral** (fig. 49d) | Estructura concéntrica | Radiation › Scheme `Spiral` con Spiral twist | ✅ | |
| 7 | 7.15 | **Centros múltiples en concéntrica** (fig. 49e) | Estructura concéntrica | Radiation › `Multi-center` | 🟡 | |
| 7 | 7.16 | **Centros distorsionados u ocultos** (fig. 49f) | Estructura concéntrica | — | ⏳ | Sin ID |
| 7 | 7.17 | **Rotación gradual de capas concéntricas** (fig. 49g) | Estructura concéntrica | Radiation › Advanced › Ring rotation | ✅ | R3 |
| 7 | 7.18 | **Capas concéntricas con radiaciones centrífugas** (fig. 49h) | Estructura concéntrica | Radiation › Angular rays + Concentric rings | ✅ | |
| 7 | 7.19 | **Capas concéntricas reorganizadas**, entretejidas (fig. 49i) | Estructura concéntrica | — | ⏳ | Sin ID |
| 7 | 7.20 | **Centrípeta básica**: ángulos que apuntan al centro (fig. 50a) | Estructura centrípeta | Radiation › Scheme `Centripetal` | ✅ | R1 |
| 7 | 7.21 | **Cambio direccional, curvatura y quebrantamiento** de líneas centrípetas (fig. 50b, c) | Estructura centrípeta | — | ⏳ | Sin ID |
| 7 | 7.22 | **Apertura del centro** de una centrípeta (fig. 50d) | Estructura centrípeta | Radiation › Open center | 🟡 | |
| 7 | 7.23 | **Superposición de estructuras de radiación**; **radiación y repetición**; **radiación y gradación** (figs. 51, 52) | Combinaciones | Varias capas; Gradation en esquema polar | ✅ | RP5 |
| 7 | 7.24 | **Subdivisiones estructurales y módulos**: los módulos se ajustan y giran con ellas (fig. 53) | Módulos en radiación | Radiation › Module orientation; Clip cell | ✅ | |
| 7 | 7.25 | **Movimiento concéntrico**: progresión hacia el centro (fig. 54a) | Módulos en radiación | Gradation › Pathway `Concentric` | ✅ | |
| 7 | 7.26 | **Módulos que son esquemas de radiación en miniatura** (fig. 54b) | Módulos en radiación | — | ⏳ | RP6 |
| 7 | 7.27 | **Módulos de tamaño mayor**, casi tan grandes como el esquema (fig. 54c) | Módulos en radiación | Module › Width / Height | 🟡 | INT4 para sus interrelaciones |
| 7 | 7.28 | **Radiación irregular y distorsionada**; fotografía o medios mecánicos (fig. 55) | Variantes | Anomaly y Similarity sobre el esquema radial | 🟡 | Sin distorsión mecánica del esquema |

## Capítulo 8 · Anomalía

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 8 | 8.1 | **Atraer la atención**: un centro de interés dentro de una zona restringida | Propósitos | Anomaly › Type `Focal` | ✅ | |
| 8 | 8.2 | **Aliviar la monotonía**: anomalías esparcidas, casual o sistemáticamente | Propósitos | Anomaly › Distribution (Scattered regular, Scattered random) con Count y Seed | ✅ | A1 |
| 8 | 8.3 | **Transformar la regularidad**: una zona con otra clase de regularidad (figs. 56c, 57c) | Propósitos | — | ⏳ | A2 |
| 8 | 8.4 | **Quebrar la regularidad**: zonas desordenadas, rasgadas o disueltas (figs. 56d, 57d) | Propósitos | Anomaly › Type `Rupture`, `Void` | ✅ | |
| 8 | 8.5 | **Anomalía entre módulos**: concentrada (fig. 56a) | Anomalía entre módulos | Anomaly › Distribution `Single` | ✅ | |
| 8 | 8.6 | **Anomalía entre módulos**: esparcida (fig. 56b) | Anomalía entre módulos | Anomaly › Distribution `Scattered` | ✅ | A1 |
| 8 | 8.7 | **Anomalía dentro de estructuras**: la estructura se estira o comprime (fig. 57a) | Anomalía dentro de estructuras | Anomaly › Type `Swell` | ✅ | Deforma los módulos, no las líneas visibles |
| 8 | 8.8 | **Anomalía dentro de estructuras**: líneas estructurales distorsionadas o dislocadas (fig. 57d) | Anomalía dentro de estructuras | — | ⏳ | A4: deformar las líneas de estructura visibles |
| 8 | 8.9 | **Efectos sobre el módulo**: forzado a cambiar de posición o dirección, recortado por líneas activas, distorsionado, anómalo con regularidad entre sí, variablemente anómalo | Efectos sobre los módulos | Anomaly › Deviates in (forma, escala, rotación, posición) | ✅ | A3 |
| 8 | 8.10 | **La anomalía es comparativa**: más o menos anómalo, sutil o prominente | Principio | Anomaly › Severity | ✅ | |

## Capítulo 9 · Contraste

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 9 | 9.1 | **Contraste, regularidad y anomalía**: el contraste existe dentro de la propia regularidad | Principio | Contrast y Anomaly | ✅ | |
| 9 | 9.2 | **Contraste de figura** (fig. 59a) | Elementos visuales | Contrast › Dimension `Shape` con Minority Shape | ✅ | |
| 9 | 9.3 | **Contraste de tamaño** (fig. 59b) | Elementos visuales | Contrast › `Scale` | ✅ | |
| 9 | 9.4 | **Contraste de color**: luminoso/oscuro, brillante/opaco, cálido/frío (fig. 59c) | Elementos visuales | Contrast › `Tone` y Accent color | 🟡 | C7 hecho. C5: más allá del acento |
| 9 | 9.5 | **Contraste de textura**: suave/rugoso, pulido/tosco (fig. 59d) | Elementos visuales | Contrast › `Texture` | ✅ | C4 |
| 9 | 9.6 | **Contraste de dirección**: a 90º es el máximo (fig. 59e) | Elementos de relación | Contrast › `Angle` con Clash Angle | ✅ | |
| 9 | 9.7 | **Contraste de posición**: arriba/abajo, izquierda/derecha, céntrico/excéntrico (fig. 59f) | Elementos de relación | Contrast › `Position` con Shift y Shift direction | ✅ | C1 |
| 9 | 9.8 | **Contraste de espacio**: ocupado/vacío, positivo/negativo, plano/ilusorio (fig. 59g) | Elementos de relación | Contrast › `Space` | ✅ | C2 |
| 9 | 9.9 | **Contraste de gravedad**: estable/inestable, ligero/pesado (fig. 59h) | Elementos de relación | — | ➖ | C3: se consigue con Position a 90º |
| 9 | 9.10 | **Contrastes dentro de una forma**: partes angulares y curvas en un mismo módulo (fig. 60) | Contraste dentro de una forma | Module › Shape (formas compuestas: herradura, creciente, gota) | 🟡 | No hay editor de formas propias |
| 9 | 9.11 | **La estructura de contraste**: informal, sin regularidad estricta; equilibrio informal (fig. 61) | Estructura de contraste | — | ⏳ | C6: la minoría tira desde el borde (fig. 61b) |
| 9 | 9.12 | **Dominación de una mayoría**: un tipo de módulo ocupa más espacio | Dominancia y énfasis | Contrast › Dominance ratio | ✅ | |
| 9 | 9.13 | **Énfasis de una minoría**: llama la atención como una anomalía | Dominancia y énfasis | Contrast › Accent color | ✅ | |
| 9 | 9.14 | **Equilibrio** de mayoría y minoría, como pesos en una balanza (fig. 61b) | Dominancia y énfasis | — | ⏳ | C6 |

## Capítulo 10 · Concentración

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 10 | 10.1 | **Ausencias frecuentes**: módulos que desaparecen por ser del color del fondo (fig. 64a) | Concentración en estructuras formales | Concentration › Method `Absence` | ✅ | K4 |
| 10 | 10.2 | **Cambios posicionales** dentro de las subdivisiones (fig. 64b) | Concentración en estructuras formales | Concentration › Method `Move` | ✅ | |
| 10 | 10.3 | **Cambios cuantitativos**: más o menos módulos por subdivisión (fig. 64c) | Concentración en estructuras formales | — | ⏳ | K5: varios módulos por celda |
| 10 | 10.4 | **Concentración hacia un punto** (fig. 65a) | Estructura de concentración | Concentration › Structure `Point` | ✅ | |
| 10 | 10.5 | **Concentración desde un punto** (fig. 65b) | Estructura de concentración | Concentration › `Void` | ✅ | |
| 10 | 10.6 | **Concentración hacia una línea** (fig. 65c) | Estructura de concentración | Concentration › `Line` con Line axis | ✅ | |
| 10 | 10.7 | **Concentración desde una línea** (fig. 65d) | Estructura de concentración | Concentration › `Away from line` | ✅ | K1 |
| 10 | 10.8 | **Concentración libre**: grupos de densidad y escasez variables (fig. 65e) | Estructura de concentración | Concentration › `Hotspots` | 🟡 | K3: hoy son solo dos focos |
| 10 | 10.9 | **Superconcentración**: todo el diseño agrupado densamente (fig. 65f) | Estructura de concentración | Concentration › `Dense` con Soft edge | ✅ | K2 |
| 10 | 10.10 | **Desconcentración**: todo el diseño esparcido (fig. 65g) | Estructura de concentración | Concentration › `Sparse` con Soft edge | ✅ | K2 |
| 10 | 10.11 | **Más de un tipo de módulo**: uno concentrado y otro disperso | Combinaciones | Varias capas, cada una con su concentración | ✅ | |
| 10 | 10.12 | **Módulos en estructuras de concentración**: muchos módulos pequeños para construir la densidad | Módulos | Layout › Columns y Rows (hasta 50) | ✅ | |

## Capítulo 11 · Textura

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 11 | 11.1 | **Textura decorativa**: adorna la superficie y queda subordinada a la figura (fig. 67a) | Textura visual | — | ➖ | T1: descartada; se eliminó al reemplazar el control |
| 11 | 11.2 | **Textura espontánea**: parte del proceso de creación; figura y textura inseparables (fig. 67b) | Textura visual | Texture › Jitter, Line skipping, Strand crossing, Perimeter undulation | ✅ | Deformación de geometría |
| 11 | 11.3 | **Textura mecánica**: granulado fotográfico, retícula, tipografía (fig. 67c) | Textura visual | — | ➖ | T1 |
| 11 | 11.4 | **Dibujo y pintura**: líneas a mano alzada (fig. 68a) | Fabricación de la textura visual | Texture › Jitter | 🟡 | |
| 11 | 11.5 | **Raspado y rascado** (fig. 68f) | Fabricación de la textura visual | Texture › Line skipping | 🟡 | |
| 11 | 11.6 | **Impresión, vaporización, manchado, ahumado, procesos fotográficos** | Fabricación de la textura visual | — | ➖ | Técnicas de taller; no aplican a vectores |
| 11 | 11.7 | **Collage**: materiales con y sin imágenes (fig. 69) | Collage | — | 🚫 | |
| 11 | 11.8 | **Textura táctil**: natural asequible, modificada y organizada (fig. 70) | Textura táctil | — | 🚫 | Es física, no visual |
| 11 | 11.9 | **Luz y color en la textura táctil** | Textura táctil | — | 🚫 | |
| 11 | 11.10 | **Textura en gradación** (tipos de imprenta de tamaño variable, fig. 71) | Textura en el diseño | Gradation › Attribute `Texture` | ✅ | G6, T2 |

## Capítulo 12 · Espacio

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 12 | 12.1 | **Espacio positivo y negativo**; relaciones reversibles de figura y fondo (fig. 72a) | Espacio positivo y negativo | Botón de figura/fondo; Contrast › `Space`; Checkerboard inversion | ✅ | |
| 12 | 12.2 | **Espacio liso**: las formas son planas y paralelas al plano de la imagen (fig. 72b) | Espacio liso e ilusorio | Space apagado (por defecto) | ✅ | |
| 12 | 12.3 | **Espacio ilusorio**: formas que avanzan, retroceden, oblicuas o tridimensionales (fig. 72d) | Espacio liso e ilusorio | Space › Mode | ✅ | |
| 12 | 12.4 | **Superposición** como señal de espacio (fig. 73a) | Formas lisas en espacio ilusorio | Capas | ✅ | |
| 12 | 12.5 | **Cambio en tamaño**: más grande = más cerca (fig. 73b) | Formas lisas en espacio ilusorio | Gradation › `Scale` | 🟡 | SP1: perspectiva con disminución de tamaño |
| 12 | 12.6 | **Cambio en color y en textura** como señal de profundidad (fig. 73c, d) | Formas lisas en espacio ilusorio | Space › Facet shading contrast | 🟡 | SP3: pistas de tamaño, tono y textura |
| 12 | 12.7 | **Cambio en el punto de vista** (fig. 73e) | Formas lisas en espacio ilusorio | Space › `3D tilt`; Gradation › `Depth` | ✅ | |
| 12 | 12.8 | **Curvatura o quebrantamiento** de formas lisas (fig. 73f) | Formas lisas en espacio ilusorio | Texture › Perimeter undulation | 🟡 | |
| 12 | 12.9 | **Agregado de sombra**: unida o separada (fig. 73g) | Formas lisas en espacio ilusorio | — | ⏳ | SP2 |
| 12 | 12.10 | **Volumen y profundidad**: sistemas isométricos de proyección (fig. 74b) | Volumen y profundidad | Space › `Isometric` con Extrusion depth, Projection angle | ✅ | |
| 12 | 12.11 | **Perspectiva** con disminución gradual de tamaño (fig. 74c, d) | Volumen y profundidad | — | ⏳ | SP1 |
| 12 | 12.12 | **Planos dibujados**: opacos, o transparentes como marcos espaciales (fig. 75a) | Representación del plano | — | ⏳ | SP4 |
| 12 | 12.13 | **Planos sólidos**: sin ambigüedad; los de color varían el volumen (fig. 75b) | Representación del plano | Space › Facet shading contrast | ✅ | |
| 12 | 12.14 | **Planos de textura uniforme** (fig. 75c) | Representación del plano | — | ⏳ | SP3 |
| 12 | 12.15 | **Planos de color o textura en gradación** (fig. 75d) | Representación del plano | — | ⏳ | SP3 |
| 12 | 12.16 | **Espacio fluctuante**: avanza y retrocede (fig. 76a) | Espacio fluctuante y conflictivo | Space › `Fluctuating` | ✅ | |
| 12 | 12.17 | **Espacio conflictivo**: absurdo, imposible de interpretar (fig. 76b) | Espacio fluctuante y conflictivo | Space › `Paradox` | ✅ | |
| 12 | 12.18 | **Profundidad por capa** | Espacio | — | ⏳ | SP5 (depende de las interrelaciones) |

## Segunda parte · Diseño tridimensional

| Cap. | ID | Concepto (qué es) | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-- | :-: | :-- |
| 2ª parte | P2.1 | Planos seriados, estructuras de pared, prismas y cilindros, repetición tridimensional, estructuras poliédricas, planos triangulares, estructura lineal, capas lineales y líneas enlazadas | Diseño tridimensional | — | 🚫 | La app es bidimensional |

## Controles de la app sin concepto directo del libro

| Control | Para qué sirve | Notas |
| :-- | :-- | :-- |
| Capas (hasta 5), orden, visibilidad | Un módulo por capa; superposición de estructuras | Cubre 2.12, 4.28 y 7.23 |
| Aspect ratio | El marco del diseño | Cubre 1.14 |
| Guías de pantalla y su color; Show container | Ayudas de trabajo; no se exportan | Fuera del libro |
| Seed, Undo / Redo, Save / Open, exportar SVG y PNG | Herramientas de trabajo | Fuera del libro |
| Teclado en las cajas de valor, secciones *Advanced* | Usabilidad | Ver `STUDIO_CONTROLS_GUIDE.md`, sección 5 |

---

## Resumen

Primera parte del libro (cap. 1 a 12): **199 conceptos** · ✅ **118** · 🟡 **39** · ⏳ **33** · ➖ **5** · 🚫 **4**.

Lo pendiente (⏳) se concentra en: interrelaciones entre capas (INT1 a INT4), supermódulos (RP6), espacio (SP1 a SP5), retículas irregulares y distribución libre (S3, S4), zonas y equilibrio (C6, C5), anomalías con otra regularidad (A2, A4), más focos y varios módulos por celda (K3, K5), y algunas variantes de la radiación sin ID todavía.
