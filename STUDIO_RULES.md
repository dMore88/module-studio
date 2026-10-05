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
   La retícula cartesiana (*Repetition* / *Structure*) y el esquema polar (*Radiation*) representan geometrías de coordenadas mutuamente excluyentes.  
   - Al encender **Radiation**, se apagan automáticamente **Repetition** y **Structure** (cerrando sus acordeones y desmarcando sus switches).  
   - Al encender **Repetition**, se apaga automáticamente **Radiation**.  
   - Al encender **Structure**, se apaga **Radiation** y se activa **Repetition** (pues la estructura rítmica dual es una subdivisión intrínseca de la retícula cartesiana).  
   - Al apagar **Repetition**, se apaga **Structure**.

2. **Independencia Pedagógica y Advertencias Asistidas (Opción B):**  
   Los modificadores cualitativos (*Similarity*, *Gradation*, *Anomaly*, *Contrast*, *Concentration*) pueden encenderse y calibrarse libremente en cualquier momento:
   - Si se activan estando en modo módulo único (sin *Repetition* ni *Radiation*), el sistema **no fuerza** el encendido de la retícula.
   - En su lugar, despliega de forma no intrusiva un banner ámbar informativo (`#warning-*-grid`) dentro de la tarjeta del modificador: *"Requires Repetition or Radiation matrix to display across a population of units"*.
   - Cuando el usuario apaga la retícula para inspeccionar el módulo central, los modificadores cualitativos activos **no se apagan en cascada ni pierden sus parámetros**. Quedan listos para volver a manifestarse en cuanto se active cualquier retícula.

3. **Preservación Integral de Módulos en el Canvas:**  
   - Los márgenes del canvas se calculan dinámicamente según la proporción activa (1:1, 9:16, 4:3, 3:4, 16:9).  
   - El radio máximo en *Radiation* (`maxR`) se adapta automáticamente (0.42 para foco único, 0.32 para foco múltiple) garantizando que los anillos exteriores, el desplazamiento de Form B y las proyecciones 3D (*Space*) permanezcan íntegramente visibles sin ser amputados ni arrojados fuera del canvas.  
   - Ningún módulo se descarta ni se oculta arbitrariamente por filtros de posición.

---

## 2. Matriz Completa de Dependencias y Comportamiento Mecánico

| Modificador | Régimen / Dependencia | Razón según el libro de Wucius Wong | Comportamiento Mecánico en la Interfaz (Opción B) |
| :--- | :--- | :--- | :--- |
| **Layer / Module** | **Autónomo (Base)** | Es la unidad visual fundamental del diseño. Cada capa es un módulo independiente (hasta 5); lo que antes eran Form A y Form B son ahora capas. | **Siempre activo** en el canvas. Base sobre la que operan los modificadores de cada capa. |
| **Repetition** | **Cartesiano (Incompatible con Radiation)** | Multiplica el módulo en una retícula ortogonal regular cartesiana ($X, Y$). | **Al activar:** Si *Radiation* estaba activo, lo apaga automáticamente. Notifica cambio a retícula cartesiana.<br>**Al desactivar:** Apaga *Structure*. Mantiene encendidos los modificadores cualitativos mostrando su banner pedagógico asistido. |
| **Radiation** | **Polar (Incompatible con Repetition & Structure)** | Estructura el espacio mediante coordenadas polares (rayos y anillos concéntricos desde un foco). | **Al activar:** Apaga automáticamente *Repetition* y *Structure* (eliminando controles fantasma). Notifica cambio a esquema polar.<br>**Al desactivar:** Regresa al modo base sin apagar en cascada las calibraciones de modificadores cualitativos. |
| **Structure** | **Requiere Repetition (Exclusivo Cartesiano)** | Regula las líneas estructurales y los intervalos rítmicos duales ($A : B$) que gobiernan las celdas ortogonales. No tiene sentido físico en rayos polares. | **Al activar:** Si *Radiation* estaba encendido, lo apaga y asegura *Repetition* activo.<br>**Al desactivar Repetition:** *Structure* se apaga automáticamente. |
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
 └── [2] Guías arquitectónicas & Safe Bounds (grilla tenue roja 48px)
      └── [2.5] Guías isométricas si Space está activo
           └── [3] Estructura espacial principal:
                ├── Si Radiation.enabled === true  ──> renderRadiation() (esquema polar seguro)
                ├── Else if Repetition.enabled    ──> renderRepetitionGrid() (grilla cartesiana con Structure)
                └── Else                          ──> renderSingleModule() (módulo central adaptado a aspect ratio)
```

---

## 4. Indicador de Resolución y Lienzo
 
 El pie del canvas muestra la resolución activa, el número de capas y el soporte HiDPI/Retina (ej. `600 × 600 PX • 2 LAYERS • 100% ZOOM`).


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
   Antes de entregar, abrir `tests/smoke.html` a través de un servidor (`python3 -m http.server`, luego `/tests/smoke.html`). Debe terminar en **"All tests passed"**. Prueba el dibujo de las 15 formas, 400 combinaciones al azar de todos los controles, la textura determinista, deshacer y rehacer, el alta y baja de capas y el aviso de error en pantalla. Si se añade un control o modificador nuevo, ampliar `randomizeState` en esa página para que lo incluya.
