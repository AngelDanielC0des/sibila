import { describe, expect, it } from "vitest";
import { BARAJA, NUMERO_DE_CARTAS } from "./baraja";
import {
  barajarMazo,
  enteroCriptografico,
  obtenerCartaDelMazo,
  type FuenteDeAzar,
} from "./mazo-de-cartas";

/**
 * Un barajado no se prueba afirmando que sale un orden concreto: eso probaría
 * el generador, no el algoritmo. Se prueba comprobando que **la distribución**
 * es la que debe ser, y que las invariantes que no dependen del azar se
 * cumplen siempre.
 *
 * Las dos mitades del problema se prueban por separado a propósito:
 *
 * 1. Que Fisher-Yates reparte bien **dado un azar uniforme** se comprueba con
 *    un generador sembrado, rápido y reproducible. Miles de barajadas con el
 *    generador del sistema tardarían segundos y no probarían nada más.
 * 2. Que `enteroCriptografico` **es** uniforme se comprueba aparte, sorteando
 *    directamente y sin barajar nada.
 */

/** Umbral de ji-cuadrado con 77 grados de libertad, aproximadamente p = 0,0002. */
const UMBRAL_JI_CUADRADO = 130;

/** Cuántas veces hay que ver cada casilla para que la prueba tenga fuerza. */
const OBSERVACIONES_POR_CASILLA = 300;

/**
 * Generador sembrado de calidad decente (mulberry32).
 *
 * @param semilla Semilla inicial.
 * @returns Una fuente de azar reproducible.
 */
function fuenteSembrada(semilla: number): FuenteDeAzar {
  let estado = semilla >>> 0;

  return (limite: number) => {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let mezcla = Math.imul(estado ^ (estado >>> 15), estado | 1);
    mezcla ^= mezcla + Math.imul(mezcla ^ (mezcla >>> 7), mezcla | 61);
    const fraccion = ((mezcla ^ (mezcla >>> 14)) >>> 0) / 0x1_0000_0000;

    return Math.floor(fraccion * limite);
  };
}

/**
 * Mide cuánto se desvía un recuento de la distribución uniforme.
 *
 * @param observados Veces que salió cada casilla.
 * @param esperado Veces que debería salir cada una.
 * @returns El estadístico de ji-cuadrado.
 */
function jiCuadrado(observados: readonly number[], esperado: number): number {
  let suma = 0;

  for (const observado of observados) {
    const desvio = observado - esperado;
    suma += (desvio * desvio) / esperado;
  }

  return suma;
}

describe("invariantes del barajado", () => {
  it("el mazo tiene las 78 cartas", () => {
    expect(barajarMazo()).toHaveLength(NUMERO_DE_CARTAS);
  });

  /*
   * La prueba que de verdad importa: un barajado con un índice mal calculado
   * puede duplicar una carta y perder otra sin que nada más lo delate.
   */
  it("el mazo es una permutación: ni pierde ni duplica cartas", () => {
    for (let intento = 0; intento < 50; intento += 1) {
      const identidades = barajarMazo().map(({ carta }) => carta.id);

      expect(new Set(identidades).size).toBe(NUMERO_DE_CARTAS);
    }
  });

  it("no toca la baraja canónica", () => {
    const antes = BARAJA.map((carta) => carta.id).join();
    barajarMazo();

    expect(BARAJA.map((carta) => carta.id).join()).toBe(antes);
  });

  it("con la misma semilla sale el mismo mazo", () => {
    const describir = (semilla: number) =>
      barajarMazo(fuenteSembrada(semilla))
        .map(({ carta, orientacion }) => `${carta.id}:${orientacion}`)
        .join();

    expect(describir(20260916)).toBe(describir(20260916));
    expect(describir(20260916)).not.toBe(describir(20260917));
  });
});

