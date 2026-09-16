/**
 * Las familias de posición.
 *
 * El hallazgo que define la arquitectura del corpus: **la posición es una lente
 * interpretativa, no un atributo de la tirada.** «Pasado» en Tres Cartas y
 * «pasado reciente» en la Cruz Celta piden exactamente el mismo texto, así que
 * comparten familia y comparten pieza.
 *
 * ## Los dos ejes, y por qué suman en lugar de multiplicar
 *
 * El significado de una carta se matiza por **dos** cosas: la posición donde
 * cayó y el tema de la tirada. «Qué te frena» no se escribe igual para una
 * relación que para un trabajo.
 *
 * Multiplicar los ejes —cada familia escrita en cada tema— daría más de cinco
 * mil piezas por idioma, y una docena de esas combinaciones saldrían casi
 * idénticas, porque el tema no cambia igual en todas las familias: en «qué te
 * frena» cambia mucho y en «pasado · raíz» casi nada.
 *
 * Por eso el tema **suma**: se crean familias que ya lo llevan dentro, y sólo
 * donde cambia la pregunta de escritura. El resultado que lee el usuario es el
 * mismo y el corpus crece de forma lineal.
 *
 * ## Una familia se escribe cuando una tirada la usa
 *
 * Declarar una familia es barato; escribirla son 156 piezas. `interior` y
 * `entorno` están declaradas porque la Cruz Celta las necesitará, pero ninguna
 * tirada activa las usa todavía y por eso no se escriben. Quién está en uso no
 * se marca a mano: lo deriva `familiasEnUso()` en `definicion-de-tirada.ts`.
 *
 * Ver docs/plan-v1.md §4A.1 y la hoja de ruta, vía B.
 */

/**
 * El eje temático de una familia.
 *
 * `general` es la ausencia de tema: sirve a cualquier pregunta. Un tema nuevo
 * entra sólo cuando existe una tirada que lo pida.
 */
export type TemaDeFamilia = "general" | "vinculo";

/** Identificador estable de una familia. Es el nombre del fichero del corpus. */
export type IdFamilia =
  /* Genéricas. */
  | "situacion"
  | "obstaculo"
  | "pasado"
  | "futuro"
  | "resultado"
  | "consejo"
  | "recurso"
  | "a-atender"
  /* Del vínculo. El sufijo hace visible el tema en el propio identificador. */
  | "aporte-vinculo"
  | "situacion-vinculo"
  | "pasado-vinculo"
  | "a-atender-vinculo"
  | "futuro-vinculo"
  /* Declaradas y aún sin escribir: ninguna tirada activa las usa. */
  | "interior"
  | "entorno";

/**
 * Una familia de posición.
 *
 * `pregunta` no es documentación: es la instrucción de escritura. El matiz de
 * una familia debe contestar esa pregunta y ninguna otra, que es lo que impide
 * que los matices acaben repitiendo el significado base.
 */
export type Familia = {
  readonly id: IdFamilia;
  readonly tema: TemaDeFamilia;
  readonly nombre: string;
  readonly pregunta: string;
  /** Peligro de redacción propio de esta familia, si lo tiene. */
  readonly advertencia?: string;
};

/**
 * Las familias declaradas.
 *
 * Quedan fuera dos casos que no son familias de matiz: la tirada de una carta,
 * que usa el significado base sin lente, y la de sí/no, que tiene su propia
 * capa de valencia.
 */
