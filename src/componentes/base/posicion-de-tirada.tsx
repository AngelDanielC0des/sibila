import type { ReactNode } from "react";
import estilos from "./posicion-de-tirada.module.css";

/**
 * Un hueco de la tirada, con su nombre.
 *
 * El nombre va **siempre visible**, no escondido tras un icono ni en un
 * emergente. La posición es lo que modifica el significado de la carta —es la
 * lente de la que habla `docs/plan-v1.md` §4A.1—, así que leer una carta sin
 * saber en qué posición cayó es leer otra cosa.
 *
 * El hueco vacío late despacio. No es adorno: es lo que indica cuál toca cubrir
 * sin tener que escribirlo en ninguna parte.
 */

type PropiedadesDePosicion = {
  /** Cómo se llama esta posición: «Dónde estás ahora», «Qué te frena»… */
  readonly nombre: string;
  /** Su orden dentro de la tirada, empezando en uno. */
  readonly ordinal: number;
  readonly totalDePosiciones: number;
  /** La carta, cuando ya hay una. */
  readonly children?: ReactNode;
};

/**
 * Hueco de una tirada.
 *
 * @param props Propiedades del componente.
 * @param props.nombre Nombre de la posición.
 * @param props.ordinal Su orden dentro de la tirada, empezando en uno.
 * @param props.totalDePosiciones Cuántas posiciones tiene la tirada.
 * @param props.children La carta, si ya se ha colocado.
 */
export function PosicionDeTirada({
  nombre,
  ordinal,
  totalDePosiciones,
  children,
}: PropiedadesDePosicion) {
  const estaVacia = children === undefined;

  return (
    <div className={estilos.posicion}>
      {estaVacia ? (
        <div
          className={`${estilos.hueco} ${estilos.vacio}`}
          role="img"
          aria-label={`Posición ${ordinal} de ${totalDePosiciones}, ${nombre}. Sin carta todavía.`}
        >
          <span className={estilos.ordinal} aria-hidden="true">
            {ordinal}
          </span>
        </div>
      ) : (
        <div className={estilos.hueco}>{children}</div>
      )}

      <p className={estilos.nombre}>{nombre}</p>
    </div>
  );
}
