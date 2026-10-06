# Design concepts in app — mapa de conceptos de diseño

Este documento recorre los **conceptos de diseño** en los que se basa la app, uno por uno, y dice **qué control de la interfaz los implementa**, o por qué no. Es la fuente única de los IDs: [`BACKLOG.md`](./BACKLOG.md) guarda solo las prioridades de lo pendiente y usa estos mismos IDs, y [`../STUDIO_CONTROLS_GUIDE.md`](../STUDIO_CONTROLS_GUIDE.md) explica cómo funciona cada control.

**Columnas.** *ID*: la letra indica la sección (B conceptos básicos, F forma, INT interrelación de formas, RP repetición, E estructura, S similitud, G gradación, R radiación, A anomalía, C contraste, K concentración, T textura, SP espacio) y el número, el orden dentro de ella. *Concepto*: qué es. *Grupo*: la clase de concepto a la que pertenece dentro de la sección. *Control en la app*: panel › control. *Estado*. *Notas*: límites y detalles.

**Estados.** ✅ hecho · 🟡 parcial (se cubre una parte, o con otro mecanismo) · ⏳ pendiente · ➖ descartado (con el motivo) · 🚫 fuera de alcance (la app es bidimensional y digital; queda registrado como referencia).

---

## Conceptos básicos

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| B1 | **Punto**: indica posición; no tiene largo ni ancho | Elementos conceptuales | Module › Shape (círculo pequeño) y Width / Height | 🟡 | Un punto es un módulo muy pequeño; no hay "punto" como elemento aparte |
| B2 | **Línea**: recorrido de un punto; largo, sin ancho | Elementos conceptuales | Module › Shape `line`, Width, Stroke width | ✅ | La línea solo tiene largo; el ancho es el grosor del trazo |
| B3 | **Plano**: recorrido de una línea; largo y ancho, sin grosor | Elementos conceptuales | Module › Shape (círculo, cuadrado, triángulo, hexágono...) | ✅ |  |
| B4 | **Volumen**: recorrido de un plano; en 2D es ilusorio | Elementos conceptuales | Space › Mode (Isometric, 3D tilt, Fluctuating, Paradox) | ✅ | Ver Espacio |
| B5 | **Forma**: todo lo que se ve tiene forma | Elementos visuales | Module › Shape (22 formas) | ✅ |  |
| B6 | **Medida**: tamaño de una forma | Elementos visuales | Module › Width, Height (5 a 2000 px) | ✅ |  |
| B7 | **Color**: blanco, negro, grises y cromáticos | Elementos visuales | Module › Shape color; Contrast › Tone y Accent color; botón de invertir figura/fondo | 🟡 | Un color por capa; más colores con varias capas. Color por zonas: pendiente (ver C4) |
| B8 | **Textura**: cualidades de la superficie | Elementos visuales | Texture › Jitter, Line skipping, Random lines, Plane wave | ✅ | Deforma la geometría; ver Textura |
| B9 | **Dirección**: depende de cómo se relaciona la forma con el observador o el marco | Elementos de relación | Module › Rotation; Layout › Direction; Contrast › Angle; Gradation › Rotate | ✅ |  |
| B10 | **Posición**: se juzga por su relación con el marco o la estructura | Elementos de relación | Module › Offset X / Y; Layout › Module placement; Contrast › Position; Anomaly | ✅ |  |
| B11 | **Espacio**: ocupado o vacío, liso o ilusorio | Elementos de relación | Space (panel entero); Checkerboard inversion; botón de figura/fondo | ✅ | Ver Espacio |
| B12 | **Gravedad**: sensación psicológica de pesadez o liviandad | Elementos de relación | — | ➖ | Descartado como control propio: se consigue con Contrast › Position a 90º (ver C9) |
| B13 | **Representación, significado y función** | Elementos prácticos | — | 🚫 | Pertenecen al diseño aplicado; fuera del alcance de la app |
| B14 | **Referencia al marco**: los límites del diseño | Marco | Canvas › Aspect ratio (1:1, 9:16, 4:3, 3:4, 16:9) | ✅ |  |
| B15 | **Plano de la imagen**: la superficie sobre la que se pinta | Marco | Canvas (lienzo) | ✅ |  |
| B16 | **Forma y estructura**: la estructura gobierna la organización | Principio | Layout (Repetition y Radiation) | ✅ | Ver Estructura |

