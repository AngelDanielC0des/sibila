import { describe, expect, it } from "vitest";
import { contarFrases, contarPalabras } from "@/corpus/reglas";
import {
  BASE_MAXIMO,
  BASE_MINIMO,
  MATIZ_MAXIMO,
  MATIZ_MINIMO,
  VALENCIA_MAXIMA,
  VALENCIA_MINIMA,
  type TextoDeMedida,
} from "./textos-de-medida";

/**
 * Los textos de medida sólo sirven si de verdad ocupan el extremo que dicen
 * ocupar. Un texto «máximo» que se quedara en 70 palabras validaría la maqueta
 * contra un caso cómodo y nos dejaría descubrir el desbordamiento con el corpus
 * ya escrito.
 *
 * Esta prueba es además la atadura entre `reglas.ts` y la maqueta: si alguien
 * cambia un límite y no toca los textos, falla aquí.
 */

/** Lo que el validador exige a cada capa. Debe reflejar `reglas.ts`. */
const LIMITES = {
  base: { palabrasMin: 45, palabrasMax: 90, frasesMin: 3, frasesMax: 5 },
  matiz: { palabrasMin: 18, palabrasMax: 40, frasesMin: 1, frasesMax: 2 },
  valencia: { palabrasMin: 10, palabrasMax: 25, frasesMin: 1, frasesMax: 1 },
} as const;

const CASOS: ReadonlyArray<{
  nombre: string;
  muestra: TextoDeMedida;
  esperadas: number;
  frasesMin: number;
  frasesMax: number;
}> = [
  {
    nombre: "base mínimo",
    muestra: BASE_MINIMO,
    esperadas: LIMITES.base.palabrasMin,
    frasesMin: LIMITES.base.frasesMin,
    frasesMax: LIMITES.base.frasesMax,
  },
  {
    nombre: "base máximo",
    muestra: BASE_MAXIMO,
    esperadas: LIMITES.base.palabrasMax,
    frasesMin: LIMITES.base.frasesMin,
    frasesMax: LIMITES.base.frasesMax,
  },
  {
    nombre: "matiz mínimo",
    muestra: MATIZ_MINIMO,
    esperadas: LIMITES.matiz.palabrasMin,
    frasesMin: LIMITES.matiz.frasesMin,
    frasesMax: LIMITES.matiz.frasesMax,
  },
  {
    nombre: "matiz máximo",
    muestra: MATIZ_MAXIMO,
    esperadas: LIMITES.matiz.palabrasMax,
    frasesMin: LIMITES.matiz.frasesMin,
    frasesMax: LIMITES.matiz.frasesMax,
  },
  {
    nombre: "valencia mínima",
    muestra: VALENCIA_MINIMA,
    esperadas: LIMITES.valencia.palabrasMin,
    frasesMin: LIMITES.valencia.frasesMin,
    frasesMax: LIMITES.valencia.frasesMax,
  },
  {
    nombre: "valencia máxima",
    muestra: VALENCIA_MAXIMA,
    esperadas: LIMITES.valencia.palabrasMax,
    frasesMin: LIMITES.valencia.frasesMin,
    frasesMax: LIMITES.valencia.frasesMax,
  },
];

describe("los textos de medida ocupan su extremo exacto", () => {
  for (const caso of CASOS) {
    it(`«${caso.nombre}» tiene ${caso.esperadas} palabras`, () => {
      expect(contarPalabras(caso.muestra.texto)).toBe(caso.esperadas);
    });

    it(`«${caso.nombre}» declara bien su propio recuento`, () => {
      expect(caso.muestra.palabras).toBe(caso.esperadas);
    });

    it(`«${caso.nombre}» respeta el número de frases de su capa`, () => {
      const frases = contarFrases(caso.muestra.texto);

      expect(frases).toBeGreaterThanOrEqual(caso.frasesMin);
      expect(frases).toBeLessThanOrEqual(caso.frasesMax);
    });
  }
});
