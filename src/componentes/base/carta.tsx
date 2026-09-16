"use client";

import type { Carta as CartaDeBaraja, Orientacion } from "@/motor-de-lectura/baraja";
import { aNumeroRomano } from "@/motor-de-lectura/numeracion";
import estilos from "./carta.module.css";

/**
 * Una carta de la baraja, boca abajo o revelada.
 *
 * **La identidad de la carta no llega hasta que se revela.** La propiedad
 * `carta` es opcional a propósito: mientras la carta está boca abajo, quien la
 * monta no le pasa cuál es, así que no hay nada que espiar con las herramientas
 * del navegador. En un producto de tarot eso no es un detalle: si el nombre está
 * en el DOM antes de voltear, la ceremonia entera es teatro.
 *
 * El componente cambia de naturaleza según su papel. Si se le da algo que hacer
 * al pulsarla, es un botón y se anuncia por lo que va a ocurrir; si no, es
 * contenido y se anuncia por lo que muestra.
 */

/** Dorso común a las setenta y ocho. Todas comparten el mismo, y por eso es uno. */
function DibujoDeDorso() {
  return (
    <svg
      className={estilos.dibujoDeDorso}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.7"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="46" />
      <circle cx="50" cy="50" r="34" />
      <circle cx="50" cy="50" r="15" />
      <circle cx="50" cy="50" r="3" fill="currentColor" stroke="none" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((grados) => {
        const radianes = (grados * Math.PI) / 180;
        return (
          <line
            key={grados}
            x1={50 + Math.cos(radianes) * 15}
            y1={50 + Math.sin(radianes) * 15}
            x2={50 + Math.cos(radianes) * 34}
            y2={50 + Math.sin(radianes) * 34}
          />
        );
      })}
    </svg>
  );
}

/**
 * Cómo se numera una carta según su arcano.
 *
 * @param carta Carta a numerar.
 * @returns El número en romano para los mayores, en arábigo para los menores.
 */
function numeroVisible(carta: CartaDeBaraja): string {
  if (carta.arcano === "mayor") {
    return aNumeroRomano(carta.numero);
  } else {
    return String(carta.numero);
  }
}

type PropiedadesDeCara = {
  readonly carta: CartaDeBaraja | undefined;
  readonly orientacion: Orientacion;
};

/**
 * La cara de la carta.
 *
 * Funciona sin ilustración: con el nombre y el número ya es una carta legible.
 * Es la misma resiliencia que con los clips —el producto no depende de que un
 * recurso exista— y significa que se puede jugar una lectura entera antes de
 * tener una sola lámina dibujada.
 *
 * @param props Propiedades del componente.
 * @param props.carta Carta mostrada, si ya se conoce.
 * @param props.orientacion Cómo salió en la tirada.
 */
function CaraDeCarta({ carta, orientacion }: PropiedadesDeCara) {
  if (carta === undefined) {
    return <span className={`${estilos.cara} ${estilos.frente}`} />;
  } else {
    return (
      <span className={`${estilos.cara} ${estilos.frente}`}>
        <span className={estilos.numero}>{numeroVisible(carta)}</span>
        <span className={estilos.nombre}>{carta.nombre}</span>

        {orientacion === "invertida" ? (
          <span className={estilos.marcaDeInvertida}>Invertida</span>
        ) : null}
      </span>
    );
  }
}

type PropiedadesDeCarta = {
  /** Solo se pasa cuando la carta ya puede conocerse. */
  readonly carta?: CartaDeBaraja;
  readonly orientacion?: Orientacion;
  readonly estaRevelada: boolean;
  /** Si está, la carta es un botón. Si no, es contenido. */
  readonly alPulsar?: () => void;
  /** Qué va a ocurrir al pulsarla. Obligatorio si es pulsable. */
  readonly etiquetaDeAccion?: string;
  readonly estaElegida?: boolean;
  /** Bloquea la carta **y** explica por qué. */
  readonly motivoDeBloqueo?: string;
};

/**
 * Describe la carta para quien no la ve.
 *
 * @param carta Carta mostrada, si se conoce.
 * @param orientacion Cómo salió.
 * @returns El texto que anuncia un lector de pantalla.
 */
function describir(carta: CartaDeBaraja | undefined, orientacion: Orientacion): string {
  if (carta === undefined) {
    return "Carta boca abajo";
  } else if (orientacion === "invertida") {
    return `${carta.nombre}, invertida`;
  } else {
    return carta.nombre;
  }
}

/**
 * Carta de tarot.
 *
 * @param props Propiedades del componente.
 * @param props.carta Carta mostrada, solo cuando ya puede conocerse.
 * @param props.orientacion Derecha o invertida.
 * @param props.estaRevelada Si muestra la cara o el dorso.
 * @param props.alPulsar Qué hacer al pulsarla. Su ausencia la vuelve contenido.
 * @param props.etiquetaDeAccion Qué va a ocurrir al pulsarla.
 * @param props.estaElegida Si ya fue seleccionada del abanico.
 * @param props.motivoDeBloqueo Bloquea la carta y explica por qué.
 */
export function Carta({
  carta,
  orientacion = "derecha",
  estaRevelada,
  alPulsar,
  etiquetaDeAccion,
  estaElegida = false,
  motivoDeBloqueo,
}: PropiedadesDeCarta) {
  const esPulsable = alPulsar !== undefined;

  const atributos = {
    className: esPulsable ? `${estilos.carta} ${estilos.pulsable}` : estilos.carta,
    "data-revelada": estaRevelada,
    "data-orientacion": orientacion,
    "data-elegida": estaElegida,
  };

  const interior = (
    <span className={estilos.interior}>
      <span className={`${estilos.cara} ${estilos.dorso}`}>
        <DibujoDeDorso />
      </span>
      <CaraDeCarta carta={carta} orientacion={orientacion} />
    </span>
  );

  if (!esPulsable) {
    return (
      <div {...atributos} role="img" aria-label={describir(carta, orientacion)}>
        {interior}
      </div>
    );
  } else {
    const estaInactiva = motivoDeBloqueo !== undefined;

    return (
      <button
        {...atributos}
        type="button"
        onClick={estaInactiva ? undefined : alPulsar}
        aria-disabled={estaInactiva}
        aria-pressed={estaElegida}
        aria-label={
          motivoDeBloqueo ??
          `${etiquetaDeAccion ?? "Elegir"}. ${describir(carta, orientacion)}`
        }
      >
        {interior}
      </button>
    );
  }
}
