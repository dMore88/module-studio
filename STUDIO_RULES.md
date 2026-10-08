# Wong Design Fundamentals — Reglas Mecánicas y Matriz de Funcionamiento

> **DOCUMENTO DE ARQUITECTURA Y CONTRATO DE DISEÑO (MODELO OPCIÓN B: INFORMATIVO / ASISTIDO)**  
> Este documento define las reglas mecánicas del editor, la matriz de relaciones visuales y las dependencias teóricas entre modificadores basadas en la obra *Fundamentos del Diseño Bi- y Tridimensional* de **Wucius Wong**.  
> **Cualquier desarrollo, refactor o modificación futura en la aplicación debe respetar obligatoriamente este contrato.**

---

## 1. Principio Fundamental de la Interfaz: Coherencia Espacial y Control Respetuoso del Usuario

En una herramienta pedagógica para diseño gráfico, la experiencia de usuario debe balancear dos principios esenciales:
1. **No a los controles fantasma:** Si un sistema espacial toma precedencia geométrica en el canvas (como *Radiation* sobre *Repetition*), los controles incompatibles no deben quedar encendidos engañando al usuario.
2. **No a la coerción destructiva:** El sistema no debe encender switches secundarios sin permiso del usuario, ni debe borrar o apagar destructivamente los modificadores cualitativos ya configurados cuando el usuario decide explorar el módulo único.

Para cumplir esto, el editor implementa 3 reglas mecánicas:

1. **Exclusión Mutua Topológica Estricta (Cartesiano vs. Polar):**  
   La retícula cartesiana (*Repetition*) y el esquema polar (*Radiation*) representan geometrías de coordenadas mutuamente excluyentes. Ambas viven en el panel *Layout*, y el selector *Structure mode* elige una u otra.  
   - Al elegir **Radiation**, la retícula cartesiana deja de dibujarse.  
   - Al elegir **Repetition**, el esquema polar deja de dibujarse.  
   - El **ritmo A:B** y la **gradación de estructura** (antes el panel *Structure*, hoy *Layout › Repetition › Advanced*) son propiedades de la retícula cartesiana: solo existen en *Repetition*, y mover sus sliders enciende la estructura rítmica de la capa.

2. **Independencia Pedagógica y Advertencias Asistidas (Opción B):**  
   Los modificadores cualitativos (*Similarity*, *Gradation*, *Anomaly*, *Contrast*, *Concentration*) pueden encenderse y calibrarse libremente en cualquier momento:
   - Si se activan estando en modo módulo único (sin *Repetition* ni *Radiation*), el sistema **no fuerza** el encendido de la retícula.
   - En su lugar, despliega de forma no intrusiva un banner ámbar informativo (`#warning-*-grid`) dentro de la tarjeta del modificador: *"Requires Repetition or Radiation matrix to display across a population of units"*.
   - Cuando el usuario apaga la retícula para inspeccionar el módulo central, los modificadores cualitativos activos **no se apagan en cascada ni pierden sus parámetros**. Quedan listos para volver a manifestarse en cuanto se active cualquier retícula.

3. **Preservación Integral de Módulos en el Canvas:**  
   - El lienzo se calcula según la proporción activa (1:1, 9:16, 4:3, 3:4, 16:9). **No hay margen de seguridad** (vale 0): las estructuras llegan al borde.  
   - El radio máximo en *Radiation* (`maxR`) se adapta automáticamente (0.42 para foco único, 0.32 para foco múltiple) garantizando que los anillos exteriores, el desplazamiento de Form B y las proyecciones 3D (*Space*) permanezcan íntegramente visibles sin ser amputados ni arrojados fuera del canvas.  
   - Ningún módulo se descarta ni se oculta arbitrariamente por filtros de posición.

---

## 2. Matriz Completa de Dependencias y Comportamiento Mecánico

