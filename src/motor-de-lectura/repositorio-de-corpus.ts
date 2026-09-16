/**
 * De dónde sale el texto de una carta.
 *
 * El dominio pregunta «¿qué significa La Torre invertida en la posición del
 * obstáculo?» y recibe la respuesta. No sabe que hay ficheros JSON detrás, ni
 * cuántas capas se han compuesto, ni en qué idioma están. Ese es todo el
 * propósito del patrón: el día que el corpus venga de otro sitio, cambia esta
 * implementación y nada más.
 *
 * **Este módulo no lee del disco**, igual que `src/corpus/esquema.ts`. Recibe
 * las capas ya cargadas. Quien las carga —un componente de servidor que importa
 * el JSON, o el validador que lo lee con `fs`— vive fuera, y así el motor sigue
 * siendo TypeScript puro que corre en cualquier parte.
 *
 * Las tres capas y por qué son tres están en `CLAUDE.md`, apartado «El corpus».
 *
 * **Que falte una pieza es una situación de dominio, no un accidente.** El
 * corpus se escribe a mano y durante meses estará incompleto; una lectura que
 * el usuario quizá ha pagado no puede reventar porque a una carta le falte el
 * matiz. Se devuelve el motivo y quien llama decide qué enseñar.
 */

import type { Carta, Orientacion } from "./baraja";
import type { IdFamilia } from "./familias";
import type { ModoDeLectura } from "./definicion-de-tirada";
import { exito, fallo, type Resultado } from "./resultado";

/**
 * La forma del corpus vive aquí, no en `src/corpus/`.
 *
 * Podría parecer que le corresponde a la capa que lee los ficheros, pero el
 * motor no puede importar nada del proyecto —regla de dependencias, §1 de la
 * guía de arquitectura— y necesita estos tipos para componer un significado.
 * Ponerlos allí crearía una dependencia del dominio hacia fuera.
 *
 * Y mirado de cerca son tipos de dominio: «el texto de una carta según su
 * orientación» es vocabulario del tarot, no un detalle de almacenamiento.
 * `src/corpus/esquema.ts` los importa de aquí y añade lo suyo: validar que un
 * fichero escrito a mano tiene de verdad esta forma.
 */

/** Las dos versiones de una misma carta. */
export type TextoPorOrientacion = {
  readonly derecha: string;
  readonly invertida: string;
};

/** Una capa de texto indexada por identificador de carta. */
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
 * Se guarda por orientación y no sólo por carta porque una carta que responde
 * «sí» derecha responde a menudo «no» o «quizá» invertida. Tratarlas igual sería
 * un error visible para el usuario.
 */
export type CapaDeValencias = Readonly<
  Record<string, Readonly<Record<Orientacion, EntradaDeValencia>>>
>;

/**
 * Las capas del corpus de un idioma, ya cargadas en memoria.
 *
 * `matices` se indexa por familia, no por tirada. Es la decisión que hace que
 * una tirada nueva cuyas posiciones caigan en familias existentes no cueste
 * corpus; ver `familias.ts`.
 */
export type CapasDeCorpus = {
  readonly base: CapaDeTexto;
  readonly matices: Readonly<Partial<Record<IdFamilia, CapaDeTexto>>>;
  /** Sólo la necesita la tirada de sí/no. */
  readonly valencias?: CapaDeValencias;
};

/** Qué texto se pide. */
export type PeticionDeSignificado = {
  readonly carta: Carta;
  readonly orientacion: Orientacion;
  readonly modo: ModoDeLectura;
  /** Obligatoria cuando el modo es `matiz`, prohibida en los demás. */
  readonly familia?: IdFamilia;
};

/**
 * El texto de una carta en una posición, ya compuesto.
 *
 * `matiz` y `valencia` son `null` y no opcionales a propósito: quien pinta
 * tiene que decidir qué hacer cuando no hay, y un campo ausente se olvida más
 * fácil que uno que vale `null`.
 */
export type Significado = {
  readonly base: string;
  readonly matiz: string | null;
  readonly valencia: EntradaDeValencia | null;
};

