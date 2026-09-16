/**
 * Simulación de las motas de polvo suspendidas en el haz.
 *
 * Es lógica pura, sin canvas ni DOM, para poder probarla. El componente que la
 * pinta vive aparte.
 *
 * Las motas no caen ni suben en línea recta: **divergen**. Una mota que asciende
 * dentro de un haz que se abre se separa del eje conforme sube, y reproducir esa
 * divergencia es lo que convierte unos puntos animados en polvo dentro de una
 * luz. Sin ella se ven partículas; con ella, volumen.
 */

/** Una mota, en coordenadas normalizadas independientes del tamaño del lienzo. */
export type Mota = {
  /** Posición transversal dentro del haz, de -1 a 1. Se conserva al ascender. */
  desvio: number;
  /** Altura, de 0 en el emisor a 1 en lo alto del haz. */
  altura: number;
  /** Cuánto asciende por segundo, en fracción de altura. */
  velocidad: number;
  /** Radio en píxeles a densidad 1. */
  radio: number;
  /** Brillo máximo que alcanza a media altura. */
  brillo: number;
  /** Desfase del bamboleo, para que no oscilen todas a la vez. */
  fase: number;
};

/** Semianchura del haz en la base, en fracción del lienzo. */
const SEMIANCHURA_EN_BASE = 0.06;

/** Semianchura del haz en lo alto, en fracción del lienzo. */
const SEMIANCHURA_EN_ALTO = 0.46;

/** Amplitud del bamboleo transversal, en fracción del lienzo. */
const AMPLITUD_DE_BAMBOLEO = 0.012;

/**
 * Semianchura del haz a una altura dada.
 *
 * Es la misma geometría que el cono volumétrico: estrecho en el emisor y
 * abierto arriba. Que ambos ornamentos compartan envolvente es lo que hace que
 * las motas parezcan estar *dentro* del haz y no delante de él.
 *
 * @param altura Altura normalizada, de 0 a 1.
 * @returns Semianchura en fracción del lienzo.
 */
export function semianchuraDelHaz(altura: number): number {
  return SEMIANCHURA_EN_BASE + (SEMIANCHURA_EN_ALTO - SEMIANCHURA_EN_BASE) * altura;
}

/**
 * Opacidad de una mota según su altura.
 *
 * Aparece al salir del emisor y se disuelve antes de llegar arriba, para que
 * ninguna desaparezca de golpe al salir del lienzo.
 *
 * @param mota Mota a evaluar.
 * @returns Opacidad entre 0 y el brillo máximo de la mota.
 */
export function opacidadDeMota(mota: Mota): number {
  const entrada = Math.min(1, mota.altura / 0.12);
  const salida = Math.min(1, (1 - mota.altura) / 0.35);

  return mota.brillo * entrada * salida;
}

/**
 * Posición horizontal de una mota, en fracción del lienzo.
 *
 * @param mota Mota a situar.
 * @param segundos Tiempo transcurrido, para el bamboleo.
 * @returns Posición de 0 a 1, donde 0,5 es el eje del haz.
 */
export function posicionHorizontal(mota: Mota, segundos: number): number {
  const bamboleo = Math.sin(segundos * 0.6 + mota.fase) * AMPLITUD_DE_BAMBOLEO;

  return 0.5 + mota.desvio * semianchuraDelHaz(mota.altura) + bamboleo;
}

/**
 * Crea una mota con valores aleatorios dentro de rangos razonables.
 *
 * @param azar Función que devuelve un número de 0 a 1. Se inyecta para poder
 *   fijarla en las pruebas.
 * @param alturaInicial Altura de partida. Al sembrar el lienzo se reparten por
 *   toda la altura; al reciclar una mota, vuelve a empezar en 0.
 * @returns La mota recién creada.
 */
export function crearMota(azar: () => number, alturaInicial: number): Mota {
  return {
    desvio: azar() * 2 - 1,
    altura: alturaInicial,
    velocidad: 0.02 + azar() * 0.05,
    radio: 0.6 + azar() * 1.4,
    brillo: 0.25 + azar() * 0.5,
    fase: azar() * Math.PI * 2,
  };
}

/**
 * Siembra el haz con motas repartidas por toda su altura.
 *
 * Se reparten en vez de salir todas del emisor porque, si no, el primer par de
 * segundos se ve el haz vacío y luego una oleada, que delata el truco.
 *
 * @param cantidad Cuántas motas.
 * @param azar Función de azar, inyectable.
 * @returns Las motas sembradas.
 */
export function sembrarMotas(cantidad: number, azar: () => number): Mota[] {
  const motas: Mota[] = [];

  for (let indice = 0; indice < cantidad; indice += 1) {
    motas.push(crearMota(azar, azar()));
  }

  return motas;
}

/**
 * Avanza la simulación.
 *
 * Muta las motas en el sitio a propósito: se llama en cada fotograma y crear
 * objetos nuevos sesenta veces por segundo daría trabajo al recolector de basura
 * sin ninguna ventaja. La inmutabilidad es regla para lo que cruza una frontera,
 * y esto no la cruza.
 *
 * @param motas Motas a avanzar.
 * @param segundosTranscurridos Tiempo desde el fotograma anterior.
 * @param azar Función de azar, inyectable.
 */
export function avanzarMotas(
  motas: Mota[],
  segundosTranscurridos: number,
  azar: () => number,
): void {
  for (let indice = 0; indice < motas.length; indice += 1) {
    const mota = motas[indice];

    if (mota !== undefined) {
      mota.altura += mota.velocidad * segundosTranscurridos;

      if (mota.altura >= 1) {
        motas[indice] = crearMota(azar, 0);
      }
    }
  }
}
