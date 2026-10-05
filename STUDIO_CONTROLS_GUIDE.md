# Guía Técnica de Controles del Panel de Studio e Interrelaciones
### Wucius Wong: Principles of Two-Dimensional Design

> **DOCUMENTO DE ESPECIFICACIÓN TÉCNICA Y PORTABILIDAD**  
> Este documento detalla cada parámetro, control, fórmula geométrica e interrelación del panel de **Studio** en *Wong Design Fundamentals*. Su objetivo es servir como referencia canónica y manual de implementación para trasladar estas capacidades a otros entornos de diseño generativo (como [Abstract Studio](https://github.com/dMore88/abstract-studio)).

---

## 📑 Índice
1. [Arquitectura y Jerarquía del Panel](#1-arquitectura-y-jerarquía-del-panel)
2. [Canvas & Display (Nivel Base)](#2-canvas--display-nivel-base)
3. [Capas y Módulo Base](#3-capas-y-módulo-base)
4. [Modifiers Stack: Especificación Detallada de los 10 Principios](#4-modifiers-stack-especificación-detallada-de-los-10-principios)
   - [4.1 Repetition (Retícula Cartesiana Regular)](#41-repetition-retícula-cartesiana-regular)
   - [4.2 Structure (Estructura Rítmica Formal)](#42-structure-estructura-rítmica-formal)
   - [4.3 Radiation (Estructura Polar / Rayos & Anillos)](#43-radiation-estructura-polar--rayos--anillos)
   - [4.4 Similarity (Parentesco y Variación Morfológica)](#44-similarity-parentesco-y-variación-morfológica)
   - [4.5 Gradation (Transición Progresiva Sistemática)](#45-gradation-transición-progresiva-sistemática)
   - [4.6 Anomaly (Ruptura Focal y Fractura)](#46-anomaly-ruptura-focal-y-fractura)
   - [4.7 Contrast (Tensión y Dominancia de Minorías)](#47-contrast-tensión-y-dominancia-de-minorías)
   - [4.8 Concentration (Campos Gravitatorios y Densidad)](#48-concentration-campos-gravitatorios-y-densidad)
   - [4.9 Texture (Materia Táctil y Tratamiento Superficial)](#49-texture-materia-táctil-y-tratamiento-superficial)
   - [4.10 Space (Ilusión Tridimensional y Extrusión Isométrica)](#410-space-ilusión-tridimensional-y-extrusión-isométrica)
5. [Matriz de Interrelaciones, Reglas Mecánicas y Precedencias](#5-matriz-de-interrelaciones-reglas-mecánicas-y-precedencias)
6. [Guía de Portabilidad para Abstract Studio](#6-guía-de-portabilidad-para-abstract-studio)

---

## 1. Arquitectura y Jerarquía del Panel

El panel de Studio estructura la generación gráfica en tres niveles. Cada **capa** (hasta 5) es un módulo independiente con su propio estado de modificadores:

```
┌────────────────────────────────────────────────────────┐
│               1. CANVAS & DISPLAY BOUNDS               │
│        (Aspect Ratio, Safe Margins, Figure/Ground)      │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│         2. CAPAS (hasta 5) · MÓDULO BASE POR CAPA       │
│          (Forma, escala, rotación, offset, color)       │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│       3. MODIFIERS STACK (por capa, 10 PRINCIPIOS)     │
│    (Cartesiano vs. Polar, Variación, Ruptura, Espacio) │
└────────────────────────────────────────────────────────┘
```

> **Nota:** el antiguo par *Form A / Form B* y sus 8 interrelaciones (detachment, touching, overlapping, penetration, union, subtraction, intersection, coincidence) fueron reemplazados por el sistema de capas. Se eliminaron del código (`state.interrelation`, `renderModule`, botones pathfinder). Las interrelaciones entre capas están **pendientes de rediseño**.

---

## 2. Canvas & Display (Nivel Base)

Controla el soporte físico y los límites del plano gráfico.

| Parámetro / Control | Selector / Tipo | Rango / Valores | Función & Comportamiento Gráfico |
| :--- | :--- | :--- | :--- |
| `aspectRatio` | Grupo de Botones | `1:1`, `9:16`, `4:3`, `3:4`, `16:9` | Modifica dinámicamente las dimensiones del canvas (`width`, `height`) (sin margen de seguridad). Determina el tamaño de celda en retículas y el radio máximo en esquemas polares. |
| `invertFigureGround` | Switch (Toggle) | `boolean` (`true` / `false`) | Invierte ópticamente los roles de figura y fondo: la figura asume el tono del papel y el fondo el de la tinta principal. |
| `wireframe` | Switch (Toggle) | `boolean` (`true` / `false`) | Elimina los rellenos sólidos (`fill: none`) forzando un trazo de contorno (`stroke`). Permite auditar colisiones e intersecciones booleanas sin oclusión visual. |
| `showSafeBounds` | Switch (Toggle) | `boolean` (`true` / `false`) | Renderiza una rejilla perimetral sutil que cubre el lienzo. |
| Margen de seguridad | — | — | Retirado (2026-10-04): vale 0. Las estructuras llegan al borde del lienzo (antes dejaban un 5 %). Si se retoma, será un control. |
| `zoomLevel` | — | — | Retirado (2026-10-04): el lienzo se ajusta solo al alto libre de la pantalla. |

---

## 3. Capas y Módulo Base

Cada capa es un módulo independiente. Se pueden tener hasta 5 capas con visibilidad, orden (drag & drop), forma, color y pipeline de modificadores propios.

### 3.1 Controles de capa
* **`width` / `height`**: tamaño del módulo **exactamente en píxeles** del lienzo (un módulo de 100 mide 100 px en cualquier proporción de lienzo; ya no hay factor oculto de 1,25 ni reducción en lienzos pequeños). Con Structure en *Fit to cell* ese tamaño se reparte entre las celdas (con 4 columnas, un módulo de 100 ocupa 25 px); en *Fixed size* mantiene sus píxeles.
* **`containerW` / `containerH`** (*Container width* y *Container height*, 20 a 2000 px, por defecto el lienzo entero): el **contenedor** del módulo, un marco centrado en el lienzo (como un frame de Figma) dentro del que se compone el módulo: lo centras, lo desplazas o lo sacas de él. Con las guías activadas se dibuja punteado. No depende del tamaño del módulo ni de la proporción del lienzo. Es la celda de *Actual size* y el recorte de *Clip cell*.
* **`shape`**: una de las 15 formas del selector (lista canónica del mockup de Figma, `STUDIO_SHAPE_KEYS` en `js/studio/shapes.js`): `circle`, `square`, `triangle`, `wave`, `horseshoe`, `hexagon`, `line`, `parallelogram`, `hatch`, `crescent`, `teardrop`, `cross`, `digit1`, `digit5`, `digit9`. Los botones y las tarjetas de capa usan iconos Phosphor en peso *regular*, los del Figma (campo `phIcon` de cada forma; lista completa en `docs/DESIGN_SYSTEM_TOKENS.md`, sección 6). Los dígitos son vectoriales (ya no son texto) y `line` es una línea real.
* **`width / height`**: dimensiones del módulo en píxeles, de 5 a 2000 para todas las formas (base 50), de modo que cualquier figura pueda ser gigante y un círculo pueda seguir siendo círculo con valores iguales. La línea solo tiene largo (*Width*): su *Height* se oculta.
* **`rotation`**: ángulo de orientación.
* **`strokeWidth`**: grosor del trazo.
* **`offsetX / offsetY`**: desplazamiento relativo al centro, de -1000 a 1000 px.
* **`drawMode`**: trazo o relleno.
* **`color`**: color de la forma (hex).
* **`visible`**: visibilidad de la capa.

## 4. Modifiers Stack: Especificación Detallada de los 10 Principios

### 4.1 Repetition (Retícula Cartesiana Regular)
Multiplica el módulo en una retícula ortogonal sobre el plano cartesiano $X, Y$.

* **`gridType`** (tags *Grid structure variation*):
  * `basic` (*Grid*): Retícula ortogonal tradicional $M_{i,j}$.
  * `sliding` (*Brick*): Desfase alternado de filas (*brick pattern*). Parámetro **Row offset** (`slideOffset`, 0% a 100%).
  * `sheared` (*Diagonal*): Cizallamiento diagonal del plano. Parámetro **Shear angle** (`shearAngle`, 0° a 45°).
  * `curved` (*Curved*): Deformación sinusoidal de las filas. Parámetro **Wave amount** (`curveIntensity`, 0 a 60 px).
  * `zigzag` (*Zigzag*): Deformación angular triangular de las filas. Mismo parámetro **Wave amount**.
  * `triangular` (*Triangular*): Filas impares desplazadas media celda (retícula triangular).
  * `alternating` (*Alternating*): Las celdas impares giran 180° (direcciones alternadas).
  * `hexagonal` (*Hexagonal*): Panal. Las filas impares se desplazan media celda y las filas encajan (paso vertical de 0,866 del ancho de celda, algo menor si no cabe). El recorte de celda y las líneas visibles usan hexágonos.
* **`cols / rows`** (1 a 50): Número de divisiones en los ejes horizontal y vertical.
* **`spacing`** (px): Separación o canaleta (*gutter*) entre celdas contiguas.
* **`slideOffset`** (0.0 a 1.0): Proporción de desplazamiento en filas impares (modo `sliding`).
* **`shearAngle`** (0° a 45°): Ángulo de inclinación oblicua (modo `sheared`).
* **`curveIntensity`** (px): Amplitud de oscilación de la onda (modo `curved`).
* **`showGridLines`** (`boolean`): Renderiza las líneas maestras de la retícula. Con las líneas visibles aparecen sus opciones:
  * **`lineTone`** (*Line tone*, `guide` por defecto): `guide` es una guía de ayuda, como las de Figma: siempre 1 px, con un color a elegir (*Guide color*), y **no se exporta** al SVG ni al PNG; `positive` se dibuja en tinta (el color de la capa); `negative` se dibuja con el color del fondo y corta los módulos que cruza (fig. 20b y 20c). Los módulos más grandes que la celda son los que muestran el corte.
  * **`lineDirection`** (*Line direction*, `both`): solo líneas `horizontal`, solo `vertical` o ambas (fig. 20d).
  * **`lineSpacing`** (*Line spacing*, `all`): `alternate` dibuja una línea de cada dos.
  * **`gridLineWidth`** (*Line width*, 0.5 a 6 px).
  En la cuadrícula hexagonal se dibuja cada panal y la dirección y el espaciado no se aplican. Las líneas del esquema radial siguen con el estilo tenue de siempre (E2 pendiente para radial).
* **`sizeMode`** (*Module size*, `fit` por defecto):
  * `fit` (*Fit to canvas*): *Columns* y *Rows* dividen el lienzo y todo lo que compusiste (el módulo dentro de su contenedor) se reduce **en proporción al lienzo**: con 2 × 2 cada celda es la mitad del lienzo y el módulo se reduce a la mitad, sea cual sea el tamaño del contenedor. Es el comportamiento de siempre.
  * `actual` (*Actual size*): se repite **el contenedor del módulo tal cual**, *Columns* × *Rows* veces. Cada celda mide lo que mide el contenedor (*Container width* y *Container height* del panel Module) y lleva dentro el módulo con su tamaño, desplazamiento y rotación reales. El bloque queda centrado en el lienzo; si es mayor que el lienzo se sale por los bordes (sangrado). *Clip cell* recorta lo que sale de cada contenedor. Al activarlo con el contenedor por defecto, este arranca del tamaño de una celda de *Fit to canvas* para conservar el ritmo.
* **`direction`** (*Direction*, `repeated` por defecto): Hacia dónde mira cada módulo. `repeated` todos igual; `alternated` las celdas alternas giran 180° (si la variación de retícula ya es *Alternating* no se gira dos veces); `undefined` cada módulo mira hacia un lado distinto, de forma que siempre es el mismo para el mismo estado.
* **`reflection`** (*Reflection*, `none`): Espeja el módulo en las columnas impares (`columns`), en las filas impares (`rows`) o en ambas (`both`). El espejo se aplica al módulo ya transformado, así que las rotaciones de Gradation y los campos de Concentration no se invierten.
* **`checkerInvert`** (`boolean`): Invierte el color de figura y fondo en casillas alternadas (tablero de ajedrez).

---

### 4.2 Structure (Estructura Rítmica Formal)
Introduce subdivisión compositiva formal en los intervalos de la retícula cartesiana (requiere `Repetition`).

* **`mode`**:
  * `rhythmic`: Alternancia de bandas con cadencia dual ($A : B : A : B$).
  * `compression`: Compresión rítmica progresiva hacia el centro o extremos.
* **`colRatio`** (1.0 a 3.0): Relación de proporción entre columnas anchas y estrechas.
* **`rowRatio`** (1.0 a 3.0): Relación de proporción entre filas anchas y estrechas.
* **`bandThickness`** (px): Grosor visual de las líneas estructurales.
* **`showBands`** (`boolean`): Dibuja las líneas estructurales como elementos gráficos visibles de la composición.

---

### 4.3 Radiation (Estructura Polar / Rayos & Anillos)
Genera el espacio desde uno o varios centros focales utilizando coordenadas polares $(r, \theta)$.

* **`scheme`**:
  * `centrifugal`: Rayos directos rectos que nacen del foco y se proyectan hacia el exterior.
  * `centripetal` (*Centripetal*, fig. 50): Estructura centrípeta de Wong: los ángulos de las líneas estructurales apuntan hacia el centro, que ya no es el punto donde convergen las líneas. Mismo reparto de módulos que la centrífuga, con la orientación automática hacia dentro; las guías son **chevrones anidados** (cada uno es el sector desplazado hacia fuera) en lugar de círculos.
  * `concentric`: Anillos o capas que se expanden concéntricamente desde el epicentro.
  * `spiral`: Rayos curvos continuos gobernados por torsión angular acumulada.
  * `multi_center`: Dos focos virtuales concurrentes con interferencia mutua.
* **`orientation`** (*Module orientation*, `auto` por defecto): Hacia dónde apunta la parte superior del módulo. `auto` depende del esquema (hacia fuera en centrífuga y doble centro, hacia dentro en centrípeta, tangente en concéntrica, ligeramente inclinada en espiral); `outward` hacia fuera, `inward` hacia el centro, `tangent` siguiendo el anillo y `fixed` sin giro (solo cuenta la rotación propia de la capa).
* **`rays`** (4 a 28): Cantidad de divisiones o sectores angulares por vuelta de 360°.
* **`rings`** (2 a 10): Cantidad de capas o anillos a lo largo del radio.
* **`spiralTwist`** (-180° a +180°): Torsión acumulada aplicada a cada rayo en el recorrido de la espiral.
* **`centerOpen`** (*Open center*, 0% a 70%, por defecto 0): Radio del agujero central como porcentaje del radio total. Los anillos y rayos empiezan en el borde del agujero (fig. 48d, abrir el centro de radiación). Con las guías visibles se dibuja el círculo del agujero.
* **`sizeMode`** (*Module size*, `fit`): `actual` hace lo mismo que en la cuadrícula: el módulo conserva su tamaño real y cada anillo tiene de grosor la *Container height* del módulo. *Concentric rings* y *Angular rays* siguen diciendo cuántos; la estructura puede salirse del lienzo.
* **`direction`** (*Direction*, `repeated`): Igual que en la cuadrícula, encima de la orientación del módulo: `alternated` gira 180° las celdas alternas y `undefined` da a cada módulo un giro propio.
* **`lineTone` / `lineWidth`** (*Line tone* y *Line width*, `guide` y 1 px): Con *Visible Grid Lines* encendido, los rayos y anillos pueden dibujarse como guía de 1 px con color propio y sin exportarse (`guide`), en tinta (`positive`) o con el color del fondo (`negative`), con un grosor de 0,5 a 6 px (el grosor solo aplica a `positive` y `negative`).
* **`ringRotation`** (*Ring rotation*, -90° a 90°, por defecto 0): Grados que cada anillo gira más que el anillo interior (rotación gradual de capas concéntricas, fig. 49g). Sirve para que las subdivisiones de un anillo no se alineen con las del vecino. Las guías de rayos se dibujan por anillo.
* **`centerX / centerY`**: Desplazamiento excéntrico del foco fuera del centro del lienzo.
* **`showRays / showRings`** (`boolean`): Dibuja las líneas guía polares en la composición final.

---

### 4.4 Similarity (Parentesco y Variación Morfológica)
Rompe la rigidez mecánica de la repetición pura asignando variaciones de parentesco genético entre los módulos.

* **`kinshipType`**:
  * `distortion`: Estiramiento anamórfico pseudoaleatorio en anchura y altura.
  * `foreshortening`: Pérdida de escala en un sentido simulando inclinación en perspectiva.
  * `rotation_wobble`: Pequeñas oscilaciones aleatorias en el ángulo de orientación.
  * `scale_kinship`: Fluctuación sutil de tamaño sin abandonar la proporción base.
  * `hybrid`: Combinación simultánea de todas las transformaciones anteriores.
* **`intensity`** (0% a 100%): Magnitud del desvío morfológico respecto a la figura madre.
* **`cellJitter`** (0 a 30px): Desplazamiento orgánico del centro de cada celda fuera del nodo ortogonal estricto.
* **`association`** (*Association*, `none` por defecto): Mezcla en la población formas de **una misma familia visual**: `round` (círculo, herradura, creciente, gota), `angular` (cuadrado, triángulo, hexágono, paralelogramo), `lines` (línea, onda, trama, cruz) o `numbers` (1, 5, 9). La forma de la capa pasa a una de la familia en una parte de los módulos. **`assocMix`** (*Association mix*, 0% a 100%, por defecto 50%) es el porcentaje de módulos que cambian. Precedencia: Anomaly y Contrast mandan sobre la asociación en forma.
* **`imperfection`** (*Imperfection*, `none`): Módulos imperfectos. `cut` corta una porción con una recta; `broken` parte el módulo por una recta y separa y desliza las dos mitades. **`imperfAmount`** (*Imperfect modules*, 0% a 100%, por defecto 30%) es el porcentaje de módulos afectados. Cada módulo imperfecto lleva su propio ángulo y posición de corte, fijos para la misma semilla.
* **`seed`** (`number`): Semilla generativa para garantizar repetibilidad algorítmica.

---

### 4.5 Gradation (Transición Progresiva Sistemática)
Genera una ilusión de movimiento, velocidad o dimensión mediante una progresión sistemática y continua de módulos.

* **`type`**:
  * `rotation`: Los módulos giran sistemáticamente a lo largo de la trayectoria.
  * `scale`: Los módulos aumentan o disminuyen progresivamente de masa.
  * `depth`: Gradación en el plano espacial (ilusión de avance o alejamiento).
  * `drift`: Desplazamiento horizontal progresivo y acumulativo del módulo a lo largo del recorrido.
  * `shape` (*Shape*): La forma de la capa se convierte paso a paso en otra (`targetShape`, tags *Becomes*, las 15 formas). Los contornos de ambas formas se remuestrean a los mismos puntos y se interpolan, así que sirve entre cualquier pareja (círculo a triángulo, cuadrado a cruz...). *Range* 180 = llegar del todo a la forma destino.
  * `texture` (*Texture*): La deformación de Texture crece a lo largo del recorrido: 0 en el primer módulo y la fuerza configurada en el último. Si Texture está apagado en la capa usa una fuerza propia (vibración 4, ondulación 14, salto 25, cruce 25). *Range* 180 = fuerza completa; 360 = el doble.
* **`pathway`**:
  * `diagonal`: Progresión a lo largo del vector $i + j$.
  * `horizontal`: Progresión por filas de izquierda a derecha.
  * `vertical`: Progresión por columnas de arriba hacia abajo.
  * `concentric`: Progresión radial desde el centro hacia la periferia ($\sqrt{\Delta x^2 + \Delta y^2}$).
  * `zigzag` (*Zigzag*): Camino en serpiente: las filas pares avanzan de izquierda a derecha y las impares de derecha a izquierda (en radial, los anillos alternan sentido). Es el tercer modelo del libro (fig. 41).
* **`range`** (15° a 360°, pasos de 5°): Magnitud total de la transición. En `rotation` son los grados de giro. En `scale`, `depth` y `drift` escala la cantidad de cambio, y 180 equivale a la cantidad original (escala de 0.35x a 1.45x).
* **`steps`** (1 a 4): Cantidad de ciclos o frecuencias completas en el recorrido (slider *Cycles*).
* **`sequence`** (*Sequence*, `restart` por defecto): `restart` repite la rampa (1-2-3-1-2-3) y `pingpong` va y vuelve (1-2-3-2-1) dentro de cada ciclo.
* **`easing`** (*Acceleration*, -100 a 100, por defecto 0): Velocidad del cambio a lo largo del recorrido. Positivo arranca lento y acelera; negativo arranca rápido y frena (fig. 38).
* **`alternate`** (*Alternate rows*, por defecto apagado): Las filas impares (las columnas impares en `vertical`; los anillos o rayos impares en radial) corren en sentido contrario (fig. 43).
* **`reverse`** (`boolean`): Invierte el sentido del gradiente (*Reverse Gradient Direction*).

**UI (Figma, nodo `5779:2472`):** tags *Attribute* (Rotate, Scale, Depth, Drift, Shape, Texture), la rejilla de formas *Becomes* (solo con Shape), sliders *Range*, *Cycles* y *Acceleration* con caja de valor, tags *Pathway direction* (Diagonal, Horizontal, Vertical, Concentric, Zigzag), tags *Sequence* (Restart, Ping-pong) y checkboxes *Alternate rows* y *Reverse*. Los controles nuevos (Shape, Texture, Becomes, Acceleration, Sequence, Alternate rows, Zigzag) salen del catálogo de componentes. Estado por capa en `layer.structure.gradation`. En esquema polar, `drift` desplaza el módulo sobre su eje local hasta cerca de un anillo.

---

### 4.6 Anomaly (Ruptura Focal y Fractura)
Introduce una zona de irregularidad donde prevalece una estructura regular previa, creando un epicentro de máxima tensión focal. Estado por capa en `layer.structure.anomaly`.

* **`type`** (tags *Type*):
  * `focal` (*Focal*): Epicentro circular que transforma a los módulos inscritos en su radio.
  * `fracture` (*Rupture*): Falla o hendidura transversal que parte la composición y desfasa los módulos a ambos lados.
  * `swell` (*Swell*): Deformación gravitatoria que expande y empuja los módulos contiguos.
  * `tear` (*Void*): Desaparición o vacío absoluto de módulos en un área delimitada.
* **`distribution`** (*Distribution*, `single` por defecto): `single` es un epicentro (el de siempre, con *X / Y position*); `regular` reparte `count` anomalías en una retícula escalonada y `random` las reparte al azar sin que se toquen (fig. 56b). Cada módulo obedece al epicentro más cercano. Con varias anomalías se ocultan *X / Y position* y el clic en el lienzo; aparecen **`count`** (*Count*, 2 a 12, por defecto 5) y, solo en `random`, **`seed`** (*Seed*, 1 a 99) para cambiar la disposición. La mira se dibuja en todos los epicentros.
* **`attrs`** (*Deviates in*, chips de selección múltiple, todos activos por defecto): En qué atributos se desvía la anomalía; los demás se respetan. Cada tipo ofrece los suyos: `focal` forma, escala y rotación; `fracture` posición y rotación; `swell` posición y escala; `tear` posición, rotación y escala (el vacío central siempre desaparece). Sin *Shape* se oculta el selector *Focal Intruder Shape*.
* **`anomalousShape`** (*Focal Intruder Shape*): una de las 15 formas del selector. Es la silueta que adoptan los módulos dentro del epicentro en modo `focal`.
* **`epicenterX / epicenterY`** (*X / Y position*, 10% a 90%, por defecto 50%): Coordenadas normalizadas del epicentro. También se fijan haciendo clic en el canvas con la pestaña Anomaly abierta.
* **`radius`** (*Radius*, 50 a 350 px, por defecto 160): Radio espacial de influencia del evento anómalo.
* **`intensity`** (*Severity*, 10% a 100%, por defecto 65%): Nivel de mutación aplicada a los módulos intervenidos.
* **`highlightColor`** (*Highlight with accent color*, por defecto apagado): Aplica un color de acento a los módulos anómalos.
* **`accentColor`** (*Accent color*, selector de color, por defecto `#f43f5e`): Color usado por el resaltado. Elegir un color enciende el resaltado.
* **`showReticle`** (*Show Epicenter Reticle*, por defecto apagado): Dibuja el radio de influencia y la mira del epicentro.

**UI (Figma, nodo `5779:2565`).** Requiere retícula (Repetition o Radiation) en la capa para manifestarse; sin ella se muestra el banner ámbar del contrato Opción B.

---

### 4.7 Contrast (Tensión y Dominancia de Minorías)
Establece disparidad formal estructurada en una relación matemática de **mayoría dominante vs. minoría discordante**. Estado por capa en `layer.structure.contrast`.

* **`dimension`** (tags *Dimension*):
  * `scale` (*Scale*): Mayoría regular reducida vs. minoría monumental.
  * `shape` (*Shape*): Mayoría regular vs. minoría con glifo completamente discordante (`contrastShape`, selector *Minority Shape* con las 15 formas, por defecto `cross`).
  * `direction` (*Angle*): Mayoría alineada vs. minoría rotada en un ángulo de choque (`angle`, slider *Clash Angle* de 15° a 90°, por defecto 45°).
  * `tone` (*Tone*): Mayoría en línea/tinta vs. minoría en masa rellena o invertida.
  * `texture` (*Texture*): Solo la minoría recibe la deformación de Texture (la fuerza de la capa si Texture está encendido; si no, una fuerza propia). Se lee mejor con Texture apagado en la capa, porque encendido afecta también a la mayoría.
  * `space` (*Space*): La minoría se dibuja con figura y fondo invertidos: la celda (o el sector, en radial) se rellena de tinta y el módulo va en el color del fondo. Con *Checkerboard inversion* se combinan por exclusión: una celda invertida por los dos queda normal.
* **`dominanceRatio`** (*Dominance ratio*, 50% a 95%, por defecto 80%): Proporción que ocupa la mayoría regular. El techo del 95% garantiza que siempre exista una minoría.
* **`scaleFactor`** (*Contrast Scale Multiplier*, 0.2x a 3.0x, por defecto 2.2x): Multiplicador de la minoría en la dimensión `scale`.
* **`highlightContrast`** (*Accentuate Minority Elements*, por defecto apagado): Destaca la minoría discordante con un color de acento.
* **`accentColor`** (*Accent color*, selector de color, por defecto `#f43f5e`): Color de la minoría resaltada. Elegir un color enciende el resaltado.

**UI (Figma, nodo `5779:2773`).** Cada dimensión muestra solo los controles que la gobiernan: *Scale* → multiplicador de escala, *Shape* → selector de forma, *Angle* → ángulo de choque, *Tone*, *Texture* y *Space* → ninguno (*Dominance ratio* y *Accentuate Minority Elements* siempre visibles). El selector de color de acento, los controles de forma y los de ángulo se añadieron a lo que muestra el mockup. A diferencia de Anomaly, Contrast no tiene puntero en el canvas: la minoría se reparte por distribución, no por posición. Requiere retícula (Repetition o Radiation) en la capa; sin ella se muestra el banner ámbar del contrato Opción B.

---

### 4.8 Concentration (Campos Gravitatorios y Densidad)
Agrupa o dispersa los módulos según campos de fuerza invisibles, simulando gravedad, magnetismo o cúmulos. Estado por capa en `layer.structure.concentration`.

* **`mode`** (tags *Structure*):
  * `point` (*Point*): Los módulos se atraen y concentran hacia un único punto de atracción.
  * `void` (*Void*): Los módulos huyen del centro generando un vacío circular despejado.
  * `line` (*Line*): Concentración hacia un eje lineal principal.
  * `line_void` (*Away from line*): lo inverso de `line`: los módulos huyen del eje y queda un pasillo despejado a su alrededor.
  * `free` (*Hotspots*): Dos focos de densidad (el atractor y su simétrico respecto al centro del canvas).
  * `dense` (*Dense*, superconcentración): **todo el diseño** se comprime hacia el centro (el atractor): los módulos quedan muy juntos.
  * `sparse` (*Sparse*, desconcentración): todo el diseño se dispersa hacia fuera: los módulos quedan muy separados.
* **`method`** (*Method*, `move` por defecto): `move` desplaza los módulos como siempre. `absence` **no mueve nada**: los módulos desaparecen según la densidad del campo (el mecanismo que el libro usa dentro de estructuras formales). En `point`, `line` y `free` se conservan los cercanos y desaparecen los lejanos; en `void` y `line_void`, al revés. *Gathering pull* es la proporción que desaparece en la zona más lejana (100% = ninguno sobrevive). Los mismos módulos desaparecen siempre. No se muestra en `dense` ni `sparse`.
* **`edgeFade`** (*Fade toward the edges*, por defecto apagado): Solo en `dense` y `sparse`. Apagado, la compresión o dispersión es pareja en todo el lienzo; encendido, se debilita hacia los bordes (transición a los bordes).
* **`lineAxis`** (*Line axis*, `horizontal` / `vertical`): Orientación del eje lineal. Solo se muestra en los modos `line` y `line_void`.
* **`attractorX / attractorY`** (*X / Y position*, 5% a 95%, por defecto 50%): Ubicación del polo atractor. También se fijan haciendo clic en el canvas con la pestaña Concentration abierta.
* **`power`** (*Gathering pull*, 20% a 100%, por defecto 50%): Intensidad de la fuerza atractiva o repulsiva.
* **`radius`** (*Field radius*, 80 a 450 px, por defecto 240): Alcance o zona de influencia del campo gravitatorio. No se muestra en `dense` ni `sparse`.
* **`alignToField`** (*Orient Modules to Field Flow*, por defecto apagado): Rota los módulos haciéndolos tangentes a las líneas de fuerza.
* **`densityScale`** (*Dynamic Density Scale*, por defecto apagado): Reduce o agranda la escala del módulo en función de su proximidad al polo.
* **`showAttractor`** (*Display Attractor Guide*, por defecto apagado): Dibuja los anillos del campo, el punto atractor y, en modo `line`, el eje.

**UI (Figma, nodo `5779:2910`).** Requiere retícula (Repetition o Radiation) en la capa; sin ella se muestra el banner ámbar del contrato Opción B. El mockup muestra "1px" en *Field radius*; ese valor queda fuera del rango del campo, así que se usa 240 px. El selector de eje se añadió a lo que muestra el mockup.

---

### 4.9 Texture (Deformación de Geometría como Efecto de Textura)
No es una textura de píxeles: son deformaciones de la geometría de cada módulo que producen un efecto de textura artesanal (trazo a mano, deshilachado, ruptura de línea). Cada forma se convierte en una polilínea y se alteran sus vértices con un ruido determinista (estable por capa y celda, sin parpadeo). Estado por capa en `layer.structure.texture`. Es un modificador autónomo: funciona en módulo único y sobre cualquier retícula, sin banner de dependencia. Se aplica antes de Space, así que las extrusiones usan la geometría deformada.

* **`jitter`** (*Jitter*, 0 a 8 px, por defecto 1): Temblor de cada vértice, como un trazo a mano.
* **`skipChance`** (*Line skipping*, 0% a 60%, por defecto 10%): Omite vértices y rompe el trazo en tramos. Solo se ve en modo trazo; se ignora en relleno.
* **`crossing`** (*Strand crossing*, 0% a 60%, por defecto 10%): Intercambia vértices cercanos y deshilacha el trazo. Solo se ve en modo trazo; se ignora en relleno.
* **`undulation`** (*Perimeter undulation*, 0 a 30 px, por defecto 10): Onda senoidal sobre la normal del contorno.

**Unidades relativas.** Los px de `jitter` y `undulation` están expresados para un módulo de 100 px y se escalan al tamaño real del módulo. La forma `line` es un módulo largo y usa 450 px como referencia (`textureRef`).

**Formas de trazo.** `line`, `wave`, `horseshoe`, `hatch` y los dígitos `digit1`, `digit5` y `digit9` son rutas abiertas (`skeleton: true`): en modo trazo se ven como una línea fina y en modo relleno como un trazo grueso. No se escalan de forma anisotrópica (el trazo se aplanaría) y no usan extrusión de Space. En una retícula, una `line` abarca el ancho de su celda, de modo que una columna y varias filas reproducen una trama de líneas largas.

**UI (Figma, mockup de Texture).** Reemplaza las antiguas texturas de píxeles (grano, semitono, estriado y tipografía, con destino lienzo o formas), que se eliminaron.

---

### 4.10 Space (Ilusión Tridimensional y Extrusión Isométrica)
Transforma el espacio plano bidimensional en una experiencia volumétrica de profundidad. Estado por capa en `layer.structure.space`. Es un modificador autónomo: funciona en módulo único y sobre cualquier retícula, sin banner de dependencia.

* **`mode`** (tags *Mode*):
  * `isometric` (*Isometric*): Proyección axonométrica paralela a 30° con facetas de luz y sombra.
  * `foreshortening` (*3D tilt*): Inclinación con desvanecimiento simulando perspectiva cónica.
  * `fluctuating` (*Fluctuating*): Planos que avanzan y retroceden ópticamente (profundidad flotante). Celdas vecinas alternan la dirección de la extrusión.
  * `conflicting` (*Paradox*): Planos espaciales paradójicos o figuras imposibles.
* **`depth`** (*Extrusion depth*, 10 a 80 px, por defecto 10): Profundidad o altura de la extrusión volumétrica.
* **`angle`** (*Projection angle*, -60° a +60°, por defecto 30°): Ángulo del vector de proyección.
* **`shading`** (*Facet shading contrast*, 20% a 100%, por defecto 50%): Grado de contraste tonal entre las caras iluminadas y las facetas en sombra.
* **`showIsoGuides`** (*Display 30º Isometric Grid Lines*, por defecto apagado): Dibuja la trama isométrica de soporte. Se dibuja una sola vez si alguna capa visible lo pide.

**UI (Figma, nodo `5779:3145`).**

---

## 5. Matriz de Interrelaciones, Reglas Mecánicas y Precedencias

El motor de Studio implementa el modelo de **Contrato Asistido (Opción B)**, aplicado por capa,, asegurando coherencia visual sin frustración en la interfaz:

```
                           ┌─────────────────────────┐
                           │     CAPA (MÓDULO)       │  (Autónomo: Siempre activo)
                           └────────────┬────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       ┌───────────────────┐                         ┌───────────────────┐
       │    REPETITION     │ ◄─── EXCLUSIÓN MUTUA ──► │     RADIATION     │
       │   (Cartesiano)    │                         │      (Polar)      │
       └─────────┬─────────┘                         └───────────────────┘
                 │
                 ▼
       ┌───────────────────┐
       │     STRUCTURE     │ (Subdivisión Cartesiana:
       │ (Requiere Repet.) │  se apaga si Repetition = false)
       └───────────────────┘
```

### Regla 1: Exclusión Mutua Topológica (Cartesiano vs. Polar)
* Las coordenadas cartesianas ($X, Y$) de `Repetition` y las coordenadas polares ($r, \theta$) de `Radiation` son geometrías mutuamente excluyentes.
* **Al activar `Radiation`:** El sistema apaga automáticamente `Repetition` y `Structure`, replegando sus controles para evitar controles fantasma en el canvas.
* **Al activar `Repetition`:** El sistema apaga automáticamente `Radiation`.

### Regla 2: Dependencia Estructural Unidireccional
* `Structure` regula proporciones de columnas y filas ($A:B:A:B$), concepto exclusivo de una retícula cartesiana.
* Si `Repetition` se desactiva, `Structure` se desactiva de forma inmediata.

### Regla 3: Modificadores Colectivos Asistidos
* `Similarity`, `Gradation`, `Anomaly`, `Contrast` y `Concentration` operan sobre una **población de módulos**.
* En modo de módulo único (sin `Repetition` ni `Radiation`), el usuario puede encender y calibrar libremente sus sliders. La interfaz despliega un aviso pedagógico no intrusivo:
  > *Requires Repetition or Radiation matrix to display across a population of units.*
* Si el usuario desactiva temporalmente la retícula, los modificadores cualitativos **no pierden su calibración ni se apagan destructivamente**; quedan listos para manifestarse apenas se reactive una matriz.

### Regla 3b: Precedencia cuando varios modificadores tocan lo mismo (C8)
Sobre un mismo módulo, los efectos se aplican en este orden: Concentration (posición y densidad), Gradation, Similarity, Anomaly y Contrast. Cuando coinciden:
* **Escala:** se **multiplican** (Concentration, Anomaly y Contrast); el producto se limita a 8x para que ningún módulo se desborde. Gradation escala aparte, sobre el lienzo.
* **Giros:** se **suman** (Gradation, Similarity, Anomaly y el ángulo de Contrast).
* **Forma y color de acento:** **gana Anomaly** sobre Contrast. Una anomalía es una ruptura local y Contrast un reparto estadístico, así que dentro de la zona de la anomalía Contrast no cambia la forma ni el color. Fuera de ella, Contrast actúa con normalidad.

### Regla 4: Modificadores Autónomos Omnipresentes
* `Texture` y `Space` operan tanto a nivel del módulo único como sobre cientos de instancias en retícula cartesiana o polar.

---

## 6. Guía de Portabilidad para Abstract Studio

Para incorporar estos conceptos dentro de [Abstract Studio](https://github.com/dMore88/abstract-studio):

1. **Enriquecer las Difference Layers:**
   * Reutilizar las operaciones booleanas entre figuras (union, subtraction, intersection) cuando se rediseñen las interrelaciones entre capas.
2. **Curvas de Gradación en la Trama Lineal:**
   * En lugar de una separación lineal idéntica entre líneas, aplicar la lógica de `Gradation` (`steps`, `pathway`, `rotation`, `scale`) para modular la densidad y grosor de trazo en forma de onda.
3. **Campos Atractores en el Esculpido Automático:**
   * La lógica de `Concentration` (`mode: point`, `mode: void`, `radius`, `power`) puede integrarse como un modo generativo previo o complementario al pincel de esculpido manual de `engine.js`.
4. **Arquetipos Radiales Avanzados:**
   * Expandir los generadores radiales de Abstract Studio con los esquemas de `Radiation`: `centrifugal`, `concentric`, `spiral` con torsión continua (`spiralTwist`) y centros dobles concurrentes (`multi_center`).
