# Hoja de ruta

Desglose del trabajo en tareas con criterio de terminado. El plan explica el
**qué** y el **por qué**; esto es el **en qué orden** y **cuándo está hecho**.

Una tarea sin criterio de terminado no es una tarea, es una intención.

---

## Las tres vías

El proyecto no es una fila india. Son tres vías que avanzan a la vez, y verlas
por separado evita la sensación falsa de estar bloqueados.

| Vía              | Qué es                     | Depende de                          |
| ---------------- | -------------------------- | ----------------------------------- |
| **A · Producto** | El código de la aplicación | De sí misma, en orden               |
| **B · Corpus**   | Los ~2.000 textos curados  | De nadie. Es el camino crítico real |
| **C · Assets**   | Los 78 clips de carta      | De ti. Bloquea solo a A4            |

**La vía B es el camino crítico**, no la A. El código de una tirada se escribe
en días; el corpus que la llena, no. Si algo va a retrasar el lanzamiento, es el
corpus. Por eso empieza ya y no espera a tener interfaz donde enseñarlo.

---

## Vía A · Producto

### A0 · Cimientos

Next 16, TypeScript estricto, ESLint tipado, Stylelint, Prettier, Husky,
multiidioma con slug traducido, tokens de diseño, primera prueba.

- [x] Proyecto que compila y sirve en `es`, `pt`, `en` como HTML estático
- [x] `npm run verificar` en verde
- [x] Convenciones en `CLAUDE.md`
- [x] **Commiteado.** `3befe8c`, 116 ficheros. `.gitattributes` fija LF en el
      repositorio y en el árbol de trabajo, que es lo que ya pedía
      `.editorconfig` y lo que `core.autocrlf` contradecía

### A0b · Higiene — lo barato ahora y carísimo después

Nada de esto se ve, y todo impide una avería concreta más adelante.

|       | Tarea                   | Terminado cuando                                                                                                                                                                                                                                                        |
| ----- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A0b.1 | Integración continua    | ✅ `.github/workflows/verificar.yml`. El hook de pre‑commit se salta con `--no-verify` y no corre al empujar; esto sí. Añade formato y **compilación de producción**, que ve errores que `tsc --noEmit` no ve. `engines` fija Node 22 para que local y CI no se separen |
| A0b.2 | Pantallas de fallo      | ✅ Tres: 404 localizado dentro de un idioma, 404 estático en la raíz para URLs fuera de todo idioma, y `global-error` para cuando cae el propio layout. Verificadas en navegador: estado 404, `lang` correcto, enlaces traducidos                                       |
| A0b.3 | Guarda de peso por ruta | ✅ `CLAUDE.md` prohíbe Three.js y GSAP en rutas de contenido, y hasta ahora era sólo prosa. Forzado en ESLint y verificado con un import prohibido real                                                                                                                 |
| A0b.4 | Tema claro, decidido    | ✅ **No entra en la v1.** Los tokens quedan dormidos y documentados en `guia-de-diseno.md` §4.3, para que nadie los tome por trabajo a medias                                                                                                                           |
| A0b.5 | Plantilla de entorno    | ✅ `.env.example` versionado —con la negación en `.gitignore` que hace falta para que `.env*` no se lo trague—, con la forma de lo que llega en A5 y sin ningún valor                                                                                                   |

**Lo que sigue faltando aquí:** el arnés de pruebas de pantalla. Playwright no
está instalado y tanto este documento como `guia-de-diseno.md` §8 prometen
recorrido de extremo a extremo y capturas a 320, 390 y 1440. Es lo siguiente,
antes de escribir pantallas y no después.

### B1b · Tamaños de texto — antes de escribir corpus

El usuario nunca lee una capa suelta: lee la composición. El caso que había que
validar son las **130 palabras de matiz más base**, y no estaba validado contra
nada porque el panel donde se leen no existía.

|       | Tarea                       | Terminado cuando                                                                                                                                          |
| ----- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1b.1 | Panel de significado        | ✅ `panel-de-significado.tsx`, compuesto sobre `Panel` enmarcado. Tres composiciones: sólo base, matiz más base, y veredicto más base                     |
| B1b.2 | Textos de medida            | ✅ Seis textos en el mínimo y el máximo **exactos** de cada capa, atados a `reglas.ts` por prueba: si alguien cambia un límite y olvida la maqueta, falla |
| B1b.3 | Medición a 320 / 390 / 1440 | ✅ En navegador y sobre valores calculados, no a ojo. **Los límites del corpus no cambian**: caben. Lo que cambió fue la maqueta                          |

