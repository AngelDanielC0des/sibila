/**
 * Lógica de la decodificación de texto.
 *
 * El texto no aparece: se resuelve. Cada carácter pasa por glifos zodiacales y
 * planetarios antes de fijarse en su letra, y esa imagen —símbolos antiguos
 * resolviéndose por medio de una máquina— es el concepto entero del producto en
 * una sola animación.
 *
 * Aquí solo vive el cálculo, sin DOM ni temporizadores, para poder probarlo.
 */

/** Cuánto pesa el orden de lectura frente al azar al repartir los umbrales. */
const PESO_DEL_ORDEN = 0.72;

/** Cuánto desordena el azar ese reparto. */
const PESO_DEL_AZAR = 0.34;

/**
 * El reparto de umbrales de un texto.
 *
 * Se calcula una sola vez, al empezar: si se recalculara en cada fotograma, un
 * carácter ya resuelto podría volver a ser glifo, y el efecto se leería como un
 * parpadeo en lugar de como algo que se aclara.
 */
export type PlanDeDecodificacion = {
  readonly texto: string;
  /** Avance a partir del cual cada carácter queda fijado, de 0 a 1. */
  readonly umbrales: readonly number[];
};

/**
 * Indica si un carácter participa en la decodificación.
 *
 * Los espacios y los saltos de línea no se sustituyen nunca. Cambiarlos
 * desdibujaría la silueta de las palabras, y con ella la sensación de que hay un
 * texto ahí debajo esperando a resolverse.
 *
 * @param caracter Carácter a comprobar.
 * @returns `true` si debe pasar por glifos.
 */
export function esDecodificable(caracter: string): boolean {
  return caracter.trim() !== "";
}

/**
 * Reparte los umbrales de resolución de un texto.
 *
 * El reparto es de izquierda a derecha, como se lee, pero con holgura: sin ella
 * el efecto sería un barrido recto y mecánico. Con ella, el borde queda
 * irregular y parece que el texto se aclara solo.
 *
 * @param texto Texto a decodificar.
 * @param azar Función que devuelve un número de 0 a 1. Se inyecta para poder
 *   fijarla en las pruebas.
 * @returns El plan, con un umbral por carácter.
 */
export function planificarDecodificacion(
  texto: string,
  azar: () => number,
): PlanDeDecodificacion {
  const umbrales: number[] = [];
  const caracteres = [...texto];

  for (let indice = 0; indice < caracteres.length; indice += 1) {
    const caracter = caracteres[indice];

    if (caracter === undefined || !esDecodificable(caracter)) {
      umbrales.push(0);
    } else {
      const porOrden = (indice / Math.max(1, caracteres.length - 1)) * PESO_DEL_ORDEN;
      umbrales.push(Math.min(1, porOrden + azar() * PESO_DEL_AZAR));
    }
  }

  return { texto, umbrales };
}

/**
 * Indica si un carácter ya está fijado a un avance dado.
 *
 * @param plan Plan de decodificación.
 * @param indice Posición del carácter.
 * @param avance Avance de la animación, de 0 a 1.
 * @returns `true` si el carácter ya muestra su letra.
 */
export function estaResuelto(
  plan: PlanDeDecodificacion,
  indice: number,
  avance: number,
): boolean {
  const umbral = plan.umbrales[indice];

  if (umbral === undefined) {
    return true;
  } else {
    return avance >= umbral;
  }
}

/**
 * Cuántos caracteres quedan por resolver.
 *
 * @param plan Plan de decodificación.
 * @param avance Avance de la animación, de 0 a 1.
 * @returns El número de caracteres aún en glifo.
 */
export function pendientes(plan: PlanDeDecodificacion, avance: number): number {
  let cuenta = 0;

  for (let indice = 0; indice < plan.umbrales.length; indice += 1) {
    if (!estaResuelto(plan, indice, avance)) {
      cuenta += 1;
    }
  }

  return cuenta;
}
