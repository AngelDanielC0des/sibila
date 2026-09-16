/**
 * El mazo: la baraja en estado de juego.
 *
 * `baraja.ts` guarda las 78 cartas en orden canónico y no cambia nunca. Este
 * módulo produce lo otro: una permutación de esas cartas, cada una con la
 * orientación que le tocó, lista para que el usuario elija de ella.
 *
 * **La orientación se sortea al barajar, no al revelar.** Es como funciona una
 * baraja física —las cartas ya están giradas dentro del mazo mucho antes de que
 * nadie las toque— y además evita la sospecha razonable de que el resultado se
 * decida en el momento de mirarlo.
 *
 * Aquí no hay nada de «repartir» en el sentido del glosario. Desplegar el mazo
 * en abanico es un acto de presentación y vive en los renderizadores; el orden
 * del abanico es, sin más, el orden de este mazo.
 */

import { BARAJA, type Carta, type Orientacion } from "./baraja";
import { exito, fallo, type Resultado } from "./resultado";

/**
 * Una de cada cuántas cartas sale invertida.
 *
 * Dos: mitad y mitad, como en una baraja física, donde la inversión depende de
 * cómo se giró el mazo y no de una regla. Subirlo haría las lecturas más
 * amables y menos honestas.
 */
const UNA_INVERTIDA_DE_CADA = 2;

/** Cuántos valores distintos caben en un entero sin signo de 32 bits. */
const VALORES_DE_32_BITS = 0x1_0000_0000;

/** Una carta dentro del mazo, con la orientación que le tocó al barajar. */
export type CartaDelMazo = {
  readonly carta: Carta;
  readonly orientacion: Orientacion;
};

/** La baraja ya barajada y orientada. El orden es el del abanico. */
export type Mazo = readonly CartaDelMazo[];

/** Lo que puede salir mal al pedirle una carta al mazo. */
export type ErrorDeMazo = "indice-fuera-de-rango";

/**
 * Fuente de enteros aleatorios uniformes.
 *
 * Se inyecta en lugar de llamar a `crypto` directamente por la misma razón que
 * en `decodificacion.ts`: sin poder fijar el azar, una prueba de barajado no es
 * reproducible y no puede afirmar nada.
 *
 * @param limite Cota superior **exclusiva**. Siempre 1 o más.
 * @returns Un entero de 0 a `limite - 1`, todos igual de probables.
 */
export type FuenteDeAzar = (limite: number) => number;

/**
 * Saca un entero uniforme del generador criptográfico del sistema.
 *
 * **Por qué no basta con `sorteo % limite`.** Los 2³² valores de un `Uint32` no
 * se reparten en partes iguales entre `limite` casillas salvo que `limite` sea
 * potencia de dos: las primeras casillas reciben un valor de más. Con 78 cartas
 * el sesgo es minúsculo, pero es real, sistemático y siempre a favor de las
 * mismas cartas, que en un producto de tarot es exactamente lo que no puede
 * pasar.
 *
 * Se corrige descartando la cola sobrante y volviendo a sortear. El `do/while`
 * es el bucle correcto aquí y no una preferencia: hace falta sortear al menos
 * una vez antes de poder saber si el valor sirve.
 *
 * @param limite Cota superior exclusiva.
 * @returns Un entero de 0 a `limite - 1`.
 */
export function enteroCriptografico(limite: number): number {
  if (limite < 1) {
    throw new RangeError(`Un sorteo necesita al menos una casilla, no ${limite}.`);
  } else {
    const techo = Math.floor(VALORES_DE_32_BITS / limite) * limite;
    const buzon = new Uint32Array(1);
    let sorteo = 0;

    do {
      crypto.getRandomValues(buzon);
      sorteo = buzon[0] ?? 0;
    } while (sorteo >= techo);

    return sorteo % limite;
  }
}

/**
 * Intercambia dos cartas de sitio.
 *
 * Que un índice no exista sería un fallo de programación, no una situación de
 * dominio, así que revienta en vez de devolver un resultado.
 *
 * @param cartas Cartas a modificar, en el sitio.
 * @param uno Índice de la primera.
 * @param otro Índice de la segunda.
 */
function intercambiar(cartas: Carta[], uno: number, otro: number): void {
  const primera = cartas[uno];
  const segunda = cartas[otro];

  if (primera === undefined || segunda === undefined) {
    throw new RangeError(`Intercambio imposible entre ${uno} y ${otro}.`);
  } else {
    cartas[uno] = segunda;
    cartas[otro] = primera;
  }
}

/**
 * Sortea la orientación de una carta.
 *
 * @param azar Fuente de azar.
 * @returns `invertida` o `derecha`.
 */
function sortearOrientacion(azar: FuenteDeAzar): Orientacion {
  if (azar(UNA_INVERTIDA_DE_CADA) === 0) {
    return "invertida";
  } else {
    return "derecha";
  }
}

/**
 * Baraja las 78 cartas y les asigna orientación.
 *
 * Fisher-Yates recorriendo de atrás hacia delante: en cada vuelta se sortea qué
 * carta ocupa la última posición aún sin fijar, entre las que siguen libres. Es
 * el único barajado que hace equiprobables las 78! ordenaciones posibles; la
 * variante de sortear entre *todas* las posiciones en cada vuelta, que parece
 * equivalente, no lo es.
 *
 * @param azar Fuente de azar. Por defecto, la del sistema.
 * @returns Un mazo nuevo. La baraja canónica no se toca.
 */
export function barajarMazo(azar: FuenteDeAzar = enteroCriptografico): Mazo {
  const cartas = [...BARAJA];

  for (let posicion = cartas.length - 1; posicion > 0; posicion -= 1) {
    intercambiar(cartas, posicion, azar(posicion + 1));
  }

  return cartas.map((carta) => ({
    carta,
    orientacion: sortearOrientacion(azar),
  }));
}

/**
 * Pide una carta al mazo por su sitio en el abanico.
 *
 * El índice llega de fuera del motor —de un clic, o de una sesión que se
 * restaura— así que un índice imposible es una situación de dominio y se
 * devuelve como resultado, no como excepción.
 *
 * @param mazo El mazo barajado.
 * @param indice Posición en el abanico, empezando en cero.
 * @returns La carta con su orientación, o la razón por la que no se pudo.
 */
export function obtenerCartaDelMazo(
  mazo: Mazo,
  indice: number,
): Resultado<CartaDelMazo, ErrorDeMazo> {
  const encontrada = mazo[indice];

  if (encontrada === undefined) {
    return fallo("indice-fuera-de-rango");
  } else {
    return exito(encontrada);
  }
}
