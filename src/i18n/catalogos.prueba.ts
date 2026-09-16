import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IDIOMAS, IDIOMA_POR_DEFECTO, type Idioma } from "./rutas";

/**
 * Aplana un catálogo de mensajes a una lista ordenada de rutas de clave.
 *
 * @param nodo Objeto de mensajes, posiblemente anidado.
 * @param prefijo Ruta acumulada de las claves padre.
 * @returns Todas las rutas de clave hoja, ordenadas alfabéticamente.
 */
function extraerClaves(nodo: Record<string, unknown>, prefijo = ""): string[] {
  const claves: string[] = [];

  for (const [clave, valor] of Object.entries(nodo)) {
    const ruta = `${prefijo}${clave}`;

    if (typeof valor === "object" && valor !== null) {
      claves.push(...extraerClaves(valor as Record<string, unknown>, `${ruta}.`));
    } else {
      claves.push(ruta);
    }
  }

  return claves.sort();
}

/**
 * Carga y parsea el catálogo de mensajes de un idioma.
 *
 * @param idioma Idioma cuyo catálogo se quiere leer.
 * @returns El catálogo como objeto.
 */
function cargarCatalogo(idioma: Idioma): Record<string, unknown> {
  const ruta = resolve(import.meta.dirname, "../../messages", `${idioma}.json`);
  return JSON.parse(readFileSync(ruta, "utf8")) as Record<string, unknown>;
}

describe("catálogos de mensajes", () => {
  const clavesDeReferencia = extraerClaves(cargarCatalogo(IDIOMA_POR_DEFECTO));

  it("el idioma por defecto tiene claves", () => {
    expect(clavesDeReferencia.length).toBeGreaterThan(0);
  });

  /*
   * En un proyecto multiidioma lo que se pudre no es la traducción sino la
   * sincronía: alguien añade una clave al catálogo del idioma principal y los
   * demás se quedan atrás sin que nadie se entere hasta que un usuario ve el
   * identificador crudo en pantalla. Esta prueba lo impide.
   */
  for (const idioma of IDIOMAS) {
    it(`«${idioma}» tiene exactamente las mismas claves que «${IDIOMA_POR_DEFECTO}»`, () => {
      const claves = extraerClaves(cargarCatalogo(idioma));

      const faltan = clavesDeReferencia.filter((clave) => !claves.includes(clave));
      const sobran = claves.filter((clave) => !clavesDeReferencia.includes(clave));

      expect({ faltan, sobran }).toEqual({ faltan: [], sobran: [] });
    });

    it(`«${idioma}» no tiene textos vacíos`, () => {
      const catalogo = cargarCatalogo(idioma);
      const vacias: string[] = [];

      const recorrer = (nodo: Record<string, unknown>, prefijo: string): void => {
        for (const [clave, valor] of Object.entries(nodo)) {
          if (typeof valor === "object" && valor !== null) {
            recorrer(valor as Record<string, unknown>, `${prefijo}${clave}.`);
          } else if (typeof valor === "string" && valor.trim() === "") {
            vacias.push(`${prefijo}${clave}`);
          }
        }
      };

      recorrer(catalogo, "");
      expect(vacias).toEqual([]);
    });
  }
});
