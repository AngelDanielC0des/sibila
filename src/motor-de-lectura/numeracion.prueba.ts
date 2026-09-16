import { describe, expect, it } from "vitest";
import { BARAJA } from "./baraja";
import { aNumeroRomano } from "./numeracion";

describe("numeración romana", () => {
  /*
   * El Loco es la carta sin número. La tradición lo escribe «0», que no es
   * numeración romana pero sí es lo correcto en una baraja.
   */
  it("deja El Loco en cero", () => {
    expect(aNumeroRomano(0)).toBe("0");
  });

  it("convierte los veintidós mayores", () => {
    const esperados = [
      "0",
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
      "XIII",
      "XIV",
      "XV",
      "XVI",
      "XVII",
      "XVIII",
      "XIX",
      "XX",
      "XXI",
    ];

    for (let numero = 0; numero <= 21; numero += 1) {
      expect(aNumeroRomano(numero), `arcano ${numero}`).toBe(esperados[numero]);
    }
  });

  it("usa la forma sustractiva y no la aditiva", () => {
    expect(aNumeroRomano(4)).toBe("IV");
    expect(aNumeroRomano(9)).toBe("IX");
    expect(aNumeroRomano(14)).toBe("XIV");
    expect(aNumeroRomano(19)).toBe("XIX");
  });

  it("rechaza lo que cae fuera del rango de los mayores", () => {
    expect(() => aNumeroRomano(-1)).toThrow();
    expect(() => aNumeroRomano(22)).toThrow();
    expect(() => aNumeroRomano(1.5)).toThrow();
  });

  it("cubre todos los arcanos mayores de la baraja real", () => {
    const mayores = BARAJA.filter((carta) => carta.arcano === "mayor");

    for (const carta of mayores) {
      expect(() => aNumeroRomano(carta.numero), carta.nombre).not.toThrow();
    }
  });
});