## Forma

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| F1 | **La forma como punto**: reconocida por ser pequeña y simple | Forma y elementos conceptuales | Module › Width / Height | 🟡 | Ver B1 |
| F2 | **La forma como línea**: total, cuerpo y extremidades | Forma y elementos conceptuales | Module › Shape `line`, Stroke width | 🟡 | La forma total sí; el cuerpo y las extremidades de la línea no tienen control propio |
| F3 | **La forma como plano — geométricas**: construidas matemáticamente | Formas planas | Module › Shape (círculo, cuadrado, triángulo, hexágono, paralelogramo, cruz) | ✅ |  |
| F4 | **Formas planas — orgánicas**: curvas libres | Formas planas | Module › Shape (onda, herradura, creciente, gota) | 🟡 | Hay cuatro; no se dibujan formas libres |
| F5 | **Formas planas — rectilíneas e irregulares** | Formas planas | — | ⏳ | La app no permite dibujar formas propias; solo hay la biblioteca de 15 |
| F6 | **Formas planas — manuscritas y accidentales** | Formas planas | Texture › Jitter y Plane wave | 🟡 | La textura de geometría imita el trazo a mano |
| F7 | **La forma como volumen**: ilusoria, se trata en el cap. 12 | Forma y elementos conceptuales | Space | ✅ | Ilusoria; ver Espacio |
| F8 | **Formas positivas y negativas**: ocupa un espacio / es un espacio vacío | Figura y fondo | Botón de invertir figura/fondo; Layout › Checkerboard inversion; Contrast › Space | ✅ |  |
| F9 | **Distribución del color**: forma blanca/negra sobre fondo blanco/negro | Figura y fondo | Botón de invertir figura/fondo; Module › Stroke / Fill; Shape color | 🟡 | Las cuatro combinaciones de dos colores sí; las 16 variantes de cuatro zonas no |

## Interrelación de formas

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| INT1 | **Distanciamiento** de dos formas | Interrelación de formas | Capas (Offset X / Y de cada capa) | 🟡 |  |
| INT2 | **Toque**: las formas empiezan a tocarse | Interrelación de formas | — | ⏳ | Calcular la distancia para que se rocen |
| INT3 | **Superposición**: una forma parece estar encima de la otra | Interrelación de formas | Capas (orden de capas) | ✅ | Cada capa tapa a la inferior |
| INT4 | **Penetración**: ambas formas transparentes, contornos visibles | Interrelación de formas | Capas en modo Stroke | 🟡 |  |
| INT5 | **Unión**: reunidas en una forma nueva y mayor | Interrelación de formas | — | ⏳ |  |
| INT6 | **Sustracción**: una forma invisible tapa a la visible | Interrelación de formas | — | ⏳ | Se resolvería con composición (`destination-out`) |
| INT7 | **Intersección**: solo se ve la parte común | Interrelación de formas | — | ⏳ | Se resolvería con composición (`destination-in`) |
| INT8 | **Coincidencia**: las dos formas se convierten en una | Interrelación de formas | — | ⏳ | Alinear los centros |
| INT9 | **Efectos espaciales de las interrelaciones**: cada una produce un efecto espacial distinto | Interrelación de formas | — | ⏳ | Va al final de todo, porque depende de las capas |

## Repetición

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| RP1 | **Repetición de módulos** de igual figura, tamaño, color y textura | Repetición básica | Layout › Repetition (Columns, Rows, Module size) | ✅ |  |
| RP2 | **Direcciones repetidas**: todos mirando igual | Repetición de dirección | Layout › Advanced › Direction `Repeated` | ✅ |  |
| RP3 | **Direcciones indefinidas**: cada uno distinto | Repetición de dirección | Layout › Advanced › Direction `Undefined` | ✅ |  |
| RP4 | **Direcciones alternadas** | Repetición de dirección | Layout › Direction `Alternated`; variación de retícula *Alternating* | ✅ |  |
| RP5 | **Direcciones en gradación** | Repetición de dirección | Gradation › Attribute `Rotate` | ✅ |  |
| RP6 | **Direcciones similares** | Repetición de dirección | Similarity › `Wobble` | ✅ |  |
| RP7 | **Variaciones espaciales**: superposición, penetración, unión de módulos vecinos | Repetición de posición | Módulos mayores que su celda (se superponen) | 🟡 | Falta la unión, penetración y sustracción entre módulos vecinos (ver INT) |
| RP8 | **Submódulos**: módulos compuestos de elementos menores repetidos | Submódulos y supermódulos | — | ⏳ |  |
| RP9 | **Supermódulos**: grupos de módulos que se usan como un solo módulo | Submódulos y supermódulos | — | ⏳ | Va al final; la app trabaja un módulo por capa |
| RP10 | **El encuentro de los cuatro círculos**: disposición lineal, cuadrada o rectangular, en rombo, triangular y circular | Submódulos y supermódulos | — | ⏳ | Sería un generador de supermódulos |
| RP11 | **Reflexión**: una forma espejada, con rotaciones distintas a la original | Repetición y reflexión | Layout › Advanced › Reflection (None, Columns, Rows, Both) | ✅ |  |
| RP12 | **Simetría**: una parte componente y su reflexión | Repetición y reflexión | Layout › Reflection | 🟡 | Se espeja el módulo, no se construye la forma simétrica |

