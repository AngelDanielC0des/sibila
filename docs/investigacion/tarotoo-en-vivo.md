# Tarotoo en vivo · recorrido medido

Investigación del producto, no de la documentación. Todo lo que hay aquí sale de
recorrer `tarotoo.com` con Playwright en 1440×900 y 390×844, leyendo estilos
calculados y tráfico de red, no de mirar capturas.

El informe técnico maestro que ya teníamos describe **qué hace** Tarotoo. Esto
describe **cómo se siente y con qué lo consigue**, que es lo que hacía falta
antes de escribir pantallas.

Complementa, no sustituye, a `Informe técnico maestro de Tarotoo.md`.

---

## 0. Una premisa que había que corregir

Veníamos asumiendo que Tarotoo muestra significados individuales y no una
síntesis conjunta. Es medio cierto, y la otra mitad cambia la decisión.

**Las tres interpretaciones son generadas por IA**, personalizadas contra la
pregunta, gratis y sin cuenta: `POST /wp-json/openai/v1/ai-tarot-reading` → 200.
Lo que no existe es una sección de síntesis. Lo «conjunto» es **una frase colada
en el párrafo de la última carta**:

> «Esta carta, en conjunto con las anteriores, sugiere que al integrar las
> lecciones del pasado y las evaluaciones del presente…»

Eso es todo. Y no hay muro: lo pagan con publicidad, afiliación a líneas de
videntes y embudo a la app de suscripción.

---

## 1. El flujo, con tiempos

Recorrido de tres cartas, de la pregunta a la lectura:

| Momento                       | Medido                                         |
| ----------------------------- | ---------------------------------------------- |
| Reparto del abanico           | 4,84 s la primera carta, 4,45 s la sexta       |
| Bloqueo tras elegir una carta | 2,2 s · la interfaz no acepta la siguiente     |
| Elegir las tres               | ~6,6 s mínimo                                  |
| Barrida del mazo              | ~4,5 s, con 10 ms de retardo por carta         |
| Volteo de una carta           | ~1,2 s a 180°, sobrepasa a ~199° y vuelve      |
| Aparición de la lectura       | dentro del ritual; el cargador es la excepción |

**La petición al modelo sale con el primer volteo y devuelve el texto entero.**
No hay streaming. En esa misma ventana descargan los MP4 de las tres cartas
elegidas. Cuando el modelo tarda más que la ceremonia aparece «Su lectura está
casi lista…», pero es el caso raro, no el camino.

**La conclusión operativa: la ceremonia es el cargador.** El ritual no adorna la
espera, la absorbe.

---

## 2. Falso streaming, y mejor que el de verdad

El texto llega completo y se materializa palabra a palabra. Cada palabra es su
propio elemento:

```html
<span class="word" data-index="7" style="--word-index: 7;">que</span>
```

con `transition: 1s cubic-bezier(.23, 1, .32, 1)` y retardo
`0.3s + 0.1s × --word-index`, sobre `opacity`, `transform` y `filter: blur()`.
Los tres parámetros viven en la raíz del documento:

```html
<html style="--result-blur: 7; --result-delay: 1000; --result-speed: 1000;"></html>
```

Un párrafo de 101 palabras tarda unos 10,4 s en terminar de componerse.

**Qué adoptar:** la sensación de generación en vivo con una petición corriente, y
el tempo bajo nuestro control en vez del del proveedor.

**Qué no copiar:** animan `filter: blur()` sobre ~100 elementos a la vez, que es
justo lo que prohíbe `CLAUDE.md`. Nuestra decodificación por glifos da el mismo
efecto sin `filter` y sobre texto real.

---

## 3. El abanico: geometría y tiempo en dos variables

Todo el reparto sale de `--c-order` y `--c-count`:

```css
.card-axis {
  transform: rotate(calc(-5deg * var(--c-order)));
}
.card-wrapper {
  transform: rotate(calc(-1.5deg * var(--c-order)));
  transition: transform
    calc(2.1s * (1.5 + 0.0375 * (var(--c-count) / 2 - var(--c-order))))
    cubic-bezier(0.3, 0, 0.14, 1);
}
```

Tres cosas que merecen subrayado:

**El escalonado es por duración, no por retardo.** Todas las cartas tienen
`transition-delay: 0s` y duraciones distintas —4,843 s, 4,764 s, 4,686 s…,
−0,0787 s por carta—. Salen juntas y **llegan** en cascada. Se siente un mazo
vivo en lugar de una cola.

**El arco es de radio enorme y ángulo pequeño.** 1,5° por carta con el pivote muy
por debajo de la carta, no un abanico cerrado. Eso es lo que ensancha la franja
visible de cada carta, y es la lección para D1.

**Un solo token de tempo.** 2,1 s gobierna abanico, rótulos, brillos y sombras.

Los easings anticipan. La carta seleccionada usa
`cubic-bezier(0.89, -0.72, 0.65, 1)`: el punto de control **negativo** la hace
retroceder antes de salir del abanico. Y el volteo sobrepasa: medido 179° a
1,2 s, ~199°, y de vuelta a 161° a 1,8 s.

---

## 4. Móvil: donde se rompe

Medido a 390 px, en la tirada de tres cartas:

- **Solo 12 de las 22 cartas son alcanzables por el puntero.** El resto queda
  fuera de la pantalla.
- **La rueda no gira.** Probado con arrastre de ratón y con eventos táctiles
  sintéticos: sin efecto. `touch-action: none` solo suprime el desplazamiento.
