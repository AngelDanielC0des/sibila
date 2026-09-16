/**
 * El flujo de una lectura, de la pregunta a la síntesis.
 *
 * `reposo → barajando → seleccionando → revelando → sintetizando → completada`
 *
 * Es el corazón del motor y la razón de que exista la separación motor /
 * renderizador: el producto se ve muy distinto en escritorio y en móvil, pero
 * **la lectura es una sola** y las reglas de cuándo se puede hacer qué viven
 * aquí, una vez, probadas sin DOM.
 *
 * `avanzar()` es una función pura: mismo estado y misma acción, mismo
 * resultado. No baraja, no cobra, no pinta y no guarda nada. El azar entra ya
 * resuelto, dentro de la acción que empieza la lectura, porque una máquina de
 * estados que sortea por su cuenta no se puede probar.
 *
 * **Ninguna transición lanza.** Elegir una carta ya elegida o revelar cuando no
 * queda nada por revelar son respuestas válidas del sistema, no accidentes; ver
 * `docs/guia-de-arquitectura.md` §5.
 *
 * El muro de pago no es una fase. Es el momento en que están todas reveladas y
 * aún no se ha pedido la síntesis, y se consulta con `estaEnElMuro()`. Tenerlo
 * como fase propia duplicaría el estado sin añadir ninguna regla.
 */

import type { DefinicionDeTirada } from "./definicion-de-tirada";
import type { CartaDelMazo, Mazo } from "./mazo-de-cartas";
import { exito, fallo, type Resultado } from "./resultado";

/** Lo que no cambia en toda la lectura, desde que empieza hasta que termina. */
type DatosDeLectura = {
  readonly tirada: DefinicionDeTirada;
  /** Lo que escribió el usuario, o `null` si prefirió no escribir nada. */
  readonly pregunta: string | null;
  readonly mazo: Mazo;
};

/** Aún no hay lectura. */
export type EstadoEnReposo = { readonly fase: "reposo" };

/** El mazo se está mezclando delante del usuario. */
export type EstadoBarajando = DatosDeLectura & { readonly fase: "barajando" };

/** El abanico está desplegado y el usuario va eligiendo. */
export type EstadoSeleccionando = DatosDeLectura & {
  readonly fase: "seleccionando";
  /** Sitios del mazo ya elegidos, en el orden en que se eligieron. */
  readonly elegidas: readonly number[];
};

/** Las cartas se voltean de una en una, con su significado. */
export type EstadoRevelando = DatosDeLectura & {
  readonly fase: "revelando";
  readonly elegidas: readonly number[];
  readonly reveladas: number;
};

/** Se está generando el texto que relaciona todas las cartas. */
export type EstadoSintetizando = DatosDeLectura & {
  readonly fase: "sintetizando";
  readonly elegidas: readonly number[];
};

/** La lectura está entera. */
export type EstadoCompletada = DatosDeLectura & {
  readonly fase: "completada";
  readonly elegidas: readonly number[];
  readonly sintesis: string;
};

/** El estado de una lectura en cualquier momento. */
export type EstadoDeLectura =
  | EstadoEnReposo
  | EstadoBarajando
  | EstadoSeleccionando
  | EstadoRevelando
  | EstadoSintetizando
  | EstadoCompletada;

/** Lo que el usuario o la interfaz le piden a la lectura. */
export type Accion =
  | {
      readonly tipo: "empezar";
      readonly tirada: DefinicionDeTirada;
      readonly pregunta: string | null;
      readonly mazo: Mazo;
    }
  | { readonly tipo: "terminar-barajado" }
  | { readonly tipo: "seleccionar"; readonly indice: number }
  | { readonly tipo: "pasar-a-revelar" }
  | { readonly tipo: "revelar" }
  | { readonly tipo: "pedir-sintesis" }
  | { readonly tipo: "recibir-sintesis"; readonly texto: string }
  | { readonly tipo: "reiniciar" };

