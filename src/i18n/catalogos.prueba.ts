import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { IDIOMAS, IDIOMA_POR_DEFECTO, type Idioma } from "./rutas";
import { TIRADAS } from "@/motor-de-lectura/definicion-de-tirada";

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

/**
 * Enumera las claves de texto que exigen las tiradas declaradas en el motor.
 *
 * @returns Todas las rutas de clave que los catálogos tienen que cubrir.
 */
function clavesQueExigenLasTiradas(): string[] {
  const necesarias: string[] = [];

  for (const tirada of TIRADAS) {
    necesarias.push(`tiradas.${tirada.id}.nombre`);
    necesarias.push(`tiradas.${tirada.id}.descripcion`);

    for (const posicion of tirada.posiciones) {
      necesarias.push(`tiradas.${tirada.id}.posiciones.${posicion.numero}`);
    }
  }

  return necesarias;
}

/*
 * El motor declara las tiradas y no sabe de idiomas, que es como tiene que ser.
 * El precio de esa separación es que nada ata una cosa a la otra: se añade una
 * tirada y su nombre no existe en ningún catálogo, o se quita y su texto se
 * queda ahí para siempre. Esto es esa atadura, y vive en la capa de idiomas
 * porque es la que puede conocer al dominio, nunca al revés.
 */
describe("los catálogos cubren las tiradas del motor", () => {
  const necesarias = clavesQueExigenLasTiradas();

  for (const idioma of IDIOMAS) {
    it(`«${idioma}» nombra todas las tiradas y todas sus posiciones`, () => {
      const claves = extraerClaves(cargarCatalogo(idioma));

      expect(necesarias.filter((clave) => !claves.includes(clave))).toEqual([]);
    });

    it(`«${idioma}» no guarda texto de tiradas que ya no existen`, () => {
      const huerfanas = extraerClaves(cargarCatalogo(idioma))
        .filter((clave) => clave.startsWith("tiradas."))
        .filter((clave) => !necesarias.includes(clave));

      expect(huerfanas).toEqual([]);
    });
  }
});
