# Plan · Completar la sección de tarot

## 1. Contexto

Estamos al final de los cimientos: Fase 0 cerrada (Next 16, TypeScript estricto,
multiidioma con slug traducido, tokens, guías de diseño y arquitectura) y B1
cerrado (baraja canónica de 78 cartas, validador del corpus con dos gravedades,
informe de avance). 50 pruebas en verde, cero avisos.

Este plan cubre **todo lo que falta del producto de tarot**, incorpora la
decisión sobre datos abiertos y MCP que pediste evaluar, y detalla el héroe
holográfico de la portada.

### 1.1 Actualización competitiva — cambia la estrategia

La investigación de la Fase 1 concluyó que **nadie integra tarot y astrología**.
Eso ya no es cierto y hay que decirlo claro:

| Competidor                        | Qué hace                                                                                                                                          | Qué significa para nosotros                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Raka** (2026, Vyve Health Tech) | Tarot + carta natal + tránsitos + sinastría + numerología. «Al sacar una carta, la IA incorpora tus datos astrológicos». 9,99 $/mes o 79,99 $/año | **Ocupa nuestra tesis de integración.** App primero, inglés, cuenta obligatoria                            |
| **Chatarot.ai**                   | Tirada 3D en web con las 78 cartas, invertidas, síntesis carta a carta, chat de seguimiento                                                       | Demuestra que el 3D web es viable. Y enseña qué evitar: su portada muestra «INITIALIZING SCENE · 78 CARDS» |
| **Tarotoo**                       | Sigue siendo el mejor en artesanía; sin astrología; web con 22 arcanos                                                                            | Sin cambios                                                                                                |

**La idea de integrar tarot y astrología ya no es defensa suficiente.** Lo que
sí sigue libre, y es donde hay que apoyarse:

1. **Canal.** Raka es app primero con cuenta obligatoria. Tarotoo demostró que el
   volumen está en la web sin registro. Nadie junta las dos cosas.
2. **Artesanía.** Raka es un paquete de funciones; no hay indicio de que se
   acerque al nivel de atmósfera de Tarotoo. Nuestra tesis original —la
   artesanía de Tarotoo con profundidad real— sigue en pie.
3. **Idioma.** Español y portugués primero, contra un mercado angloparlante.
4. **Persona.** Nadie tiene un personaje. Sibila es marca, no función.
5. **El corpus curado por posición.** Ellos generan; nosotros tenemos texto
   escrito y revisado, gratis y con latencia cero.

El «INITIALIZING SCENE» de Chatarot merece subrayado: es exactamente el fallo
que el diseño del héroe de este plan está construido para evitar.

---

## 2. Datos abiertos y MCP: no lo replicamos

### 2.1 Qué publica Tarotoo

Dos repositorios públicos, ambos MIT:

- **`tarotoo-tarot-dataset`** — las 78 cartas con 22 campos: significados derecho
  e invertido, palabras clave, amor, carrera, ánimo, espiritual, elemento,
  planeta, zodiaco y valor sí/no. En JSON, JSONL, CSV y YAML por palo.
  Distribuido en npm, PyPI, Hugging Face, Kaggle y Zenodo con DOI citable.
- **`tarotoo-mcp-server`** — expone cinco herramientas: `get_card_meaning`,
  `list_cards`, `search_cards`, `yes_no_answer` y `draw_cards`.

Es una jugada de autoridad: cuando alguien pregunta a un asistente por el
significado de una carta, la respuesta sale de sus datos, con su atribución.

### 2.2 Por qué a nosotros nos perjudicaría

**Nuestro corpus no es una referencia, es el producto.** El modelo de negocio
completo se apoya en que los significados son gratuitos —el gancho— y la
síntesis se paga. Publicar el corpus sería regalar el activo más caro que
tenemos: 2.028 piezas, unas 95.000 palabras por idioma, escritas y revisadas.

