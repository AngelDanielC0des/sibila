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

import { ORIENTACIONES } from "@/motor-de-lectura/baraja";

/*
 * La forma del corpus se declara en el motor, no aquí.
 *
 * «El texto de una carta según su orientación» es vocabulario de tarot, o sea
 * dominio, y además el motor necesita esos tipos para componer un significado
 * sin poder importar nada del proyecto. Se reexportan para que quien ya los
 * usaba desde aquí —el validador, el informe de avance— siga haciéndolo: el
 * sitio donde se declaran es un detalle de capas, no del corpus.
 */
export type {
  CapaDeTexto,
  CapaDeValencias,
  EntradaDeValencia,
  TextoPorOrientacion,
  Valencia,
} from "@/motor-de-lectura/repositorio-de-corpus";

import type {
  CapaDeTexto,
  CapaDeValencias,
  EntradaDeValencia,
  TextoPorOrientacion,
} from "@/motor-de-lectura/repositorio-de-corpus";

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