## Estructura

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| E1 | **Estructura formal**: líneas rígidas y matemáticas; repetición, gradación, radiación | Tipos de estructura | Layout (Repetition y Radiation) | ✅ |  |
| E2 | **Estructura semiformal**: casi regular; similitud, anomalía, concentración | Tipos de estructura | Similarity, Anomaly, Concentration | ✅ |  |
| E3 | **Estructura informal**: sin líneas estructurales, organización libre | Tipos de estructura | Layout › `Free`; Concentration › `Hotspots` | ✅ | Sin líneas estructurales: los módulos se reparten libremente |
| E4 | **Estructura inactiva**: líneas solo conceptuales; no dividen el espacio | Activa / inactiva | Layout con *Visible lines* apagado (por defecto) | ✅ |  |
| E5 | **Estructura activa — subdivisiones independientes**: cada módulo en su espacio, con fondo propio o alternancia positivo/negativo | Estructura activa | Layout › Advanced › Checkerboard inversion; Clip cell | ✅ |  |
| E6 | **Estructura activa — módulo excéntrico y recortado** por los límites | Estructura activa | Module › Offset X / Y con Layout › Clip cell | ✅ |  |
| E7 | **Estructura activa — el módulo penetra la subdivisión vecina** | Estructura activa | Módulo mayor que la celda, sin Clip cell | 🟡 |  |
| E8 | **Estructura activa — espacio aislado reunido con el de un vecino** | Estructura activa | Layout › Cell mix `Merged` | 🟡 | Solo bloques de 2×2 en retícula básica y alternada |
| E9 | **Estructura invisible**: líneas conceptuales, sin grosor | Visible / invisible | Layout con *Visible lines* apagado | ✅ |  |
| E10 | **Estructura visible — líneas reales** con grosor, que interactúan con los módulos | Visible / invisible | Layout › Advanced › Visible lines (Line color, Line width) | ✅ | Son diseño y se exportan |
| E11 | **Líneas visibles positivas y negativas** | Visible / invisible | Visible lines › Line color (el color del fondo da la línea negativa) | ✅ |  |
| E12 | **Solo verticales u horizontales, o alternadas** | Visible / invisible | Visible lines › Line direction, Line spacing | ✅ |  |
| E13 | **Estructura de repetición**: módulos con espacio igual alrededor | Estructura de repetición | Layout › Repetition | ✅ |  |
| E14 | **El enrejado básico** | Estructura de repetición | Layout › Grid structure variation `Grid` | ✅ |  |
| E15 | **Cambio de proporción**: subdivisiones rectangulares | Variaciones del enrejado | Layout › Advanced › Col ratio / Row ratio (ritmo A:B); Columns y Rows distintos | ✅ |  |
| E16 | **Cambio de dirección**: líneas inclinadas | Variaciones del enrejado | Layout › `Diagonal` con Shear angle | ✅ |  |
| E17 | **Deslizamiento**: cada fila corrida | Variaciones del enrejado | Layout › `Brick` con Row offset | ✅ |  |
| E18 | **Curvatura o quebrantamiento** | Variaciones del enrejado | Layout › `Curved`, `Zigzag` con Wave amount | ✅ |  |
| E19 | **Reflexión de las subdivisiones**: fila espejada, alternada o regular | Variaciones del enrejado | Layout › Reflection | 🟡 | Se espeja el módulo, no las líneas de la estructura |
| E20 | **Combinación**: subdivisiones unidas en formas mayores | Variaciones del enrejado | Layout › Cell mix `Merged` | 🟡 | Solo bloques de 2×2 |
| E21 | **Divisiones ulteriores**: subdivisiones divididas en formas menores | Variaciones del enrejado | Layout › Cell mix `Divided` | 🟡 | Solo bloques de 2×2 |
| E22 | **El enrejado triangular** | Variaciones del enrejado | Layout › `Triangular` | ✅ |  |
| E23 | **El enrejado hexagonal** | Variaciones del enrejado | Layout › `Hexagonal` | ✅ |  |
| E24 | **Estructura de múltiple repetición**: más de una clase de subdivisión, entretejidas | Estructura de repetición | Layout › Module placement `Both` con Intersection size | 🟡 | Dos clases de módulo entretejidas; no dos retículas de formas distintas |
| E25 | **Módulos en el centro o en las intersecciones** de las subdivisiones | Módulos y subdivisiones | Layout › Module placement `Centers`, `Intersections`, `Both` | ✅ |  |
| E26 | **Módulos que ajustan, o más pequeños o más grandes** que la subdivisión | Módulos y subdivisiones | Layout › Module size; Module › Width / Height; Container | ✅ |  |
| E27 | **Repetición de posición**: todos colocados igual dentro de su subdivisión | Repetición de posición | Layout (por defecto); Contrast › Position rompe la regla | ✅ |  |
| E28 | **Superposición de estructuras de repetición** | Superposición | Varias capas con su propia retícula | ✅ |  |
| E29 | **Supermódulos en estructuras activas** | Submódulos y supermódulos | — | ⏳ |  |