| Modificador | Régimen / Dependencia | Razón según el libro de Wucius Wong | Comportamiento Mecánico en la Interfaz (Opción B) |
| :--- | :--- | :--- | :--- |
| **Layer / Module** | **Autónomo (Base)** | Es la unidad visual fundamental del diseño. Cada capa es un módulo independiente (hasta 5); lo que antes eran Form A y Form B son ahora capas. | **Siempre activo** en el canvas. Base sobre la que operan los modificadores de cada capa. |
| **Layout › Repetition** | **Cartesiano (excluyente con Radiation)** | Multiplica el módulo en una retícula ortogonal regular cartesiana ($X, Y$) y la subdivide: intervalos rítmicos A:B, gradación de estructura, líneas visibles. | **Al elegirlo:** el esquema polar deja de dibujarse. Mantiene encendidos los modificadores cualitativos. El ritmo A:B y la gradación de estructura viven en su sección *Advanced*. |
| **Layout › Radiation** | **Polar (excluyente con Repetition)** | Estructura el espacio mediante coordenadas polares (rayos y anillos desde uno o varios focos). | **Al elegirlo:** la retícula cartesiana deja de dibujarse, sin apagar en cascada las calibraciones de los modificadores cualitativos. |
| **Similarity** | **Colectivo (Población de Módulos)** | Define variaciones de parentesco genético en una familia de formas. Requiere una población para comparar el parentesco. | **Al activar:** Se enciende libremente. Si no hay retícula activa, muestra advertencia ámbar asistida sin forzar switches. Se manifiesta en cuanto se active *Repetition* o *Radiation*. |
| **Gradation** | **Colectivo (Población de Módulos)** | Es una secuencia gradual de pasos ordenados a lo largo de un camino espacial. Requiere una progresión de módulos para manifestar el cambio. | **Al activar:** Se enciende libremente. Si no hay retícula, muestra advertencia ámbar asistida indicando la necesidad de un camino modular. |
| **Anomaly** | **Colectivo (Población de Módulos)** | Es la presencia de irregularidad *donde prevalece una regularidad*. Sin una base regular previa, no existe concepto de anomalía. | **Al activar:** Se enciende libremente. Muestra advertencia ámbar si no hay campo regular activo. |
| **Contrast** | **Colectivo (Población de Módulos)** | Establece disparidad y dominancia (mayoría regular vs. minoría contrastante). | **Al activar:** Se enciende libremente. Muestra advertencia ámbar si no hay población donde distribuir la proporción de dominancia. |
| **Concentration** | **Colectivo (Población de Módulos)** | Simula fuerzas gravitatorias acumulando módulos hacia puntos, líneas o vacíos dentro de un campo modular. | **Al activar:** Se enciende libremente. Muestra advertencia ámbar si no hay campo modular sobre el cual aplicar la fuerza gravitatoria. |
| **Texture** | **Autónomo (Superficial)** | Deformación de la geometría (jitter, salto de línea, cruce de hebras, ondulación perimetral) que produce un efecto de textura. | **Funciona en todos los modos:** Deforma la geometría de cada módulo, en módulo único o en cada celda de cualquier retícula. |
| **Space** | **Autónomo (Tridimensional)** | Modula la ilusión de profundidad tridimensional mediante extrusión isométrica, inclinaciones, planos reversibles y planos en conflicto. | **Funciona en todos los modos:** Transforma volumétricamente las formas planas tanto en módulo único como en retículas cartesianas o polares. |

---

## 3. Pipeline Gráfico de Renderizado (`StudioEngine.render`)

> El pipeline se ejecuta **una vez por capa visible**, respetando el orden de capas.


```
[1] Fondo (Color de papel según paleta activa e inversión Figura/Fondo)
 └── [2] Guías de pantalla (solo en pantalla, NUNCA en una exportación):
 │        retícula de coordenadas, límites, marco de contenedor (color de guías), retícula isométrica
 └── [3] Estructura espacial principal, por capa visible:
      ├── Si la capa está en Radiation     ──> renderRadiation() (esquema polar; anillos circulares o poligonales)
      ├── Else si hay Layout/Repetition    ──> renderRepetitionGrid() (retícula con ritmo y gradación de estructura)
      └── Else                             ──> renderSingleLayerModule() (módulo central)
 └── [4] Guías de modificadores (punto focal de Anomaly, atractor de Concentration): solo en pantalla
```

