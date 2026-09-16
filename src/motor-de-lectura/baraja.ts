/**
 * La baraja canónica de 78 cartas.
 *
 * Es la única fuente de verdad sobre qué cartas existen. El corpus valida su
 * cobertura contra esta lista, las rutas de la enciclopedia se generan desde
 * ella y el mazo se construye barajándola.
 *
 * Tradición Rider–Waite–Smith, que es la que siguen nuestros textos. Importa
 * para dos cartas concretas: aquí la Fuerza es la 8 y la Justicia la 11, al
 * revés que en la tradición de Marsella.
 */

/** Un arcano mayor o menor. */
export type Arcano = "mayor" | "menor";

/** Los cuatro palos de los arcanos menores. */
export type Palo = "bastos" | "copas" | "espadas" | "oros";

/** Cómo sale una carta en la tirada. */
export type Orientacion = "derecha" | "invertida";

/**
 * Una carta de la baraja.
 *
 * El `id` es un slug estable: aparece en la URL de la enciclopedia y es la clave
 * con la que el corpus indexa sus textos. **No se cambia nunca** una vez
 * publicado, porque rompería enlaces y desharía la correspondencia con el
 * corpus.
 */
export type Carta = {
  readonly id: string;
  readonly nombre: string;
  readonly arcano: Arcano;
  /** `null` en los arcanos mayores, que no pertenecen a ningún palo. */
  readonly palo: Palo | null;
  /** 0–21 en los mayores; 1–14 en los menores, donde 11–14 son las figuras. */
  readonly numero: number;
};

/** Las dos orientaciones posibles, para recorrerlas sin repetir el literal. */
export const ORIENTACIONES: readonly Orientacion[] = ["derecha", "invertida"];

/** Los cuatro palos en orden canónico. */
export const PALOS: readonly Palo[] = ["bastos", "copas", "espadas", "oros"];

export const NUMERO_DE_CARTAS = 78;
export const NUMERO_DE_ARCANOS_MAYORES = 22;
export const NUMERO_DE_CARTAS_POR_PALO = 14;

/**
 * Los arcanos mayores, en orden.
 *
 * Se escriben a mano porque sus nombres son irregulares y no se derivan de
 * ninguna regla.
 */
const ARCANOS_MAYORES: readonly Carta[] = [
  { id: "el-loco", nombre: "El Loco", arcano: "mayor", palo: null, numero: 0 },
  { id: "el-mago", nombre: "El Mago", arcano: "mayor", palo: null, numero: 1 },
  {
    id: "la-sacerdotisa",
    nombre: "La Sacerdotisa",
    arcano: "mayor",
    palo: null,
    numero: 2,
  },
  {
    id: "la-emperatriz",
    nombre: "La Emperatriz",
    arcano: "mayor",
    palo: null,
    numero: 3,
  },
  { id: "el-emperador", nombre: "El Emperador", arcano: "mayor", palo: null, numero: 4 },
  {
    id: "el-hierofante",
    nombre: "El Hierofante",
    arcano: "mayor",
    palo: null,
    numero: 5,
  },
  {
    id: "los-enamorados",
    nombre: "Los Enamorados",
    arcano: "mayor",
    palo: null,
    numero: 6,
  },
  { id: "el-carro", nombre: "El Carro", arcano: "mayor", palo: null, numero: 7 },
  { id: "la-fuerza", nombre: "La Fuerza", arcano: "mayor", palo: null, numero: 8 },
  { id: "el-ermitano", nombre: "El Ermitaño", arcano: "mayor", palo: null, numero: 9 },
  {
    id: "la-rueda-de-la-fortuna",
    nombre: "La Rueda de la Fortuna",
    arcano: "mayor",
    palo: null,
    numero: 10,
  },
  { id: "la-justicia", nombre: "La Justicia", arcano: "mayor", palo: null, numero: 11 },
  { id: "el-colgado", nombre: "El Colgado", arcano: "mayor", palo: null, numero: 12 },
  { id: "la-muerte", nombre: "La Muerte", arcano: "mayor", palo: null, numero: 13 },
  { id: "la-templanza", nombre: "La Templanza", arcano: "mayor", palo: null, numero: 14 },
  { id: "el-diablo", nombre: "El Diablo", arcano: "mayor", palo: null, numero: 15 },
  { id: "la-torre", nombre: "La Torre", arcano: "mayor", palo: null, numero: 16 },
  { id: "la-estrella", nombre: "La Estrella", arcano: "mayor", palo: null, numero: 17 },
  { id: "la-luna", nombre: "La Luna", arcano: "mayor", palo: null, numero: 18 },
  { id: "el-sol", nombre: "El Sol", arcano: "mayor", palo: null, numero: 19 },
  { id: "el-juicio", nombre: "El Juicio", arcano: "mayor", palo: null, numero: 20 },
  { id: "el-mundo", nombre: "El Mundo", arcano: "mayor", palo: null, numero: 21 },
];