export const FAMILIAS: readonly Familia[] = [
  {
    id: "situacion",
    tema: "general",
    nombre: "Situación · presente · corazón del asunto",
    pregunta: "¿Qué está pasando ahora mismo?",
  },
  {
    id: "obstaculo",
    tema: "general",
    nombre: "Obstáculo · cruce · lo que frena",
    pregunta: "¿Qué lo frena o lo complica?",
  },
  {
    id: "pasado",
    tema: "general",
    nombre: "Pasado · influencia previa · raíz",
    pregunta: "¿Qué de lo ya vivido sigue operando aquí?",
  },
  {
    id: "futuro",
    tema: "general",
    nombre: "Futuro cercano · lo que se perfila",
    pregunta: "¿Hacia dónde se inclina esto si nada cambia?",
    /*
     * Es la familia con más riesgo del corpus genérico. La lente empuja al
     * escritor justo hacia el léxico que la guía de voz prohíbe.
     */
    advertencia:
      "Se describe una tendencia, nunca un hecho futuro. Está prohibido «sucederá», «vas a» y cualquier formulación que presente la lectura como algo que ocurrirá. La condición «si nada cambia» es parte del significado y tiene que notarse.",
  },
  {
    id: "resultado",
    tema: "general",
    nombre: "Resultado · potencial · desenlace",
    pregunta: "¿En qué desemboca esto?",
    advertencia:
      "Desenlace potencial, no destino. Mismo cuidado que en la familia «futuro».",
  },
  {
    id: "consejo",
    tema: "general",
    nombre: "Consejo · acción recomendada",
    pregunta: "¿Qué conviene hacer con esto?",
    advertencia:
      "Es la única familia donde Sibila se acerca a aconsejar, y aun así observa: señala por dónde va el camino, no da órdenes. Nada de consejo médico, legal, financiero ni psicológico.",
  },
  {
    id: "recurso",
    tema: "general",
    nombre: "Recurso · fortaleza",
    pregunta: "¿Con qué se cuenta?",
  },
  {
    id: "a-atender",
    tema: "general",
    nombre: "A atender · debilidad · sombra",
    pregunta: "¿Qué hay que atender o soltar?",
    advertencia:
      "Describe una conducta o un patrón, nunca un defecto de la persona. No se diagnostica ni se juzga.",
  },

  /* ── Del vínculo ──────────────────────────────────────────────────────── */

  {
    id: "aporte-vinculo",
    tema: "vinculo",
    nombre: "Aporte al vínculo · rol relacional",
    pregunta: "¿Qué lleva uno mismo al vínculo?",
    advertencia:
      "Sobre lo propio, nunca sobre lo que aporta el otro. Lo que hace o deja de hacer un tercero no lo sabemos.",
  },
  {
    id: "situacion-vinculo",
    tema: "vinculo",
    nombre: "Situación del vínculo · cómo está ahora",
    pregunta: "¿Cómo está el vínculo ahora mismo, visto desde dentro?",
    /*
     * La advertencia más fácil de incumplir sin darse cuenta: basta un «tu
     * pareja» para dejar fuera a media pregunta que llega a esta tirada.
     */
    advertencia:
      "No se presupone que haya vínculo, ni de qué tipo, ni con cuántas personas. El texto tiene que encajar igual para quien lleva quince años con alguien, para quien acaba de conocer a una persona y para quien no tiene a nadie en mente.",
  },
  {
    id: "pasado-vinculo",
    tema: "vinculo",
    nombre: "Pasado del vínculo · lo que se arrastra",
    pregunta: "¿Qué de lo vivido en otros vínculos sigue operando en éste?",
    advertencia:
      "Describe un patrón propio, no la culpa de un tercero. Nunca se afirma qué hizo o dejó de hacer otra persona.",
  },
  {
    id: "a-atender-vinculo",
    tema: "vinculo",
    nombre: "A atender en el vínculo · el patrón propio",
    /*
     * La familia más delicada del corpus entero. Un texto mal calibrado aquí no
     * es sólo impreciso: le dice a alguien cómo es su pareja, que es justo lo
     * que ni sabemos ni nos corresponde.
     */
    pregunta: "¿Qué conducta propia hay que mirar para que el vínculo respire?",
    advertencia:
      "Siempre sobre la conducta de quien consulta, jamás sobre la del otro, y nunca como diagnóstico. Queda prohibido cualquier texto que pueda leerse como «tu pareja es así».",
  },
  {
    id: "futuro-vinculo",
    tema: "vinculo",
    nombre: "Futuro del vínculo · hacia dónde se inclina",
    pregunta: "¿Hacia dónde se inclina el vínculo si nada cambia?",
    /*
     * Máximo riesgo del corpus: es la posición donde más se espera una
     * predicción y donde más caro sale darla.
     */
    advertencia:
      "Tendencia condicionada, nunca un hecho. Está prohibido decir si alguien volverá, se irá, llamará o dejará de hacerlo. Se describe hacia dónde empuja lo que ya hay.",
  },

  /* ── Declaradas, todavía sin escribir ─────────────────────────────────── */

  {
    id: "interior",
    tema: "general",
    nombre: "Interior · esperanzas y miedos",
    pregunta: "¿Qué se siente por dentro y no se dice?",
  },
  {
    id: "entorno",
    tema: "general",
    nombre: "Entorno · influencias externas",
    pregunta: "¿Qué aportan o imponen los demás?",
    advertencia:
      "No se afirma lo que un tercero piensa o siente: no lo sabemos. Se describe cómo llega al consultante, no qué ocurre en la cabeza de otro.",
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
 * Indica si existe una familia con ese identificador.
 *
 * Devuelve un predicado de tipo y no un booleano suelto porque para eso existe:
 * quien pregunta viene de fuera —el nombre de un fichero, un parámetro— y lo que
 * necesita a continuación es usar ese texto **como** `IdFamilia`. Con un
 * booleano tendría que afirmarlo con un `as`, que es exactamente la forma de
 * decir «confía en mí» que esta función evita.
 *
 * @param id Identificador a comprobar.
 * @returns `true`, y estrecha el tipo, si la familia existe.
 */
export function existeFamilia(id: string): id is IdFamilia {
  return FAMILIAS_POR_ID.has(id);
}