## Similitud

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| S1 | **Similitud de módulos**: parecidos en figura, tamaño, color y textura | Similitud de módulos | Similarity › Visual kinship type, Fluctuation intensity | ✅ |  |
| S2 | **Asociación**: formas de una misma familia, clasificación común | Similitud de figura | Similarity › Advanced › Association (Round, Angular, Lines, Numbers) con Association mix | ✅ |  |
| S3 | **Imperfección**: variaciones de una figura ideal, cortada o quebrada | Similitud de figura | Similarity › Advanced › Imperfection (Cut, Broken) con Imperfect modules | ✅ |  |
| S4 | **Distorsión espacial**: la figura vista desde otro ángulo | Similitud de figura | Similarity › `3D tilt` | ✅ |  |
| S5 | **Unión o sustracción**: formas compuestas de formas menores unidas o restadas | Similitud de figura | — | ⏳ | Ligado a las interrelaciones (INT5 a INT7) |
| S6 | **Tensión o compresión**: la forma estirada o apretada, como algo elástico | Similitud de figura | Similarity › `Elastic` | ✅ |  |
| S7 | **Similitud y gradación**: la similitud no debe mostrar un cambio sistemático | Diferenciar conceptos | Similarity frente a Gradation (paneles separados) | ✅ |  |
| S8 | **Subdivisiones estructurales similares**: cuadriláteros, triángulos o hexágonos de lados desiguales | Estructura de similitud | — | 🚫 | Probado y descartado: los tamaños al azar se sienten como un random, no como un patrón que se pueda leer; el ritmo A:B y la gradación de estructura ya cubren las celdas de distinto tamaño |
| S9 | **Distribución visual**: módulos sin retícula, con espacio similar para cada uno | Estructura de similitud | Layout › Grid structure variation `Free` (con Seed) | ✅ | Columns × Rows dan la cantidad de módulos; el reparto mantiene un espacio parecido alrededor de cada uno y cambia con la semilla |

