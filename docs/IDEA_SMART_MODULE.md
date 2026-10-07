# Idea de diseño — Módulo "smart" (rama aparte)

> **Estado: idea para discutir y probar en una rama (`smart-module`). No se toca `main` hasta validarla.** Este documento sí vive en `main` para que la idea no se pierda; el código, cuando exista, vive solo en la rama.
> Fecha de la conversación: 7 oct 2026.

## La idea

Tratar el módulo como un **smart object de Photoshop**: un pequeño diseño dentro del diseño, que se edita en su propio "ambiente" y se repite en las celdas de la retícula. Editas el módulo una vez y todas las copias se actualizan. Enlaza con el **supermódulo** de Wong y con las **interrelaciones de formas** (A8 y G9/S5 del backlog).

Analogía de Diego: *una hoja de papel que se corta en pedazos; dentro de cada pedazo se dibuja un círculo, un cuadrado y un triángulo. Ese pedazo es el módulo compuesto.*

## Decisiones tomadas

1. **Sustituye al módulo actual.** Un módulo de una sola figura es el caso simple, así que los proyectos guardados migran solos (la forma de cada capa pasa a ser la figura 1).
2. **Simple, sin recursión:** el módulo solo contiene **figuras** y sus **interrelaciones**. Sin capas, sin retículas internas, sin efectos dentro.
3. **Los modificadores (Texture, Space, Gradation, Similarity…) actúan sobre el módulo entero**, desde fuera, como hoy actúan sobre la forma.
4. **Un solo contenedor para todas las figuras** (la hoja de papel). Orden: celda → contenedor → figuras. El recorte (*Clip container*) corta el conjunto.
5. **Lista corta de figuras** (de 1 a 4), cada una con forma, tamaño, giro y offset. Desde la segunda, cada figura tiene una **relación con la anterior**.
6. **Fase 1 de relaciones (lo barato):** separadas, tocándose, solapadas, interpenetradas y coincidencia, con un slider de distancia cuando aplique.
7. **Fase 2:** unión, sustracción e intersección. Son booleanas y en el SVG exportado hay que resolverlas con máscaras o recortes, sin trazo limpio.
8. **Color y trazo/relleno heredados** del módulo en la prueba de concepto. Problema conocido: un triángulo sobre un cuadrado, ambos rellenos del mismo color, no se distinguen. Posible solución barata para más adelante: un selector por figura *Fill / Outline* (sin color propio).

## Interfaz

- **El botón *Module* del tool rail pasa a ser solo la entrada al editor del módulo** (no se reparten opciones entre dos paneles). Dentro del editor viven la lista de figuras, el contenedor, el trazo y el color.
- **Modo aislamiento** (como Illustrator): el lienzo muestra solo el módulo, grande y centrado; los paneles de modificadores se ocultan (como *Hide modifiers*).
- **Con *Save* y *Cancel*, no en vivo:** al entrar se guarda una copia; *Cancel* la restaura; *Save* confirma y deja un único paso de deshacer. La vista previa dentro del editor sí se actualiza mientras se edita.

## Dudas abiertas

- ¿Dónde quedan el **tamaño, giro y offset del módulo entero** dentro del diseño? (Propuesta: dentro del editor, con el resto.) Coste: cambiar el tamaño exige entrar y salir.
- Máximo de figuras por módulo (¿4?).
- Si Similarity/Gradation por celda necesitan ver las figuras por separado o solo el conjunto.
- Rendimiento: dibujar el módulo una vez en un lienzo oculto y copiarlo por celda no sirve cuando un modificador cambia el módulo en cada celda.
- Exportar SVG: definir el módulo una vez como símbolo y usarlo en cada celda (archivo más ligero).
