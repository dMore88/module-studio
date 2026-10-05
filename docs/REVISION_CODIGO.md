# Revisión de código y auditoría de lo propuesto

Fecha: 2026-10-04. Cubre los ítems **Q1** (revisión de código) y **Q2** (auditoría contra el backlog).

> **Actualización (2026-10-04, misma jornada):** se eliminaron los presets y el botón Random, lo que resuelve el hallazgo 1 de raíz (repetida la prueba de 400 combinaciones: **0 fallos**). El PDF del libro (hallazgo 2) se quitó del repositorio y se añadió a `.gitignore`; sigue existiendo en tu disco como base de conocimiento local. El historial de git se reescribió para quitarlo de todos los commits y se hizo push forzado. Pendiente: pedir a GitHub que purgue las copias en caché (ver el mensaje de la sesión).

Este informe está escrito sin jerga. Cada hallazgo dice **qué pasa**, **por qué importa** y **qué propongo**. No se cambió ningún código para escribirlo.

**Cómo leer la gravedad:** 🔴 grave (rompe algo o es un riesgo real) · 🟠 importante (cuesta mantener o limita) · 🟡 mejorable · 🟢 está bien.

---

## Resumen

La aplicación funciona bien en el uso normal: dibuja rápido, deshacer y rehacer funcionan, y las capas se añaden y borran sin problema. Pero hay **dos cosas graves**:

1. Si cargas un preset y luego apagas el Layout de la capa 1, **el lienzo se queda en blanco o falla**.
2. El **libro de Wong completo (PDF de 39 MB)** está dentro del repositorio público y se puede descargar desde la página publicada.

El resto son problemas de orden interno que no se ven hoy pero encarecen cada cambio futuro: código viejo que quedó muerto, código duplicado y ninguna prueba automática.

---

## Qué probé

| Prueba | Resultado |
| :--- | :--- |
| Cargar los 8 presets y apagar el Layout de la capa 1 | 🔴 Los 8 fallaban (2 en blanco, 6 con error). **Resuelto al eliminar los presets** |
| 400 combinaciones al azar de formas, capas (1 a 5), proporciones y todos los modificadores | 🟠 21 fallaron (5%), todas por el motivo del punto 1. Tras eliminar los presets: 🟢 0 fallos |
| Equilibrio del lienzo (`save` / `restore`) en esas 400 | 🟢 0 desbalanceadas |
| Velocidad de dibujo | 🟢 pocos milisegundos con ajustes normales. 🟡 En combinaciones extremas al azar (50×50, 5 capas, todos los modificadores a la vez): promedio 73 ms, peor caso 973 ms |
| Deshacer y rehacer un cambio de Texture | 🟢 Correcto, y el control se actualiza |
| Añadir hasta 5 capas y borrarlas | 🟢 Correcto; todas conservan todos sus bloques de ajustes |
| Accesibilidad (etiquetas, nombres de botones) | 🟠 Ver hallazgo 7 |
| Dependencias y repositorio | 🔴 / 🟠 Ver hallazgos 2 y 9 |

---

## 🔴 Graves

### 1. Preset + apagar el Layout deja el lienzo en blanco o con error

- **Qué pasa:** al cargar un preset, quedan encendidos unos interruptores "globales" de una versión vieja de la app. Si después apagas el Layout de la capa 1, la app cree que hay una estructura global y toma un camino de dibujo que ya no funciona: o dibuja nada (2 presets) o falla (6 presets).
- **Por qué importa:** es un camino fácil de recorrer (Random, luego apagar el Layout) y el error deja la pantalla inservible hasta recargar. Parte de este fallo lo introduje yo al añadir las líneas largas: ese camino viejo ahora tropieza con un valor vacío.
- **Propuesta:** al cargar un preset apagar esos interruptores viejos y eliminar el camino de dibujo viejo. Esfuerzo bajo.

### 2. El libro de Wong está publicado en el repositorio

- **Qué pasa:** `docs/wong-wucius-fundamentos-del-diseno-bi-y-tridimensional.pdf` (39,7 MB, escaneo completo) está desde el primer commit. El repositorio es público y el archivo se descarga desde GitHub Pages (`dmore88.github.io/module-studio/docs/…pdf`, respuesta 200). Ocupa 35 MB del repositorio.
- **Por qué importa:** es un libro con derechos de autor, y cualquiera puede descargarlo desde tu página. Además hace pesada cada copia del repositorio.
- **Propuesta (decisión tuya):** sacarlo del repositorio y guardarlo solo en tu disco, enlazando al libro en el README. Esto lo oculta de la página publicada, pero el archivo seguiría en el historial de git. Para borrarlo del historial hay que reescribirlo y forzar un push; lo hago solo si me lo pides.

---

## 🟠 Importantes

### 3. ✅ Quedó código viejo sin uso (unas 300 líneas) — resuelto

