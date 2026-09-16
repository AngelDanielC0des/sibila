/**
 * Las tiradas, declaradas como datos.
 *
 * Una tirada no es código: es cuántas cartas se eligen, qué lente aplica a cada
 * hueco y cómo se disponen sobre la mesa. Declararlas así es lo que permite
 * añadir una tirada nueva sin tocar el motor.
 *
 * **La lente es la familia, y la familia se comparte entre tiradas.** «Pasado»
 * en Tres Cartas y «raíz» en la Cruz Celta piden el mismo texto, así que
 * comparten pieza de corpus. La consecuencia estratégica está en `familias.ts`:
 * una tirada cuyas posiciones caigan todas en familias existentes no cuesta
 * corpus.
 *
 * Aquí no hay ni un solo texto de cara al usuario. Los nombres visibles viven
 * en `messages/`, bajo `tiradas.<id>`, y el motor no sabe de idiomas.
 */

import type { IdFamilia } from "./familias";

/** Identificador estable de una tirada. Aparece en la URL y en el historial. */
export type IdTirada =
  | "una-carta"
  | "si-no"
  | "pasado-presente-futuro"
  | "situacion-obstaculo-consejo"
  | "general-de-cinco"
  | "amor-de-cinco";

/**
 * Con qué capas del corpus se interpreta una tirada.
 *
 * Las tres capas se describen en `CLAUDE.md`. No todas las tiradas usan las
 * tres, y esta distinción es la que le dice al repositorio de corpus qué
 * componer:
 *
 * - `base` — sólo el significado de la carta. La tirada de una carta no tiene
 *   posiciones que matizar, así que añadir una lente sería inventarla.
 * - `matiz` — significado base más el matiz de la familia de cada posición.
 *   Es el caso normal.
 * - `valencia` — significado base más la respuesta sí/no. Es la única tirada
 *   que usa esa capa, y por eso la capa existe aparte.
 */
export type ModoDeLectura = "base" | "matiz" | "valencia";

/**
 * Dónde se coloca una posición sobre la mesa.
 *
 * Coordenadas abstractas de rejilla, no píxeles: la forma de una tirada —que la
 * Cruz Celta sea una cruz— es parte de su definición, pero traducirla a una
 * pantalla concreta es trabajo del renderizador.
 */
export type SitioEnLaMesa = {
  readonly columna: number;
  readonly fila: number;
  /** La carta se cruza sobre la anterior, girada un cuarto de vuelta. */
  readonly estaCruzada?: boolean;
};

/**
 * Un hueco de la tirada.
 *
 * `familia` falta cuando el modo de lectura no es `matiz`: sin lente no hay
 * familia que aplicar, y dejarla puesta sugeriría un texto que no se va a leer.
 */
export type Posicion = {
  /** Orden en que se revela, empezando en uno. Es lo que ve el usuario. */
  readonly numero: number;
  readonly familia?: IdFamilia;
  readonly sitio: SitioEnLaMesa;
};

/** Una tirada completa. */
export type DefinicionDeTirada = {
  readonly id: IdTirada;
  readonly numeroDeCartas: number;
  readonly modo: ModoDeLectura;
  readonly posiciones: readonly Posicion[];
};

/**
 * Coloca varias posiciones en una sola fila.
 *
 * Las tiradas cortas se despliegan en línea, que es como se leen de izquierda a
 * derecha. Sólo las tiradas con forma propia declaran su sitio a mano.
 *
 * @param familias Familias en el orden en que se revelan.
 * @returns Las posiciones numeradas y colocadas.
 */
function enUnaFila(familias: readonly IdFamilia[]): readonly Posicion[] {
  return familias.map((familia, indice) => ({
    numero: indice + 1,
    familia,
    sitio: { columna: indice, fila: 0 },
  }));
}

/** El hueco único de las tiradas de una sola carta. */
const POSICION_UNICA: readonly Posicion[] = [
  { numero: 1, sitio: { columna: 0, fila: 0 } },
];

/**
 * Las tiradas de la v1.
 *
 * La Cruz Celta queda fuera a propósito: tres de sus diez posiciones no tienen
 * familia y añadirlas cuesta corpus. Ver la decisión abierta D2 en
 * `docs/hoja-de-ruta.md`.
 */
export const TIRADAS: readonly DefinicionDeTirada[] = [
  {
    id: "una-carta",
    numeroDeCartas: 1,
    modo: "base",
    posiciones: POSICION_UNICA,
  },
  {
    id: "si-no",
    numeroDeCartas: 1,
    modo: "valencia",
    posiciones: POSICION_UNICA,
  },
  {
    id: "pasado-presente-futuro",
    numeroDeCartas: 3,
    modo: "matiz",
    posiciones: enUnaFila(["pasado", "situacion", "futuro"]),
  },
  {
    id: "situacion-obstaculo-consejo",
    numeroDeCartas: 3,
    modo: "matiz",
    posiciones: enUnaFila(["situacion", "obstaculo", "consejo"]),
  },
  {
    id: "general-de-cinco",
    numeroDeCartas: 5,
    modo: "matiz",
    posiciones: enUnaFila([
      "situacion",
      "obstaculo",
      "recurso",
      "a-atender",
      "resultado",
    ]),
  },
  {
    id: "amor-de-cinco",
    numeroDeCartas: 5,
    modo: "matiz",
    /*
     * Las cinco posiciones son del vínculo, no genéricas con otro nombre. Es lo
     * que hace que la tirada se lea como lo que dice ser.
     */
    posiciones: enUnaFila([
      "aporte-vinculo",
      "pasado-vinculo",
      "situacion-vinculo",
      "a-atender-vinculo",
      "futuro-vinculo",
    ]),
  },
];

/**
 * Las familias que alguna tirada activa usa de verdad.
 *
 * Declarar una familia es barato; escribirla son 156 piezas de corpus. Esta
 * función es la que distingue una cosa de la otra, y se deriva en lugar de
 * marcarse a mano: una familia queda «en uso» porque una tirada la nombra, no
 * porque alguien se acuerde de anotarlo.
 *
 * Vive aquí y no en `familias.ts` porque la dirección de la dependencia es
 * ésta: las tiradas conocen a las familias, nunca al revés.
 *
 * @returns Los identificadores de familia en uso, sin repetir.
 */
export function familiasEnUso(): ReadonlySet<IdFamilia> {
  const enUso = new Set<IdFamilia>();

  for (const tirada of TIRADAS) {
    for (const posicion of tirada.posiciones) {
      if (posicion.familia !== undefined) {
        enUso.add(posicion.familia);
      }
    }
  }

  return enUso;
}

/** Índice de tiradas por identificador, para acceso en tiempo constante. */
const TIRADAS_POR_ID: ReadonlyMap<string, DefinicionDeTirada> = new Map(
  TIRADAS.map((tirada) => [tirada.id, tirada]),
);

/**
 * Busca una tirada por su identificador.
 *
 * @param id Identificador de la tirada.
 * @returns La tirada, o `undefined` si no existe.
 */
export function buscarTiradaPorId(id: string): DefinicionDeTirada | undefined {
  return TIRADAS_POR_ID.get(id);
}

/**
 * Indica si existe una tirada con ese identificador.
 *
 * @param id Identificador a comprobar.
 * @returns `true` si la tirada existe.
 */
export function existeTirada(id: string): boolean {
  return TIRADAS_POR_ID.has(id);
}
