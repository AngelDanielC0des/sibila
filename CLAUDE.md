# Sibila

Plataforma de tarot interactivo con una oráculo holográfica. Web primero, en
español y preparada para más idiomas. La astrología llega en la v2.

## Documentación

Este fichero son las reglas que aplican **siempre**. Lo específico vive en su
guía, y hay que abrirla antes de trabajar en su área:

| Documento                      | Ábrelo antes de                                                      |
| ------------------------------ | -------------------------------------------------------------------- |
| `docs/hoja-de-ruta.md`         | Empezar cualquier tarea. Dice qué toca y cuándo está terminada       |
| `docs/guia-de-diseno.md`       | Maquetar una pantalla. Responsive, contraste, estados, accesibilidad |
| `docs/guia-de-arquitectura.md` | Crear un módulo. Capas, patrones, errores, pruebas                   |
| `docs/corpus/guia-de-voz.md`   | Escribir texto del corpus                                            |
| `docs/plan-v1.md`              | Entender una decisión de producto o su porqué                        |
| `docs/investigacion/`          | Contrastar con lo que hacen Tarotoo y Astrolink                      |
| `docs/lienzo/`                 | Maquetar una de las diez pantallas. Composición aprobada             |

---

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run verificar    # tipos + eslint + stylelint + pruebas · pásalo antes de dar nada por terminado
npm run typecheck    # solo tipos
npm run lint         # solo eslint
npm run lint:css     # solo stylelint
npm test             # pruebas del motor
```

`npm run verificar` es la puerta. Si no pasa, el trabajo no está hecho.

---

## Convenciones de código

**El código de este proyecto se escribe en español.** No es una preferencia
estética: el dominio del tarot tiene vocabulario propio y traducirlo a medias
produce nombres confusos. Se escribe entero en español o no se escribe.

### Nomenclatura

| Elemento             | Convención                                            | Ejemplo                                            |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Clases y tipos       | PascalCase                                            | `MazoDeCartas`, `DefinicionDeTirada`               |
| Métodos y funciones  | camelCase, verbo primero                              | `barajarMazo()`, `obtenerSignificadoPorPosicion()` |
| Variables            | camelCase descriptivo, sin abreviar                   | `cartasSeleccionadas`, nunca `cartsSel`            |
| Constantes de módulo | UPPER_SNAKE_CASE                                      | `NUMERO_MAXIMO_DE_CARTAS`                          |
| Booleanos            | prefijo `es`, `esta`, `tiene`, `puede`, `debe`, `hay` | `estaRevelada`, `puedeSeleccionar`                 |
| Ficheros             | kebab-case                                            | `mazo-de-cartas.ts`                                |
| Ficheros de prueba   | `*.prueba.ts`                                         | `mazo-de-cartas.prueba.ts`                         |
| Clases CSS           | camelCase en CSS Modules                              | `.cartaRevelada`                                   |
| Tokens CSS           | kebab-case                                            | `--holo-nucleo`                                    |
| Eventos              | `dominio:accion`                                      | `carta:revelada`, `lectura:completada`             |

Los identificadores técnicos consolidados se quedan en inglés cuando traducirlos
empeora la claridad: `useEffect`, `props`, `canvas`, `shader`, `viewport`.

### Glosario de dominio

Término único y obligatorio por concepto. Respetarlo es lo que impide que un
código en español derive:

| Término       | Significa                                                   |
| ------------- | ----------------------------------------------------------- |
| `baraja`      | Las 78 cartas como conjunto, en orden canónico              |
| `mazo`        | La baraja en estado de juego, ya barajada                   |
| `carta`       | Una carta concreta                                          |
| `arcano`      | Mayor o menor                                               |
| `palo`        | Bastos, copas, espadas, oros                                |
| `orientacion` | `derecha` o `invertida`                                     |
| `tirada`      | El tipo de lectura y su disposición de posiciones           |
| `posicion`    | Un hueco de la tirada, con su nombre y significado          |
| `barajar`     | Mezclar el mazo                                             |
| `repartir`    | Desplegar el mazo en abanico                                |
| `seleccionar` | El usuario elige una carta del abanico                      |
| `revelar`     | Voltear una carta seleccionada                              |
| `significado` | Texto curado de una carta en una posición · **gratuito**    |
| `sintesis`    | Texto generado que relaciona todas las cartas · **de pago** |
| `lectura`     | La sesión completa, de la pregunta a la síntesis            |

### Reglas de estilo

**Condicionales con `if`/`else` explícito. No se usa retorno anticipado.**
Donde eso genere anidamiento profundo, se extrae un método con nombre
descriptivo en lugar de aplanar con `return`. Así se obtiene legibilidad sin
código en pirámide.

```ts
// Correcto
function obtenerOrientacion(estaInvertida: boolean): Orientacion {
  if (estaInvertida) {
    return "invertida";
  } else {
    return "derecha";
  }
}

