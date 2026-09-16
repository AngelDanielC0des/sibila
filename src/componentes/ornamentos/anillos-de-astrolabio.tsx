import estilos from "./anillos-de-astrolabio.module.css";

/**
 * Anillos de astrolabio girando tras el sujeto.
 *
 * Las divisiones no son arbitrarias: doce como los signos del zodiaco,
 * veintiocho como las mansiones lunares y cuatro como los puntos cardinales. Un
 * lector de cartas reconoce el instrumento, y ese reconocimiento es lo que
 * separa un ornamento de un adorno.
 *
 * **Cada anillo es su propio SVG a propósito.** La primera versión metía los
 * tres en un solo SVG y rotaba cada `<g>`: eso obliga a re-rasterizar el vector
 * en cada fotograma y costaba unos 19 fps con la CPU 4× estrangulada. Rotando el
 * elemento exterior, la transformación se compone en la GPU y el vector se
 * rasteriza una sola vez.
 *
 * Decorativo: se oculta a la tecnología asistiva.
 */

/** Centro del lienzo de coordenadas del SVG. */
const CENTRO = 100;

type Anillo = {
  readonly radio: number;
  readonly divisiones: number;
  readonly largoDeMarca: number;
  readonly clase: string | undefined;
};

const ANILLOS: readonly Anillo[] = [
  { radio: 92, divisiones: 12, largoDeMarca: 8, clase: estilos.zodiacal },
  { radio: 74, divisiones: 28, largoDeMarca: 4, clase: estilos.mansiones },
  { radio: 56, divisiones: 4, largoDeMarca: 12, clase: estilos.cardinal },
];

type Marca = {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
};

/**
 * Calcula las marcas de un anillo repartidas por su circunferencia.
 *
 * @param anillo Anillo a marcar.
 * @returns Las coordenadas de cada marca, del punto interior al exterior.
 */
function calcularMarcas(anillo: Anillo): Marca[] {
  const marcas: Marca[] = [];

  for (let indice = 0; indice < anillo.divisiones; indice += 1) {
    const angulo = (indice / anillo.divisiones) * Math.PI * 2;
    const coseno = Math.cos(angulo);
    const seno = Math.sin(angulo);
    const interior = anillo.radio - anillo.largoDeMarca;

    marcas.push({
      x1: CENTRO + coseno * interior,
      y1: CENTRO + seno * interior,
      x2: CENTRO + coseno * anillo.radio,
      y2: CENTRO + seno * anillo.radio,
    });
  }

  return marcas;
}

/** Anillos concéntricos de astrolabio. */
export function AnillosDeAstrolabio() {
  return (
    <div className={estilos.anillos} aria-hidden="true">
      {ANILLOS.map((anillo) => (
        <svg
          key={anillo.radio}
          className={`${estilos.anillo} ${anillo.clase}`}
          viewBox="0 0 200 200"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
        >
          <circle cx={CENTRO} cy={CENTRO} r={anillo.radio} />
          {calcularMarcas(anillo).map((marca) => (
            <line
              key={`${marca.x1}-${marca.y1}`}
              x1={marca.x1}
              y1={marca.y1}
              x2={marca.x2}
              y2={marca.y2}
            />
          ))}
        </svg>
      ))}
    </div>
  );
}
