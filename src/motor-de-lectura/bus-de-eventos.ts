/**
 * El bus de eventos: cómo el motor le cuenta al renderizador lo que ha pasado.
 *
 * **La dirección es única y está impuesta por los tipos, no por la disciplina.**
 * `crearBusDeEventos()` devuelve dos caras del mismo objeto: un `Emisor`, que
 * sólo sabe emitir y es lo que recibe el motor, y una `Escucha`, que sólo sabe
 * suscribirse y es lo que reciben los renderizadores. Un renderizador no puede
 * emitir aunque quiera, porque su tipo no tiene ese método.
 *
 * Esto es lo que sostiene la regla de `CLAUDE.md`: los renderizadores sólo
 * pintan. La lectura ocurre una vez, en el motor, y escritorio y móvil se
 * enteran igual.
 *
 * **La pregunta del usuario no viaja por aquí.** Es texto libre y personal, y
 * un bus de eventos acaba conectado a registros y a analítica antes o después.
 * Los eventos dicen si hay pregunta, nunca cuál es.
 */

import type { IdTirada, Posicion } from "./definicion-de-tirada";
import type { CartaDelMazo } from "./mazo-de-cartas";

/**
 * Los eventos del motor y lo que lleva cada uno.
 *
 * Los nombres siguen la forma `dominio:accion` del glosario. Añadir un evento
 * es añadir una entrada aquí: suscribirse a uno que no exista, o leer un campo
 * que no lleve, no compila.
 */
export type MapaDeEventos = {
  /** Se ha elegido tirada y arranca el ritual. */
  "lectura:empezada": {
    readonly tirada: IdTirada;
    /** Si el usuario escribió pregunta. Nunca cuál: ver la nota del módulo. */
    readonly tienePregunta: boolean;
  };
  /** El mazo ya está mezclado y el abanico se puede desplegar. */
  "mazo:barajado": { readonly tirada: IdTirada };
  /** El usuario ha tomado una carta del abanico. */
  "carta:seleccionada": {
    readonly indice: number;
    /** Qué número de carta es, empezando en uno. */
    readonly orden: number;
    readonly quedan: number;
  };
  /** Una carta se ha volteado y su significado ya se puede leer. */
  "carta:revelada": {
    readonly orden: number;
    readonly carta: CartaDelMazo;
    readonly posicion: Posicion;
  };
  /** Todo lo gratuito está entregado. Es el corte de monetización. */
  "muro:alcanzado": { readonly tirada: IdTirada };
  /** Se ha pedido la síntesis conjunta, ya del lado de pago. */
  "sintesis:pedida": { readonly tirada: IdTirada };
  /** La lectura está entera. */
  "lectura:completada": { readonly tirada: IdTirada };
  /** Se abandona o se empieza otra. */
  "lectura:reiniciada": { readonly tirada: IdTirada | null };
};

/** Nombre de cualquier evento del motor. */
export type NombreDeEvento = keyof MapaDeEventos;

/** Quien atiende un evento concreto. */
export type Suscriptor<N extends NombreDeEvento> = (carga: MapaDeEventos[N]) => void;

/** La cara del bus que ve el motor. Sólo puede contar lo que pasa. */
export type Emisor = {
  emitir: <N extends NombreDeEvento>(nombre: N, carga: MapaDeEventos[N]) => void;
};

/** La cara del bus que ven los renderizadores. Sólo pueden enterarse. */
export type Escucha = {
  /**
   * @returns La función que cancela esta suscripción.
   */
  suscribir: <N extends NombreDeEvento>(
    nombre: N,
    suscriptor: Suscriptor<N>,
  ) => () => void;
};

/** Las dos caras del mismo bus. */
export type BusDeEventos = {
  readonly emisor: Emisor;
  readonly escucha: Escucha;
};

/** Qué hacer cuando un suscriptor revienta. */
export type InformeDeFallo = (motivo: unknown) => void;

/**
 * Avisa de un suscriptor que ha reventado, sin detener a los demás.
 *
 * Que un renderizador falle al pintar no puede impedir que los otros se
 * enteren, ni cortar el ritual a mitad. Pero tragarse el error sería peor: se
 * relanza fuera del bucle, de modo que llega al manejador global de errores y
 * se ve, mientras la emisión sigue su curso.
 *
 * @param motivo Lo que lanzó el suscriptor.
 */
function relanzarFueraDelBucle(motivo: unknown): void {
  queueMicrotask(() => {
    throw motivo;
  });
}

/**
 * Crea un bus de eventos vacío.
 *
 * @param informarDeFallo Qué hacer con el error de un suscriptor. Se inyecta
 *   para poder observarlo en las pruebas sin lanzar errores al proceso; por
 *   defecto, relanzarlo al manejador global.
 * @returns El emisor para el motor y la escucha para los renderizadores.
 */
export function crearBusDeEventos(
  informarDeFallo: InformeDeFallo = relanzarFueraDelBucle,
): BusDeEventos {
  const porEvento = new Map<NombreDeEvento, Set<Suscriptor<NombreDeEvento>>>();

  const suscribir = <N extends NombreDeEvento>(
    nombre: N,
    suscriptor: Suscriptor<N>,
  ): (() => void) => {
    const suscriptores = porEvento.get(nombre) ?? new Set();
    porEvento.set(nombre, suscriptores);
    suscriptores.add(suscriptor as Suscriptor<NombreDeEvento>);

    return () => {
      suscriptores.delete(suscriptor as Suscriptor<NombreDeEvento>);
    };
  };

  const emitir = <N extends NombreDeEvento>(nombre: N, carga: MapaDeEventos[N]): void => {
    /*
     * Se recorre una copia: un suscriptor puede cancelarse a sí mismo al
     * atender el evento —es lo normal en un efecto de React que se desmonta— y
     * modificar el conjunto mientras se itera se saltaría a su vecino.
     */
    const suscriptores = [...(porEvento.get(nombre) ?? [])];

    for (const suscriptor of suscriptores) {
      try {
        (suscriptor as Suscriptor<N>)(carga);
      } catch (motivo) {
        informarDeFallo(motivo);
      }
    }
  };

  return { emisor: { emitir }, escucha: { suscribir } };
}
