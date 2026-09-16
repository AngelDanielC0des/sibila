# Guía de diseño

Reglas de composición, responsive y accesibilidad. Lo que aquí se decide es de
obligado cumplimiento; lo que no está aquí, se decide y se añade.

El concepto visual y la paleta viven en `docs/plan-v1.md` §2 y §3. Este
documento es el **cómo se usa**.

---

## 1. La regla que gobierna todo lo demás

Sibila tiene **dos clases de ruta con necesidades opuestas.** Casi todos los
errores de maquetación del proyecto van a venir de aplicar las reglas de una
clase a la otra.

|                   | **Rutas de contenido**                                                   | **Rutas de lectura**                                                 |
| ----------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Cuáles            | Portada, landings, enciclopedia, ficha de carta, glosario, legal, cuenta | Pregunta, barajado, abanico, revelado, muro, síntesis                |
| Se comportan como | Un documento                                                             | Una aplicación                                                       |
| Scroll            | Sí, es el modo normal de consumo                                         | No. Ocupan el viewport y no desbordan                                |
| Responsive        | **Reflujo**: el contenido se recoloca y se apila                         | **Adaptativo**: cambia el algoritmo de disposición, no solo el ancho |
| Métrica           | Core Web Vitals                                                          | Fotogramas por segundo                                               |
| Peso              | Mínimo. Sin Three.js ni GSAP                                             | Three.js y GSAP, cargados en diferido                                |
| Tema              | Sólo oscuro en la v1 · ver §4.3                                          | Solo oscuro                                                          |

Antes de maquetar cualquier pantalla: **decidir a qué clase pertenece.** Si no
está claro, es de contenido.

---

## 2. Responsive

### 2.1 Fluido primero; puntos de ruptura solo para cambio estructural

La mayoría de adaptaciones se resuelven sin ningún punto de ruptura, con
`clamp()` sobre tipografía y espaciado. Un punto de ruptura solo se justifica
cuando **cambia la estructura**: una columna pasa a dos, un abanico pasa a
carrusel, una barra pasa a menú.

Añadir un punto de ruptura para cambiar un tamaño es una señal de que faltaba
una función fluida.

### 2.2 Los tres puntos de ruptura

Se nombran por lo que cambia, no por el dispositivo. Los dispositivos cambian;
los cambios estructurales no.

| Token           | Valor    | Qué cambia al cruzarlo                                     |
| --------------- | -------- | ---------------------------------------------------------- |
| `--bp-compacto` | `600px`  | Una columna → dos. Navegación en menú → navegación visible |
| `--bp-medio`    | `900px`  | Aparecen barras laterales. El abanico gana arco            |
| `--bp-amplio`   | `1280px` | Abanico a arco completo. Ornamento ambiental al máximo     |

**No existe punto de ruptura por debajo de 600px.** El diseño tiene que
sobrevivir a 320px por medios fluidos. Se prueba a 320, no a 360.

### 2.3 Contenedor para componentes, viewport para página

- **Consultas de contenedor** (`@container`) para todo lo que sea componente.
  Una ficha de carta debe maquetarse según el sitio que tiene, no según el
  tamaño de la ventana. Es lo que permite reutilizarla en una rejilla, en una
  barra lateral y a pantalla completa sin tocarla.
- **Consultas de viewport** (`@media`) solo para la disposición de la página y
  para las preferencias del usuario (`prefers-reduced-motion`,
  `prefers-color-scheme`, `prefers-contrast`).

Si un componente tiene un `@media` dentro, casi siempre está mal.

### 2.4 Unidades

| Uso                  | Unidad                | Nunca                                         |
| -------------------- | --------------------- | --------------------------------------------- |
| Altura de viewport   | `dvh`                 | `vh` — la barra del navegador móvil la falsea |
| Tipografía           | `rem` y `clamp()`     | `px` para texto                               |
| Espaciado            | tokens `--esp-*`      | valores arbitrarios                           |
| Bordes y filetes     | `px`                  | `rem` — un filete debe medir un píxel         |
| Medida de texto      | `ch`                  | `%`                                           |
| Anchos de componente | `%`, `fr`, `minmax()` | anchos fijos                                  |

### 2.5 Áreas seguras y orientación

- Todo lo fijado al borde respeta `env(safe-area-inset-*)`. El muro de pago y la
  barra de acciones de la lectura se apoyan en el borde inferior, que es
  exactamente donde está el indicador de inicio de iOS.