/** Por qué una acción no se pudo aplicar. Todas son situaciones de dominio. */
export type ErrorDeTransicion =
  | "fase-incorrecta"
  | "indice-fuera-de-rango"
  | "carta-ya-elegida"
  | "ya-estan-todas-elegidas"
  | "faltan-cartas-por-elegir"
  | "faltan-cartas-por-revelar"
  | "no-quedan-cartas-por-revelar";

/** El punto de partida de toda lectura. */
export const LECTURA_EN_REPOSO: EstadoEnReposo = { fase: "reposo" };

/** Resultado de cualquier transición. */
type Transicion = Resultado<EstadoDeLectura, ErrorDeTransicion>;

/**
 * Extrae lo que no cambia durante la lectura, para reconstruir la fase siguiente.
 *
 * @param estado Estado del que copiar los datos.
 * @returns Tirada, pregunta y mazo.
 */
function datosDe(estado: DatosDeLectura): DatosDeLectura {
  return { tirada: estado.tirada, pregunta: estado.pregunta, mazo: estado.mazo };
}

/**
 * Arranca una lectura con su tirada, su pregunta y un mazo ya barajado.
 *
 * @param estado Estado actual.
 * @param accion La acción de empezar, con el mazo ya sorteado fuera.
 * @returns La lectura barajando, o el motivo del rechazo.
 */
function empezarLectura(
  estado: EstadoDeLectura,
  accion: Extract<Accion, { tipo: "empezar" }>,
): Transicion {
  if (estado.fase !== "reposo") {
    return fallo("fase-incorrecta");
  } else {
    return exito({
      fase: "barajando",
      tirada: accion.tirada,
      pregunta: accion.pregunta,
      mazo: accion.mazo,
    });
  }
}

/**
 * Cierra la ceremonia del barajado y despliega el abanico.
 *
 * @param estado Estado actual.
 * @returns La lectura esperando selección, o el motivo del rechazo.
 */
function terminarBarajado(estado: EstadoDeLectura): Transicion {
  if (estado.fase !== "barajando") {
    return fallo("fase-incorrecta");
  } else {
    return exito({ ...datosDe(estado), fase: "seleccionando", elegidas: [] });
  }
}

/**
 * Añade una carta del abanico a las elegidas.
 *
 * @param estado Estado actual.
 * @param indice Sitio de la carta en el mazo.
 * @returns La lectura con una carta más, o el motivo del rechazo.
 */
function seleccionarCarta(estado: EstadoDeLectura, indice: number): Transicion {
  if (estado.fase !== "seleccionando") {
    return fallo("fase-incorrecta");
  } else if (estado.mazo[indice] === undefined) {
    return fallo("indice-fuera-de-rango");
  } else if (estado.elegidas.includes(indice)) {
    return fallo("carta-ya-elegida");
  } else if (estado.elegidas.length >= estado.tirada.numeroDeCartas) {
    return fallo("ya-estan-todas-elegidas");
  } else {
    return exito({ ...estado, elegidas: [...estado.elegidas, indice] });
  }
}

/**
 * Pasa del abanico al volteo, una vez elegidas todas las cartas.
 *
 * @param estado Estado actual.
 * @returns La lectura lista para revelar, o el motivo del rechazo.
 */
function pasarARevelar(estado: EstadoDeLectura): Transicion {
  if (estado.fase !== "seleccionando") {
    return fallo("fase-incorrecta");
  } else if (estado.elegidas.length < estado.tirada.numeroDeCartas) {
    return fallo("faltan-cartas-por-elegir");
  } else {
    return exito({
      ...datosDe(estado),
      fase: "revelando",
      elegidas: estado.elegidas,
      reveladas: 0,
    });
  }
}

/**
 * Voltea la siguiente carta.
 *
 * @param estado Estado actual.
 * @returns La lectura con una carta más revelada, o el motivo del rechazo.
 */