// Incorrecto: retorno anticipado sin else
function obtenerOrientacion(estaInvertida: boolean): Orientacion {
  if (estaInvertida) return "invertida";
  return "derecha";
}
```

> La regla `no-else-return` de ESLint está **desactivada a propósito** en
> `eslint.config.mjs`. Impone lo contrario de lo que pide este proyecto. No
> reactivarla.

**El bucle se elige por su semántica**, no por costumbre:

- `for` cuando se recorre un número conocido de elementos.
- `while` cuando la condición se evalúa antes de entrar.
- `do/while` cuando el cuerpo debe ejecutarse al menos una vez.

**Una responsabilidad por función**, y funciones que quepan en pantalla. ESLint
avisa a partir de 60 líneas, profundidad 3 o complejidad 10. Un aviso es una
señal de que hay que extraer, no de que haya que subir el umbral.

**Documentación JSDoc en español** en todo lo público: qué hace, qué recibe, qué
devuelve y, cuando no sea evidente, por qué existe.

**CSS**: solo CSS Modules. Prohibido `!important`, prohibidos los identificadores
como selector, especificidad máxima `0,3,0` y anidamiento máximo de 2. Los
colores salen siempre de tokens, nunca literales.

---

## Arquitectura

### Separación motor / renderizador

Es la decisión estructural del proyecto. El producto se comporta distinto en
escritorio y en móvil, pero **la lógica de la lectura es una sola**.

```
src/motor-de-lectura/     agnóstico de presentación · probado con vitest
  mazo-de-cartas.ts       barajado, reparto, estado de cada carta
  definicion-de-tirada.ts posiciones, número de cartas, disposición
  maquina-de-estados.ts   reposo → barajando → seleccionando →
                          revelando → sintetizando → completada
  bus-de-eventos.ts       desacopla el motor de los renderizadores

src/renderizadores/
  tridimensional/         escritorio · Three.js · abanico en perspectiva,
                          shader holográfico, paralaje, clips pre-renderizados
  plano/                  móvil · transformaciones CSS 3D · sin WebGL