describe("distribución del barajado", () => {
  /*
   * Si Fisher-Yates estuviera mal escrito —el fallo clásico es sortear entre
   * todas las posiciones en cada vuelta en lugar de entre las que quedan— el
   * reparto seguiría pareciendo aleatorio a ojo, pero unas cartas caerían en
   * unas posiciones más que en otras. El ji-cuadrado sí lo ve.
   */
  it("cualquier carta puede acabar primera, y todas por igual", () => {
    const azar = fuenteSembrada(1312);
    const repeticiones = OBSERVACIONES_POR_CASILLA * NUMERO_DE_CARTAS;
    const vecesPrimera = new Map<string, number>();

    for (let vuelta = 0; vuelta < repeticiones; vuelta += 1) {
      const primera = barajarMazo(azar)[0];

      if (primera !== undefined) {
        const acumulado = vecesPrimera.get(primera.carta.id) ?? 0;
        vecesPrimera.set(primera.carta.id, acumulado + 1);
      }
    }

    expect(vecesPrimera.size).toBe(NUMERO_DE_CARTAS);
    expect(
      jiCuadrado([...vecesPrimera.values()], OBSERVACIONES_POR_CASILLA),
    ).toBeLessThan(UMBRAL_JI_CUADRADO);
  });

  it("una carta concreta recorre todas las posiciones por igual", () => {
    const azar = fuenteSembrada(77);
    const repeticiones = OBSERVACIONES_POR_CASILLA * NUMERO_DE_CARTAS;
    const vecesEnPosicion = new Array<number>(NUMERO_DE_CARTAS).fill(0);

    for (let vuelta = 0; vuelta < repeticiones; vuelta += 1) {
      const donde = barajarMazo(azar).findIndex(({ carta }) => carta.id === "la-torre");
      vecesEnPosicion[donde] = (vecesEnPosicion[donde] ?? 0) + 1;
    }

    expect(jiCuadrado(vecesEnPosicion, OBSERVACIONES_POR_CASILLA)).toBeLessThan(
      UMBRAL_JI_CUADRADO,
    );
  });

  it("las inversiones salen a mitad y mitad", () => {
    const azar = fuenteSembrada(4242);
    let invertidas = 0;
    let total = 0;

    for (let vuelta = 0; vuelta < 400; vuelta += 1) {
      for (const { orientacion } of barajarMazo(azar)) {
        total += 1;

        if (orientacion === "invertida") {
          invertidas += 1;
        }
      }
    }

    expect(invertidas / total).toBeGreaterThan(0.48);
    expect(invertidas / total).toBeLessThan(0.52);
  });
});

describe("la fuente criptográfica", () => {
  /*
   * 78 no divide a 2³², así que es justo el caso donde `sorteo % 78` sesgaría
   * a favor de las primeras cartas. Esta prueba es la que justifica el bucle de
   * rechazo, y la que se rompería si alguien lo «simplificara».
   */
  it("reparte uniformemente aunque el límite no divida a 2³²", () => {
    const recuentos = new Array<number>(NUMERO_DE_CARTAS).fill(0);
    const sorteos = OBSERVACIONES_POR_CASILLA * NUMERO_DE_CARTAS;

    for (let vuelta = 0; vuelta < sorteos; vuelta += 1) {
      const casilla = enteroCriptografico(NUMERO_DE_CARTAS);
      recuentos[casilla] = (recuentos[casilla] ?? 0) + 1;
    }

    expect(jiCuadrado(recuentos, OBSERVACIONES_POR_CASILLA)).toBeLessThan(
      UMBRAL_JI_CUADRADO,
    );
  });

  it("nunca se sale del rango pedido", () => {
    for (let vuelta = 0; vuelta < 2000; vuelta += 1) {
      const sorteo = enteroCriptografico(7);

      expect(sorteo).toBeGreaterThanOrEqual(0);
      expect(sorteo).toBeLessThan(7);
    }
  });

  it("con una sola casilla siempre devuelve cero", () => {
    expect(enteroCriptografico(1)).toBe(0);
  });

  /* Pedir cero casillas es un fallo de programación, no una situación de dominio. */
  it("un límite imposible revienta", () => {
    expect(() => enteroCriptografico(0)).toThrow(RangeError);
    expect(() => enteroCriptografico(-3)).toThrow(RangeError);
  });
});

describe("pedirle una carta al mazo", () => {
  it("devuelve la carta que está en esa posición", () => {
    const mazo = barajarMazo(fuenteSembrada(9));
    const resultado = obtenerCartaDelMazo(mazo, 12);

    expect(resultado.estaBien).toBe(true);

    if (resultado.estaBien) {
      expect(resultado.valor).toBe(mazo[12]);
    }
  });

  /*
   * El índice llega de un clic o de una sesión restaurada, así que es dominio y
   * no puede lanzar: la interfaz tiene que poder contarlo sin pantalla de error.
   */
  it("un índice imposible es un fallo de dominio, no una excepción", () => {
    const mazo = barajarMazo(fuenteSembrada(9));

    for (const indice of [-1, NUMERO_DE_CARTAS, 1000, 1.5]) {
      const resultado = obtenerCartaDelMazo(mazo, indice);

      expect(resultado.estaBien, `índice ${indice}`).toBe(false);

      if (!resultado.estaBien) {
        expect(resultado.error).toBe("indice-fuera-de-rango");
      }
    }
  });
});
