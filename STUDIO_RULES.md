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
   - En su lugar, despliega de forma no intrusiva un banner ámbar informativo (`#dep-warning-*`) dentro del acordeón y una etiqueta de estado en la *Study Card* izquierda: *"Requires Repetition or Radiation matrix to display across a population of units"*.
   - Cuando el usuario apaga la retícula para inspeccionar el módulo central, los modificadores cualitativos activos **no se apagan en cascada ni pierden sus parámetros**. Quedan listos para volver a manifestarse en cuanto se active cualquier retícula.

3. **Preservación Integral de Módulos en el Canvas:**  
   - Los márgenes del canvas se calculan dinámicamente según la proporción activa (1:1, 9:16, 4:3, 3:4, 16:9).  
   - El radio máximo en *Radiation* (`maxR`) se adapta automáticamente (0.42 para foco único, 0.32 para foco múltiple) garantizando que los anillos exteriores, el desplazamiento de Form B y las proyecciones 3D (*Space*) permanezcan íntegramente visibles sin ser amputados ni arrojados fuera del canvas.  
   - Ningún módulo se descarta ni se oculta arbitrariamente por filtros de posición.

---

## 2. Matriz Completa de Dependencias y Comportamiento Mecánico

| Modificador | Régimen / Dependencia | Razón según el libro de Wucius Wong | Comportamiento Mecánico en la Interfaz (Opción B) |
| :--- | :--- | :--- | :--- |
| **Form / Module** *(CH 02)* | **Autónomo (Base)** | Es la unidad visual fundamental e indivisible del diseño (figura-fondo y las 8 interrelaciones espaciales entre Form A y Form B). | **Siempre activo** en el canvas. Base matemática sobre la que operan todos los demás modificadores. |
| **Repetition** *(CH 03)* | **Cartesiano (Incompatible con Radiation)** | Multiplica el módulo en una retícula ortogonal regular cartesiana ($X, Y$). | **Al activar:** Si *Radiation* estaba activo, lo apaga automáticamente. Notifica cambio a retícula cartesiana.<br>**Al desactivar:** Apaga *Structure*. Mantiene encendidos los modificadores cualitativos mostrando su banner pedagógico asistido. |
| **Radiation** *(CH 07)* | **Polar (Incompatible con Repetition & Structure)** | Estructura el espacio mediante coordenadas polares (rayos y anillos concéntricos desde un foco). | **Al activar:** Apaga automáticamente *Repetition* y *Structure* (eliminando controles fantasma). Notifica cambio a esquema polar.<br>**Al desactivar:** Regresa al modo base sin apagar en cascada las calibraciones de modificadores cualitativos. |
| **Structure** *(CH 04)* | **Requiere Repetition (Exclusivo Cartesiano)** | Regula las líneas estructurales y los intervalos rítmicos duales ($A : B$) que gobiernan las celdas ortogonales. No tiene sentido físico en rayos polares. | **Al activar:** Si *Radiation* estaba encendido, lo apaga y asegura *Repetition* activo.<br>**Al desactivar Repetition:** *Structure* se apaga automáticamente. |
| **Similarity** *(CH 05)* | **Colectivo (Población de Módulos)** | Define variaciones de parentesco genético en una familia de formas. Requiere una población para comparar el parentesco. | **Al activar:** Se enciende libremente. Si no hay retícula activa, muestra advertencia ámbar asistida sin forzar switches. Se manifiesta en cuanto se active *Repetition* o *Radiation*. |
| **Gradation** *(CH 06)* | **Colectivo (Población de Módulos)** | Es una secuencia gradual de pasos ordenados a lo largo de un camino espacial. Requiere una progresión de módulos para manifestar el cambio. | **Al activar:** Se enciende libremente. Si no hay retícula, muestra advertencia ámbar asistida indicando la necesidad de un camino modular. |
| **Anomaly** *(CH 08)* | **Colectivo (Población de Módulos)** | Es la presencia de irregularidad *donde prevalece una regularidad*. Sin una base regular previa, no existe concepto de anomalía. | **Al activar:** Se enciende libremente. Muestra advertencia ámbar si no hay campo regular activo. |
| **Contrast** *(CH 09)* | **Colectivo (Población de Módulos)** | Establece disparidad y dominancia (mayoría regular vs. minoría contrastante). | **Al activar:** Se enciende libremente. Muestra advertencia ámbar si no hay población donde distribuir la proporción de dominancia. |
| **Concentration** *(CH 10)* | **Colectivo (Población de Módulos)** | Simula fuerzas gravitatorias acumulando módulos hacia puntos, líneas o vacíos dentro de un campo modular. | **Al activar:** Se enciende libremente. Muestra advertencia ámbar si no hay campo modular sobre el cual aplicar la fuerza gravitatoria. |
| **Texture** *(CH 11)* | **Autónomo (Superficial)** | Tratamiento superficial táctil y óptico (grano litográfico, semitono, estriado, tipografía). | **Funciona en todos los modos:** Aplica directamente sobre la silueta de las formas (Form A y Form B) en módulo único o sobre cada celda de cualquier retícula, o sobre el fondo. |
| **Space** *(CH 12)* | **Autónomo (Tridimensional)** | Modula la ilusión de profundidad tridimensional mediante extrusión isométrica, inclinaciones, planos reversibles y planos en conflicto. | **Funciona en todos los modos:** Transforma volumétricamente las formas planas tanto en módulo único como en retículas cartesianas o polares. |

---

## 3. Mecánica de las Study Cards (Panel Izquierdo)

1. **Sincronización Total con los Switches:**  
   Hacer clic en el botón `[×]` de una Study Card en la columna izquierda desmarca el switch correspondiente de forma limpia, sincronizando el estado sin efectos secundarios destructivos.
2. **Base Permanente:**  
   La tarjeta `CH 02 • FORM & 8 INTERRELATIONS` permanece siempre en el tope del feed y no se puede cerrar.
3. **Avisos de Dependencia en Tiempo Real:**  
   Si un modificador colectivo está activo sin una retícula, la Study Card muestra un badge ámbar:
   `[i] Requires Repetition or Radiation`
4. **Acciones Contextuales:**  
   Cada tarjeta cuenta con accesos directos:
   - `[📖 Theory]`: Navega al capítulo correspondiente en el libro/teoría.
   - `[💼 Real World]`: Muestra el caso de estudio profesional aplicado.

---

## 4. Pipeline Gráfico de Renderizado (`StudioEngine.render`)

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

## 5. Indicador de Resolución y Lienzo
 
 El pie del canvas (`#studio-resolution-text`) muestra la resolución activa del canvas y el soporte HiDPI/Retina (ej. `600 × 600 PX • RETINA HiDPI`, `600 × 800 PX • RETINA HiDPI`). Los principios de diseño aplicados se estudian de forma interactiva y detallada en la columna izquierda mediante las **Study Cards**.


## 6. Proporciones de Canvas (Aspect Ratios)

- **1:1 Square:** 600 × 600 px (Identidad, branding, logos)
- **9:16 Story:** 450 × 800 px (Social media, vertical reels)
- **4:3 Editorial:** 800 × 600 px (Publicaciones, afiches)
- **3:4 Poster:** 600 × 800 px (Carteles impresos)
- **16:9 Cinematic:** 800 × 450 px (Panorámico, web hero)

---

## 7. Protocolo de Compilación Obligatorio (`build.py`)

Después de cualquier modificación en los archivos de la carpeta `js/`:
```bash
python3 build.py
```
Esto genera `js/bundle.js` manteniendo sincronizada la versión standalone de la aplicación.
