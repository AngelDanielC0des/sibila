"use client";

import { useId, type ReactNode } from "react";
import estilos from "./boton.module.css";

/**
 * Botón.
 *
 * Cumple los siete estados obligatorios de `docs/guia-de-diseno.md` §6.1:
 * reposo, hover, foco, activo, bloqueado, cargando y error.
 *
 * Dos decisiones que merecen explicación:
 *
 * **No existe una propiedad «deshabilitado».** Existe `motivoDeBloqueo`, y su
 * presencia es lo que bloquea. Si no se puede explicar por qué un botón no
 * responde, no se puede bloquear: la regla de la guía queda forzada por el
 * sistema de tipos en lugar de confiada a la disciplina.
 *
 * **Bloquear no es `disabled`.** Un botón con ese atributo no recibe foco, así
 * que quien navega con teclado o con lector de pantalla nunca llega a él y nunca
 * se entera del motivo. Se usa `aria-disabled`, que mantiene el botón alcanzable
 * y anunciado, y es el manejador quien ignora la pulsación.
 */

/** Peso visual del botón dentro de la jerarquía de una pantalla. */
export type VarianteDeBoton = "primario" | "secundario" | "sutil";

const CLASE_DE_VARIANTE: Record<VarianteDeBoton, string | undefined> = {
  primario: estilos.primario,
  secundario: estilos.secundario,
  sutil: estilos.sutil,
};

type PropiedadesDeBoton = {
  readonly children: ReactNode;
  readonly variante?: VarianteDeBoton;
  readonly tipo?: "button" | "submit";
  readonly alPulsar?: () => void;
  /** Bloquea el botón **y** explica por qué. Sin motivo no hay bloqueo. */
  readonly motivoDeBloqueo?: string;
  /** Muestra el indicador y evita el doble envío mientras dura la acción. */
  readonly estaCargando?: boolean;
  /** Qué ha fallado y qué hacer. Nunca una disculpa. */
  readonly error?: string;
};

/**
 * Indicador de carga, en el mismo lenguaje que los anillos de astrolabio.
 *
 * El arco abierto es lo que hace legible el giro: un círculo completo girando no
 * se distingue de uno quieto.
 */
function IndicadorDeCarga() {
  return (
    <svg
      className={estilos.indicador}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 3 A9 9 0 0 1 21 12" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" opacity="0.25" />
    </svg>
  );
}

type PropiedadesDeNota = {
  readonly id: string;
  readonly texto: string;
  readonly esError: boolean;
};

/**
 * Nota bajo el botón: el motivo del bloqueo, o qué ha fallado.
 *
 * @param props Propiedades del componente.
 * @param props.id Identificador al que apunta `aria-describedby`.
 * @param props.texto Lo que se explica.
 * @param props.esError Si lo que se explica es un fallo.
 */
function NotaDelBoton({ id, texto, esError }: PropiedadesDeNota) {
  const clase = esError ? `${estilos.motivo} ${estilos.motivoDeError}` : estilos.motivo;

  return (
    <span id={id} className={clase}>
      {texto}
    </span>
  );
}

/**
 * Botón con los siete estados.
 *
 * @param props Propiedades del componente.
 * @param props.children Texto del botón. Dice lo que va a pasar, no dónde lleva.
 * @param props.variante Peso visual dentro de la pantalla.
 * @param props.tipo Tipo nativo del botón.
 * @param props.alPulsar Qué hacer al pulsarlo.
 * @param props.motivoDeBloqueo Bloquea el botón y explica por qué.
 * @param props.estaCargando Si la acción está en curso.
 * @param props.error Qué ha fallado y qué hacer.
 */
export function Boton({
  children,
  variante = "primario",
  tipo = "button",
  alPulsar,
  motivoDeBloqueo,
  estaCargando = false,
  error,
}: PropiedadesDeBoton) {
  const identificadorDeNota = useId();
  const tieneError = error !== undefined;
  const nota = error ?? motivoDeBloqueo;

  /*
   * Un botón cargando no se vuelve a pulsar: es de donde salen los envíos
   * duplicados y, en nuestro caso, los cobros repetidos.
   */
  const estaInactivo = motivoDeBloqueo !== undefined || estaCargando;

  const manejarPulsacion = () => {
    if (estaInactivo || alPulsar === undefined) {
      return;
    } else {
      alPulsar();
    }
  };

  return (
    <span className={estilos.envoltorio}>
      <button
        type={tipo}
        className={`${estilos.boton} ${CLASE_DE_VARIANTE[variante]}`}
        onClick={manejarPulsacion}
        aria-disabled={estaInactivo}
        aria-busy={estaCargando}
        aria-describedby={nota === undefined ? undefined : identificadorDeNota}
        data-estado={tieneError ? "error" : undefined}
      >
        {estaCargando ? <IndicadorDeCarga /> : null}
        {children}
      </button>

      {nota === undefined ? null : (
        <NotaDelBoton id={identificadorDeNota} texto={nota} esError={tieneError} />
      )}
    </span>
  );
}
