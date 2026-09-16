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

### A0 · Cimientos — hecho, sin commitear

Next 16, TypeScript estricto, ESLint tipado, Stylelint, Prettier, Husky,
multiidioma con slug traducido, tokens de diseño, primera prueba.

- [x] Proyecto que compila y sirve en `es`, `pt`, `en` como HTML estático
- [x] `npm run verificar` en verde
- [x] Convenciones en `CLAUDE.md`
- [ ] **Commitear.** Todo esto vive en un árbol sucio sobre un único commit de
      andamiaje. Es la tarea más urgente del proyecto

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

|      | Tarea                  | Terminado cuando                                                                                                                                       |
| ---- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A2.1 | Tipos del dominio      | ✅ `Carta`, `Orientacion`, `Arcano`, `Palo` inmutables y las 78 cartas en orden canónico, en `baraja.ts`. Las once familias de lente, en `familias.ts` |
| A2.2 | Barajado               | Fisher-Yates con `crypto.getRandomValues`. **Prueba de distribución**, no de igualdad                                                                  |
| A2.3 | Definiciones de tirada | Las tiradas de la v1 declarativas: posiciones, familia de cada posición, disposición                                                                   |
| A2.4 | Máquina de estados     | Todas las transiciones cubiertas por prueba, incluidas las inválidas, que devuelven resultado y no lanzan                                              |
| A2.5 | Bus de eventos         | Dirección única motor → renderizador, con los eventos del glosario                                                                                     |
| A2.6 | Repositorio de corpus  | Interfaz más implementación sobre ficheros. El dominio no sabe de dónde sale el texto                                                                  |

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

|     | Decisión                                                                                                                                                                                                               | Bloquea a   | Cuándo hay que resolverla        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------- |
| D1  | **Interacción táctil del abanico.** La aritmética descarta «el mismo abanico más pequeño»: 78 cartas sobre 110° dan franjas de 6–19px frente a los 44px mínimos. Recomendación: rotación tipo rolodex con zona de foco | A3.3        | Antes de empezar A3              |
| D2  | **Cuántas tiradas al lanzamiento**, cuatro o siete                                                                                                                                                                     | B3          | Cuando B2 esté cerca de terminar |
| D3  | **Proveedor de modelo**                                                                                                                                                                                                | A5.3        | Antes de A5                      |
| D4  | **Pasarela de pago** y si acepta pago sin cuenta con el flujo que queremos                                                                                                                                             | A5.4        | Antes de A5                      |
| D5  | **Voseo** para Argentina                                                                                                                                                                                               | A7, o nunca | Solo si entra ese mercado        |
| D6  | **Postura ante Raka**, que ya ocupa la tesis de tarot informado por carta natal. ¿La astrología sigue en la v2 o se adelanta algo?                                                                                     | Nada hoy    | Tras lanzar el tarot             |

---

## Decisiones cerradas

Se anotan para no volver a discutirlas.

| Decisión                                                                     | Resultado                     | Motivo                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **¿Publicamos el corpus como dataset abierto y servidor MCP, como Tarotoo?** | **No**                        | Su dataset es un diccionario de referencia; el nuestro **es el producto**. El modelo de negocio vive de que los significados sean el gancho gratuito. Además la posición ya está disputada por deckaura. Ver `docs/plan-tarot.md` §2 |
| **¿Algún MCP entonces?**                                                     | Más adelante, y de otra forma | Uno que exponga **lecturas, no significados**: capa gratuita más enlace para desbloquear la síntesis. Es captación, no donación. Fuera de la v1                                                                                      |
| **¿Usamos el dataset MIT de Tarotoo?**                                       | Solo para contrastar          | Elemento, planeta, zodiaco y valor sí/no son materia de tradición, no de autoría. Sirven de comprobación cruzada. Nuestra prosa es nuestra                                                                                           |

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
