import { describe, expect, it } from "vitest";
import {
  GLIFOS_DE_ASPECTO,
  GLIFOS_PLANETARIOS,
  GLIFOS_ZODIACALES,
  RESERVA_DE_DECODIFICACION,
  glifoAlAzar,
} from "./glifos";

const TODOS = [...GLIFOS_ZODIACALES, ...GLIFOS_PLANETARIOS, ...GLIFOS_DE_ASPECTO];
const VARIACION_DE_TEXTO = "︎";

describe("repertorio", () => {
  it("tiene los doce signos", () => {
    expect(GLIFOS_ZODIACALES).toHaveLength(12);
  });

  it("tiene los diez planetas", () => {
    expect(GLIFOS_PLANETARIOS).toHaveLength(10);
  });

  it("ningún nombre está vacío", () => {
    const vacios = TODOS.filter((glifo) => glifo.nombre.trim() === "");

    expect(vacios).toEqual([]);
  });

  it("no repite símbolos entre grupos", () => {
    const distintos = new Set(TODOS.map((glifo) => glifo.simbolo));

    expect(distintos.size).toBe(TODOS.length);
  });

  it("no repite nombres", () => {
    const distintos = new Set(TODOS.map((glifo) => glifo.nombre));

    expect(distintos.size).toBe(TODOS.length);
  });
});

describe("presentación tipográfica", () => {
  /*
   * Sin el selector de variación, varios sistemas pintan Venus, Marte y los
   * signos como emoji a color. Un símbolo que llega ya coloreado no puede
   * heredar el oro, y se salta de golpe la disciplina de paleta.
   */
  it("todos llevan el selector de variación de texto", () => {
    const sinSelector = TODOS.filter(
      (glifo) => !glifo.simbolo.endsWith(VARIACION_DE_TEXTO),
    ).map((glifo) => glifo.nombre);

    expect(sinSelector).toEqual([]);
  });

  it("cada símbolo es un carácter más el selector", () => {
    for (const glifo of TODOS) {
      const puntos = [...glifo.simbolo];

      expect(puntos, glifo.nombre).toHaveLength(2);
      expect(puntos[1]).toBe(VARIACION_DE_TEXTO);
    }
  });
});

describe("reserva de decodificación", () => {
  it("reúne todos los glifos del repertorio", () => {
    expect(RESERVA_DE_DECODIFICACION).toHaveLength(TODOS.length);
  });

  it("devuelve siempre un símbolo de la reserva", () => {
    for (const valor of [0, 0.25, 0.5, 0.75, 0.999]) {
      expect(RESERVA_DE_DECODIFICACION).toContain(glifoAlAzar(() => valor));
    }
  });

  /*
   * `Math.random` nunca devuelve 1, pero una función inyectada sí podría, y un
   * índice fuera de rango dejaría un hueco en mitad del texto en vez de un
   * glifo. Más vale que devuelva algo válido.
   */
  it("aguanta un azar que devuelva exactamente uno", () => {
    expect(RESERVA_DE_DECODIFICACION).toContain(glifoAlAzar(() => 1));
  });

  it("reparte por todo el repertorio y no se atasca en unos pocos", () => {
    const vistos = new Set<string>();

    for (let intento = 0; intento < 600; intento += 1) {
      vistos.add(glifoAlAzar(Math.random));
    }

    expect(vistos.size).toBe(RESERVA_DE_DECODIFICACION.length);
  });
});