La diferencia con Tarotoo es real, no una excusa: lo suyo es un diccionario de
cartas en abstracto. Lo nuestro es **la misma carta a través de once lentes, en
la voz de Sibila**. Es mucho más caro de producir y mucho más diferenciador.

Además, la posición ya está disputada: **deckaura** publica su propio dataset
abierto y su propio servidor MCP. Llegar terceros a la misma jugada no da
autoridad, da ruido.

Y el beneficio de SEO que se busca ahí ya lo cubre nuestra enciclopedia de 78
fichas renderizadas en servidor, que los rastreadores de IA indexan igual.

### 2.3 Qué sí haremos, y no ahora

Un servidor MCP **más adelante**, y con otra forma: que no exponga significados
sino **lecturas**. Un asistente podría pedir una tirada de Sibila, recibir la
capa gratuita —cartas, posiciones, significados curados— y un enlace para
desbloquear la síntesis. Eso convierte el MCP en un canal de captación en lugar
de en una donación.

No es trabajo de la v1. Queda anotado en la hoja de ruta.

**Lo que sí conviene tomar de su dataset ahora mismo:** las correspondencias
tradicionales —elemento, planeta, zodiaco, numerología, valor sí/no— son materia
de tradición, no de autoría, y su licencia MIT lo permite con atribución. Sirven
para **contrastar** nuestras valencias sí/no y las correspondencias que usaremos
en la v2 astrológica. Nuestra prosa interpretativa sigue siendo nuestra.

---

## 3. La portada y el héroe holográfico

Es la pieza con más riesgo de diseño del proyecto y la que más nos separa de
todos los competidores. Merece detalle.

### 3.1 El concepto

Una cámara de proyección a oscuras. Sibila se materializa a escala monumental,
como VIKI. Pronuncia una bienvenida, y **sus palabras precipitan como texto de
glifos a su izquierda y a su derecha**, decodificándose hasta resolverse en
letras.

La idea que impide que sea un truco: **el texto no aparece, se condensa de la
luz.** Es su voz hecha visible.

### 3.2 La arquitectura: tres niveles progresivos

Es la decisión técnica central. La portada es una ruta de contenido y su métrica
son los Core Web Vitals, no los fps. **Nunca puede haber un «INITIALIZING
SCENE».**

**Nivel 0 · siempre, y es el LCP**

- Un solo retrato de Sibila en AVIF con WebP de reserva, `fetchpriority="high"`,
  con ancho y alto explícitos para no provocar desplazamiento de maquetación.
- Tratamiento holográfico **solo con CSS**: líneas de barrido con
  `repeating-linear-gradient`, resplandor de borde con `drop-shadow`, y una
  máscara de degradado que la disuelve por la base — el corte clásico de
  holograma, que además evita tener que recortarla con precisión.
- La frase de bienvenida como texto real, visible y legible desde el primer
  pintado.
- **En este nivel la página ya está completa y es bonita.** Sin cargador, sin
  espera, sin JavaScript.

**Nivel 1 · tras el LCP, si el dispositivo puede**

- Un único cuadrilátero a pantalla completa con shader propio, en **WebGL
  crudo, no Three.js**. Un grafo de escena para un solo quad son ciento y pico
  kilobytes desperdiciados, y además violaría nuestra propia regla de peso por
  ruta en `CLAUDE.md`.
- El shader hace: aberración cromática creciente hacia los bordes, realce de
  fresnel, deriva lenta del barrido, bandas de interferencia esporádicas y
  respiración sutil de las coordenadas.
- **Usa como textura el retrato que ya se descargó.** No hay segunda descarga.
- Paralaje de cursor.
- Se carga con `import()` dinámico tras `requestIdleCallback`, una vez asentado
  el LCP.

**Nivel 2 · escritorio con margen**

- Motas de polvo en el cono volumétrico: un canvas, puntos instanciados.
- Anillos de astrolabio girando detrás de ella: SVG con rotación CSS, coste casi
  nulo.