- **El objetivo real es la franja visible, no la carta.** Pedí la carta 6 y se
  seleccionó la 7; pedí la 9 y salió la 10.
- **La tirada revelada se sale de la pantalla.** Dos de las tres cartas quedan
  cortadas por el borde: es la composición de escritorio encogida.

Matiz honesto: como los dorsos son idénticos, la inalcanzabilidad no rompe el
azar. Rompe la sensación de elegir, que es distinto y también importa.

Su respuesta a no poder rotar es el botón **BARAJAR**, que recoloca el mazo. Es
una salida digna, pero no es lo mismo que poder recorrerlo.

---

## 5. Jerarquía de la lectura

El orden en que aparece la información, y dónde falla:

1. Al colocar la tirada, un titular grande anuncia **la posición de la carta que
   toca voltear** —«Pasado»— con «Voltear una carta» debajo. La posición se
   nombra **antes** del volteo, no después.
2. Al voltear, el nombre de la carta entra en el DOM y se compone en serif,
   **rotado para acompañar la inclinación de la carta**. Es composición, no pie
   de foto.
3. Al completarse cada volteo, el titular avanza: Pasado → Presente → Futuro.
4. En la lectura final: posición en dorado, nombre de carta en blanco, arte de la
   carta flotando al lado y el cuerpo en columna estrecha.

**El fallo:** entre el último volteo y la lectura, los rótulos de posición
desaparecen. Quedan tres cartas con nombre y sin posición, que es justo el
momento en que el usuario se para a mirarlas.

---

## 6. Símbolos y detalles

- **El dorso del mazo cambia por tirada:** luna creciente en 3 Cartas, ojo en
  1 Carta, plumas y balanza en Sí/No. Coste casi nulo, identidad grande.
- Cada carta lleva su propio `<canvas class="magic-dust">` oculto, que se
  enciende al seleccionarla, más burbujas de partículas con cuatro derivas
  horizontales distintas.
- Separador de fases lunares como ornamento recurrente. Círculos concéntricos y
  una cruz fina de fondo: un astrolabio insinuado, nunca dibujado del todo.
- El borde dorado de la carta revelada es un degradado con
  `mask: … content-box exclude`, no una imagen.
- El carrusel de consejos **enseña a leer** —«di "Pasado" en voz alta mientras
  eliges la carta»— y de paso sostiene la autoridad ante buscadores. «Proceso
  revisado por Inbaal», tarotista de 25 años, enlazado desde la propia pantalla
  de pregunta.

---

## 7. Lo que hacen mal y podemos ganar sin esfuerzo

**Accesibilidad.** Cero reglas `prefers-reduced-motion` en toda su hoja de
estilos. `<meta viewport … maximum-scale=1.0, user-scalable=no>`: zoom
desactivado. `will-change: transform` permanente en `.card-wrapper`,
`.count-title` y `.card-name`.

**Primera impresión.** En la primera visita, el banner de cookies violeta a
sangre tapa por completo el botón de empezar. Todo el cuidado atmosférico, y lo
primero que se ve es eso.

**Calidad del texto generado.** De una lectura real:

> «Este **card** también invita a hacer los cambios necesarios…»

Palabra inglesa sin traducir en la salida española. Además presupone la vida del
consultante —«Este mes arrancaste con una mentalidad abierta»—, roza la
predicción —«es probable que encuentres claridad»— y cierra en autoayuda
genérica. Las tres cosas las prohíbe nuestra guía de voz y las caza
`src/corpus/reglas.ts`.

**Fuga de identidad.** Los clips se sirven como `/wp-content/uploads/8.mp4`,
nombrados por índice de carta. La identidad de la carta es visible en la pestaña
de red **antes** del volteo. Heredaríamos el mismo agujero salvo que
precarguemos señuelos.

---

## 8. Dato para la vía C

El rostro de la carta revelada es un vídeo, no una imagen:

| Parámetro  | Tarotoo                         | Nuestra especificación C1 |
| ---------- | ------------------------------- | ------------------------- |
| Resolución | 342 × 576                       | 720 × 1260                |
| Duración   | 3,5 – 4 s, **en bucle**         | 1,5 – 2,5 s, sin bucle    |
| Peso       | 180 KB (`8.mp4`, 184.194 bytes) | 400 KB máximo             |
| Formato    | MP4                             | AV1 en MP4                |
| Carga      | `preload="metadata"`, al elegir | precarga al seleccionar   |

Nuestra especificación dobla la resolución. Merece contrastarse en **C2, el
piloto de tres**, que existe justo para esto.

---

## 9. Conclusiones que afectan a la hoja de ruta

1. **La coreografía del ritual es el presupuesto de latencia de A5.** Si el
   revelado dura menos que el p95 de generación, aparece el cargador. Diseñarlo
   ahora como restricción es gratis; descubrirlo en A5 obliga a rehacer A3 y A4.
2. **D1 queda resuelto por evidencia.** Con 22 cartas y sin rotación se pierde
   casi la mitad del mazo en móvil. El rolodex con zona de foco es la respuesta,
   y el arco de radio grande es el truco que lo hace legible.
3. **La síntesis conjunta se pospone.** El argumento decisivo es que un muro solo
   funciona si lo gratuito ya se siente completo, y con el corpus a cero no hay
   forma de saberlo.
4. **El arnés de Playwright va antes que cualquier pantalla**, y A3.4 antes que
   la portada: es la rebanada vertical que prueba la tesis del producto con
   piezas que ya están construidas.