function revelarSiguiente(estado: EstadoDeLectura): Transicion {
  if (estado.fase !== "revelando") {
    return fallo("fase-incorrecta");
  } else if (estado.reveladas >= estado.tirada.numeroDeCartas) {
    return fallo("no-quedan-cartas-por-revelar");
  } else {
    return exito({ ...estado, reveladas: estado.reveladas + 1 });
  }
}

/**
 * Pide la síntesis conjunta.
 *
 * Es el único salto que hay detrás del muro de pago. La máquina no sabe nada de
 * cobros: quien la llama es responsable de haber reservado el pago antes, y la
 * regla de cobro de `CLAUDE.md` exige que sólo se capture cuando la síntesis ya
 * existe y está guardada.
 *
 * @param estado Estado actual.
 * @returns La lectura generando, o el motivo del rechazo.
 */
function pedirSintesis(estado: EstadoDeLectura): Transicion {
  if (estado.fase !== "revelando") {
    return fallo("fase-incorrecta");
  } else if (estado.reveladas < estado.tirada.numeroDeCartas) {
    return fallo("faltan-cartas-por-revelar");
  } else {
    return exito({
      ...datosDe(estado),
      fase: "sintetizando",
      elegidas: estado.elegidas,
    });
  }
}

/**
 * Da la lectura por terminada con su texto de síntesis.
 *
 * @param estado Estado actual.
 * @param texto La síntesis generada.
 * @returns La lectura completa, o el motivo del rechazo.
 */
function recibirSintesis(estado: EstadoDeLectura, texto: string): Transicion {
  if (estado.fase !== "sintetizando") {
    return fallo("fase-incorrecta");
  } else {
    return exito({
      ...datosDe(estado),
      fase: "completada",
      elegidas: estado.elegidas,
      sintesis: texto,
    });
  }
}

/**
 * Aplica una acción a una lectura.
 *
 * @param estado Estado actual de la lectura.
 * @param accion Lo que se quiere hacer.
 * @returns El estado siguiente, o la razón de dominio por la que no se pudo.
 */
export function avanzar(estado: EstadoDeLectura, accion: Accion): Transicion {
  if (accion.tipo === "reiniciar") {
    return exito(LECTURA_EN_REPOSO);
  } else if (accion.tipo === "empezar") {
    return empezarLectura(estado, accion);
  } else if (accion.tipo === "terminar-barajado") {
    return terminarBarajado(estado);
  } else if (accion.tipo === "seleccionar") {
    return seleccionarCarta(estado, accion.indice);
  } else if (accion.tipo === "pasar-a-revelar") {
    return pasarARevelar(estado);
  } else if (accion.tipo === "revelar") {
    return revelarSiguiente(estado);
  } else if (accion.tipo === "pedir-sintesis") {
    return pedirSintesis(estado);
  } else {
    return recibirSintesis(estado, accion.texto);
  }
}

/**
 * Indica si la lectura está parada en el muro de pago.
 *
 * Es decir: todas las cartas reveladas con su significado gratuito, y la
 * síntesis conjunta aún sin pedir. Es el corte de monetización del producto.
 *
 * @param estado Estado de la lectura.
 * @returns `true` si toca enseñar el muro.
 */
export function estaEnElMuro(estado: EstadoDeLectura): boolean {
  if (estado.fase !== "revelando") {
    return false;
  } else {
    return estado.reveladas >= estado.tirada.numeroDeCartas;
  }
}

/**
 * Devuelve las cartas elegidas, en el orden en que se eligieron.
 *
 * @param estado Estado de la lectura.
 * @returns Las cartas con su orientación, o vacío si aún no hay ninguna.
 */
export function cartasElegidas(estado: EstadoDeLectura): readonly CartaDelMazo[] {
  if (estado.fase === "reposo" || estado.fase === "barajando") {
    return [];
  } else {
    return estado.elegidas
      .map((indice) => estado.mazo[indice])
      .filter((carta): carta is CartaDelMazo => carta !== undefined);
  }
}