Cada nivel se activa solo si el anterior ya se asentó y el dispositivo da la
talla. Si algo falla, se queda en el nivel inferior y **nadie nota que falta
nada**.

### 3.3 El efecto de habla

1. Una cola de tres a cinco frases de bienvenida, sacadas del catálogo de
   idiomas — no incrustadas en el componente.
2. Cada frase se materializa con la decodificación por glifos zodiacales y
   alquímicos, que es la firma del producto.
3. Las frases alternan lado: izquierda, derecha, izquierda.
4. Al llegar una nueva, la anterior **deriva hacia fuera y se apaga** — se
   dispersa, no desaparece de golpe.
5. La luminosidad de Sibila pulsa al compás de cada materialización: se ilumina
   al hablar.
6. Tempo de «revelación»: 1,8–2,1 s materializando, unos 4 s sostenida, 1,2 s
   dispersándose.

### 3.4 Móvil

El arreglo lateral **no cabe en 390px**, y encogerlo lo arruinaría. Igual que
con el abanico, no se reduce: se cambia.

- Sibila ocupa menos altura y se centra.
- Las frases pasan a **disposición vertical**: una sola cada vez, bajo ella.
- Las motas y los anillos se desactivan; el shader del nivel 1 sí puede correr,
  porque un quad a pantalla completa con el DPR limitado a 2 es barato —muy
  distinto del abanico de 78 cartas.
- El cambio se hace con **consultas de contenedor**, no de viewport. Ventaja
  gratis: el mismo mecanismo resuelve el zoom de texto al 200%, donde el espacio
  se estrecha igual.

### 3.5 Accesibilidad — innegociable

Un héroe con texto que cicla y se decodifica es uno de los patrones más hostiles
que existen si se hace mal. Las reglas:

- **El texto completo está en el DOM desde el primer pintado**, en orden de
  lectura. La decodificación es un tratamiento visual **sobre texto real**,
  nunca una sustitución por JavaScript.
- Las copias animadas van `aria-hidden`. Se expone **una versión estática y
  completa** a la tecnología asistiva. Un lector de pantalla jamás recibe un
  chorro de glifos cambiantes.
- **Sin `aria-live`.** Aquí no hay nada urgente.
- La rotación **se pausa al enfocar y al pasar el puntero**, y hay un control
  visible para detenerla. Contenido que se auto-avanza sin poder pararse
  incumple WCAG 2.2.2.
- `prefers-reduced-motion` → sin decodificación, sin ciclo, sin deriva. Una
  frase, compuesta y quieta. Sibila conserva el resplandor, que es opacidad y no
  movimiento.
- Las columnas de texto **no pueden caer sobre la parte luminosa de la
  proyección**. O se sitúan en zona oscura, o llevan su propio velo.

### 3.6 Qué tienes que producir tú

Esto cambia lo que hace falta respecto a lo que hablamos:

- **Un retrato de Sibila**, limpio, iluminado de frente, sobre negro puro o
  transparente, en torno a 1600 × 2000. La parte inferior puede acabar
  difuminada; si no, la enmascaramos nosotros.
- **Opcional**, para el nivel 1: un bucle corto y sin costura de 2 a 4 segundos
  con movimiento mínimo, por debajo de 400 KB.
- **No hace falta un vídeo con canal alfa.** El holograma lo hace el shader. Un
  vídeo con alfa pesa mucho más y Safari apenas lo soporta.

### 3.7 Guías a consultar al implementar

Del catálogo de `modern-web-guidance`, recuperar antes de escribir código:
`optimize-image-priority`, `deliver-optimized-decorative-images`,
`parallax-scroll-effects`, `accessibility` y `performance`.

---

## 4. Orden de ejecución

**Cambio respecto a la hoja de ruta: la portada sube.** Estaba en A6, casi al
final. Va después del sistema de diseño porque es la pieza con más riesgo
visual, no depende del motor ni del corpus, y validarla pronto es cuando sale
barato cambiarla.