- **Qué pasa:** hay 23 controles de la versión anterior enlazados a elementos que ya no existen en la pantalla (por ejemplo `toggle-mod-radiation`, `input-grid-cols`, `input-rad-rays`). No fallan, pero ocupan espacio y confunden. También hay 3 funciones que nadie llama y 10 estilos CSS sin uso.
- **Por qué importa:** esos restos son la raíz del hallazgo 1: el "estado global viejo" sigue vivo junto al estado por capa. Quien lea el código no sabe cuál manda.
- **Resuelto:** se eliminaron unas 350 líneas de JavaScript (el motor pasó de 1.794 a 1.645 líneas y la app de 2.451 a 2.244), 27 reglas de CSS sin uso y el estado global de modificadores. Ahora cada capa es la única fuente de verdad. Lo único que cambió a la vista: el punto de referencia del centro ya solo aparece cuando ninguna capa usa una cuadrícula o radial, como indicaba el comentario original.

### 4. Código repetido entre cuadrícula y radial (unas 400 líneas)

- **Qué pasa:** la lógica de Gradation, Anomaly, Contrast, Concentration y Similarity está escrita dos veces: una para la cuadrícula y otra para el esquema radial.
- **Por qué importa:** cada cambio hay que hacerlo en dos sitios. Ya pasó una vez: Drift funcionaba en cuadrícula y no en radial.
- **Propuesta:** unificar en una sola pieza que ambos esquemas usen. Es un cambio delicado: se haría con la prueba de las 400 combinaciones como red de seguridad.

### 5. No hay pruebas automáticas ni aviso de errores

- **Qué pasa:** no existe ninguna prueba. Y si el dibujo falla una vez, el lienzo queda en blanco sin mensaje.
- **Por qué importa:** los errores se descubren a mano. El fallo del hallazgo 1 llevaba tiempo ahí sin que nadie lo viera.
- **Propuesta:** guardar la prueba de las 400 combinaciones como una página de pruebas dentro del repositorio, y añadir una protección que muestre un aviso en pantalla si un dibujo falla en lugar de dejar el lienzo en blanco.

### 6. El archivo final se genera a mano

- **Qué pasa:** la app se carga desde `js/bundle-pro.js`, un archivo generado con `python3 build-pro.py` y guardado en el repositorio. Si se olvida ese paso, el archivo queda desfasado. Además el navegador guarda copias viejas: me pasó varias veces ver la versión anterior al probar.
- **Por qué importa:** es fácil publicar algo que no coincide con el código.
- **Propuesta:** añadir una verificación al hacer commit que avise si el archivo generado no está al día, y poner un número de versión en la dirección del archivo para evitar la caché.

### 7. Accesibilidad

- **Qué pasa:** 73 de 97 campos no tienen etiqueta asociada. 69 de 117 botones tienen solo icono, sin nombre para un lector de pantalla (solo un texto de ayuda al pasar el ratón). Las 39 etiquetas tipo botón (Rotate, Scale, Point…) no indican cuál está activa.
- **Por qué importa:** las personas que usan lector de pantalla o teclado no pueden saber qué hace cada control.
- **Propuesta:** añadir nombres accesibles a campos y botones, e indicar el estado activo de las etiquetas. Es mecánico y se puede hacer de una vez.

### 8. Exportar y guardar están a medias

- **Qué pasa:** "Download SVG" y "Copy SVG" no generan vectores: incrustan una imagen PNG dentro de un SVG. El botón Config guarda el proyecto en un archivo JSON, pero no existe forma de volver a abrirlo.
- **Por qué importa:** quien exporta espera un vector real, y un "guardar" sin "abrir" no sirve.
- **Propuesta:** ya estaba en el backlog (O1) y ahora se añade la importación del proyecto. Es trabajo de tamaño medio.

### 9. Dependencias de internet sin verificación

- **Qué pasa:** la app carga Tailwind (en su versión de pruebas), los iconos y las fuentes desde internet, sin comprobar su integridad. Sin conexión, la app no se ve bien.
- **Por qué importa:** es lento, puede parpadear al cargar sin estilos y depende de que esos servidores sigan disponibles. Los iconos sí están fijados a una versión, lo cual está bien.
- **Propuesta:** a futuro, empaquetar iconos y fuentes en el propio repositorio. No urgente.

---

## 🟡 Mejorables

- **10. Cada movimiento de un deslizador dibuja de inmediato.** Con ajustes pesados (peor caso medido: 973 ms) arrastrar puede sentirse con retraso. Conviene agrupar los dibujos de un mismo instante.
- **11. Archivos muy grandes.** La lógica de pantalla tiene 2.529 líneas en una sola clase y el motor 1.794. Funcionan, pero cuesta encontrar cosas. A futuro, separar por modificador.
- **12. Colores y medidas escritos a mano en el CSS** en lugar de variables de diseño. Se resuelve con el trabajo del design system (Q3).
- **13. Pequeñas rarezas visuales.** El punto de referencia del centro se dibuja siempre, incluso con capas en cuadrícula. El zoom quedó desactivado pero su código sigue.