**Lo que la medición encontró**, todo corregido:

- `--ancho-lectura: 68ch` daba **83 caracteres por línea**, no 68: `ch` es el
  ancho del cero y la minúscula española corre más estrecha. Bajado a `58ch`,
  que da 71. Afectaba a los doce sitios que usan el token, no sólo al panel.
- `Carta` no tiene ancho propio —lo decide quien la coloca— y en un flex sin
  base crecía hasta el contenedor: su proporción 7/12 la estiraba a 2.023 px de
  alto. Toda disposición que la use tiene que darle base.
- El panel enmarcado se comía el ancho a 320 px: con 32 px de relleno a cada
  lado la línea caía a 24 caracteres. Reducido a 16 px en pantallas estrechas.
- `minmax(280px, 1fr)` desbordaba el documento a 320 px. Corregido con
  `min(280px, 100%)`, que es lo que se esperaba desde el principio.
- **Con el texto al 200 % a 390 px el documento se desbordaba 37 px**, que
  incumple el criterio de reflujo. La causa eran titulares con palabras largas.
  `overflow-wrap: break-word` en `h1`–`h4` lo deja en cero.

**Medidas finales**, caso peor de 130 palabras:

| Ancho | Caracteres por línea | Carta más respuesta | Veredicto                   |
| ----- | -------------------- | ------------------- | --------------------------- |
| 1440  | 71 base · 49 matiz   | panel de 505 px     | entra entero en 900         |
| 390   | 42 base · 41 matiz   | 540 px de 844       | carta y matiz sin desplazar |
| 320   | 31 base · 30 matiz   | 594 px de 844       | carta y matiz sin desplazar |

### B1c · Mapa de familias temáticas — aprobado

El significado se matiza por dos ejes: la posición y el tema. El tema **suma**
familias en lugar de multiplicarlas, y una familia se escribe sólo cuando una
tirada la usa.

| Grupo                  | Familias                                                                                       | Piezas |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ------ |
| Genéricas en uso       | `situacion`, `obstaculo`, `pasado`, `futuro`, `resultado`, `consejo`, `recurso`, `a-atender`   | 1.248  |
| Del vínculo            | `aporte-vinculo`, `situacion-vinculo`, `pasado-vinculo`, `a-atender-vinculo`, `futuro-vinculo` | 780    |
| Declaradas y en espera | `interior`, `entorno` · ninguna tirada activa las usa                                          | 0      |

**Total de la v1: 2.340 piezas**, unas 72.000 palabras en español. Base 156,
matices 2.028, valencias 156, más 78 núcleos.

Lo que salió de hacer el mapa:

- **Dos familias no las usaba ninguna tirada.** `interior` y `entorno` se
  escribieron para la Cruz Celta, que está fuera por D2. Escribirlas ahora
  habrían sido 312 piezas que nadie lee. Se quedan declaradas y sin escribir, y
  quién está en uso lo **deriva** `familiasEnUso()` en lugar de marcarse a mano.
- `a-trabajar` pasa a `a-atender`. El nombre ya chirriaba con su propia pregunta
  —«atender o soltar»— y además el día que entre un tema de trabajo la variante
  habría sido `a-trabajar-trabajo`.
- `aporte` pasa a `aporte-vinculo`: nunca fue genérica.
- **La tirada de amor lleva las cinco posiciones temáticas.** Si una se quedara
  genérica, la tirada se leería como la general con otro nombre.
- El informe de `npm run corpus` cuenta contra las familias en uso: contar las
  dos en espera mostraba un cero eterno y hundía el porcentaje midiendo trabajo
  que nadie ha decidido hacer.

### A1 · Sistema de diseño

Nada de pantallas reales hasta que esto esté. Construir componentes sobre tokens
no probados obliga a rehacerlos.