| Orden | Bloque                                                                                                                                                           | Por qué aquí                                     |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| 1     | **A1 · Sistema de diseño** — página de tokens, biblioteca de los diez ornamentos, catálogo de componentes con sus siete estados                                  | Todo lo visual se apoya en esto                  |
| 2     | **Portada y héroe** — los tres niveles, el efecto de habla, móvil y accesibilidad                                                                                | Máximo riesgo de diseño, cero dependencias       |
| 3     | **A2 · Motor de lectura** — barajado criptográfico con prueba de distribución, definiciones de tirada, máquina de estados, bus de eventos, repositorio de corpus | Lógica pura, probada sin DOM                     |
| 4     | **A3 · Renderizador plano** — la lectura completa en móvil. Antes decidir D1, la interacción táctil del abanico                                                  | Es el camino por defecto y la reserva del 3D     |
| 5     | **A4 · Renderizador 3D** — abanico en perspectiva, selección magnética, shader, clips                                                                            | Mejora de escritorio sobre un contrato ya fijado |
| 6     | **A5 · Síntesis y cobro** — moderación, detección de crisis, streaming, y reservar-generar-persistir-cobrar                                                      | Necesita el motor terminado                      |
| 7     | **A6 · Resto de contenido y SEO** — enciclopedia, landings por tirada, `hreflang`, sitemaps                                                                      | Se nutre del corpus ya escrito                   |

**La vía B del corpus corre en paralelo desde ya y es el camino crítico.**
B2 son 156 significados base en tandas, empezando por los 22 arcanos mayores.
Ninguna tarea de arriba la bloquea, y ella no bloquea a ninguna hasta el paso 4.

---

## 5. Verificación

- `npm run verificar` en verde tras cada bloque: tipos, ESLint tipado,
  Stylelint, pruebas.
- `npm run corpus` para el avance del corpus.
- **Portada**: traza de Chrome DevTools en perfil de móvil de gama media. El LCP
  tiene que cumplirse en el nivel 0, con el shader aún sin cargar. Criterio:
  ningún cargador visible en ningún momento.
- **Accesibilidad de la portada**: recorrido con lector de pantalla comprobando
  que se anuncia la bienvenida una sola vez; pausa al enfocar; recorrido íntegro
  con `prefers-reduced-motion`; zoom de texto al 200 %.
- **Responsive**: 320, 390, 844 × 390 girado y 1440, según la lista de
  `docs/guia-de-diseno.md` §8.
- **Motor**: pruebas en Node sin jsdom, por debajo de un segundo.
- **Extremo a extremo con Playwright** del recorrido completo, en escritorio y
  móvil, con y sin clips de carta.

---

## 6. Decisiones abiertas

|     | Decisión                                                                                                                                                                                              | Bloquea  | Cuándo               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------- |
| D1  | **Interacción táctil del abanico.** La aritmética descarta encogerlo: 78 cartas sobre 110° dan franjas de 6 a 19 px frente a los 44 px mínimos. Recomendación: rotación tipo rolodex con zona de foco | Paso 4   | Antes de A3          |
| D2  | Cuántas tiradas al lanzamiento, cuatro o siete                                                                                                                                                        | B3       | Cuando B2 esté cerca |
| D3  | Proveedor de modelo                                                                                                                                                                                   | Paso 6   | Antes de A5          |
| D4  | Pasarela de pago, y si admite compra sin cuenta                                                                                                                                                       | Paso 6   | Antes de A5          |
| D5  | **Postura ante la tesis integrada de Raka.** ¿Mantenemos la astrología para la v2 como estaba, o se adelanta algo para no ceder el terreno?                                                           | Nada hoy | Tras lanzar el tarot |

---

## 7. Lo primero que haré

El paso 1, **A1 · Sistema de diseño**, empezando por la página navegable de
tokens: paleta con sus contrastes anotados, escala tipográfica, espaciado y
curvas de movimiento, en ambos temas. Es la base sobre la que se construye el
héroe y todo lo demás, y hasta que no esté no se escribe ningún componente.