## Gradación

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| G1 | **Gradación de figura** de un módulo a otro | Gradación de módulos | Gradation › Attribute `Shape` con Becomes | ✅ | Interpola contornos entre cualquier pareja de formas |
| G2 | **Gradación de tamaño** | Gradación de módulos | Gradation › Attribute `Scale` | ✅ |  |
| G3 | **Gradación de color** | Gradación de módulos | Gradation › Attribute `Color` + End color | ✅ | El color del módulo viaja hacia el color final a lo largo del recorrido |
| G4 | **Gradación de textura** | Gradación de módulos | Gradation › Attribute `Texture` | ✅ |  |
| G5 | **Rotación en el plano**: cambio gradual de dirección | Gradación en el plano | Gradation › `Rotate` | ✅ |  |
| G6 | **Progresión en el plano**: cambio gradual de posición dentro de la subdivisión | Gradación en el plano | Gradation › `Drift` | ✅ |  |
| G7 | **Rotación espacial**: el módulo gira respecto al plano de la imagen | Gradación espacial | Gradation › `Depth` | ✅ |  |
| G8 | **Progresión espacial**: el aumento o disminución de tamaño sugiere profundidad | Gradación espacial | Gradation › `Scale` | ✅ |  |
| G9 | **Unión o sustracción en la figura**: cambio gradual de posición de sub-módulos | Gradación en la figura | — | ⏳ |  |
| G10 | **Tensión o compresión en la figura** | Gradación en la figura | Gradation › `Shape` | 🟡 | Cambia la figura, no una deformación elástica |
| G11 | **Camino de la gradación**: directo o indirecto, por figuras intermedias | Camino | Gradation › `Shape` › Becomes | 🟡 | Solo directo; el indirecto se hace con capas |
| G12 | **Velocidad de gradación**: pocos pasos = rápida, muchos = lenta | Velocidad | Gradation › Range, Cycles, Speed | ✅ |  |
| G13 | **Movimiento paralelo** | Modelos de gradación | Gradation › Pathway `Horizontal`, `Vertical`, `Diagonal` | ✅ |  |
| G14 | **Movimiento concéntrico** | Modelos de gradación | Gradation › Pathway `Concentric` | ✅ |  |
| G15 | **Movimiento en zigzag** | Modelos de gradación | Gradation › Pathway `Zigzag` | ✅ |  |
| G16 | **Reinicio o ida y vuelta** (1-2-3-4-5-1... frente a 1-2-3-4-5-4-3-2-1) | Modelos de gradación | Gradation › Advanced › Sequence (Restart, Ping-pong) | ✅ |  |
| G17 | **Cambio de tamaño y/o proporción de las subdivisiones** | Estructura de gradación | Layout › Advanced › Col gradation, Row gradation | ✅ |  |
| G18 | **Cambio de dirección, deslizamiento y curvatura** de la estructura de gradación | Estructura de gradación | Layout › `Diagonal`, `Brick`, `Curved`, `Zigzag` con la gradación de estructura | ✅ |  |
| G19 | **Reflexión, combinación y división ulterior** en gradación | Estructura de gradación | Layout › Reflection, Cell mix | 🟡 | Sin gradación de tamaño dentro de cada bloque |
| G20 | **Enrejados triangular y hexagonal en gradación** | Estructura de gradación | Layout › `Triangular`, `Hexagonal` | 🟡 | La gradación de estructura no aplica al panal |
| G21 | **Gradación alternada**: filas A y B en sentidos opuestos | Gradación alternada | Gradation › Advanced › Alternate rows | ✅ |  |
| G22 | **Gradación inversa**: los módulos que disminuyen dejan sitio a un conjunto inverso | Gradación alternada | Dos capas: una con Scale ascendente y otra con Reverse | 🟡 | Sin control propio |
| G23 | **Módulos y estructuras en gradación**: módulos en gradación sobre una estructura de repetición, módulos repetidos sobre una estructura de gradación, o ambas | Relación | Gradation (atributos) + Layout › gradación de estructura | ✅ | Se combinan libremente |

## Radiación

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| R1 | **Características**: multisimétrica, con foco vigoroso, genera energía óptica | Estructura de radiación | Layout › Radiation | ✅ |  |
| R2 | **Centro de radiación**: no siempre es el centro físico del diseño | Estructura de radiación | Estado `centerX / centerY` | 🟡 | Existe en el estado, sin control en la interfaz |
| R3 | **Direcciones de radiación**: de las líneas estructurales y de los módulos | Estructura de radiación | Radiation › Advanced › Module orientation, Direction | ✅ |  |
| R4 | **Centrífuga básica**: líneas rectas desde el centro | Estructura centrífuga | Radiation › Scheme `Centrifugal` | ✅ |  |
| R5 | **Curvatura o quebrantamiento de líneas** | Estructura centrífuga | Radiation › Spiral twist (curvatura) | 🟡 | Curvas sí, quebrantamiento no |
| R6 | **Centro en posición excéntrica** | Estructura centrífuga | Estado `centerX / centerY` | 🟡 | Sin control en la interfaz |
| R7 | **Apertura del centro** redondo, ovalado, triangular, cuadrado o poligonal | Estructura centrífuga | Radiation › Advanced › Open center (+ Ring shape) | ✅ | Las líneas tangentes al agujero poligonal no |
| R8 | **Centros múltiples, abriendo el centro** | Estructura centrífuga | — | 🚫 |  |
| R9 | **Centros múltiples, dividiendo y deslizando el centro** | Estructura centrífuga | Radiation › Scheme `Multi-center` con Centers (2 a 6) | ✅ |  |
| R10 | **Centros múltiples ocultos**, combinando sectores excéntricos | Estructura centrífuga | — | 🚫 |  |
| R11 | **Concéntrica básica**: capas de círculos espaciados | Estructura concéntrica | Radiation › Scheme `Concentric` | ✅ |  |
| R12 | **Enderezamiento, curvatura o quebrantamiento** de las capas: cuadrados, polígonos | Estructura concéntrica | Radiation › Advanced › Ring shape (Triangle, Square, Hexagon) | ✅ |  |
| R13 | **Traslado de los centros** de cada círculo a lo largo de una línea | Estructura concéntrica | — | 🚫 |  |
| R14 | **La espiral** | Estructura concéntrica | Radiation › Scheme `Spiral` con Spiral twist | ✅ |  |
| R15 | **Centros múltiples en concéntrica** | Estructura concéntrica | Radiation › `Multi-center` | 🟡 |  |
| R16 | **Centros distorsionados u ocultos** | Estructura concéntrica | — | 🚫 |  |
| R17 | **Rotación gradual de capas concéntricas** | Estructura concéntrica | Radiation › Advanced › Ring rotation | ✅ |  |
| R18 | **Capas concéntricas con radiaciones centrífugas** | Estructura concéntrica | Radiation › Angular rays + Concentric rings | ✅ |  |
| R19 | **Capas concéntricas reorganizadas**, entretejidas | Estructura concéntrica | — | 🚫 |  |
| R20 | **Centrípeta básica**: ángulos que apuntan al centro | Estructura centrípeta | Radiation › Scheme `Centripetal` | ✅ |  |
| R21 | **Cambio direccional, curvatura y quebrantamiento** de líneas centrípetas | Estructura centrípeta | — | 🚫 |  |
| R22 | **Apertura del centro** de una centrípeta | Estructura centrípeta | Radiation › Open center | 🟡 |  |
| R23 | **Superposición de estructuras de radiación**; **radiación y repetición**; **radiación y gradación** | Combinaciones | Varias capas; Gradation en esquema polar | ✅ |  |
| R24 | **Subdivisiones estructurales y módulos**: los módulos se ajustan y giran con ellas | Módulos en radiación | Radiation › Module orientation; Clip cell | ✅ |  |
| R25 | **Movimiento concéntrico**: progresión hacia el centro | Módulos en radiación | Gradation › Pathway `Concentric` | ✅ |  |
| R26 | **Módulos que son esquemas de radiación en miniatura** | Módulos en radiación | — | ⏳ |  |
| R27 | **Módulos de tamaño mayor**, casi tan grandes como el esquema | Módulos en radiación | Module › Width / Height | 🟡 | Falta resolver sus interrelaciones (ver INT) |
| R28 | **Radiación irregular y distorsionada**; fotografía o medios mecánicos | Variantes | Anomaly y Similarity sobre el esquema radial | 🟡 | Sin distorsión mecánica del esquema |

