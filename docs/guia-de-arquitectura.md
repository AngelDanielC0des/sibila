# Guía de arquitectura

Patrones, límites entre módulos y reglas de código limpio. Las convenciones de
nombres están en `CLAUDE.md`; esto es la estructura.

---

## 1. La regla de dependencias

Es la regla más importante del proyecto. Todo lo demás se deriva de ella.

```
  src/app/            rutas, páginas, servidor
        │  puede importar de ↓
  src/renderizadores/ pintan · Three.js, GSAP, DOM
        │  puede importar de ↓
  src/motor-de-lectura/  el dominio
        │
        └── no importa de NADIE
```

**`motor-de-lectura` no importa nada del proyecto, ni React, ni Next, ni nada
que toque el DOM.** Es TypeScript puro. Si necesita saber la hora, se la pasan;
si necesita azar, se lo inyectan.

La prueba de que se está cumpliendo: las pruebas del motor corren en entorno
Node, sin jsdom, y son instantáneas. **Si una prueba del motor necesita un DOM,
la lógica está en la capa equivocada.**

La regla está forzada mecánicamente en `eslint.config.mjs`. No es un acuerdo de
caballeros.

---

## 2. Los patrones que usamos, y dónde

Cinco. Ni uno más sin motivo escrito.

### Máquina de estados — el flujo de la lectura

Los estados son pocos y cerrados: `reposo → barajando → seleccionando →
revelando → sintetizando → completada`. Se modelan explícitamente, con
transiciones exhaustivas.

No hay estados implícitos. Nada de tres booleanos que entre ellos describen ocho
combinaciones de las que solo cinco son válidas — que es exactamente de donde
salen los bugs de «la carta se voltea dos veces» o «el muro aparece antes de
tiempo».

### Bus de eventos — del motor a los renderizadores

Dirección única: el motor emite, los renderizadores escuchan. Un renderizador
**nunca** emite un evento que el motor escuche; si necesita algo del motor,
llama a un método suyo.

Eventos nombrados `dominio:accion` — `carta:revelada`, `lectura:completada`.

### Estrategia — los dos renderizadores

`RenderizadorTridimensional` y `RenderizadorPlano` implementan la misma interfaz
y son intercambiables. La aplicación elige uno al arrancar y no vuelve a
preguntarse cuál es.

Es lo que impide el desastre de esta clase de proyecto: `if (esMovil)` sembrado
por veinte ficheros.

### Repositorio — el acceso al corpus

El dominio pide «el significado de esta carta en esta familia de posición» y no
sabe si eso sale de un fichero, de un CDN o de una base de datos. Hoy son
ficheros estáticos. Cuando cambie, cambia una implementación y nada más.

### Objeto de valor — `Carta`, `Orientacion`, `Posicion`

Inmutables, comparados por valor, sin identidad propia. Una carta no «cambia» de
orientación: se produce otra carta con otra orientación.

---

## 3. Lo que deliberadamente NO usamos

| No usamos                                  | Por qué                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Librería de estado global                  | La máquina de estados **es** el estado. Añadir Redux o Zustand sería una segunda fuente de verdad                   |
| Framework de inyección de dependencias     | Con cinco dependencias, pasarlas por constructor es más claro que cualquier contenedor                              |
| Ficheros barril (`index.ts` que reexporta) | Crean ciclos, ocultan el origen real de cada símbolo y estropean el _tree-shaking_. Se importa del fichero concreto |
| ORM en la v1                               | El camino gratuito no toca base de datos                                                                            |
| Abstracciones «por si acaso»               | Se abstrae cuando hay dos casos reales, nunca cuando hay uno y se imagina el segundo                                |

---

## 4. Inmutabilidad

**Las transiciones del motor devuelven estado nuevo; no mutan el existente.**

El beneficio no es ideológico: hace que una prueba sea `expect(despues).toEqual(...)`
sin tener que razonar sobre qué se modificó por el camino, y permite guardar el
historial de una lectura sin copias defensivas.

Dentro de una función, mutar una variable local es perfectamente correcto. La
regla es sobre lo que cruza una frontera.

---

## 5. Errores: qué es excepción y qué es resultado

La distinción que más limpia deja la base de código:

