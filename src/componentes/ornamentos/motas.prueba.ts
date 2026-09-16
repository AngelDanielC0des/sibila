import { describe, expect, it } from "vitest";
import {
  avanzarMotas,
  crearMota,
  opacidadDeMota,
  posicionHorizontal,
  semianchuraDelHaz,
  sembrarMotas,
  type Mota,
} from "./motas";

/**
 * El azar se inyecta para poder fijarlo. Una simulación que solo se puede
 * observar a ojo no se puede probar, y esta tiene comportamiento que importa:
 * que las motas no se salgan del haz y que se reciclen en vez de acumularse.
 */
function azarFijo(valores: readonly number[]): () => number {
  let indice = 0;

  return () => {
    const valor = valores[indice % valores.length] ?? 0.5;
    indice += 1;
    return valor;
  };
}

describe("envolvente del haz", () => {
  it("es estrecha en el emisor y se abre arriba", () => {
    expect(semianchuraDelHaz(1)).toBeGreaterThan(semianchuraDelHaz(0));
  });

  it("crece de forma continua con la altura", () => {
    let anterior = semianchuraDelHaz(0);

    for (let paso = 1; paso <= 10; paso += 1) {
      const actual = semianchuraDelHaz(paso / 10);
      expect(actual).toBeGreaterThan(anterior);
      anterior = actual;
    }
  });
});

describe("posición de las motas", () => {
  /*
   * Es la propiedad que da el efecto: una mota conserva su desvío y, como la
   * envolvente se abre al subir, se separa del eje conforme asciende. Si no
   * divergieran, se verían partículas en vez de polvo dentro de una luz.
   */
  it("una mota se separa del eje conforme asciende", () => {
    const abajo: Mota = {
      desvio: 1,
      altura: 0.1,
      velocidad: 0.03,
      radio: 1,
      brillo: 0.5,
      fase: 0,
    };
    const arriba: Mota = { ...abajo, altura: 0.9 };

    const distanciaAbajo = Math.abs(posicionHorizontal(abajo, 0) - 0.5);
    const distanciaArriba = Math.abs(posicionHorizontal(arriba, 0) - 0.5);

    expect(distanciaArriba).toBeGreaterThan(distanciaAbajo);
  });

  it("ninguna mota se sale del lienzo", () => {
    const motas = sembrarMotas(200, Math.random);

    for (const mota of motas) {
      for (const segundos of [0, 1.7, 4.2, 9.9]) {
        const posicion = posicionHorizontal(mota, segundos);
        expect(posicion).toBeGreaterThanOrEqual(0);
        expect(posicion).toBeLessThanOrEqual(1);
      }
    }
  });

  it("el bamboleo no las sincroniza: cada una lleva su desfase", () => {
    const motas = sembrarMotas(20, Math.random);
    const fases = new Set(motas.map((mota) => mota.fase));

    expect(fases.size).toBeGreaterThan(15);
  });
});

describe("opacidad", () => {
  it("es nula en el emisor y en lo más alto", () => {
    const base = crearMota(azarFijo([0.5]), 0);
    const tope = crearMota(azarFijo([0.5]), 1);

    expect(opacidadDeMota(base)).toBe(0);
    expect(opacidadDeMota(tope)).toBe(0);
  });

  it("alcanza su máximo a media altura", () => {
    const media = crearMota(azarFijo([0.5]), 0.5);

    expect(opacidadDeMota(media)).toBeCloseTo(media.brillo, 5);
  });

  it("nunca supera el brillo de la mota", () => {
    for (const mota of sembrarMotas(100, Math.random)) {
      expect(opacidadDeMota(mota)).toBeLessThanOrEqual(mota.brillo);
    }
  });
});

describe("siembra y reciclado", () => {
  /*
   * Si todas salieran del emisor a la vez, los primeros segundos se vería el
   * haz vacío y después una oleada, que delata el truco.
   */
  it("la siembra reparte las motas por toda la altura", () => {
    const motas = sembrarMotas(100, Math.random);
    const alturas = motas.map((mota) => mota.altura);

    expect(Math.min(...alturas)).toBeLessThan(0.2);
    expect(Math.max(...alturas)).toBeGreaterThan(0.8);
  });

  it("una mota que llega arriba vuelve al emisor, no se acumula", () => {
    const motas = sembrarMotas(10, Math.random);
    const cuantasAlEmpezar = motas.length;

    avanzarMotas(motas, 100, Math.random);

    expect(motas).toHaveLength(cuantasAlEmpezar);

    for (const mota of motas) {
      expect(mota.altura).toBeGreaterThanOrEqual(0);
      expect(mota.altura).toBeLessThan(1);
    }
  });

  it("avanzar sin tiempo transcurrido no mueve nada", () => {
    const motas = sembrarMotas(5, Math.random);
    const antes = motas.map((mota) => mota.altura);

    avanzarMotas(motas, 0, Math.random);

    expect(motas.map((mota) => mota.altura)).toEqual(antes);
  });
});