## Anomalía

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| A1 | **Atraer la atención**: un centro de interés dentro de una zona restringida | Propósitos | Anomaly › Type `Focal` | ✅ |  |
| A2 | **Aliviar la monotonía**: anomalías esparcidas, casual o sistemáticamente | Propósitos | Anomaly › Distribution (Scattered regular, Scattered random) con Count y Seed | ✅ |  |
| A3 | **Transformar la regularidad**: una zona con otra clase de regularidad | Propósitos | Anomaly › Type `Another grid` con Grid inside the zone | ✅ | Dentro de una zona circular (clic en el lienzo, Radius) la retícula cambia a Brick, Diagonal, Curved, Zigzag, Triangular o Alternating. Solo en retícula |
| A4 | **Quebrar la regularidad**: zonas desordenadas, rasgadas o disueltas | Propósitos | Anomaly › Type `Rupture`, `Void` | ✅ |  |
| A5 | **Anomalía entre módulos**: concentrada | Anomalía entre módulos | Anomaly › Distribution `Single` | ✅ |  |
| A6 | **Anomalía entre módulos**: esparcida | Anomalía entre módulos | Anomaly › Distribution `Scattered` | ✅ |  |
| A7 | **Anomalía dentro de estructuras**: la estructura se estira o comprime | Anomalía dentro de estructuras | Anomaly › Type `Swell` | ✅ | Deforma los módulos, no las líneas visibles |
| A8 | **Anomalía dentro de estructuras**: líneas estructurales distorsionadas o dislocadas | Anomalía dentro de estructuras | — | ⏳ | Falta deformar las líneas de estructura visibles; hoy solo se deforman los módulos |
| A9 | **Efectos sobre el módulo**: forzado a cambiar de posición o dirección, recortado por líneas activas, distorsionado, anómalo con regularidad entre sí, variablemente anómalo | Efectos sobre los módulos | Anomaly › Deviates in (forma, escala, rotación, posición) | ✅ |  |
| A10 | **La anomalía es comparativa**: más o menos anómalo, sutil o prominente | Principio | Anomaly › Severity | ✅ |  |