---

## 🟢 Lo que está bien

- Dibujo equilibrado: ninguna de las 400 combinaciones dejó el lienzo en mal estado.
- Rápido en el uso normal (pocos milisegundos); solo las combinaciones extremas tardan cerca de un segundo.
- Deshacer y rehacer se comportan bien con todos los controles nuevos.
- Cada capa conserva todos sus bloques de ajustes tras añadir, borrar o cargar presets.
- La textura no parpadea: el ruido es estable por capa y celda.
- La documentación coincide con lo que hace el código.
- Los iconos están fijados a una versión concreta.

---

## Q2 — Auditoría: ¿qué del backlog ya existe?

Resultado de comprobar cada ítem contra el código y la pantalla.

| ID | Ítem del backlog | Realidad hoy |
| :-- | :--- | :--- |
| RP1 | Retícula hexagonal | No existe |
| **RP-oculto** | Retículas triangular, zigzag y alternada | **Ya existen en el motor pero no se pueden elegir en pantalla.** La pantalla ofrece solo Grid, Curved, Brick y Diagonal. Basta con exponerlas |
| RP3 | Reflexión | Parcial: la rejilla "alternada" gira 180° las celdas impares, pero no espeja |
| RP4 | Selector de dirección | Parcial: lo anterior existe sin control; no hay modo "indefinida" |
| E1 a E3 | Líneas visibles | Parcial: existe mostrar líneas y su grosor está en el motor, pero sin control en pantalla. No hay positivas/negativas ni separar horizontales y verticales |
| S3 | Celdas irregulares | Parcial: *Cell jitter* mueve el centro de cada celda, pero no deforma las celdas |
| G1 a G4 | Zigzag, ida y vuelta, alternada, velocidad | No existen. Los ciclos reinician siempre (diente de sierra) |
| G5 | Gradación de figura | No existe |
| R1 a R3 | Centrípeta, centro abierto, anillos rotados | No existen |
| R5 | Orientación del módulo en Radiation | No existe como control: la orientación es automática según el esquema |
| K1, K2, K4, K5 | Concentración: desde una línea, super/des-concentración, ausencias, varios por celda | No existen |
| C1 a C6 | Dimensiones nuevas de Contrast | No existen. "Tone" cambia trazo por relleno |
| A1 a A4 | Anomalía: esparcida, otra regularidad, atributos, estructura | No existen |
| SP2 | Sombra | Parcial: el modo 3D tilt dibuja una sombra proyectada fija, sin control |
| SP4 | Planos transparentes | Parcial: en modo trazo, las extrusiones se dibujan como marcos |
| SP1, SP3, SP5 | Perspectiva, pistas de profundidad, profundidad por capa | No existen |
| INT1 a INT4 | Interrelaciones entre capas | No existen |
| O1 | SVG vectorial | No existe: hoy incrusta una imagen |

**Conclusión de la auditoría:** la mayoría de lo propuesto realmente falta. Pero hay **ganancias rápidas**: exponer en pantalla las retículas ocultas (triangular, zigzag, alternada), dar control al grosor de las líneas visibles, y dar control a la sombra del 3D tilt.

---

## Plan de arreglos propuesto

Orden sugerido, de lo más urgente a lo menos:

| Paso | Qué | Esfuerzo | Riesgo |
| :-- | :--- | :-- | :-- |
| F1 | ~~Arreglar presets + Layout (hallazgo 1)~~ ✅ resuelto al eliminar los presets | — | — |
| F2 | PDF del libro (hallazgo 2): ✅ quitado del repositorio. Pendiente: push y decidir si se limpia el historial | Bajo | Ninguno |
| F3 | ✅ Hecho (2026-10-04): eliminado el estado global viejo, los 23 enlaces a controles inexistentes, las funciones y los estilos sin uso (hallazgo 3) | — | — |
| F4 | ✅ Hecho: página `tests/smoke.html` (7 pruebas, incluidas las 400 combinaciones) y aviso de error en pantalla (hallazgo 5) | — | — |
| F5 | ✅ Hecho: nombres para campos y botones, estado de las etiquetas, teclado en las capas (hallazgo 7) | — | — |
| F6 | ✅ Hecho: retículas Zigzag, Triangular y Alternating, parámetro de cada variación y grosor de líneas (Q2) | — | — |
| F7 | ✅ Hecho (2026-10-04): Concentration, Gradation, Similarity, Anomaly, Contrast y la mira de Anomaly viven en una sola pieza que usan la cuadrícula y el radial (hallazgo 4). El motor bajó de 1645 a 1485 líneas | — | — |
| F8 | Verificación del archivo generado y versión en la dirección (hallazgo 6) | Bajo | Bajo |
| F9 | Importar proyecto y SVG vectorial (hallazgo 8) | Medio a alto | Medio |

F1 y F4 conviene hacerlos antes de añadir funciones nuevas: F1 porque es un error visible y F4 porque protege todo lo que viene después.