|      | Tarea                        | Terminado cuando                                                                                                                                                                                                                                                                                                                                                                                    |
| ---- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1.1 | Página navegable de tokens   | ✅ `/{idioma}/sistema/tokens`, sin indexar. Contrastes calculados en servidor desde `tokens.css` y juzgados contra el suelo de cada rol. Los mismos suelos los verifica `contraste.prueba.ts`                                                                                                                                                                                                       |
| A1.2 | Biblioteca ornamental        | ✅ **Los diez.** Tratamiento holográfico (barrido, cono, fresnel, aberración, interferencia) con el compositor `Holograma`; ambiente (rejilla, anillos, motas); capa dorada (filigrana y glifos). Catálogo en `/{idioma}/sistema/ornamentos` con el coste medido en producción: el conjunto barato sostiene 60 fps a CPU 4×, el completo baja a 42, y los caros se retiran solos con puntero grueso |
| A1.3 | Catálogo de componentes base | ✅ **Los cinco.** Botón, campo de texto, carta, posición de tirada y panel, en `/{idioma}/sistema/componentes`. El bloqueo se declara con su motivo y usa `aria-disabled` para seguir siendo alcanzable; la identidad de la carta no entra en el DOM hasta revelarse                                                                                                                                |
| A1.4 | Lienzo en Claude Design      | ◐ **Diez pantallas maquetadas**, a la espera de tu aprobación. Las ocho de escritorio a 1440x900 y las dos que en móvil no se encogen sino que cambian: portada con frases apiladas y selección en rolodex. Fuentes en `docs/lienzo/`, lienzo publicado como artefacto                                                                                                                              |
| A1.5 | Decodificación de texto      | ✅ Lógica pura con 12 pruebas y componente en `texto-decodificado.tsx`. **Nunca sustituye el texto**: la letra real es un nodo del DOM desde el primer pintado y el glifo va encima, absoluto, oculto al lector y vaciado al resolverse, de modo que el texto indexado queda limpio. Verificado en navegador                                                                                        |

### A2 · Motor de lectura

TypeScript puro. Sin interfaz. Es donde vive toda la lógica y donde se gana la
tranquilidad del resto del proyecto.

|      | Tarea                  | Terminado cuando                                                                                                                                                                                                                                                                                                                                |
| ---- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A2.1 | Tipos del dominio      | ✅ `Carta`, `Orientacion`, `Arcano`, `Palo` inmutables y las 78 cartas en orden canónico, en `baraja.ts`. Las once familias de lente, en `familias.ts`                                                                                                                                                                                          |
| A2.2 | Barajado               | ✅ Fisher-Yates en `mazo-de-cartas.ts`, con la fuente de azar inyectada. El entero uniforme se saca por **muestreo por rechazo**: `sorteo % 78` sesgaría siempre a favor de las mismas cartas. Probado por ji-cuadrado, y verificado que el estadístico caza el fallo clásico de Fisher-Yates (78,6 correcto frente a 238.200 roto, umbral 130) |
| A2.3 | Definiciones de tirada | ✅ **Seis tiradas** declarativas con su modo de lectura (base, matiz o valencia), familia por posición y sitio en la mesa. Nombres visibles en los tres catálogos, atados al motor en ambas direcciones por prueba. La Cruz Celta queda fuera: ver D2                                                                                           |
| A2.4 | Máquina de estados     | ✅ `avanzar()` es pura y **ninguna transición lanza**: devuelve `Resultado` con el motivo exacto del rechazo. Cubierta como matriz completa de ocho situaciones por ocho acciones. El muro de pago no es una fase sino un predicado, `estaEnElMuro()`                                                                                           |
| A2.5 | Bus de eventos         | ✅ La dirección única la imponen los tipos, no la disciplina: el motor recibe un `Emisor` que sólo emite y el renderizador una `Escucha` que sólo escucha. **La pregunta del usuario no viaja por el bus**, sólo si la hay. Un suscriptor que revienta no corta el ritual                                                                       |
| A2.6 | Repositorio de corpus  | ✅ Compone las tres capas según el modo de la tirada. **Toda pieza que falte es situación de dominio con su motivo propio**, nunca una excepción: el corpus estará incompleto durante meses y no puede tumbar una lectura ya pagada                                                                                                             |

**Criterio global de A2:** las pruebas corren en Node sin jsdom y tardan menos
de un segundo. Si necesitan DOM, la lógica está mal colocada.

### A3 · Renderizador plano — móvil primero

Se hace antes que el 3D a propósito: define el contrato que el 3D tendrá que
cumplir, y además es el camino de respaldo si los clips no llegan.

