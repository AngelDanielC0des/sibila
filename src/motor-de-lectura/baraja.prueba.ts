import { describe, expect, it } from "vitest";
import {
  BARAJA,
  NUMERO_DE_ARCANOS_MAYORES,
  NUMERO_DE_CARTAS,
  NUMERO_DE_CARTAS_POR_PALO,
  PALOS,
  buscarCartaPorId,
  existeCarta,
} from "./baraja";

describe("baraja canónica", () => {
  it("tiene setenta y ocho cartas", () => {
    expect(BARAJA).toHaveLength(NUMERO_DE_CARTAS);
  });

  it("se reparte en veintidós mayores y cincuenta y seis menores", () => {
    const mayores = BARAJA.filter((carta) => carta.arcano === "mayor");
    const menores = BARAJA.filter((carta) => carta.arcano === "menor");

    expect(mayores).toHaveLength(NUMERO_DE_ARCANOS_MAYORES);
    expect(menores).toHaveLength(NUMERO_DE_CARTAS - NUMERO_DE_ARCANOS_MAYORES);
  });

  it("da catorce cartas a cada palo", () => {
    for (const palo of PALOS) {
      const delPalo = BARAJA.filter((carta) => carta.palo === palo);
      expect(delPalo, `palo ${palo}`).toHaveLength(NUMERO_DE_CARTAS_POR_PALO);
    }
  });

  it("no asigna palo a ningún arcano mayor", () => {
    const mayoresConPalo = BARAJA.filter(
      (carta) => carta.arcano === "mayor" && carta.palo !== null,
    );

    expect(mayoresConPalo).toEqual([]);
  });

  it("asigna palo a todos los arcanos menores", () => {
    const menoresSinPalo = BARAJA.filter(
      (carta) => carta.arcano === "menor" && carta.palo === null,
    );

    expect(menoresSinPalo).toEqual([]);
  });
});

describe("identificadores", () => {
  /*
   * Los identificadores viajan en la URL de la enciclopedia y son la clave con
   * la que el corpus indexa sus textos. Un duplicado haría que dos cartas
   * compartieran significado sin que nadie se enterase.
   */
  it("son únicos", () => {
    const vistos = new Set(BARAJA.map((carta) => carta.id));

    expect(vistos.size).toBe(BARAJA.length);
  });

  it("son slugs válidos, sin acentos ni mayúsculas", () => {
    const patronDeSlug = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    const invalidos = BARAJA.filter((carta) => !patronDeSlug.test(carta.id)).map(
      (carta) => carta.id,
    );

    expect(invalidos).toEqual([]);
  });

  it("localizan su carta, y solo la suya", () => {
    for (const carta of BARAJA) {
      expect(buscarCartaPorId(carta.id)).toBe(carta);
      expect(existeCarta(carta.id)).toBe(true);
    }
  });

  it("no encuentran nada para un identificador inventado", () => {
    expect(buscarCartaPorId("la-carta-que-no-existe")).toBeUndefined();
    expect(existeCarta("la-carta-que-no-existe")).toBe(false);
  });
});

describe("numeración", () => {
  it("numera los mayores del cero al veintiuno, sin huecos ni repeticiones", () => {
    const numeros = BARAJA.filter((carta) => carta.arcano === "mayor")
      .map((carta) => carta.numero)
      .sort((uno, otro) => uno - otro);

    const esperados = Array.from({ length: NUMERO_DE_ARCANOS_MAYORES }, (_, i) => i);
    expect(numeros).toEqual(esperados);
  });

  it("numera cada palo del uno al catorce, sin huecos ni repeticiones", () => {
    const esperados = Array.from({ length: NUMERO_DE_CARTAS_POR_PALO }, (_, i) => i + 1);

    for (const palo of PALOS) {
      const numeros = BARAJA.filter((carta) => carta.palo === palo)
        .map((carta) => carta.numero)
        .sort((uno, otro) => uno - otro);

      expect(numeros, `palo ${palo}`).toEqual(esperados);
    }
  });

  /*
   * Rider–Waite–Smith intercambia Fuerza y Justicia respecto a la tradición de
   * Marsella. Nuestros textos siguen Rider–Waite, así que invertirlas dejaría el
   * corpus entero desalineado con la numeración. Es el error clásico del
   * dominio y merece un guardia explícito.
   */
  it("coloca la Fuerza en el ocho y la Justicia en el once, como Rider–Waite", () => {
    expect(buscarCartaPorId("la-fuerza")?.numero).toBe(8);
    expect(buscarCartaPorId("la-justicia")?.numero).toBe(11);
  });
});

describe("nombres", () => {
  it("ninguno está vacío", () => {
    const vacios = BARAJA.filter((carta) => carta.nombre.trim() === "").map(
      (carta) => carta.id,
    );

    expect(vacios).toEqual([]);
  });

  it("nombran las figuras a la española", () => {
    expect(buscarCartaPorId("sota-de-copas")?.nombre).toBe("Sota de Copas");
    expect(buscarCartaPorId("caballo-de-espadas")?.nombre).toBe("Caballo de Espadas");
    expect(buscarCartaPorId("reina-de-oros")?.nombre).toBe("Reina de Oros");
    expect(buscarCartaPorId("rey-de-bastos")?.nombre).toBe("Rey de Bastos");
  });
});