/**
 * Los rangos de los arcanos menores, del as al rey.
 *
 * El índice del array más uno es el número de la carta, así que el orden de
 * esta lista es significativo y no debe alterarse.
 */
const RANGOS: readonly string[] = [
  "As",
  "Dos",
  "Tres",
  "Cuatro",
  "Cinco",
  "Seis",
  "Siete",
  "Ocho",
  "Nueve",
  "Diez",
  "Sota",
  "Caballo",
  "Reina",
  "Rey",
];

/**
 * Construye las catorce cartas de un palo.
 *
 * Los menores son perfectamente regulares, así que se generan en lugar de
 * escribirse: evita las erratas que produce teclear cincuenta y seis entradas
 * casi idénticas.
 *
 * @param palo Palo cuyas cartas se quieren construir.
 * @returns Las catorce cartas del palo, del as al rey.
 */
function construirPalo(palo: Palo): Carta[] {
  const cartas: Carta[] = [];

  for (let indice = 0; indice < RANGOS.length; indice += 1) {
    const rango = RANGOS[indice];

    if (rango === undefined) {
      throw new Error(`Rango ausente en el índice ${indice}`);
    } else {
      cartas.push({
        id: `${normalizarParaId(rango)}-de-${palo}`,
        nombre: `${rango} de ${capitalizar(palo)}`,
        arcano: "menor",
        palo,
        numero: indice + 1,
      });
    }
  }

  return cartas;
}

/**
 * Pasa un texto a minúsculas y le quita los acentos, para poder usarlo en un
 * identificador y en una URL.
 *
 * @param texto Texto de partida.
 * @returns El texto en minúsculas y sin diacríticos.
 */
function normalizarParaId(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Pone en mayúscula la primera letra de un texto.
 *
 * @param texto Texto de partida.
 * @returns El texto con la inicial en mayúscula.
 */
function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Construye los cincuenta y seis arcanos menores, palo a palo.
 *
 * @returns Los menores en orden canónico de palo y rango.
 */
function construirArcanosMenores(): Carta[] {
  const cartas: Carta[] = [];

  for (const palo of PALOS) {
    cartas.push(...construirPalo(palo));
  }

  return cartas;
}

/**
 * La baraja completa en orden canónico: los veintidós mayores y después los
 * cincuenta y seis menores, agrupados por palo.
 *
 * Este orden es el de referencia para la enciclopedia y para cualquier listado.
 * El mazo de una lectura se obtiene barajando esta lista, nunca alterándola.
 */
export const BARAJA: readonly Carta[] = [
  ...ARCANOS_MAYORES,
  ...construirArcanosMenores(),
];

/**
 * Índice de las cartas por su identificador, para búsqueda en tiempo constante.
 *
 * El dominio es fijo y diminuto, así que un mapa en memoria es la estructura
 * correcta. No hay motivo para consultar nada más pesado.
 */
const CARTAS_POR_ID: ReadonlyMap<string, Carta> = new Map(
  BARAJA.map((carta) => [carta.id, carta]),
);

/**
 * Busca una carta por su identificador.
 *
 * @param id Identificador de la carta, en forma de slug.
 * @returns La carta, o `undefined` si el identificador no existe.
 */
export function buscarCartaPorId(id: string): Carta | undefined {
  return CARTAS_POR_ID.get(id);
}

/**
 * Indica si un identificador corresponde a una carta de la baraja.
 *
 * @param id Identificador a comprobar.
 * @returns `true` si la carta existe.
 */
export function existeCarta(id: string): boolean {
  return CARTAS_POR_ID.has(id);
}