|      | Tarea                                         | Terminado cuando                                                                  |
| ---- | --------------------------------------------- | --------------------------------------------------------------------------------- |
| A3.0 | **Decidir la interacción táctil del abanico** | Ver decisiones abiertas. Bloquea A3.3                                             |
| A3.1 | Pantalla de pregunta                          | Contador, validación, estados de error, teclado móvil sin tapar el campo          |
| A3.2 | Barajado                                      | Coreografía completa, con sonido, saltable tras verla una vez                     |
| A3.3 | Selección                                     | 44px de objetivo real, navegable por teclado, con lectura para lector de pantalla |
| A3.4 | Revelado y significado                        | Volteo CSS 3D, decodificación del texto, carta invertida distinguible sin color   |
| A3.5 | Muro                                          | Los dos caminos: compra suelta sin cuenta y suscripción                           |

### A4 · Renderizador 3D — escritorio

|      | Tarea                  | Terminado cuando                                                                                           |
| ---- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| A4.1 | Escena base Three.js   | Se carga en diferido, solo en rutas de lectura, y no pesa en las de contenido                              |
| A4.2 | Abanico en perspectiva | Dorso instanciado en una sola llamada de dibujo; orden de profundidad explícito                            |
| A4.3 | Selección magnética    | La carta cercana al cursor se eleva y las vecinas se apartan. Índice deducido del ángulo, no por _raycast_ |
| A4.4 | Shader holográfico     | Barrido, aberración, fresnel. Se desactiva bajo umbral de rendimiento sin romper nada                      |
| A4.5 | Integración de clips   | Precarga al seleccionar; si no está listo, volteo CSS y fundido. **Nunca bloquea**                         |

### A5 · Síntesis y cobro

|      | Tarea                     | Terminado cuando                                                                      |
| ---- | ------------------------- | ------------------------------------------------------------------------------------- |
| A5.1 | Moderación de la pregunta | Antes del modelo y antes de cualquier log                                             |
| A5.2 | Detección de crisis       | Recursos destacados en el idioma del usuario. No se barajan cartas                    |
| A5.3 | Generación en streaming   | Separación estricta instrucción/dato. Idioma del usuario                              |
| A5.4 | Cobro                     | Reservar, generar, persistir, **luego** capturar. Un corte a mitad no cobra dos veces |
| A5.5 | Compra sin cuenta         | Recuperable por enlace; la cuenta se ofrece después                                   |

### A6 · Rutas de contenido y SEO

> **La portada ya no vive aquí.** Sube al segundo puesto del orden de ejecución,
> justo detrás del sistema de diseño: es la pieza con más riesgo visual, no
> depende del motor ni del corpus, y validarla pronto es cuando cambiarla sale
> barato. El diseño completo del héroe holográfico está en `docs/plan-tarot.md` §3.

|      | Tarea                                       | Terminado cuando                                              |
| ---- | ------------------------------------------- | ------------------------------------------------------------- |
| A6.1 | ~~Portada con Sibila~~ · movida al puesto 2 | Ver `docs/plan-tarot.md` §3                                   |
| A6.2 | Enciclopedia y fichas                       | 78 fichas renderizadas en servidor, con contenido completo    |
| A6.3 | Landings por tirada                         | Slug traducido por idioma                                     |
| A6.4 | `hreflang` y sitemaps                       | Recíprocos y por idioma. Verificado con herramienta, no a ojo |

### A7 · Segundo idioma

Portugués: corpus reescrito, cadenas, slugs, sitemap. No se traduce: se reescribe
contra la guía de voz.

---

## Vía B · Corpus — el camino crítico

|     | Tarea                 | Terminado cuando                                                                                                    |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| B0  | Guía de voz           | ✅ `docs/corpus/guia-de-voz.md`                                                                                     |
| B1  | Esquema y validador   | ✅ Reglas puras probadas, validación del corpus real dentro de `verificar`, e informe de avance en `npm run corpus` |
| B2  | 156 significados base | 78 cartas × 2 orientaciones, validador en verde, muestra revisada por ti                                            |
| B3  | Matices por familia   | Todas las familias de las tiradas activas                                                                           |
| B4  | Valencias sí/no       | Las 78, con su frase de motivo                                                                                      |
| B5  | Revisión de voz       | Lectura completa buscando deriva. El validador no detecta que un texto no tenga voz                                 |

**Sobre el ritmo de B2:** son 156 textos de 45–90 palabras. Producirlos en
tandas y revisar cada tanda antes de seguir es lo que impide descubrir en la
pieza 140 que la voz se torció en la 40.

---

## Vía C · Assets — bloqueada en ti