---

## 4. Indicador de Resolución y Lienzo
 
 El pie del canvas muestra la resolución activa, el número de capas y el soporte HiDPI/Retina (ej. `640 × 640 PX • 2 LAYERS`; el tamaño es el del lienzo tal como se ve, calculado del espacio libre).


## 5. Proporciones de Canvas (Aspect Ratios)

- **1:1 Square:** 600 × 600 px (Identidad, branding, logos)
- **9:16 Story:** 450 × 800 px (Social media, vertical reels)
- **4:3 Editorial:** 800 × 600 px (Publicaciones, afiches)
- **3:4 Poster:** 600 × 800 px (Carteles impresos)
- **16:9 Cinematic:** 800 × 450 px (Panorámico, web hero)

---

## 6. Protocolo de Compilación Obligatorio (`build-pro.py`)

Después de cualquier modificación en los archivos de la carpeta `js/`:
```bash
python3 build-pro.py
```
Esto genera `js/bundle-pro.js` manteniendo sincronizada la versión standalone de la aplicación, y escribe su versión en la etiqueta `<script>` de `index.html` (`?v=...`) para evitar copias viejas en el navegador.

Para comprobar sin regenerar: `python3 build-pro.py --check`. El hook de git `.githooks/pre-commit` ejecuta esa comprobación y bloquea el commit si el bundle está desfasado; se activa una vez por copia del repositorio con `git config core.hooksPath .githooks`.

---

## 7. Protocolo de Calidad Obligatorio (Zero-Breakage)

> **REGLA DE ORO DE DESARROLLO:**  
> Ningún cambio, refactor o nuevo control puede entregarse sin cumplir estrictamente estos 7 mandamientos de calidad:

1. **Compilación Inmediata:**  
   Tras editar cualquier archivo en `js/`, compilar inmediatamente con `python3 build-pro.py` para regenerar `js/bundle-pro.js`.

2. **Validación Sintáctica y de Ejecución (JXA):**  
   Ejecutar obligatoriamente la validación en macOS con `osascript -l JavaScript` para garantizar 0 errores de sintaxis (`SyntaxError`, llaves faltantes, etc.) y ejecución limpia:
   ```bash
   osascript -l JavaScript -e 'var code = ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError("/Users/dgo/Documents/AI Projects/module-studio/js/bundle-pro.js", $.NSUTF8StringEncoding, null)); new Function(code); var window = { addEventListener: function(){} }; var document = { addEventListener: function(){}, querySelector: function(){ return null; }, querySelectorAll: function(){ return []; }, getElementById: function(){ return null; } }; eval(code); console.log("ZERO-BREAKAGE VALIDATION PASSED");'
   ```

3. **Sincronización Atómica de Inspectores (`syncAllInspectorsWithActiveLayer`):**  
   Cualquier evento que mute el estado o cambie la capa activa (`selectLayer`, `undo`, `redo`, `init`) debe invocar `syncAllInspectorsWithActiveLayer()`. Prohibido actualizar inspectores de forma parcial dejando controles desfasados.

4. **Balance Estricto del Canvas 2D:**  
   Todo `ctx.save()` en `studio-engine.js` debe poseer exactamente un `ctx.restore()` correspondiente en todas las ramas de ejecución (incluyendo salidas tempranas como `tear` anomaly), protegiendo la matriz de transformación y el área de clipping de arte.

5. **Soporte Per-Layer y Contrato Asistido (Opción B):**  
   Cada control nuevo debe operar de forma independiente por capa (`mod.structure`). Si un modificador colectivo se activa sin una retícula en esa capa, no se apaga destructivamente; despliega su banner ámbar informativo (`#warning-*-grid`).

6. **Integración Dual Cartesiano + Polar:**  
   Cada modificador debe implementarse y probarse tanto en la retícula cartesiana (`renderRepetitionGrid`) como en el esquema polar (`renderRadiation`).