```

Los renderizadores **solo pintan**. Ninguna regla de negocio vive en ellos. Si
te descubres escribiendo lógica de tirada dentro de un renderizador, va al motor.

El renderizador se elige por capacidad detectada — puntero grueso, memoria del
dispositivo, ausencia de WebGL2 — no solo por ancho de pantalla.

### Reglas de rendimiento

- Solo se animan `transform` y `opacity`. Nunca `top`, `left`, `width` ni
  `filter` en bucle.
- `will-change` se añade justo antes de animar y se retira en `transitionend`.
  Dejarlo permanente promociona capas de GPU durante toda la sesión.
- Objetivo: 60 fps sostenidos en Android de gama media de tres años.
- Toda animación respeta `prefers-reduced-motion` sustituyendo desplazamiento
  por fundido. La ceremonia se conserva; el movimiento desaparece.

### Multiidioma

Tres problemas distintos que no se mezclan:

1. **Cadenas de interfaz** → catálogos de `next-intl` en `messages/`.
2. **Corpus interpretativo** → ficheros estáticos por idioma, versionados en
   git. No son cadenas de interfaz y no se tratan como tales.
3. **Síntesis generada** → el idioma es parte del contexto del modelo. Se genera
   directamente en la lengua del usuario; nunca se traduce.

Las rutas usan **slug traducido**, no solo prefijo: `/es/tarot-gratis`,
`/en/free-tarot`. La palabra clave tiene que estar en la URL de cada mercado.

---

## El corpus

Los significados son **datos estáticos versionados en git**, no filas de base de
datos. El camino gratuito no consulta a Postgres ni llama a ningún modelo: lee
un fichero que el CDN ya tiene cacheado.

Se organiza en tres capas que se componen:

1. **Significado base** — por carta y orientación. 78 × 2.
2. **Matiz por familia de posición** — la lente a través de la que se lee.
3. **Valencia sí/no** — solo para esa tirada.

**La posición es una lente temática, no un atributo de la tirada.** «Pasado» en
Tres Cartas y «pasado reciente» en la Cruz Celta son la misma familia y comparten
texto. Por eso el corpus se indexa por familia y no por tirada, y por eso una
tirada nueva cuyas posiciones caigan en familias existentes **no cuesta corpus**.

Al añadir texto al corpus, el validador comprueba longitudes, léxico prohibido,
glosario, campos vacíos y **texto duplicado entre cartas**. Corre dentro de
`npm run verificar`.

---

## Modelo de negocio

El corte de monetización define el producto y hay que tenerlo presente al
escribir cualquier pantalla de lectura:

```
revelar carta → significado curado de esa carta        GRATIS
...
última carta  → muro                                    ← AQUÍ SE CORTA
                ├── compra única de esta síntesis       DE PAGO · sin cuenta
                └── suscripción                         DE PAGO · con cuenta
                síntesis conjunta en streaming
```

Lo gratuito es lectura de fichero: coste marginal cero y latencia nula. Lo de
pago es lo único que cuesta generar. **Nunca se llama al modelo de lenguaje en
el camino gratuito.**

**El muro ofrece dos caminos.** El visitante que llega por primera vez desde un
buscador puede pagar la lectura suelta sin crear cuenta; la cuenta se le ofrece
después, para conservarla. Es el mismo principio de «valor antes que cuenta» que
rige el resto del producto.

### Regla de cobro

**Se reserva, se genera, se persiste, y solo entonces se captura el cobro.** Si
la generación falla, no se cobra. Si se corta a mitad del streaming, la lectura
queda guardada y se reintenta sin volver a cobrar. Nunca se captura un pago
contra una síntesis que no existe.

---

## Encuadre del producto

Entretenimiento y autoconocimiento, nunca predicción. Contenido para mayores de 18. Esto no es formalismo legal: define la promesa del producto y es lo que lo
sostiene ante las tiendas de aplicaciones y las pasarelas de pago.

**Léxico prohibido en todo texto de cara al usuario, corpus incluido:**
«predice», «sucederá», «te va a pasar», y cualquier formulación que presente
una lectura como hecho futuro. Tampoco consejo médico, legal, financiero ni
psicológico.

**Crisis.** Un enlace en el pie no es un mecanismo. Si la pregunta contiene
lenguaje de ideación suicida o autolesión, el producto reacciona: muestra
recursos de ayuda de forma destacada, en el idioma del usuario, antes de seguir.
Nunca se responde a una pregunta así barajando cartas como si nada.

## Seguridad

- La pregunta es texto libre que acaba en un prompt. **Separación estricta entre
  instrucción y dato**, y moderación de la entrada antes de que llegue al modelo
  o a cualquier log.
- Los significados son el activo más valioso y son gratuitos: **limitación de
  tasa** y nada de exponerlos como endpoint alcanzable fuera de una lectura en
  curso.

## Peso por ruta

Three.js y GSAP **no se cargan en rutas de contenido** — portada, landings,
enciclopedia, fichas, glosario, legal. Solo las rutas de lectura los importan, y
de forma diferida. Las landings son toda la captación orgánica y su métrica es
Core Web Vitals, no fps.