|     | Tarea                     | Terminado cuando                                                                                 |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| C1  | Confirmar especificación  | AV1 en MP4, 720×1260, 1,5–2,5 s, 400 KB máximo, sin canal alfa, último fotograma igual al reposo |
| C2  | **Piloto de tres cartas** | Tres clips reales integrados y medidos en red lenta antes de producir los 78                     |
| C3  | Los 78                    | Manifiesto completo y presupuesto de peso verificado en compilación                              |

C2 es importante: **produce tres antes que setenta y ocho.** Si la
especificación falla —peso, duración, empalme con el volteo— es mucho mejor
descubrirlo con tres clips hechos que con el catálogo entero.

---

## Decisiones abiertas

Ninguna bloquea hoy. Se anotan para resolverlas cuando toque y no antes.

|     | Decisión                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Bloquea a   | Cuándo hay que resolverla        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------- |
| D1  | **Interacción táctil del abanico.** La aritmética descarta «el mismo abanico más pequeño»: 78 cartas sobre 110° dan franjas de 6–19px frente a los 44px mínimos. Recomendación: rotación tipo rolodex con zona de foco                                                                                                                                                                                                                                                     | A3.3        | Antes de empezar A3              |
| D2  | **La Cruz Celta, ¿entra?** Auditada: tres de sus diez posiciones no tienen familia —lo que corona, la actitud propia y el pasado reciente, que hoy chocaría con la raíz y repetiría texto—. Con el mapa temático el precio sube: además de crear esas tres, habría que escribir `interior` y `entorno`, hoy declaradas y en espera. Son **cinco familias, 780 piezas por idioma**, un 38 % más de capa de matiz. Las otras seis tiradas ya están y no cuestan corpus nuevo | B3          | Cuando B2 esté cerca de terminar |
| D3  | **Proveedor de modelo**                                                                                                                                                                                                                                                                                                                                                                                                                                                    | A5.3        | Antes de A5                      |
| D4  | **Pasarela de pago** y si acepta pago sin cuenta con el flujo que queremos                                                                                                                                                                                                                                                                                                                                                                                                 | A5.4        | Antes de A5                      |
| D5  | **Voseo** para Argentina                                                                                                                                                                                                                                                                                                                                                                                                                                                   | A7, o nunca | Solo si entra ese mercado        |
| D6  | **Postura ante Raka**, que ya ocupa la tesis de tarot informado por carta natal. ¿La astrología sigue en la v2 o se adelanta algo?                                                                                                                                                                                                                                                                                                                                         | Nada hoy    | Tras lanzar el tarot             |

---

## Decisiones cerradas

Se anotan para no volver a discutirlas.

| Decisión                                                                     | Resultado                             | Motivo                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **¿Publicamos el corpus como dataset abierto y servidor MCP, como Tarotoo?** | **No**                                | Su dataset es un diccionario de referencia; el nuestro **es el producto**. El modelo de negocio vive de que los significados sean el gancho gratuito. Además la posición ya está disputada por deckaura. Ver `docs/plan-tarot.md` §2                                                                                                                                       |
| **¿Algún MCP entonces?**                                                     | Más adelante, y de otra forma         | Uno que exponga **lecturas, no significados**: capa gratuita más enlace para desbloquear la síntesis. Es captación, no donación. Fuera de la v1                                                                                                                                                                                                                            |
| **¿El tema claro entra en la v1?**                                           | **No. Los tokens se quedan dormidos** | El producto es un holograma en una cámara a oscuras y el tema claro es la idea contraria: obligaría a diseñar y verificar cada pantalla dos veces, con los ornamentos desactivados en la mitad clara. Los tokens ya están escritos y verificados, así que no se borran: la enciclopedia y una vista para imprimir son candidatos previsibles. Ver `guia-de-diseno.md` §4.3 |
| **¿Usamos el dataset MIT de Tarotoo?**                                       | Solo para contrastar                  | Elemento, planeta, zodiaco y valor sí/no son materia de tradición, no de autoría. Sirven de comprobación cruzada. Nuestra prosa es nuestra                                                                                                                                                                                                                                 |

---

## Cómo se trabaja una tarea

1. Se lee el criterio de terminado **antes** de empezar.
2. Se consultan las guías que apliquen: `guia-de-diseno.md` si toca pantalla,
   `guia-de-arquitectura.md` si toca estructura, `corpus/guia-de-voz.md` si toca
   texto.
3. Se implementa.
4. `npm run verificar`.
5. Se repasa la lista de la guía correspondiente.
6. Commit con un mensaje que diga **por qué**, no qué.

Una tarea que no cumple su criterio no se marca como hecha, aunque «funcione».