## Contraste

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| C1 | **Contraste, regularidad y anomalía**: el contraste existe dentro de la propia regularidad | Principio | Contrast y Anomaly | ✅ |  |
| C2 | **Contraste de figura** | Elementos visuales | Contrast › Dimension `Shape` con Minority Shape | ✅ |  |
| C3 | **Contraste de tamaño** | Elementos visuales | Contrast › `Scale` | ✅ |  |
| C4 | **Contraste de color**: luminoso/oscuro, brillante/opaco, cálido/frío | Elementos visuales | Contrast › `Tone` y Accent color; Gradation › `Color` | 🟡 | El tono y la gradación de color están hechos; falta el contraste cálido/frío entre zonas |
| C5 | **Contraste de textura**: suave/rugoso, pulido/tosco | Elementos visuales | Contrast › `Texture` | ✅ |  |
| C6 | **Contraste de dirección**: a 90º es el máximo | Elementos de relación | Contrast › `Angle` con Clash Angle | ✅ |  |
| C7 | **Contraste de posición**: arriba/abajo, izquierda/derecha, céntrico/excéntrico | Elementos de relación | Contrast › `Position` con Shift y Shift direction | ✅ |  |
| C8 | **Contraste de espacio**: ocupado/vacío, positivo/negativo, plano/ilusorio | Elementos de relación | Contrast › `Space` | ✅ |  |
| C9 | **Contraste de gravedad**: estable/inestable, ligero/pesado | Elementos de relación | — | ➖ | Descartado: se consigue con Position a 90º (ver C7) |
| C10 | **Contrastes dentro de una forma**: partes angulares y curvas en un mismo módulo | Contraste dentro de una forma | Module › Shape (formas compuestas: herradura, creciente, gota) | 🟡 | No hay editor de formas propias |
| C11 | **La estructura de contraste**: informal, sin regularidad estricta; equilibrio informal | Estructura de contraste | Contrast › Minority spread | ✅ | Dispersa, equilibrada, hacia los bordes o hacia el centro |
| C12 | **Dominación de una mayoría**: un tipo de módulo ocupa más espacio | Dominancia y énfasis | Contrast › Dominance ratio | ✅ |  |
| C13 | **Énfasis de una minoría**: llama la atención como una anomalía | Dominancia y énfasis | Contrast › Accent color | ✅ |  |
| C14 | **Equilibrio** de mayoría y minoría, como pesos en una balanza | Dominancia y énfasis | Contrast › Minority spread (Balanced) | ✅ |  |

## Concentración

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| K1 | **Ausencias frecuentes**: módulos que desaparecen por ser del color del fondo | Concentración en estructuras formales | Concentration › Method `Absence` | ✅ |  |
| K2 | **Cambios posicionales** dentro de las subdivisiones | Concentración en estructuras formales | Concentration › Method `Move` | ✅ |  |
| K3 | **Cambios cuantitativos**: más o menos módulos por subdivisión | Concentración en estructuras formales | — | 🚫 | Fuera de alcance: varios módulos por celda se logra con capas |
| K4 | **Concentración hacia un punto** | Estructura de concentración | Concentration › Structure `Point` | ✅ |  |
| K5 | **Concentración desde un punto** | Estructura de concentración | Concentration › `Void` | ✅ |  |
| K6 | **Concentración hacia una línea** | Estructura de concentración | Concentration › `Line` con Line axis | ✅ |  |
| K7 | **Concentración desde una línea** | Estructura de concentración | Concentration › `Away from line` | ✅ |  |
| K8 | **Concentración libre**: grupos de densidad y escasez variables | Estructura de concentración | Concentration › `Hotspots` con *Foci* (2 a 6) | ✅ | Los focos se reparten girando el atractor alrededor del centro del lienzo |
| K9 | **Superconcentración**: todo el diseño agrupado densamente | Estructura de concentración | Concentration › `Dense` con Soft edge | ✅ |  |
| K10 | **Desconcentración**: todo el diseño esparcido | Estructura de concentración | Concentration › `Sparse` con Soft edge | ✅ |  |
| K11 | **Más de un tipo de módulo**: uno concentrado y otro disperso | Combinaciones | Varias capas, cada una con su concentración | ✅ |  |
| K12 | **Módulos en estructuras de concentración**: muchos módulos pequeños para construir la densidad | Módulos | Layout › Columns y Rows (hasta 50) | ✅ |  |