7. **Pruebas de humo:**  
   Antes de entregar, abrir `tests/smoke.html` a través de un servidor (`python3 -m http.server`, luego `/tests/smoke.html`). Debe terminar en **"All tests passed"** (hoy 84 pruebas). Prueba el dibujo de las 22 formas, 150 combinaciones al azar de todos los controles (400 si se abre `smoke.html?full`, antes de entregar una versión), la textura determinista, deshacer y rehacer, el alta y baja de capas y el aviso de error en pantalla. Si se añade un control o modificador nuevo, ampliar `randomizeState` en esa página para que lo incluya.

---

## 8. Modelo del Módulo: celda → contenedor → módulo

1. La **celda** es el espacio de la retícula. El ritmo A:B y la gradación de estructura actúan sobre ella (la fila y columna A son la base; la B mide A ÷ ratio).
2. El **contenedor** (*Container width / height*, panel Module › Advanced) es un marco dentro de la celda. En *Fit to canvas* se escala con ella; en *Actual size* **manda** y la celda toma su tamaño.
3. El **módulo** vive dentro del contenedor y se escala con él **en proporción, sin deformarse**: toma la escala del lado más pequeño de su celda. Según Wong, una figura repetida no se deforma; deformar es cosa de *Similarity*. En una figura estirada por el usuario (ancho distinto del alto), el trazo conserva un grosor uniforme.
4. El tamaño del módulo es **exactamente el de los sliders** (px del lienzo), sin factores ocultos.

## 9. Diseño frente a guías (exportación)

* **Es diseño** y se exporta: los módulos y las **líneas visibles** de Layout (con su color y su grosor, porque en Wong las líneas de estructura visibles son parte de la composición).
* **Es guía** y **nunca se exporta** (ni SVG ni PNG): la retícula de coordenadas de fondo, los límites del lienzo, el marco del contenedor, el punto focal de Anomaly, la guía del atractor de Concentration y la retícula isométrica de Space. Todas usan el **color global de guías** (botón de paleta junto a los botones del lienzo), salvo la retícula de fondo y los límites, que son grises neutros.
* Al añadir cualquier ayuda visual nueva, hay que decidir cuál de las dos es. Si es guía, se dibuja con `engine.guideColor()` y se omite cuando `engine.exporting` es verdadero.

## 10. Reglas de interfaz

Las reglas completas están en `STUDIO_CONTROLS_GUIDE.md`, sección 5. En resumen:
* Los controles nuevos salen del **catálogo de componentes** existente; si ninguno encaja, van al backlog de diseño. No se inventa diseño: se sigue Figma.
* **Chips** para 2 o 3 opciones frecuentes, **dropdown** para 4 o más o para lo que se toca poco, chips múltiples para opciones que se mezclan.
* **Lo esencial visible, lo demás en *Advanced*.** Meta: 5 a 7 controles visibles por panel.
* Orden dentro de un panel: selectores, sliders, casillas. Una sola columna de 340 px, con 24 px entre sliders. Grupos de botones solo para Stroke/Fill y Repetition/Radiation.
* Color de acento sin casilla: elegir color enciende, la **×** apaga.
* Cada caja de valor responde a **↑ ↓** (Shift ×10, Alt ×0,1).
* Iconos Phosphor, peso *regular*. El sistema de diseño visual (`docs/DESIGN_SYSTEM_TOKENS.md`) está **en revisión** (por ejemplo, altura de los campos) y se actualizará con el Figma de Diego.

## 11. Proceso de trabajo

* Se implementa, se prueba (`tests/smoke.html`, todas las pruebas en verde), se hace commit local y se informa en español claro. **Nunca se sube (`git push`) sin autorización explícita.**
* Las interrelaciones entre capas (INT2, INT5 a INT9) y los supermódulos (RP8 a RP10, E29, R26) van **al final** del backlog. Los IDs son los de `docs/design-concepts-in-app.md`.
* Antes de añadir un control nuevo se aplica el filtro: *¿sirve para jugar o solo completa el libro?* Lo que solo completa el libro va a *Advanced* o se descarta.
* El libro (`docs/*.pdf`) se queda **solo en local**; no se sube al repositorio.
* El mapa de qué concepto de Wong cubre cada control está en `docs/design-concepts-in-app.md`; las prioridades, en `docs/BACKLOG.md`.