/** Por qué no se pudo componer un significado. */
export type ErrorDeCorpus =
  | "sin-significado-base"
  | "sin-familia-para-el-matiz"
  | "sin-capa-de-matices"
  | "sin-matiz-para-la-carta"
  | "sin-capa-de-valencias"
  | "sin-valencia-para-la-carta";

/** El acceso al corpus que ve el dominio. */
export type RepositorioDeCorpus = {
  obtenerSignificado: (
    peticion: PeticionDeSignificado,
  ) => Resultado<Significado, ErrorDeCorpus>;
  /** Si una carta tiene ya escrito su significado base, en ambas orientaciones. */
  tieneSignificadoBase: (idCarta: string) => boolean;
};

/**
 * Saca el matiz de familia de una carta.
 *
 * @param capas Capas del corpus.
 * @param peticion Lo que se pide.
 * @returns El matiz, o el motivo por el que no está.
 */
function obtenerMatiz(
  capas: CapasDeCorpus,
  peticion: PeticionDeSignificado,
): Resultado<string, ErrorDeCorpus> {
  if (peticion.familia === undefined) {
    return fallo("sin-familia-para-el-matiz");
  } else {
    const capa = capas.matices[peticion.familia];

    if (capa === undefined) {
      return fallo("sin-capa-de-matices");
    } else {
      const texto = capa[peticion.carta.id]?.[peticion.orientacion];

      if (texto === undefined) {
        return fallo("sin-matiz-para-la-carta");
      } else {
        return exito(texto);
      }
    }
  }
}

/**
 * Saca la valencia sí/no de una carta.
 *
 * @param capas Capas del corpus.
 * @param peticion Lo que se pide.
 * @returns La valencia con su motivo, o la razón de que no esté.
 */
function obtenerValencia(
  capas: CapasDeCorpus,
  peticion: PeticionDeSignificado,
): Resultado<EntradaDeValencia, ErrorDeCorpus> {
  if (capas.valencias === undefined) {
    return fallo("sin-capa-de-valencias");
  } else {
    const entrada = capas.valencias[peticion.carta.id]?.[peticion.orientacion];

    if (entrada === undefined) {
      return fallo("sin-valencia-para-la-carta");
    } else {
      return exito(entrada);
    }
  }
}

/**
 * Compone el significado una vez se tiene el texto base.
 *
 * Vive aparte de `obtenerSignificado` para que ninguna de las dos pase del
 * umbral de anidamiento del proyecto.
 *
 * @param capas Capas del corpus.
 * @param peticion Lo que se pide.
 * @param base Texto base ya encontrado.
 * @returns El significado completo, o el motivo del fallo.
 */
function componerSegunElModo(
  capas: CapasDeCorpus,
  peticion: PeticionDeSignificado,
  base: string,
): Resultado<Significado, ErrorDeCorpus> {
  if (peticion.modo === "base") {
    return exito({ base, matiz: null, valencia: null });
  } else if (peticion.modo === "matiz") {
    const matiz = obtenerMatiz(capas, peticion);

    if (matiz.estaBien) {
      return exito({ base, matiz: matiz.valor, valencia: null });
    } else {
      return fallo(matiz.error);
    }
  } else {
    const valencia = obtenerValencia(capas, peticion);

    if (valencia.estaBien) {
      return exito({ base, matiz: null, valencia: valencia.valor });
    } else {
      return fallo(valencia.error);
    }
  }
}

/**
 * Crea un repositorio sobre unas capas ya cargadas.
 *
 * @param capas Las capas del corpus de un idioma.
 * @returns El repositorio.
 */
export function crearRepositorioDeCorpus(capas: CapasDeCorpus): RepositorioDeCorpus {
  const obtenerSignificado = (
    peticion: PeticionDeSignificado,
  ): Resultado<Significado, ErrorDeCorpus> => {
    const base = capas.base[peticion.carta.id]?.[peticion.orientacion];

    if (base === undefined) {
      return fallo("sin-significado-base");
    } else {
      return componerSegunElModo(capas, peticion, base);
    }
  };

  const tieneSignificadoBase = (idCarta: string): boolean => {
    return capas.base[idCarta] !== undefined;
  };

  return { obtenerSignificado, tieneSignificadoBase };
}
