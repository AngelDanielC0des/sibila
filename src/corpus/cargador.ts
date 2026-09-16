import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { existeFamilia, type IdFamilia } from "@/motor-de-lectura/familias";
import type {
  CapaDeTexto,
  CapaDeValencias,
  CapasDeCorpus,
} from "@/motor-de-lectura/repositorio-de-corpus";
import { interpretarCapaDeTexto, interpretarCapaDeValencias } from "./esquema";

/**
 * Carga las capas del corpus de un idioma desde disco.
 *
 * **Esto es todo lo que cuesta el camino gratuito: leer ficheros.** No hay
 * consulta a base de datos ni llamada a ningún modelo, y por eso la lectura
 * gratuita tiene coste marginal cero y latencia de fichero cacheado. Ver
 * `CLAUDE.md`, apartado «Modelo de negocio».
 *
 * Sólo corre en servidor. Las capas que aún no se han escrito **no son un
 * error**: el corpus estará incompleto durante meses, y quien pinta ya sabe
 * tratar la pieza que falta porque el repositorio devuelve un motivo de dominio
 * en lugar de lanzar.
 */

const RAIZ_DEL_CORPUS = resolve(process.cwd(), "corpus");

/**
 * Lee y parsea un fichero del corpus.
 *
 * @param ruta Ruta absoluta del fichero.
 * @returns El contenido sin interpretar todavía.
 */
function leerJson(ruta: string): unknown {
  return JSON.parse(readFileSync(ruta, "utf8")) as unknown;
}

/**
 * Reúne los matices que haya escritos, por familia.
 *
 * Una carpeta sin escribir devuelve un objeto vacío y no un fallo: es el estado
 * normal del proyecto durante los próximos meses.
 *
 * @param carpeta Carpeta `matices` del idioma.
 * @returns Las familias con texto.
 */
function leerMatices(carpeta: string): Readonly<Partial<Record<IdFamilia, CapaDeTexto>>> {
  const matices: Partial<Record<IdFamilia, CapaDeTexto>> = {};

  if (existsSync(carpeta)) {
    for (const fichero of readdirSync(carpeta)) {
      const familia = fichero.replace(/\.json$/, "");

      if (fichero.endsWith(".json") && existeFamilia(familia)) {
        matices[familia] = interpretarCapaDeTexto(
          leerJson(resolve(carpeta, fichero)),
          `matices/${familia}`,
        );
      }
    }
  }

  return matices;
}

/**
 * Carga el corpus completo de un idioma.
 *
 * @param idioma Idioma cuyo corpus se quiere.
 * @returns Las capas listas para `crearRepositorioDeCorpus`.
 */
export function cargarCorpus(idioma: string): CapasDeCorpus {
  const carpeta = resolve(RAIZ_DEL_CORPUS, idioma);
  const ficheroBase = resolve(carpeta, "base.json");
  const ficheroDeValencias = resolve(carpeta, "valencias.json");

  let base: CapaDeTexto = {};
  if (existsSync(ficheroBase)) {
    base = interpretarCapaDeTexto(leerJson(ficheroBase), "base");
  }

  let valencias: CapaDeValencias | undefined = undefined;
  if (existsSync(ficheroDeValencias)) {
    valencias = interpretarCapaDeValencias(leerJson(ficheroDeValencias), "valencias");
  }

  return { base, matices: leerMatices(resolve(carpeta, "matices")), valencias };
}
