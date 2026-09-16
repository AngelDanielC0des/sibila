/**
 * Forma de los ficheros del corpus.
 *
 * El corpus son datos estáticos versionados en git, bajo `corpus/<idioma>/`, no
 * filas de base de datos. El camino gratuito lee un fichero que el CDN ya tiene
 * cacheado: latencia cero y coste cero. Ver docs/plan-v1.md §4A.5.
 *
 * Este módulo solo define e interpreta la forma. No lee del disco: así se puede
 * usar tanto desde el validador, que lee ficheros, como desde la aplicación,
 * que los importa.
 */

import { ORIENTACIONES, type Orientacion } from "@/motor-de-lectura/baraja";

/** Las dos versiones de una misma carta. */
export type TextoPorOrientacion = {
  readonly derecha: string;
  readonly invertida: string;
};

/**
 * Una capa de texto indexada por identificador de carta.
 *
 * Es la forma de `base.json` y de cada fichero de `matices/`.
 */
export type CapaDeTexto = Readonly<Record<string, TextoPorOrientacion>>;

/** El veredicto de la tirada de sí/no. */
export type Valencia = "si" | "no" | "quiza";

/** Un veredicto con su justificación de una frase. */
export type EntradaDeValencia = {
  readonly valencia: Valencia;
  readonly motivo: string;
};

/**
 * La capa de valencias, indexada por carta y orientación.
 *
 * Se guarda por orientación y no solo por carta porque una carta que responde
 * «sí» derecha responde a menudo «no» o «quizá» invertida. Tratarlas igual sería
 * un error visible para el usuario.
 */
export type CapaDeValencias = Readonly<
  Record<string, Readonly<Record<Orientacion, EntradaDeValencia>>>
>;

const VALENCIAS_VALIDAS: readonly string[] = ["si", "no", "quiza"];

/**
 * Comprueba que un valor tenga la forma de un texto por orientación.
 *
 * @param valor Valor a comprobar.
 * @returns `true` si tiene ambas orientaciones como cadenas.
 */
function esTextoPorOrientacion(valor: unknown): valor is TextoPorOrientacion {
  if (typeof valor !== "object" || valor === null) {
    return false;
  } else {
    const candidato = valor as Record<string, unknown>;
    return (
      typeof candidato["derecha"] === "string" &&
      typeof candidato["invertida"] === "string"
    );
  }
}

/**
 * Interpreta el contenido de una capa de texto, validando su forma.
 *
 * @param contenido JSON ya parseado del fichero.
 * @param procedencia Ruta del fichero, para poder señalarlo en el error.
 * @returns La capa tipada.
 * @throws Si la forma no encaja. Es un error de programación o de edición a
 *   mano, no una situación de dominio, y por eso se lanza en lugar de
 *   devolverse como resultado.
 */
export function interpretarCapaDeTexto(
  contenido: unknown,
  procedencia: string,
): CapaDeTexto {
  if (typeof contenido !== "object" || contenido === null) {
    throw new Error(`${procedencia}: se esperaba un objeto en la raíz`);
  } else {
    const entradas = Object.entries(contenido as Record<string, unknown>);

    for (const [idCarta, valor] of entradas) {
      if (!esTextoPorOrientacion(valor)) {
        throw new Error(
          `${procedencia}: «${idCarta}» debe tener «derecha» e «invertida» como texto`,
        );
      }
    }

    return contenido as CapaDeTexto;
  }
}

/**
 * Comprueba que un valor tenga la forma de una entrada de valencia.
 *
 * @param valor Valor a comprobar.
 * @returns `true` si trae una valencia válida y su motivo.
 */
function esEntradaDeValencia(valor: unknown): valor is EntradaDeValencia {
  if (typeof valor !== "object" || valor === null) {
    return false;
  } else {
    const candidato = valor as Record<string, unknown>;
    const valencia = candidato["valencia"];

    return (
      typeof valencia === "string" &&
      VALENCIAS_VALIDAS.includes(valencia) &&
      typeof candidato["motivo"] === "string"
    );
  }
}

/**
 * Interpreta el contenido de la capa de valencias, validando su forma.
 *
 * @param contenido JSON ya parseado del fichero.
 * @param procedencia Ruta del fichero, para poder señalarlo en el error.
 * @returns La capa tipada.
 * @throws Si la forma no encaja.
 */
export function interpretarCapaDeValencias(
  contenido: unknown,
  procedencia: string,
): CapaDeValencias {
  if (typeof contenido !== "object" || contenido === null) {
    throw new Error(`${procedencia}: se esperaba un objeto en la raíz`);
  } else {
    const entradas = Object.entries(contenido as Record<string, unknown>);

    for (const [idCarta, valor] of entradas) {
      validarValenciasDeUnaCarta(valor, idCarta, procedencia);
    }

    return contenido as CapaDeValencias;
  }
}

/**
 * Valida las dos orientaciones de una sola carta en la capa de valencias.
 *
 * Vive aparte porque hacerlo en línea anidaba cinco niveles de bloques. La
 * regla del proyecto es extraer, no subir el umbral del linter.
 *
 * @param valor Valor sin validar asociado a la carta.
 * @param idCarta Identificador de la carta, para el mensaje de error.
 * @param procedencia Ruta del fichero, para el mensaje de error.
 * @throws Si falta alguna orientación o su forma no encaja.
 */
function validarValenciasDeUnaCarta(
  valor: unknown,
  idCarta: string,
  procedencia: string,
): void {
  if (typeof valor !== "object" || valor === null) {
    throw new Error(`${procedencia}: «${idCarta}» debe ser un objeto`);
  } else {
    const porOrientacion = valor as Record<string, unknown>;

    for (const orientacion of ORIENTACIONES) {
      if (!esEntradaDeValencia(porOrientacion[orientacion])) {
        throw new Error(
          `${procedencia}: «${idCarta}/${orientacion}» necesita «valencia» ` +
            `(si, no o quiza) y «motivo»`,
        );
      }
    }
  }
}
