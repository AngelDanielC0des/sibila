# Lienzo de diseño

Las diez pantallas de la v1 maquetadas con los tokens reales de
`src/estilos/tokens.css`. Sirven para aprobar composición, jerarquía y densidad
tipográfica **antes** de escribir componentes, que es cuando cambiar sale barato.

## Qué hay aquí

| Fichero                  | Pantalla                               | Tamaño     |
| ------------------------ | -------------------------------------- | ---------- |
| `Main.dc.html`           | 1 · Portada                            | 1440 × 900 |
| `Catalogo.dc.html`       | 2 · Catálogo de tiradas                | 1440 × 900 |
| `Pregunta.dc.html`       | 3 · La pregunta                        | 1440 × 900 |
| `Barajado.dc.html`       | 4 · Barajado                           | 1440 × 900 |
| `Seleccion.dc.html`      | 5 · Selección · abanico                | 1440 × 900 |
| `Revelado.dc.html`       | 6 · Revelado y significado             | 1440 × 900 |
| `Muro.dc.html`           | 7 · El muro · corte de pago            | 1440 × 900 |
| `Sintesis.dc.html`       | 8 · Síntesis                           | 1440 × 900 |
| `PortadaMovil.dc.html`   | 1m · Portada en móvil                  | 390 × 844  |
| `SeleccionMovil.dc.html` | 5m · Selección en móvil                | 390 × 844  |
| `canvas.json`            | Posiciones, títulos y notas del lienzo | —          |

Sólo hay dos pantallas de móvil porque son las dos únicas que **no se encogen,
se cambian**: el arreglo lateral de frases de la portada no cabe en 390 px, y el
abanico de 78 cartas daría franjas táctiles de 6 a 19 px. El resto sí es la
misma composición reflujada.

## Cómo se reconstruye

El `.html` publicable no se versiona: pesa 2,5 MB y es casi todo el editor
empaquetado. Se regenera desde los `.dc.html` con la skill `design`:

```bash
node "<base de la skill design>/seed-canvas.mjs" \
  --template "<base de la skill design>/payload.template.html" \
  --out pantallas-de-sibila.html \
  --title "Pantallas de Sibila" \
  --artboard Main.dc.html --artboard Catalogo.dc.html \
  --artboard Pregunta.dc.html --artboard Barajado.dc.html \
  --artboard Seleccion.dc.html --artboard Revelado.dc.html \
  --artboard Muro.dc.html --artboard Sintesis.dc.html \
  --artboard PortadaMovil.dc.html --artboard SeleccionMovil.dc.html \
  --canvas canvas.json
```

## Qué es y qué no es

Es una **maqueta estática**, no un prototipo navegable: no hay estados, ni
interacción, ni animación. Todo lo que se mueve —la decodificación por glifos,
el volteo de carta, el cono volumétrico— vive ya implementado en
`src/componentes/ornamentos/` y se revisa en `/es/sistema/ornamentos`.

Los valores son literales a propósito: aquí no hay tokens porque el lienzo corre
fuera de la aplicación. **Si un token cambia, estas maquetas quedan
desactualizadas y hay que regenerarlas.** La fuente de verdad es siempre
`src/estilos/tokens.css`.