| Situación                                                 | Tratamiento                                            | Ejemplo                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------- |
| **De dominio** — puede pasar y el producto sabe qué hacer | **Resultado tipado**, nunca excepción                  | Seleccionar una carta ya seleccionada. Revelar cuando aún faltan cartas |
| **Error de programación** — no debería poder pasar        | **Excepción**. Que reviente y se vea                   | Índice fuera de rango en la baraja interna                              |
| **Fallo de infraestructura** — externo y transitorio      | **Excepción**, capturada en la frontera, con reintento | El proveedor de modelo no responde                                      |

**El motor nunca lanza una excepción por una situación de dominio.** «Esa carta
ya está elegida» es una respuesta válida del sistema, no un accidente.

Corolario: en la interfaz, un error de dominio se muestra como un mensaje útil;
uno de infraestructura, como un reintento. No se confunden.

---

## 6. Pruebas: qué se prueba y dónde

| Capa               | Herramienta                             | Qué se cubre                                                               |
| ------------------ | --------------------------------------- | -------------------------------------------------------------------------- |
| `motor-de-lectura` | Vitest, entorno Node                    | **Todas** las transiciones de estado, las reglas de selección, el barajado |
| Corpus             | Validador propio, dentro de `verificar` | Longitudes, léxico, glosario, duplicados, cobertura                        |
| Renderizadores     | Playwright                              | El recorrido completo, en escritorio y en móvil                            |
| Visual             | Capturas a 320, 390 y 1440              | Que no se rompa la maquetación                                             |

**Lo que no se prueba:** métodos privados, detalles de implementación, y nada
que obligue a reescribir la prueba cada vez que se refactoriza sin cambiar el
comportamiento. Una prueba que se rompe con un refactor correcto es una prueba
mal escrita.

El barajado se prueba por **distribución**, no por igualdad: se baraja muchas
veces y se comprueba que cada carta aparece en cada posición con frecuencia
comparable. Es la única forma de cazar un Fisher-Yates mal implementado, que es
el error clásico y produce un sesgo invisible a simple vista.

---

## 7. Reglas específicas del dominio

**El azar es criptográfico.** `crypto.getRandomValues`, nunca `Math.random`. No
es paranoia: es la base del barajado verificable de la v1.1, y además
`Math.random` tiene sesgo detectable a volumen.

**El corpus es de solo lectura en ejecución.** Se carga y no se modifica. Nada
en tiempo de ejecución escribe en él.

**El camino gratuito no puede alcanzar el modelo, por construcción.** No es una
regla de disciplina: el módulo que sirve significados **no importa** el cliente
del modelo. Así el error no es posible, en lugar de estar prohibido.

---

## 8. Organización de ficheros

- **Un concepto por fichero**, y el nombre del fichero es el del concepto.
- **La prueba vive junto al código** que prueba: `mazo-de-cartas.ts` y
  `mazo-de-cartas.prueba.ts`, en la misma carpeta.
- **Sin ficheros barril.** Se importa del fichero concreto.
- Las carpetas se nombran por **dominio**, no por tipo técnico:
  `motor-de-lectura/`, no `servicios/` ni `utils/`.
- `utils/` es un vertedero. Si algo no tiene sitio, es que falta nombrar el
  concepto al que pertenece.

---

## 9. Cuándo el linter avisa

ESLint avisa a partir de 60 líneas por función, profundidad 3 o complejidad 10.

**Un aviso es una señal de extraer, nunca de subir el umbral.** Si alguna vez
hace falta subirlo, se sube en un commit propio, con el motivo en el mensaje, y
nunca a la vez que el código que lo provocó.

La salida típica es extraer un método con nombre descriptivo. Como el proyecto
usa `if`/`else` explícito y no retorno anticipado, la extracción es la
herramienta principal contra el anidamiento: no se aplana con `return`, se
nombra el bloque y se saca.

---

## 10. Antes de dar código por terminado

- [ ] `npm run verificar` en verde
- [ ] Nada nuevo importa hacia arriba en la jerarquía de capas
- [ ] Las situaciones de dominio devuelven resultado, no lanzan excepción
- [ ] Lo público lleva JSDoc en español que dice qué hace y por qué existe
- [ ] Las transiciones nuevas del motor tienen prueba
- [ ] Ningún aviso del linter silenciado sin comentario que lo justifique
- [ ] Sin `any`, sin `!important`, sin ficheros barril