- **Móvil en horizontal es un caso real**, no una rareza: es una aplicación de
  cartas y la gente gira el teléfono. Con 390 × 844 girado quedan 844 × 390 y
  la altura disponible es de 390px. Ninguna pantalla de lectura puede asumir
  altura generosa.
- La orientación no se bloquea nunca.

### 2.6 Objetivos táctiles, y el problema del abanico

**Mínimo 44 × 44 px reales, con 8px de separación entre objetivos contiguos.**
El objetivo táctil puede ser mayor que el elemento visible; es lo normal y lo
correcto.

Ahora el caso que condiciona el producto entero. El abanico son 78 cartas sobre
un arco de 110°, lo que da **1,429° por carta**. La franja visible de cada carta
depende del radio:

| Radio del abanico | Franja visible | Veredicto         |
| ----------------- | -------------- | ----------------- |
| 250 px            | 6,2 px         | Inusable al tacto |
| 450 px            | 11,2 px        | Solo ratón        |
| 600 px            | 15,0 px        | Solo ratón        |
| 780 px            | 19,4 px        | Solo ratón        |

**A ningún radio que quepa en una pantalla el abanico completo es táctilmente
viable.** Ni siquiera a 780px de radio, que es más ancho que un móvil entero.

Consecuencias, y son de diseño de producto, no de CSS:

- **En escritorio** el abanico funciona con ratón porque la precisión del
  puntero es de un píxel y porque la microinteracción de elevar la carta bajo el
  cursor y apartar las vecinas _agranda el objetivo al aproximarse_. La
  adquisición es magnética: la carta más cercana al cursor se ensancha antes de
  que haga falta acertarle.
- **En táctil el abanico no puede ser una rejilla de objetivos.** Tiene que ser
  un único objetivo con un foco. La forma recomendada es **rotación tipo
  rolodex**: el abanico existe y se arrastra para girarlo, pero solo es
  seleccionable la carta que queda en la posición de foco, arriba y al centro.
  El objetivo pasa a ser la zona de foco, que sí puede medir 44px de sobra, y se
  conserva la ceremonia del abanico.

Queda como decisión abierta en la hoja de ruta, pero **la opción de «el mismo
abanico más pequeño» está descartada por aritmética**, no por gusto.

### 2.7 Qué se prueba, siempre

Tres anchos, y los tres antes de dar una pantalla por terminada:

1. **320 × 568** — el suelo. Nada puede desbordar horizontalmente.
2. **390 × 844** y el mismo girado, **844 × 390**.
3. **1440 × 900** — escritorio de referencia.

Más: con `prefers-reduced-motion` activo y con
zoom de texto al 200%, que es requisito de accesibilidad y rompe maquetaciones
que usan alturas fijas.

---

## 3. Composición

### 3.1 Ritmo de espaciado

Solo se usan los tokens `--esp-1` … `--esp-10`, que son una escala de 4px. Un
valor de espaciado que no esté en la escala es un error, no una excepción.

**El espaciado va en el contenedor, no en los hijos.** Se usa `gap` de flex o
grid. Márgenes sueltos en los elementos producen colapsos y dobles espacios que
luego nadie sabe de dónde salen.

### 3.2 Medida de texto

- Texto corrido: **60–75 caracteres** (`--ancho-lectura`, fijado en `58ch`).
  Ojo: `ch` es el ancho del cero, no el de una letra media. Medido en navegador,
  `68ch` daba 83 caracteres por línea —fuera de rango— y `58ch` da 71. **El
  número del token no es el número de caracteres**, así que al cambiarlo hay que
  volver a medir, no calcular.
- Nunca se aplica la medida de lectura al mismo elemento que lleva la anchura de
  contenedor y el centrado automático: el resultado es un bloque estrecho
  centrado en vez de alineado. _Ya ocurrió una vez en el pie de la portada._
  La anchura de contenedor va en el envoltorio; la medida, en los párrafos.

### 3.3 Contenedor y gutter

- Un solo envoltorio por página aplica `max-width: var(--ancho-contenedor)` y
  `margin-inline: auto`.
- El gutter lateral se declara **una vez**, como `padding-inline` en ese
  envoltorio. Nunca por debajo de 16px a ningún ancho.
