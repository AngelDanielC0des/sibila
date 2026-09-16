import { describe, expect, it } from "vitest";
import { existeFamilia } from "./familias";
import {
  buscarTiradaPorId,
  existeTirada,
  TIRADAS,
  type DefinicionDeTirada,
} from "./definicion-de-tirada";

/**
 * Una tirada es una declaración, y una declaración incoherente no falla al
 * compilar: falla en producción, con el usuario delante de un hueco vacío o de
 * un texto que no existe. Estas pruebas son el compilador que le falta.
 */

describe("coherencia de cada tirada", () => {
  for (const tirada of TIRADAS) {
    describe(`«${tirada.id}»`, () => {
      it("declara tantas posiciones como cartas", () => {
        expect(tirada.posiciones).toHaveLength(tirada.numeroDeCartas);
      });

      it("numera las posiciones de uno en uno y sin saltos", () => {
        const numeros = tirada.posiciones.map((posicion) => posicion.numero);
        const esperados = tirada.posiciones.map((_, indice) => indice + 1);

        expect(numeros).toEqual(esperados);
      });

      /*
       * Es el fallo más caro de todos: una familia mal escrita no rompe nada
       * hasta que el repositorio de corpus busca su fichero y no lo encuentra,
       * en mitad de una lectura que el usuario quizá ya ha pagado.
       */
      it("todas sus familias existen", () => {
        const inventadas = tirada.posiciones
          .map((posicion) => posicion.familia)
          .filter((familia) => familia !== undefined)
          .filter((familia) => !existeFamilia(familia));

        expect(inventadas).toEqual([]);
      });

      it("ninguna posición ocupa el sitio de otra", () => {
        const sitios = tirada.posiciones.map(
          ({ sitio }) => `${sitio.columna},${sitio.fila},${sitio.estaCruzada ?? false}`,
        );

        expect(new Set(sitios).size).toBe(sitios.length);
      });
    });
  }
});

describe("el modo de lectura manda sobre las familias", () => {
  /*
   * Las dos reglas son espejo la una de la otra y juntas impiden el estado
   * incoherente: una posición con lente que nadie va a aplicar, o una posición
   * que necesita lente y no la declara.
   */
  const conModo = (modo: DefinicionDeTirada["modo"]) =>
    TIRADAS.filter((tirada) => tirada.modo === modo);

  it("el modo «matiz» exige familia en todas sus posiciones", () => {
    for (const tirada of conModo("matiz")) {
      const sinFamilia = tirada.posiciones.filter(
        (posicion) => posicion.familia === undefined,
      );

      expect(sinFamilia, tirada.id).toEqual([]);
    }
  });

  it("los modos «base» y «valencia» no declaran familia", () => {
    for (const tirada of [...conModo("base"), ...conModo("valencia")]) {
      const conFamilia = tirada.posiciones.filter(
        (posicion) => posicion.familia !== undefined,
      );

      expect(conFamilia, tirada.id).toEqual([]);
    }
  });

  it("sólo la tirada de sí/no usa la capa de valencia", () => {
    expect(conModo("valencia").map((tirada) => tirada.id)).toEqual(["si-no"]);
  });
});

describe("el catálogo de tiradas", () => {
  it("no repite identificadores", () => {
    const identificadores = TIRADAS.map((tirada) => tirada.id);

    expect(new Set(identificadores).size).toBe(identificadores.length);
  });

  it("encuentra una tirada por su identificador", () => {
    expect(buscarTiradaPorId("general-de-cinco")?.numeroDeCartas).toBe(5);
    expect(buscarTiradaPorId("la-que-no-existe")).toBeUndefined();
  });

  it("sabe cuáles existen", () => {
    expect(existeTirada("si-no")).toBe(true);
    expect(existeTirada("cruz-celta")).toBe(false);
  });

  /*
   * La Cruz Celta no está por una razón concreta, no por olvido: tres de sus
   * diez posiciones —lo que corona, la actitud propia y el pasado reciente— no
   * tienen familia, y crearlas cuesta 468 piezas de corpus por idioma. Es la
   * decisión D2. Cuando se decida, esta prueba se cambia a la vez que la
   * declaración, y así nadie la añade a medias.
   */
  it("la Cruz Celta sigue fuera mientras D2 esté abierta", () => {
    expect(existeTirada("cruz-celta")).toBe(false);
  });
});