## Textura

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| T1 | **Textura decorativa**: adorna la superficie y queda subordinada a la figura | Textura visual | — | ➖ | Descartada; se eliminó al reemplazar el control |
| T2 | **Textura espontánea**: parte del proceso de creación; figura y textura inseparables | Textura visual | Texture › Jitter, Line skipping, Random lines, Plane wave | ✅ | Deformación de geometría |
| T3 | **Textura mecánica**: granulado fotográfico, retícula, tipografía | Textura visual | — | ➖ |  |
| T4 | **Dibujo y pintura**: líneas a mano alzada | Fabricación de la textura visual | Texture › Jitter | 🟡 |  |
| T5 | **Raspado y rascado** | Fabricación de la textura visual | Texture › Line skipping | 🟡 |  |
| T6 | **Impresión, vaporización, manchado, ahumado, procesos fotográficos** | Fabricación de la textura visual | — | ➖ | Técnicas de taller; no aplican a vectores |
| T7 | **Collage**: materiales con y sin imágenes | Collage | — | 🚫 |  |
| T8 | **Textura táctil**: natural asequible, modificada y organizada | Textura táctil | — | 🚫 | Es física, no visual |
| T9 | **Luz y color en la textura táctil** | Textura táctil | — | 🚫 |  |
| T10 | **Textura en gradación** (tipos de imprenta de tamaño variable | Textura en el diseño | Gradation › Attribute `Texture` | ✅ |  |

## Espacio

| ID | Concepto | Grupo | Control en la app | Estado | Notas |
| :-- | :-- | :-- | :-- | :-: | :-- |
| SP1 | **Espacio positivo y negativo**; relaciones reversibles de figura y fondo | Espacio positivo y negativo | Botón de figura/fondo; Contrast › `Space`; Checkerboard inversion | ✅ |  |
| SP2 | **Espacio liso**: las formas son planas y paralelas al plano de la imagen | Espacio liso e ilusorio | Space apagado (por defecto) | ✅ |  |
| SP3 | **Espacio ilusorio**: formas que avanzan, retroceden, oblicuas o tridimensionales | Espacio liso e ilusorio | Space › Mode | ✅ |  |
| SP4 | **Superposición** como señal de espacio | Formas lisas en espacio ilusorio | Capas | ✅ |  |
| SP5 | **Cambio en tamaño**: más grande = más cerca | Formas lisas en espacio ilusorio | Gradation › `Scale` | 🟡 | Falta la perspectiva con disminución de tamaño (ver SP11) |
| SP6 | **Cambio en color y en textura** como señal de profundidad | Formas lisas en espacio ilusorio | Space › Facet shading contrast | 🟡 | Falta: pistas de profundidad por tamaño, tono y textura |
| SP7 | **Cambio en el punto de vista** | Formas lisas en espacio ilusorio | Space › `3D tilt`; Gradation › `Depth` | ✅ |  |
| SP8 | **Curvatura o quebrantamiento** de formas lisas | Formas lisas en espacio ilusorio | Texture › Plane wave | 🟡 |  |
| SP9 | **Agregado de sombra**: unida o separada | Formas lisas en espacio ilusorio | — | ⏳ |  |
| SP10 | **Volumen y profundidad**: sistemas isométricos de proyección | Volumen y profundidad | Space › `Isometric` con Extrusion depth, Projection angle | ✅ |  |
| SP11 | **Perspectiva** con disminución gradual de tamaño | Volumen y profundidad | — | ⏳ |  |
| SP12 | **Planos dibujados**: opacos, o transparentes como marcos espaciales | Representación del plano | — | ⏳ |  |
| SP13 | **Planos sólidos**: sin ambigüedad; los de color varían el volumen | Representación del plano | Space › Facet shading contrast | ✅ |  |
| SP14 | **Planos de textura uniforme** | Representación del plano | — | ⏳ |  |
| SP15 | **Planos de color o textura en gradación** | Representación del plano | — | ⏳ |  |
| SP16 | **Espacio fluctuante**: avanza y retrocede | Espacio fluctuante y conflictivo | Space › `Fluctuating` | ✅ |  |
| SP17 | **Espacio conflictivo**: absurdo, imposible de interpretar | Espacio fluctuante y conflictivo | Space › `Paradox` | ✅ |  |
| SP18 | **Profundidad por capa** | Espacio | — | ⏳ | Depende de las interrelaciones |

## Controles propios de la app

Controles que no corresponden a un concepto de diseño, sino a la herramienta.

| Control | Para qué sirve | Notas |
| :-- | :-- | :-- |
| Capas (hasta 5), orden y visibilidad | Un módulo por capa; superposición de estructuras | Cubre INT3, E28 y R23 |
| Aspect ratio | El marco del diseño | Cubre B14 |
| Guías de pantalla y su color; *Show container* | Ayudas de trabajo; no se exportan | |
| Seed, deshacer y rehacer, guardar y abrir, exportar SVG y PNG | Herramientas de trabajo | |
| Teclado en las cajas de valor y secciones *Advanced* | Usabilidad | Ver `STUDIO_CONTROLS_GUIDE.md`, sección 5 |

---

## Resumen

**199 conceptos** · ✅ **118** · 🟡 **39** · ⏳ **33** · ➖ **5** · 🚫 **4**.

Lo pendiente (⏳) se concentra en las interrelaciones entre capas, los supermódulos, el espacio (perspectiva, sombra, pistas de profundidad), las retículas irregulares y la distribución libre, las zonas y el equilibrio del contraste, las anomalías con otra regularidad, más focos y varios módulos por celda, y algunas variantes de la radiación todavía sin priorizar.
