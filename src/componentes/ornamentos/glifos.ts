/**
 * Glifos zodiacales, planetarios y de aspecto.
 *
 * Son material tipográfico, no imágenes: los usa la enciclopedia de cartas para
 * mostrar las correspondencias tradicionales, y el efecto de decodificación de
 * texto como reserva de la que sacar caracteres antes de resolver la letra.
 *
 * Todos van seguidos del selector de variación de texto. Sin él, varios sistemas
 * —iOS en particular— pintan Venus, Marte y los signos del zodiaco como emoji a
 * color, que rompería de golpe la disciplina de paleta del proyecto: un símbolo
 * que llega ya coloreado no puede heredar el oro.
 */

/**
 * Selector de variación de texto, U+FE0E.
 *
 * Fuerza la presentación tipográfica de un carácter que también tiene forma de
 * emoji. Sobre los que no la tienen, se ignora sin efecto alguno.
 */
const VARIACION_DE_TEXTO = "︎";

/** Un símbolo con su nombre, para cuando se muestra con significado. */
export type Glifo = {
  readonly simbolo: string;
  readonly nombre: string;
};

/**
 * Añade el selector de variación a un símbolo.
 *
 * @param simbolo Carácter de partida.
 * @param nombre Nombre del glifo.
 * @returns El glifo listo para usar.
 */
function comoTexto(simbolo: string, nombre: string): Glifo {
  return { simbolo: simbolo + VARIACION_DE_TEXTO, nombre };
}

/** Los doce signos, en orden zodiacal. */
export const GLIFOS_ZODIACALES: readonly Glifo[] = [
  comoTexto("♈", "Aries"),
  comoTexto("♉", "Tauro"),
  comoTexto("♊", "Géminis"),
  comoTexto("♋", "Cáncer"),
  comoTexto("♌", "Leo"),
  comoTexto("♍", "Virgo"),
  comoTexto("♎", "Libra"),
  comoTexto("♏", "Escorpio"),
  comoTexto("♐", "Sagitario"),
  comoTexto("♑", "Capricornio"),
  comoTexto("♒", "Acuario"),
  comoTexto("♓", "Piscis"),
];

/** Los siete clásicos más los tres modernos, en orden de distancia al Sol. */
export const GLIFOS_PLANETARIOS: readonly Glifo[] = [
  comoTexto("☉", "Sol"),
  comoTexto("☽", "Luna"),
  comoTexto("☿", "Mercurio"),
  comoTexto("♀", "Venus"),
  comoTexto("♂", "Marte"),
  comoTexto("♃", "Júpiter"),
  comoTexto("♄", "Saturno"),
  comoTexto("♅", "Urano"),
  comoTexto("♆", "Neptuno"),
  comoTexto("♇", "Plutón"),
];

/**
 * Aspectos y nodos.
 *
 * No se usan todavía —la astrología llega en la v2— pero entran ya en la reserva
 * de decodificación, donde lo que importa es que el repertorio sea variado y se
 * lea como escritura arcana.
 */
export const GLIFOS_DE_ASPECTO: readonly Glifo[] = [
  comoTexto("☌", "Conjunción"),
  comoTexto("☍", "Oposición"),
  comoTexto("△", "Trígono"),
  comoTexto("□", "Cuadratura"),
  comoTexto("⚹", "Sextil"),
  comoTexto("☊", "Nodo norte"),
  comoTexto("☋", "Nodo sur"),
];

/**
 * Reserva de la que el efecto de decodificación saca caracteres.
 *
 * El texto final existe en el DOM desde el primer pintado; estos glifos solo se
 * pintan encima mientras se resuelve. Ver `docs/plan-tarot.md` §3.5.
 */
export const RESERVA_DE_DECODIFICACION: readonly string[] = [
  ...GLIFOS_ZODIACALES,
  ...GLIFOS_PLANETARIOS,
  ...GLIFOS_DE_ASPECTO,
].map((glifo) => glifo.simbolo);

/**
 * Devuelve un glifo cualquiera de la reserva.
 *
 * @param azar Función que devuelve un número de 0 a 1. Se inyecta para poder
 *   fijarla en las pruebas.
 * @returns Un símbolo de la reserva.
 */
export function glifoAlAzar(azar: () => number): string {
  const indice = Math.floor(azar() * RESERVA_DE_DECODIFICACION.length);

  return RESERVA_DE_DECODIFICACION[indice] ?? RESERVA_DE_DECODIFICACION[0] ?? "";
}