- El espaciado vertical de ese envoltorio se declara con `padding-block`, jamás
  con el atajo `padding`, que anularía los laterales.

---

## 4. Color

### 4.1 La disciplina

Es la regla del concepto y no se negocia: **lo holográfico es azul y emite luz;
lo antiguo es oro y la refleja.** Se cruzan en un único punto deliberado, el
borde de las cartas al revelarse.

El violeta `--fisura` **solo aparece como aberración cromática**: bordes,
desplazamientos de uno o dos píxeles, franjas de interferencia. Nunca como color
de texto, de fondo ni de acento de interfaz. En el momento en que el violeta se
usa para rellenar algo, el producto pasa a parecerse a los competidores.

### 4.2 Los tokens se nombran por rol, no por aspecto

Regla aprendida a base de un bug real. `--oro-vivo` se nombró por su aspecto
—«oro más luminoso»—. Sobre fondo oscuro, más luminoso coincide con más énfasis;
sobre fondo claro son lo contrario, y el token de énfasis acabó contrastando
**menos** que el base: 3,33 frente a 4,64.

Un token nombrado por su rol —«oro de énfasis»— no admite ese error, porque al
redefinirlo para el tema claro la pregunta que te haces es «¿cuál da más
énfasis aquí?» y no «¿cuál es más luminoso?».

Al añadir un token: **nombrarlo por lo que hace.** Y al redefinir la paleta para
otro tema, **recalcular cada valor**, nunca heredar el del tema contrario.

### 4.3 El tema claro existe, y en la v1 no se enciende

Los tokens claros están escritos y su contraste lo verifica
`contraste.prueba.ts` igual que el del oscuro. Pero **nadie pone nunca
`data-tema`**, así que hoy es código inalcanzable, y eso es deliberado.

El producto es un holograma proyectado en una cámara a oscuras. El tema claro
no es una variante de esa idea: es su contraria. Mantener las dos obligaría a
diseñar y verificar cada pantalla dos veces, en la mitad clara con los
ornamentos —cono, barrido, fresnel, aberración— desactivados o reinventados,
porque la luz sobre blanco no se lee como luz.

**Por qué entonces no se borran los tokens:** porque el trabajo caro ya está
hecho y verificado, y porque hay dos escenarios previsibles que lo pedirán
—una vista de lectura para imprimir o guardar, y las fichas de la enciclopedia,
que son documento y no ceremonia—. Borrarlos ahora y rehacerlos luego costaría
más que dejarlos dormidos.

**Qué significa esto al maquetar:** no se comprueba el tema claro, no se añade
selector, y **no se escribe CSS nuevo bajo `[data-tema="claro"]`**. Si alguna
pantalla lo necesitara, primero se reabre esta decisión.

### 4.4 Suelos de contraste

Medidos sobre los tokens reales. Mínimos exigidos: **4,5:1** para texto de
cuerpo, **3:1** para texto grande —desde 24px, o 19px en negrita— y para
elementos de interfaz no textuales como bordes de campo e iconos.

### 4.5 Tokens prohibidos como texto de cuerpo

Estos tres pasan de 3:1 pero no llegan a 4,5:1. Valen para bordes, filetes,
iconos y texto grande. **Nunca para texto corrido:**

| Token          | Contraste sobre `--nicho` |
| -------------- | ------------------------- |
| `--tenue`      | 3,20                      |
| `--holo-hondo` | 3,20                      |
| `--oro-hondo`  | 3,45                      |

Todo lo demás de la paleta pasa AA como texto de cuerpo sobre las tres
superficies oscuras.

### 4.6 Bordes: hay dos, y no son intercambiables

| Token             | Para qué                                          | Suelo   |
| ----------------- | ------------------------------------------------- | ------- |
| `--linea`         | Separadores, cantos de panel, filetes decorativos | Ninguno |
| `--linea-control` | Borde de campos, botones y cualquier control      | **3:1** |

WCAG no exige contraste a una línea ornamental, pero sí al borde de un control,
porque es lo que te dice **dónde está el campo**. Usar `--linea` en un
formulario produce campos que no se distinguen del fondo: mide 1,40.

La distinción parece menor y no lo es. Es el tipo de fallo que no se ve al
maquetar —quien lo hace ya sabe dónde están los campos— y que descubre un
usuario con poca visión cuando ya está en producción.

