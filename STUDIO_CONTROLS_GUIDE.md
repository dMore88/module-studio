# Guía Técnica de Controles del Panel de Studio e Interrelaciones
### Wucius Wong: Principles of Two-Dimensional Design

> **DOCUMENTO DE ESPECIFICACIÓN TÉCNICA Y PORTABILIDAD**
> Este documento detalla cada parámetro, control, fórmula geométrica e interrelación del panel de **Studio** (en la interfaz, *Module Studio*). Su objetivo es servir como referencia canónica y manual de implementación para trasladar estas capacidades a otros entornos de diseño generativo (como [Abstract Studio](https://github.com/dMore88/abstract-studio)).
>
> Para ver **qué concepto de Wong cubre cada control**, y qué conceptos faltan o se descartaron, mira [`docs/design-concepts-in-app.md`](docs/design-concepts-in-app.md). Las prioridades pendientes están en [`docs/BACKLOG.md`](docs/BACKLOG.md). Las decisiones de usabilidad (qué va visible y qué va en *Advanced*) están en [`docs/AUDITORIA_CONTROLES.md`](docs/AUDITORIA_CONTROLES.md).

---

## 📑 Índice
1. [Arquitectura y Jerarquía](#1-arquitectura-y-jerarquía)
2. [Canvas, Guías y Display](#2-canvas-guías-y-display)
3. [Capas y Módulo Base](#3-capas-y-módulo-base)
4. [Modifiers Stack: Especificación Detallada](#4-modifiers-stack-especificación-detallada)
   - [4.1 Layout › Repetition (Retícula Cartesiana)](#41-layout--repetition-retícula-cartesiana)
   - [4.2 Ritmo y gradación de estructura (antes panel Structure)](#42-ritmo-y-gradación-de-estructura-antes-panel-structure)
   - [4.3 Layout › Radiation (Estructura Polar)](#43-layout--radiation-estructura-polar)
   - [4.4 Similarity](#44-similarity-parentesco-y-variación-morfológica)
   - [4.5 Gradation](#45-gradation-transición-progresiva-sistemática)
   - [4.6 Anomaly](#46-anomaly-ruptura-focal-y-fractura)
   - [4.7 Contrast](#47-contrast-tensión-y-dominancia-de-minorías)
   - [4.8 Concentration](#48-concentration-campos-gravitatorios-y-densidad)
   - [4.9 Texture](#49-texture-deformación-de-geometría-como-efecto-de-textura)
   - [4.10 Space](#410-space-ilusión-tridimensional-y-extrusión-isométrica)
5. [Reglas de Interfaz (chips, dropdowns, Advanced, guías, teclado)](#5-reglas-de-interfaz)
6. [Matriz de Interrelaciones, Reglas Mecánicas y Precedencias](#6-matriz-de-interrelaciones-reglas-mecánicas-y-precedencias)
7. [Guía de Portabilidad para Abstract Studio](#7-guía-de-portabilidad-para-abstract-studio)

---

## 1. Arquitectura y Jerarquía

### Glosario (los cuatro términos de la app)

* **Canvas:** la mesa de trabajo. Tiene aspect ratio y un tamaño en px (600 × 600 en 1:1) y se muestra escalado a la pantalla; lo que se sale queda cortado. El editor del módulo tiene su propio canvas, del tamaño del módulo.
* **Composition container:** la hoja de papel donde se repite el módulo (en el panel Layout). Tiene ancho, alto y desfase en px, y **corta** lo que el layout dibuje fuera de su borde. Una por capa: una capa = una composición.
* **Module:** la pieza de papel que se repite. Es su propio canvas: solo tiene **ancho y alto** (10 a 1000 px, 100 × 100 por defecto) y **rotación**, y **siempre corta** en su borde lo que se dibuje encima, sea una o cincuenta shapes.
* **Shape:** una figura dibujada sobre el módulo (hasta 4), con su propia forma, ancho, alto, posición y giro, en px desde el centro del módulo.

Jerarquía: **canvas → composition container → celda → module → shapes**. En Wong, el módulo es la unidad que se repite (aquí, la pieza entera con sus shapes), las shapes son sus *formas* y la celda es la *subdivisión* de la estructura.

El panel estructura la generación gráfica en tres niveles. Cada **capa** (hasta 5) es un módulo independiente con su propio estado de modificadores:

```
┌────────────────────────────────────────────────────────┐
│               1. CANVAS, GUÍAS Y DISPLAY               │
│    (Aspect ratio, guías, color de guías, figura/fondo)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│         2. CAPAS (hasta 5) · MÓDULO BASE POR CAPA       │
│   (Shapes, tamaño del módulo, rotación, color, trazo)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│    3. MODIFIERS STACK (por capa, un panel cada uno)     │
│ Layout · Similarity · Gradation · Anomaly · Contrast ·  │
│            Concentration · Texture · Space              │
└────────────────────────────────────────────────────────┘
```

**Paneles del riel** (de arriba abajo): Module, Layout, Similarity, Gradation, Anomaly, Contrast, Concentration, Texture, Space. El antiguo panel *Structure* ya no existe: sus proporciones viven en *Layout › Advanced* (sección 4.2).

**Art log** (columna izquierda, bajo la lista de capas): la **receta completa del diseño** en texto, que se actualiza sola. Lista **todas las capas** en el orden de la pila (la activa marcada con `(active)`, las ocultas con `(hidden)`), y de cada una:
* **El módulo:** `Module` (ancho y alto en px y rotación), `Shapes` (cada shape con su ancho × alto, su posición y su giro; en un módulo sin abrir en el editor, `Shape`) y `Style` (relleno o trazo, color y grosor del trazo).
* **El layout** si está encendido: `Structure` con todos sus valores (modo, variación, columnas y filas o rayos y anillos, Fit o Actual size, colocación, mezcla, dirección, reflejo, el parámetro de la variación, orientación, forma de anillo, centro abierto…) y `Composition container` (tamaño y desfase en px); los **checks solo cuando están encendidos**, con sus valores: `Clip cell: on`, `Checkerboard: on`, `Visible lines: on / stroke 2px / #112233 / Both / all lines`, `Rays follow container: on`; y `Rhythm`.
* **Cada modificador encendido** con **todos sus valores**, en las unidades de los sliders: por ejemplo `Gradation: Rotate / Diagonal / Range 90º / Cycles 3 / Ping-pong / Speed +40 / Reversed`, `Texture: Jitter 58% / Line skipping 10% / Random lines 26% (opacity 85%) / Plane wave 28% (2 waves, 0º)` o `Space: Isometric / Depth 20% / Angle 30º / Shading 50%`.
Lo apagado no aparece. El recuadro tiene **scroll interno** (el título y el botón quedan fijos arriba), el texto se puede **seleccionar** y el botón **Copy** lo copia entero como texto plano. Describe el diseño, no lo que se ve en pantalla.

### Jerarquía espacial: composition container → celda → módulo → shapes

* El **composition container** es la hoja donde vive el layout (sección 4.1). Corta lo que sobresale de su borde.
* La **celda** es el espacio de la retícula (columna × fila). Sobre ella actúan el ritmo A:B y la gradación de estructura.
* El **módulo** (la pieza de papel, *Module width / height*) va dentro de la celda. En *Fit to canvas* hay dos modos (*Module scale* en *Advanced*): **Base size** (por defecto) lo deja a sus px y **Shrink with cell** lo reduce con la celda. En *Actual size* **manda**: la celda toma el tamaño del módulo.
* Las **shapes** viven dentro del módulo y se escalan con él. El módulo las **corta** en su borde; *Clip cell* (Layout) corta además al borde de la celda.

> **Nota:** el antiguo par *Form A / Form B* y sus 8 interrelaciones (detachment, touching, overlapping, penetration, union, subtraction, intersection, coincidence) fueron reemplazados por el sistema de capas. Las interrelaciones entre capas están **pendientes de rediseño** (backlog INT2, INT5 a INT9, al final de todo).

---

## 2. Canvas, Guías y Display

Controla el soporte físico y las ayudas de pantalla. Los botones están encima del lienzo.

| Parámetro / Control | Selector / Tipo | Rango / Valores | Función & Comportamiento Gráfico |
| :--- | :--- | :--- | :--- |
| `aspectRatio` | Dropdown | `1:1`, `9:16`, `4:3`, `3:4`, `16:9` | Modifica las dimensiones del canvas (sin margen de seguridad). Determina el tamaño de celda en retículas y el radio máximo en esquemas polares. |
| `showSafeBounds` | Botón de icono (rejilla) | `boolean` | Muestra u oculta las guías del lienzo: retícula de coordenadas de fondo y límites. |
| `invertFigureGround` | Botón de icono (círculo mitad) | `boolean` | Invierte ópticamente figura y fondo: la figura asume el tono del papel y el fondo el de la tinta. |
| `guideColor` | Botón de icono (paleta) que abre el selector | color hex, por defecto `#F24822` | **Un solo color para todas las guías de pantalla** de los controles: marco del composition container, marco de la shape que se edita, punto focal de Anomaly, guía del atractor de Concentration y retícula isométrica de Space. Se guarda con el proyecto. La retícula de coordenadas de fondo y los límites del lienzo siguen en gris neutro. |
| Margen de seguridad | — | — | Retirado: vale 0. Las estructuras llegan al borde del lienzo. |
| `zoomLevel` | — | — | Retirado: el lienzo se ajusta solo al alto libre de la pantalla. |

**Ninguna guía se exporta.** Ni la retícula de fondo, ni los límites, ni el marco del composition container ni el de la shape, ni el punto focal, ni la guía del atractor, ni la retícula isométrica salen en el SVG ni en el PNG. Lo que sí se exporta es todo lo que es diseño, incluidas las **líneas visibles** de Layout (ver 4.1).

---

## 3. Capas y Módulo Base

Cada capa es un módulo independiente (su pieza de papel, sus shapes, su composition container y sus modificadores). Se pueden tener hasta 5 capas con visibilidad, orden (arrastrar y soltar), color y pipeline de modificadores propios.

**Duplicate** (botón a la izquierda de *Add module*, en el panel de capas): crea una copia **exacta** de la capa activa (shapes, color, trazo o relleno, Layout con su composition container, los siete modificadores y todos sus valores), con el siguiente nombre libre (`Layer N`), justo **encima** de la original y activa. La copia no comparte nada con la original. Se desactiva, igual que *Add module*, cuando ya hay 5 capas, y deshacer quita solo el último duplicado.

### 3.1 El panel Module (el editor del módulo)

El botón *Module* del riel abre **el editor del módulo**. Mientras está abierto, el canvas pasa a ser **el módulo mismo**: mide su ancho × alto (con cualquier proporción, sin aspect ratio), se muestra escalado para caber en la pantalla y dibuja el módulo **solo**, sin layout ni modificadores, a **1:1** (un px del editor es un px del diseño). Lo que sobresale del borde se corta. Al cerrar el panel vuelve el canvas del diseño.

**Save / Cancel.** Se edita en vivo, pero con red: **Cancel** devuelve todo (shapes y controles del módulo) a cómo estaba al abrir; **Save** confirma y deja **un solo paso** en el historial del proyecto. Pasar a otro panel o cambiar de capa cuenta como *Save*. Dentro del editor, **Cmd+Z / Cmd+Shift+Z** recorren los cambios **paso a paso** (añadir una shape, moverla, cambiar un valor…).

**Shapes** (de 1 a 4):
* **Lista de shapes** con *Add shape* (la nueva sale a la mitad del módulo), subir y bajar en el orden de dibujo, y borrar (siempre queda una). Una shape seleccionada lleva un **marco fino** en el canvas del editor (guía de pantalla, nunca se exporta).
* **Rejilla de formas** (*Shape*): una de las 22 formas (`STUDIO_SHAPE_KEYS` en `js/studio/shapes.js`: básicas `circle`, `square`, `triangle`, `line`, `cross`, `ring`; curvas y direccionales `semicircle`, `quarter`, `crescent`, `wave`, `spiral`, `arrow`; polígonos `pentagon`, `hexagon`, `octagon`, `star`; caracteres `letterA`, `letterS`, `letterR`, `digit1`, `digit5`, `digit9`). Iconos Phosphor en peso *regular* (campo `phIcon`; lista en `docs/DESIGN_SYSTEM_TOKENS.md`, sección 6); el anillo y las letras se dibujan con su propio dibujo o glifo. En Gradation › *Becomes*, Contrast › *Minority Shape* y Anomaly › *Focal Intruder Shape* la misma lista se ofrece como dropdown.
* **`width` / `height`** (*Shape width* y *Shape height*, 1 a 2000 px): el tamaño de la shape. Un círculo con valores distintos es una elipse. La línea solo tiene largo: su *Height* se oculta. El trazo **conserva un grosor uniforme** aunque la shape se estire.
* **`x` / `y`** (*Shape position X* y *Y*, −1000 a 1000 px): desde el centro del módulo. Mover una shape hasta que el borde la corte es el «módulo excéntrico y recortado» de Wong.
* **`rotation`** (*Shape rotation*, −180 a 180º): gira la shape sobre su propio centro.

**Módulo** (la pieza de papel):
* **`containerW` / `containerH`** (*Module width* y *Module height*, **10 a 1000 px**, por defecto **100 × 100**): el tamaño del módulo, de cualquier proporción. En las retículas es la pieza que se repite. Los proyectos antiguos con 0 («todo el canvas») se abren con el tamaño del canvas.
* **`rotation`** (*Module rotation*, 0 a 360º): gira la pieza entera (con su borde y sus shapes), y así aparece en la composición.
* **`drawMode`** (*Stroke* o *Fill*), **`color`** (hex) y **`strokeWidth`** (*Stroke width*): comunes a todas las shapes del módulo. Todas las shapes heredan el color y el trazo; un color por shape queda para más adelante. Dos shapes del mismo color en *Fill* se funden en una sola mancha.
* **`visible`**: visibilidad de la capa (icono del ojo en la tarjeta).

**El módulo es una sola forma compuesta.** Para la retícula y para los modificadores, el módulo es una única forma con varios contornos: Gradation lo gira entero, Texture lo deforma como una pieza, Space le da profundidad a todo el bloque, y los modificadores que cambian la forma (Morph, la forma de Similarity, Contrast › *Shape*) lo sustituyen entero por otra. Desde fuera del editor no se puede tocar una shape suelta.

**El borde del módulo corta la geometría, no los efectos.** Lo que sobresale se corta *antes* de aplicar Texture y Space: la shape cortada es la que se deforma o se extruye, así que sus efectos pueden salirse del borde. Con *Stroke* quedan solo los arcos de dentro, sin línea a lo largo del corte; con *Fill* queda un polígono pegado al borde.

**Un módulo sin abrir en el editor** (una sola shape que viene de un proyecto antiguo o de una capa nueva) se dibuja como siempre y no corta. Al abrir el editor y guardar, pasa al modelo nuevo: la shape se convierte en la primera de la lista. Las shapes guardadas con tamaño y posición en % (formato anterior) se convierten solas a px.

**Ya no existen** el *Width / Height* de la shape única (ahora cada shape tiene los suyos), *Module offset*, *Clip container*, *Show container* ni *Hide modifiers*: el módulo es su propio canvas y siempre corta, y mover una shape hace lo que hacía el offset.

---

## 4. Modifiers Stack: Especificación Detallada

### 4.1 Layout › Repetition (Retícula Cartesiana)
Multiplica el módulo en una retícula ortogonal sobre el plano cartesiano $X, Y$. El panel *Layout* tiene un interruptor general y un selector *Structure mode* (Repetition / Radiation, excluyentes).

**Composition container** (cuatro sliders visibles en *Layout*, justo debajo del diseño del modo activo y antes de su *Advanced*; el mismo bloque sirve a los dos modos): la **hoja de papel donde vive el layout de la capa**, para componer varias capas (por ejemplo una retícula a la izquierda y otra polar a la derecha). Se guarda en `layer.structure.block` (en % del lienzo, para que siga al lienzo si cambia la proporción) y el layout se dibuja como si el container fuera un lienzo pequeño, con todo lo suyo dentro (módulos, líneas visibles, y las posiciones de Anomaly y Concentration, que son relativas a él). **Corta** todo lo que el layout dibuje fuera de su borde, también en *Actual size*. Los sliders muestran **píxeles del lienzo**:
* **`w` / `h`** (*Composition container width* y *height*, 10 a 2000 px, por defecto el tamaño del lienzo: 600 px en 1:1): en *Fit to canvas* la retícula se reparte dentro; en *Radiation* el radio máximo sale de su lado menor; en *Actual size* los módulos conservan su tamaño real, la cuadrícula va centrada en la hoja y la hoja corta lo que sobresale.
* **`x` / `y`** (*Composition container offset X* y *offset Y*, −1000 a 1000 px, por defecto 0 px): el **desfase del centro de la hoja respecto al centro del lienzo**.
* Con los valores por defecto el dibujo es idéntico al de siempre. En Anomaly y Concentration, el clic en el lienzo se convierte en una posición dentro de la hoja. **Marco:** mientras el panel *Layout* está abierto y la hoja no es el lienzo entero, la capa activa dibuja un marco punteado con el color de guías. Es una ayuda de pantalla: no se exporta y se oculta al cerrar el panel o abrir otro. El *Art log* añade `Composition container: 300 x 300px / offset -150, -150px`.

**Visible al abrir:**
* **`gridType`** (*Grid structure variation*, dropdown con un icono por retícula):
  * `basic` (*Grid*): retícula ortogonal $M_{i,j}$.
  * `sliding` (*Brick*): desfase alternado de filas. Parámetro **Row offset** (`slideOffset`, 0 a 100 %).
  * `sheared` (*Diagonal*): cizallamiento diagonal. Parámetro **Shear angle** (`shearAngle`, 0 a 45º).
  * `curved` (*Curved*): deformación sinusoidal de las filas. Parámetro **Wave amount** (`curveAmount`, 0 % a 100 % del ancho de la celda, por defecto 10 %: con 100 % las líneas se desplazan una celda entera y nunca se cruzan). Los proyectos antiguos guardados en píxeles (`curveIntensity`) se siguen leyendo en píxeles hasta que se mueve el slider.
  * `zigzag` (*Zigzag*): deformación angular de las filas. Mismo parámetro *Wave amount*.
  * `triangular` (*Triangular*): filas impares desplazadas media celda.
  * `alternating` (*Alternating*): las celdas impares giran 180º.
  * `free` (*Free*): **distribución libre**, sin retícula. *Columns* × *Rows* dan la cantidad de módulos; se reparten dejando un espacio parecido alrededor de cada uno (reparto uniforme tipo ruido azul) y el parámetro **Seed** (`freeSeed`, 1 a 99) cambia la disposición. Los módulos se ordenan por filas para que Gradation, Contrast y los demás sigan teniendo un recorrido. No tiene líneas visibles, ni ritmo, ni Module placement ni Cell mix. En *Actual size* ocupa el bloque centrado de *Columns* × *Rows* contenedores.
  * `hexagonal` (*Hexagonal*): panal; las filas encajan (paso vertical de 0,866 del ancho de celda). El recorte de celda y las líneas visibles usan hexágonos.
* **Parámetro de la variación**, justo debajo del dropdown y solo con Brick, Diagonal, Curved y Zigzag.
* **`cols` / `rows`** (*Columns* y *Rows*, 1 a 50).
* **`sizeMode`** (*Module size*, `fit` por defecto):
  * `fit` (*Fit to canvas*): *Columns* y *Rows* dividen el lienzo y todo lo compuesto (el módulo con sus shapes) se reduce **en proporción al lienzo**.
  * `actual` (*Actual size*): se repite **el módulo tal cual**, *Columns* × *Rows* veces. Cada celda mide lo que mide el módulo y la cuadrícula queda centrada en el composition container, que corta lo que sobresale de su borde. El módulo **conserva su tamaño** al cambiar de modo.
* **`moduleScale`** (*Module scale*, en *Advanced*, solo en *Fit to canvas*): `uniform` (*Base size*, por defecto) deja a **cada módulo con su propio tamaño** (el slider *Size*, en px del lienzo) en todas las celdas, sin reducirlo a la celda; si es mayor que la celda se solapa o, con *Clip cell*, queda cortado por ella. `cell` (*Shrink with cell*) lo reduce con su celda, como antes. Con *Rhythm* el módulo conserva igualmente la proporción de su columna. Los proyectos guardados antes de esta opción se abren con `cell`.
* **`placement`** (*Module placement*, chips Centers / Intersections / Both): dónde se colocan los módulos: en el centro de cada celda, en los cruces de las líneas, o los dos a la vez (dos clases de módulo entretejidas, fig. 23). **`interScale`** (*Intersection size*, 10 a 100 %, por defecto 50) es el tamaño de los módulos de los cruces. No aplica al panal.
* **`cellMix`** (*Cell mix*, chips None / Merged / Divided): `merge` convierte bloques alternos de 2×2 celdas en un módulo grande; `divide` parte esos bloques en módulos más pequeños (fig. 22f y 22g). Solo en retícula básica y alternada.

**En *Advanced* (plegable):**
* **`reflection`** (*Reflection*, dropdown): espeja el módulo en las columnas impares (`columns`), en las filas impares (`rows`) o en ambas (`both`). No invierte las rotaciones de Gradation ni los campos de Concentration.
* **`direction`** (*Direction*, dropdown, `repeated`): hacia dónde mira cada módulo. `repeated` todos igual; `alternated` las celdas alternas giran 180º; `undefined` cada módulo mira hacia un lado distinto, siempre el mismo para el mismo estado.
* **Ritmo y gradación de estructura** (sección 4.2).
* **`activeClipping`** (*Clip cell*): recorta cada módulo al borde de su **celda**, con la forma real de la celda en cada variación de retícula. No tiene que ver con el borde del módulo, que siempre corta (panel Module).
* **`checkerInvert`** (*Checkerboard inversion*): en casillas alternadas la celda se rellena con el color del módulo y el módulo se dibuja con el color del fondo (inversión figura-fondo, con cualquier color de módulo).
* **`showGridLines`** (*Visible lines*): dibuja las líneas de la retícula. **Son parte del diseño (Wong)**: llevan color y grosor y **se exportan**. Opciones:
  * **`lineColor`** (*Line color*, vacío = el color de la capa). Para una línea que corte los módulos basta elegir el color del fondo (fig. 20b y 20c).
  * **`gridLineWidth`** (*Line width*, 0,5 a 6 px).
  * **`lineDirection`** (*Line direction*, dropdown): `both`, `horizontal` o `vertical` (fig. 20d).
  * **`lineSpacing`** (*Line spacing*, dropdown): `all` o `alternate` (una línea de cada dos).
  En el panal se dibuja cada hexágono y dirección y espaciado no aplican.
* `spacing` (separación entre celdas) existe en el estado con valor 0 y no tiene control en la interfaz.

---

### 4.2 Ritmo y gradación de estructura (antes panel Structure)
Viven en *Layout › Repetition › Advanced* y escalan **el espacio** de la retícula. Requieren retícula cartesiana; no aplican al panal. Estado en `layer.structure.formalStructure`.

* **Ritmo A:B** — **`colRatio`** y **`rowRatio`** (*Col B size [% of A]* y *Row B size [% of A]*, **10 % a 100 %**, por defecto 100 %; el valor guardado sigue siendo el factor 1 a 10, p. ej. 40 % = 2,5): alternan columnas (o filas) A y B; el slider muestra el tamaño de B como porcentaje de A (100 % = iguales, 10 % = B mide una décima parte de A). La **A es la base** y conserva el tamaño del módulo; la **B mide A ÷ ratio** y el módulo **se encoge en proporción**, con la escala del lado más pequeño de su celda. En *Fit* el lienzo se reparte A:B; en *Actual size* la A es el contenedor y la B es más angosta, y el conjunto queda centrado. Con ratio 1 no cambia nada.
* **Gradación de estructura** — **`colGrade`** y **`rowGrade`** (*Col gradation* y *Row gradation*, −30 a 30 %, por defecto 0; fig. 44): cada columna (o fila) es ese porcentaje más ancha (o más angosta, con valores negativos) que la anterior. Se combina con el ritmo (los efectos se multiplican). En *Fit* el lienzo se reparte con esos pesos; en *Actual size* la primera columna es el contenedor y las siguientes crecen o decrecen a partir de ella. El módulo sigue a su celda en proporción, con la misma regla del ritmo.
* Mover cualquiera de estos sliders enciende la estructura rítmica automáticamente. Al verse con módulos centrados, el ritmo se aprecia mejor con *Visible lines*, *Checkerboard inversion* o *Clip cell*.
* Existen también `mode`, `bandThickness` y `showBands` (líneas estructurales dibujadas con grosor propio) como estado heredado, sin control propio en la interfaz.

---

### 4.3 Layout › Radiation (Estructura Polar)
Genera el espacio desde uno o varios centros focales con coordenadas polares $(r, \theta)$.

**Visible al abrir:**
* **`scheme`** (*Radiation scheme*, dropdown):
  * `centrifugal`: rayos rectos que nacen del foco y se proyectan hacia fuera.
  * `centripetal` (fig. 50): los ángulos de las líneas estructurales apuntan hacia el centro. Orientación automática hacia dentro; las guías son chevrones anidados.
  * `concentric`: anillos que se expanden desde el epicentro.
  * `spiral`: rayos curvos continuos con torsión angular acumulada.
  * `multi_center` (*Multi-center*): de 2 a 8 focos concurrentes con interferencia mutua. Con 2 los focos quedan a izquierda y derecha; con más se reparten parejos en un círculo pequeño.
* **`moduleScale`** (*Module scale*, en *Advanced*, solo en *Fit to canvas*): `uniform` (*Base size*, por defecto) le da **el mismo tamaño en todas las celdas**, proporcional al conjunto de la retícula (el slider *Size* del módulo se lee como en *Actual size*, en px del lienzo), mientras la retícula sigue cabiendo en el lienzo. En el centro, donde las celdas son más pequeñas, los módulos se solapan o, con *Clip cell*, quedan cortados por la retícula. Con la retícula multicentro se escala con ella. `cell` (*Shrink with cell*) hace que el módulo se encoja con su celda; los proyectos guardados antes de esta opción se abren con `cell`, para que no cambien.
* **`rays`** (*Angular rays*, 3 a 60) y **`rings`** (*Concentric rings*, 2 a 20). Todos los anillos tienen los mismos rayos (*Angular rays*), también en *Actual size*. En *Actual size* hay además una casilla en *Advanced*, **`raysByContainer`** (*Rays follow container*, apagada por defecto): al encenderla, **la celda es el módulo** y cada anillo tiene **tantos rayos como caben en su circunferencia al ancho del módulo** (`2π × radio ÷ ancho`, mínimo 3), pocos en el centro y más hacia fuera, así que todas las celdas miden más o menos lo que el módulo y no se amontonan. Con la casilla encendida el slider *Angular rays* se oculta. No existe en *Fit to canvas* ni en *Centripetal* (los chevrones de una cuña deben anidarse de un anillo al siguiente, y con rayos distintos por anillo se desordenan).
* **`centerCount`** (*Centers*, 2 a 6, por defecto 2): solo con *Multi-center*.
* **`spiralTwist`** (*Spiral twist*, −180º a 180º): torsión acumulada.
* **`sizeMode`** (*Module size*): `actual` hace lo mismo que en la cuadrícula: el módulo conserva su tamaño real y cada anillo tiene de grosor la *Module height*.

**En *Advanced*:**
* **`orientation`** (*Module orientation*, dropdown, `auto`): `auto` depende del esquema; `outward`, `inward`, `tangent` o `fixed` (sin giro).
* **`direction`** (*Direction*, `repeated`): igual que en la cuadrícula, encima de la orientación.
* **`ringShape`** (*Ring shape*, dropdown, `circle`; fig. 49b y 49g): la forma de cada anillo: `circle`, `triangle` y `pentagon` (punta arriba), `square`, `hexagon` u `octagon` (lado plano arriba). Los módulos, las líneas visibles, los sectores del recorte y la inversión figura-fondo siguen al polígono; *Ring rotation* gira cada polígono. No aplica a `spiral` ni `centripetal`.
* **`centerOpen`** (*Open center*, 0 a 90 %): radio del agujero central; anillos y rayos empiezan en su borde (fig. 48d).
* **`ringRotation`** (*Ring rotation*, −90º a 90º): grados que cada anillo gira más que el interior (fig. 49g).
* *Clip cell* (corta el módulo a su celda: el sector de arcos y rayos o, en *Centripetal*, la **banda entre dos chevrones** consecutivos, que es la celda que se ve), *Checkerboard inversion* (en los anillos son los **sectores alternos**, según la suma de su anillo y su rayo: con un número par de rayos sale un tablero perfecto; con un número impar queda una costura donde dos sectores vecinos tienen el mismo color) y **Visible lines** (`showRays` / `showRings`, con **`lineColor`** y **`lineWidth`**, 0,5 a 6 px): igual que en la cuadrícula; son diseño y se exportan.
* `centerX / centerY`: foco excéntrico (en el estado).

---

### 4.4 Similarity (Parentesco y Variación Morfológica)
Rompe la rigidez de la repetición pura con variaciones de parentesco entre módulos. Requiere retícula.

**Visible:** **`kinshipType`** (*Visual kinship type*, dropdown) y **`intensity`** (*Fluctuation intensity*, 0 a 100 %).
* `distortion` (*Elastic*): estiramiento anamórfico pseudoaleatorio. `foreshortening` (*3D tilt*): pérdida de escala en un sentido. `rotation_wobble` (*Wobble*): oscilaciones del ángulo. `scale_kinship` (*Scale*): fluctuación de tamaño. `hybrid`: todas a la vez.

**En *Advanced*:**
* **`association`** (*Association*, dropdown): mezcla formas de **una misma familia visual** (`round`, `angular`, `lines`, `characters`: letras A, S, R y los números); **`assocMix`** (*Association mix*, 0 a 100 %, por defecto 50) es el porcentaje de módulos que cambian. Anomaly y Contrast mandan sobre la asociación en forma.
* **`imperfection`** (*Imperfection*, dropdown): `cut` corta una porción con una recta; `broken` parte el módulo y desliza las mitades. **`imperfAmount`** (*Imperfect modules*, 0 a 100 %, por defecto 30).
* **`cellJitterAmount`** (*Spatial cell jitter*, 0 % a 90 %): desplazamiento orgánico del módulo, como porcentaje de su celda: al 100 % el centro llegaría al borde de la celda, así que 90 % lo mantiene dentro. En radial se usa el menor entre el grosor del anillo y el ancho del sector. Los proyectos antiguos en píxeles (`cellJitter`) se siguen leyendo en píxeles hasta que se mueve el slider.
* `seed`: semilla generativa (en el estado).

---

### 4.5 Gradation (Transición Progresiva Sistemática)
Genera una ilusión de movimiento, velocidad o dimensión mediante una progresión sistemática de módulos. Requiere retícula.

**Visible:**
* **`type`** (*Attribute*, dropdown): `rotation`, `scale`, `depth`, `drift` (desplazamiento acumulado), `shape` (la forma se convierte paso a paso en `targetShape`, *Becomes*, la lista de 22 formas en dropdown, interpolando contornos) `texture` (la deformación de Texture crece a lo largo del recorrido) y `color` (el color del módulo viaja hacia *End color* a lo largo del recorrido; *Range* controla cuánto avanza; los módulos de acento de Anomaly o Contrast conservan su color).
* **`pathway`** (*Pathway direction*, dropdown): `diagonal`, `horizontal`, `vertical`, `concentric` y `zigzag` (camino en serpiente, fig. 41).
* **`range`** (*Range*, 5º a 360º): magnitud total de la transición. **`steps`** (*Cycles*, 1 a 10).

**En *Advanced*:**
* **`sequence`** (*Sequence*, dropdown): `restart` (1-2-3-1-2-3) o `pingpong` (1-2-3-2-1).
* **`easing`** (*Speed*, −100 a 100): el slider muestra la velocidad con la que el efecto llega a su máximo: **+100 llega enseguida** (rápido) y **−100 llega tarde** (lento); 0 es un reparto parejo. Se guarda en `easing` con el signo contrario (positivo guardado = arranca lento), así que los proyectos antiguos se ven igual (fig. 38).
* **`alternate`** (*Alternate rows*): las filas impares corren en sentido contrario (fig. 43). Con *Ping-pong*, que va y vuelve igual, las filas impares quedan desfasadas medio ciclo. Se oculta en el recorrido *Zigzag*, que ya corre de ida y vuelta.
* **`reverse`** (*Reverse Gradient Direction*): invierte el sentido. Con *Ping-pong* la onda empieza por el otro extremo (arranca en lo alto en vez de en lo bajo).

En esquema polar, `drift` desplaza el módulo sobre su eje local hasta cerca de un anillo. Estado por capa en `layer.structure.gradation`. (No confundir con la *gradación de estructura* de la sección 4.2, que gradúa el tamaño de las celdas.)

---

### 4.6 Anomaly (Ruptura Focal y Fractura)
Introduce una zona de irregularidad donde prevalece una estructura regular previa. Requiere retícula. Estado en `layer.structure.anomaly`.

* **`type`** (*Type*, chips): `focal` (epicentro circular que transforma los módulos inscritos), `fracture` (*Rupture*: falla transversal que desfasa los módulos a ambos lados), `swell` (deformación que expande y empuja), `tear` (*Void*: vacío de módulos) y `regrid` (*Another grid*: dentro de la zona la retícula cambia a otra variación).
* **`distribution`** (*Distribution*): `single` (un epicentro), `regular` (`count` anomalías en retícula escalonada) o `random` (al azar sin tocarse, fig. 56b). Con varias, aparecen **`count`** (2 a 12) y, solo en `random`, **`seed`** (1 a 99).
* **`attrs`** (*Deviates in*, chips múltiples): en qué atributos se desvía (forma, escala, rotación, posición). **`anomalousShape`** (*Focal Intruder Shape*, la lista de 22 formas, en dropdown).
* **`zoneGrid`** (*Grid inside the zone*, solo con `regrid`): Brick, Diagonal, Curved, Zigzag, Triangular o Alternating; las celdas cuyo centro cae dentro de la zona (radio *Radius*, alrededor de cada epicentro) siguen esa variación y el resto la retícula de Layout. Solo aplica a la retícula, no al radial; con `regrid` se ocultan *Deviates in* y *Severity*. La casilla de acento tiñe los módulos de la zona.
* **`radius`** (*Radius*, 10 a 350 px) e **`intensity`** (*Severity*, 5 a 100 %).
* **Punto focal.** Ya no hay sliders X / Y: el punto está **visible por defecto** al activar el control y se mueve con un **clic en el lienzo** con la pestaña Anomaly abierta (`epicenterX / epicenterY`). La casilla **`showReticle`** (*Show focal point*) lo oculta. Se dibuja con el color de guías y no se exporta.
* **Color de acento:** la fila *Accent color* (`accentColor`) resalta los módulos anómalos. Elegir un color enciende el resaltado (`highlightColor`); el botón **×** lo quita (la fila muestra *None*).

---

### 4.7 Contrast (Tensión y Dominancia de Minorías)
Establece disparidad formal entre una **mayoría dominante** y una **minoría discordante**. Requiere retícula. Estado en `layer.structure.contrast`.

* **`dimension`** (*Dimension*, dropdown con siete opciones):
  * `scale`: minoría monumental (`scaleFactor`, *Contrast Scale Multiplier*, 0,2 a 5x, por defecto 2).
  * `shape`: minoría con glifo discordante (`contrastShape`, *Minority Shape*, la lista de 22 formas, en dropdown).
  * `direction` (*Angle*): minoría rotada (`angle`, *Clash Angle*, 5º a 90º).
  * `position` (*Position*): la minoría se desplaza dentro de su celda: **`positionShift`** (*Shift*, 0 a 50 % del lado menor de la celda, por defecto 25) en la dirección **`positionAngle`** (*Shift direction*, 0 a 360º). La mayoría queda centrada.
  * `tone` (*Tone*): la minoría se dibuja en otro **tono del color del propio módulo**, más claro, hacia el color del fondo. **`toneAmount`** (*Tone*, 0 a 100 %, por defecto 50; 0 % es el color original y 100 % el del fondo, donde la minoría desaparece). Sirve igual en relleno que en contorno.
  * `texture`: solo la minoría recibe la deformación de Texture.
  * `space`: la minoría se dibuja con figura y fondo invertidos. Con *Checkerboard inversion* se combinan por exclusión.
* **`dominanceRatio`** (*Dominance ratio*, 50 a 95 %, por defecto 80).
* **`spread`** (*Minority spread*, dropdown): dónde cae la minoría. `scattered` (al azar, por defecto), `balanced` (repartida con parejo, sin racimos ni huecos), `edge` (se acumula hacia los bordes) o `center` (hacia el centro). Funciona en retícula y en radial.
* **Color de acento:** la fila *Accent color* (`accentColor`) destaca la minoría; elegir un color enciende el acento (`highlightContrast`) y el **×** lo quita. Manda sobre el tono.
* Cada dimensión muestra solo sus controles. Contrast no tiene puntero en el lienzo.

---

### 4.8 Concentration (Campos Gravitatorios y Densidad)
Agrupa o dispersa los módulos según campos de fuerza invisibles. Requiere retícula. Estado en `layer.structure.concentration`.

* **`mode`** (*Structure*, chips): `point`, `void`, `line`, `line_void` (*Away from line*), `free` (*Hotspots*, de 2 a 8 focos), `dense` (todo el diseño se comprime hacia el atractor) y `sparse` (todo se dispersa).
* **`method`** (*Method*): `move` desplaza los módulos; `absence` no mueve nada y hace desaparecer módulos según la densidad (el mecanismo que el libro usa en estructuras formales). No se muestra en `dense` ni `sparse`.
* **`lineAxis`** (*Line axis*): solo en `line` y `line_void`.
* **`focusCount`** (*Foci*, 2 a 6, por defecto 2): solo en `free`. El atractor y sus copias girando alrededor del centro del lienzo; con 2 son el atractor y su simétrico. Cada módulo se dirige al foco más cercano, y *Absence* usa todos los focos.
* **Field style** (chips que se pueden **mezclar**): **`edgeFade`** (*Soft edge*, solo en `dense` y `sparse`: el efecto se debilita hacia los bordes), **`alignToField`** (*Flowing*: los módulos giran tangentes al campo) y **`densityScale`** (*Dynamic density*: la escala depende de la cercanía al polo).
* **`attractorX / attractorY`** (*X / Y position*, 0 a 100 %): también se fija con un clic en el lienzo.
* **`power`** (*Gathering pull*, 10 a 100 %) y **`radius`** (*Field radius*, 10 a 500 px, por defecto 250; no en `dense` ni `sparse`).
* **`showAttractor`** (*Display Attractor Guide*, casilla): dibuja el campo y el punto atractor con el color de guías; no se exporta.

---

### 4.9 Texture (Deformación de Geometría como Efecto de Textura)
No es una textura de píxeles: son deformaciones de la geometría de cada módulo que producen un efecto artesanal (trazo a mano, deshilachado, ruptura de línea). Cada forma se convierte en una polilínea y se alteran sus vértices con un ruido determinista (estable por capa y celda). Estado en `layer.structure.texture`. Modificador autónomo: funciona en módulo único y sobre cualquier retícula. Se aplica antes de Space.

* **`jitter`** (*Jitter*, el slider muestra **0 a 100 %**; por dentro 0 a 10 px para un módulo de 100 px, por defecto 10 % = 1 px): temblor fino: el trazo se divide en puntos muy próximos (uno cada 1,5 % del módulo) y cada uno se mueve por su cuenta, al azar en horizontal y en vertical hasta la mitad del valor.
* **`skipChance`** (*Line skipping*, 0 a 90 %, por defecto 10): probabilidad de que cada vértice se omita, y donde se omite el trazo se corta (solo en modo trazo); los pelos de Random lines no crecen en los tramos omitidos.
* **`crossing`** (*Random lines*, 0 a 100 %, por defecto 10): probabilidad de que cada punto del trazo (uno cada 0,6 % del módulo, hasta 500) saque un **pelo**, una hebra que sale en el sentido en que corre el trazo, como pelo peinado y no como líneas cruzadas. Todo lo de cada pelo es **aleatorio pero estable** (no parpadea y el SVG coincide), sin controles propios:
  * **largo**: del 1 al 50 % del módulo, medido sobre un módulo de referencia de **hasta 100 px** (así un pelo nunca pasa de 50 px, sea el módulo de 100 o de 700 px); la mayoría salen cortos y pocos largos;
  * **ángulo**: hasta 20º respecto al trazo, casi siempre muy poco;
  * **grosor**: uno de cuatro, del 10 al 80 % del grosor del trazo, **nunca igual al del trazo** (mínimo 0,3 px); los más finos también son más tenues;
  * **curvatura**: del 10 al 60 % de una curva de 90º a lo largo del pelo, hacia un lado o el otro.
  Funciona en modo trazo y en **modo relleno** (las hebras toman el color de la figura); no se dibuja bajo un volumen de *Space*, que repite la figura muchas veces. Sustituye al antiguo *Strand crossing*.
* **`hairOpacity`** (*Random lines opacity*, en *Advanced*, 10 a 100 %, por defecto 85): la opacidad base de los pelos; cada grosor varía un poco alrededor de ella.
* **`undulation`** (*Plane wave*, el slider muestra **0 a 100 %**; por dentro 0 a 30 px para un módulo de 100 px, por defecto 30 % = 9 px): onda que dobla **el módulo entero como una hoja**, no solo su contorno. Cada punto se mueve de lado respecto a la dirección de la onda según su posición, y es igual para todos los trazos de la figura. Sustituye al antiguo *Perimeter undulation*. En *Advanced*: **`waves`** (*Waves*, 1 a 6, por defecto 2) y **`waveAngle`** (*Wave direction*, 0 a 360º, por defecto 0º: la onda viaja hacia la derecha y ondula la figura en vertical).

Los px de `jitter` y `undulation` están expresados para un módulo de 100 px y se escalan al tamaño real (la forma `line` usa 450 px como referencia). Las formas de trazo abierto (`line`, `wave`, `spiral`, `letterA`, `letterS`, `letterR`, `digit1`, `digit5`, `digit9`) son rutas abiertas: en modo trazo se ven como línea fina y en relleno como trazo grueso; no usan extrusión de Space.

---

### 4.10 Space (Ilusión Tridimensional y Extrusión Isométrica)
Transforma el espacio plano en una experiencia volumétrica. Estado en `layer.structure.space`. Modificador autónomo.

* **`mode`** (*Mode*, chips): `isometric` (proyección a 30º con facetas de luz y sombra), `foreshortening` (*3D tilt*), `fluctuating` (planos que avanzan y retroceden; celdas vecinas alternan la extrusión) y `conflicting` (*Paradox*: figuras imposibles).
* **`depthPct`** (*Extrusion depth*, 5 a 100 % del tamaño del módulo, por defecto 20), **`angle`** (*Projection angle*, −180º a 180º, por defecto 30; la cara frontal queda siempre en el sitio del módulo y el volumen sale hacia ese ángulo) y **`shading`** (*Facet shading contrast*, 5 a 100 %, por defecto 50).
* **`showIsoGuides`** (*Display 30º Isometric Grid Lines*, casilla): trama isométrica de apoyo, con el color de guías; no se exporta.

---

## 5. Reglas de Interfaz

* **Chips o dropdown.** Chips para 2 o 3 opciones de uso frecuente. Dropdown (`.ds-dropdown`) para 4 o más, o para lo que se toca poco. Los elementos del dropdown son los mismos botones con `data-*` que antes eran chips; el menú solo se abre y se cierra, y el botón muestra el activo. Los chips que se pueden mezclar son selección múltiple (cada uno se enciende y apaga solo).
* **Lo esencial arriba, el resto en *Advanced*.** Cada panel muestra de entrada lo que define el resultado y deja lo secundario en una sección plegable *Advanced* (Module, Layout, Similarity, Gradation).
* **Orden dentro de un panel:** selectores (chips, dropdowns, rejilla de formas), después sliders, después casillas. Excepción deliberada en *Layout*: *Columns* y *Rows* van justo debajo del selector de retícula.
* **Una columna.** Todos los controles del panel de 340 px van en una columna, con 24 px entre sliders. Los grupos de botones solo se usan para Stroke/Fill y Repetition/Radiation.
* **Las líneas visibles son diseño** (color y grosor, se exportan); **las guías no** (un color global, no se exportan).
* **Color de acento = encendido.** En Anomaly y Contrast no hay casilla "highlight": elegir un color enciende el acento y el **×** lo apaga.
* **Teclado en las cajas de valor.** Con el cursor en una caja de valor, **↑** sube y **↓** baja el número en pasos iguales a los del slider; **Shift** avanza diez pasos y **Alt** una décima de paso. Respeta los límites y conserva la unidad (px, %, º).
* **Iconos.** Phosphor 2.1.1, peso *regular* en toda la app.
* **Sin diseño inventado.** Los controles nuevos salen del catálogo de componentes; si ninguno encaja, pasan al backlog de diseño.

---

## 6. Matriz de Interrelaciones, Reglas Mecánicas y Precedencias

El motor implementa el modelo de **Contrato Asistido (Opción B)**, aplicado por capa:

```
                           ┌─────────────────────────┐
                           │     CAPA (MÓDULO)       │  (Autónomo: siempre activo)
                           └────────────┬────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       ┌───────────────────┐                         ┌───────────────────┐
       │    REPETITION     │ ◄─── EXCLUSIÓN MUTUA ──► │     RADIATION     │
       │   (Cartesiano)    │                         │      (Polar)      │
       └───────────────────┘                         └───────────────────┘
        (el ritmo y la gradación de estructura viven aquí, en Advanced)
```

### Regla 1: Exclusión Mutua Topológica (Cartesiano vs. Polar)
* Las coordenadas cartesianas ($X, Y$) de `Repetition` y las polares ($r, \theta$) de `Radiation` son geometrías excluyentes: *Structure mode* elige una u otra.

### Regla 2: Estructura rítmica solo en retícula cartesiana
* El ritmo A:B y la gradación de estructura son propiedades de la retícula cartesiana: solo existen en *Repetition* y no aplican al panal. Mover cualquiera de sus sliders enciende la estructura rítmica de la capa.

### Regla 3: Modificadores Colectivos Asistidos
* `Similarity`, `Gradation`, `Anomaly`, `Contrast` y `Concentration` operan sobre una **población de módulos**.
* En módulo único (sin `Repetition` ni `Radiation`) se pueden encender y calibrar, y la interfaz muestra un aviso no intrusivo mientras la retícula esté apagada, aunque el modificador no esté encendido: *Turn on Layout structure (Repetition or Radiation) to see this effect across many modules.* El aviso desaparece al encender Layout.
* Si se apaga temporalmente la retícula, los modificadores **no pierden su calibración**.

### Regla 3b: Precedencia cuando varios modificadores tocan lo mismo
Sobre un mismo módulo, los efectos se aplican en este orden: Concentration (posición y densidad), Gradation, Similarity, Anomaly y Contrast. Cuando coinciden:
* **Escala:** se **multiplican** (Concentration, Anomaly y Contrast); el producto se limita a 8x. Gradation escala aparte, sobre el lienzo.
* **Giros:** se **suman** (Gradation, Similarity, Anomaly y el ángulo de Contrast).
* **Forma y color de acento:** **gana Anomaly** sobre Contrast. Fuera de la zona de la anomalía, Contrast actúa con normalidad. El color de acento de Contrast también manda sobre su tono.

### Regla 4: Modificadores Autónomos Omnipresentes
* `Texture` y `Space` operan tanto en módulo único como sobre cientos de instancias, en retícula o en radial.

---

## 7. Guía de Portabilidad para Abstract Studio

Para incorporar estos conceptos dentro de [Abstract Studio](https://github.com/dMore88/abstract-studio):

1. **Enriquecer las Difference Layers:** reutilizar las operaciones booleanas entre figuras (union, subtraction, intersection) cuando se rediseñen las interrelaciones entre capas.
2. **Curvas de Gradación en la Trama Lineal:** en lugar de una separación lineal idéntica entre líneas, aplicar la lógica de `Gradation` (`steps`, `pathway`, `rotation`, `scale`) para modular densidad y grosor de trazo en forma de onda.
3. **Campos Atractores en el Esculpido Automático:** la lógica de `Concentration` (`mode: point`, `mode: void`, `radius`, `power`) puede integrarse como un modo generativo previo o complementario al pincel de esculpido manual.
4. **Arquetipos Radiales Avanzados:** expandir los generadores radiales con los esquemas de `Radiation`: `centrifugal`, `concentric`, `spiral` con torsión continua (`spiralTwist`), centros múltiples (`multi_center`) y anillos poligonales (`ringShape`).
