/**
 * Las familias de posición.
 *
 * El hallazgo que define la arquitectura del corpus: **la posición es una lente
 * interpretativa, no un atributo de la tirada.** «Pasado» en Tres Cartas y
 * «pasado reciente» en la Cruz Celta piden exactamente el mismo texto, así que
 * comparten familia y comparten pieza.
 *
 * La consecuencia estratégica es que añadir una tirada cuyas posiciones caigan
 * en familias existentes **no cuesta corpus**. Ver docs/plan-v1.md §4A.1.
 */

/** Identificador estable de una familia. Es el nombre del fichero del corpus. */
export type IdFamilia =
  | "situacion"
  | "obstaculo"
  | "pasado"
  | "futuro"
  | "resultado"
  | "consejo"
  | "recurso"
  | "a-trabajar"
  | "interior"
  | "entorno"
  | "aporte";

/**
 * Una familia de posición.
 *
 * `pregunta` no es documentación: es la instrucción de escritura. El matiz de
 * una familia debe contestar esa pregunta y ninguna otra, que es lo que impide
 * que los matices acaben repitiendo el significado base.
 */
export type Familia = {
  readonly id: IdFamilia;
  readonly nombre: string;
  readonly pregunta: string;
  /** Peligro de redacción propio de esta familia, si lo tiene. */
  readonly advertencia?: string;
};

/**
 * Las once familias que necesitan matiz propio.
 *
 * Quedan fuera dos casos especiales que no son familias de matiz:
 * la tirada de una carta, que usa el significado base sin lente, y la de sí/no,
 * que tiene su propia capa de valencia.
 */
export const FAMILIAS: readonly Familia[] = [
  {
    id: "situacion",
    nombre: "Situación · presente · corazón del asunto",
    pregunta: "¿Qué está pasando ahora mismo?",
  },
  {
    id: "obstaculo",
    nombre: "Obstáculo · cruce · lo que frena",
    pregunta: "¿Qué lo frena o lo complica?",
  },
  {
    id: "pasado",
    nombre: "Pasado · influencia previa · raíz",
    pregunta: "¿Qué de lo ya vivido sigue operando aquí?",
  },
  {
    id: "futuro",
    nombre: "Futuro cercano · lo que se perfila",
    pregunta: "¿Hacia dónde se inclina esto si nada cambia?",
    /*
     * Es la familia con más riesgo del corpus. La lente empuja al escritor
     * justo hacia el léxico que la guía de voz prohíbe.
     */
    advertencia:
      "Se describe una tendencia, nunca un hecho futuro. Está prohibido «sucederá», «vas a» y cualquier formulación que presente la lectura como algo que ocurrirá. La condición «si nada cambia» es parte del significado y tiene que notarse.",
  },
  {
    id: "resultado",
    nombre: "Resultado · potencial · desenlace",
    pregunta: "¿En qué desemboca esto?",
    advertencia:
      "Desenlace potencial, no destino. Mismo cuidado que en la familia «futuro».",
  },
  {
    id: "consejo",
    nombre: "Consejo · acción recomendada",
    pregunta: "¿Qué conviene hacer con esto?",
    advertencia:
      "Es la única familia donde Sibila se acerca a aconsejar, y aun así observa: señala por dónde va el camino, no da órdenes. Nada de consejo médico, legal, financiero ni psicológico.",
  },
  {
    id: "recurso",
    nombre: "Recurso · fortaleza",
    pregunta: "¿Con qué se cuenta?",
  },
  {
    id: "a-trabajar",
    nombre: "A trabajar · debilidad · sombra",
    pregunta: "¿Qué hay que atender o soltar?",
    advertencia:
      "Describe una conducta o un patrón, nunca un defecto de la persona. No se diagnostica ni se juzga.",
  },
  {
    id: "interior",
    nombre: "Interior · esperanzas y miedos",
    pregunta: "¿Qué se siente por dentro y no se dice?",
  },
  {
    id: "entorno",
    nombre: "Entorno · influencias externas",
    pregunta: "¿Qué aportan o imponen los demás?",
    advertencia:
      "No se afirma lo que un tercero piensa o siente: no lo sabemos. Se describe cómo llega al consultante, no qué ocurre en la cabeza de otro.",
  },
  {
    id: "aporte",
    nombre: "Aporte al vínculo · rol relacional",
    pregunta: "¿Qué lleva uno mismo al vínculo?",
  },
];

/** Índice de familias por identificador, para acceso en tiempo constante. */
const FAMILIAS_POR_ID: ReadonlyMap<string, Familia> = new Map(
  FAMILIAS.map((familia) => [familia.id, familia]),
);

/**
 * Busca una familia por su identificador.
 *
 * @param id Identificador de la familia.
 * @returns La familia, o `undefined` si no existe.
 */
export function buscarFamiliaPorId(id: string): Familia | undefined {
  return FAMILIAS_POR_ID.get(id);
}

/**
 * Indica si un identificador corresponde a una familia con matiz propio.
 *
 * @param id Identificador a comprobar.
 * @returns `true` si la familia existe.
 */
export function existeFamilia(id: string): boolean {
  return FAMILIAS_POR_ID.has(id);
}