### 4.7 Los semánticos se recalculan en cada tema

`--exito`, `--aviso` y `--error` son colores luminosos pensados para emitir
sobre negro. Sobre fondo claro se hunden: heredarlos daba 1,59, 1,66 y 2,43,
que deja un mensaje de error prácticamente invisible.

Es el mismo error que el del oro de §4.2, y por la misma causa: **heredar un
valor de un tema a otro en vez de recalcularlo.** Cada tema define su paleta
entera o no define nada.

---

## 5. Tipografía en uso

| Familia                | Se usa para                                                | No se usa para               |
| ---------------------- | ---------------------------------------------------------- | ---------------------------- |
| **Cormorant Garamond** | Titulares, nombres de carta, el texto del significado      | Interfaz, botones, etiquetas |
| **Inter Tight**        | Cuerpo de interfaz, botones, formularios, navegación       | Titulares grandes            |
| **JetBrains Mono**     | Contadores, versalitas, el efecto de decodificación, datos | Texto corrido                |

Reglas:

- Los titulares llevan `text-wrap: balance`; los párrafos, `text-wrap: pretty`.
- Las versalitas llevan `letter-spacing: var(--espaciado-versalita)`. Una
  versalita sin espaciado se lee apelmazada.
- **Los tamaños salen de la escala.** Si hace falta un tamaño intermedio, o se
  usa `clamp()` entre dos escalones, o se añade el escalón a la escala.
- El serif de display baja de 24px solo en casos justificados: Cormorant tiene
  mucho contraste de trazo y a tamaño pequeño pierde legibilidad, sobre todo en
  pantallas de baja densidad.

---

## 6. Anatomía de componente

### 6.1 Estados obligatorios

Un componente interactivo no está terminado hasta que tiene los siete:

1. **Reposo**
2. **Hover** — solo bajo `@media (hover: hover)`. En táctil no existe y no puede
   ser el único indicio de nada.
3. **Foco visible** — anillo holográfico, nunca `outline: none` a secas.
4. **Activo** — el instante de la pulsación. Da la sensación de respuesta.
5. **Deshabilitado** — y con el motivo comunicado, no solo atenuado.
6. **Cargando** — si la acción tarda, con el control bloqueado para evitar doble
   envío.
7. **Error** — qué ha fallado y qué hacer, no una disculpa.

### 6.2 Cuándo algo merece ser componente

A la **tercera** aparición. A la segunda se copia; a la tercera se extrae. Sacar
un componente en la primera aparición produce abstracciones diseñadas para un
solo caso que luego estorban.

---

## 7. Accesibilidad: el suelo

No es una fase posterior. Una pantalla que incumpla esto no está terminada:

- **Navegable entera por teclado**, incluido el abanico. Flechas para moverse
  entre cartas, Enter o Espacio para seleccionar, Escape para salir.
- **El texto existe en el DOM antes de animarse.** La decodificación por glifos
  es un efecto visual sobre texto que ya está ahí. Un lector de pantalla no
  puede leer una animación.
- **Orden de foco igual al orden visual.** Si hace falta `tabindex` positivo, la
  maquetación está mal.
- **Región viva** para lo que cambia sin interacción: la carta revelada, el
  texto de la síntesis llegando.
- **`prefers-reduced-motion`** sustituye desplazamiento por fundido en todas las
  animaciones. La ceremonia se conserva.
- **El color nunca es el único portador de información.** Carta invertida se
  marca con forma y texto, no solo con un tinte.
- **Zoom de texto al 200%** sin pérdida de contenido ni de función.

---

## 8. Antes de dar una pantalla por terminada

- [ ] Clasificada como ruta de contenido o de lectura, y aplicadas sus reglas
- [ ] Probada a 320, 390, 844×390 y 1440
- [ ] Sin scroll horizontal a ningún ancho
- [ ] Los siete estados en cada componente interactivo
- [ ] Recorrido completo por teclado, con foco siempre visible
- [ ] Contrastes verificados, sin tokens prohibidos en texto de cuerpo
- [ ] Con `prefers-reduced-motion` activo sigue siendo usable y con sentido
- [ ] Zoom de texto al 200% sin romper
- [ ] Solo `transform` y `opacity` animados
- [ ] ~~Tema claro revisado~~ · no aplica en la v1, ver §4.3
- [ ] `npm run verificar` en verde
