import type { Valencia } from "@/motor-de-lectura/repositorio-de-corpus";
import { Panel } from "./panel";
import estilos from "./panel-de-significado.module.css";

/**
 * El significado de una carta en su posición.
 *
 * Es la superficie donde el usuario lee lo que ha pagado con su atención, y la
 * única que muestra corpus. Por eso importa más que ninguna otra que las
 * longitudes del corpus y esta maqueta se hayan decidido juntas: un límite
 * fijado sin mirar la pantalla se paga reescribiendo miles de piezas.
 *
 * **El orden de lectura no es arbitrario.** Primero la respuesta a *esta*
 * posición —el matiz de la familia, o el veredicto de sí/no— y después el
 * significado general de la carta. Al revés, el usuario lee un párrafo genérico
 * antes de saber qué pinta ahí, y la lente deja de notarse.
 *
 * No reimplementa el marco: se apoya en `Panel` con variante `enmarcado`, que ya
 * pone el borde dorado y las esquinas de filigrana.
 */

/** El veredicto de la tirada de sí/no, ya traducido. */
type VeredictoDeValencia = {
  readonly veredicto: Valencia;
  /** La palabra visible: «Sí», «No», «Quizá». Llega traducida. */
  readonly etiqueta: string;
  readonly motivo: string;
};

const CLASE_DE_VEREDICTO: Record<Valencia, string | undefined> = {
  si: estilos.afirmativo,
  no: estilos.negativo,
  quiza: estilos.incierto,
};

type PropiedadesDeSignificado = {
  /** Nombre de la posición, o de la carta cuando la tirada no tiene lente. */
  readonly encabezado: string;
  /** La lente de la familia. Ausente en los modos «base» y «valencia». */
  readonly matiz?: string;
  /** El significado de la carta. Nunca falta. */
  readonly base: string;
  /** Sólo en la tirada de sí/no. */
  readonly valencia?: VeredictoDeValencia;
};

/**
 * La respuesta a esta posición concreta, destacada sobre el significado general.
 *
 * Vive aparte para que el componente principal no tenga que ramificar dentro del
 * marcado, que es donde las tres composiciones se volverían ilegibles.
 *
 * @param props Propiedades del componente.
 * @param props.matiz La lente de la familia, si la tirada la usa.
 * @param props.valencia El veredicto de sí/no, si es esa tirada.
 */
function RespuestaDeLaPosicion({
  matiz,
  valencia,
}: Pick<PropiedadesDeSignificado, "matiz" | "valencia">) {
  if (valencia !== undefined) {
    return (
      <p className={estilos.destacado}>
        <strong
          className={`${estilos.veredicto} ${CLASE_DE_VEREDICTO[valencia.veredicto]}`}
        >
          {valencia.etiqueta}
        </strong>
        {valencia.motivo}
      </p>
    );
  } else if (matiz !== undefined) {
    return <p className={estilos.destacado}>{matiz}</p>;
  } else {
    /*
     * La tirada de una carta no tiene lente: su significado es el base y no hay
     * nada que destacar encima. El panel se queda en encabezado y texto.
     */
    return null;
  }
}

/**
 * Panel de significado.
 *
 * @param props Propiedades del componente.
 * @param props.encabezado Nombre de la posición, o de la carta si no hay lente.
 * @param props.matiz La lente de la familia.
 * @param props.base El significado de la carta.
 * @param props.valencia El veredicto de sí/no.
 */
export function PanelDeSignificado({
  encabezado,
  matiz,
  base,
  valencia,
}: PropiedadesDeSignificado) {
  const tieneDestacado = matiz !== undefined || valencia !== undefined;

  return (
    <Panel variante="enmarcado">
      <p className={estilos.encabezado}>{encabezado}</p>
      <RespuestaDeLaPosicion matiz={matiz} valencia={valencia} />
      <p className={tieneDestacado ? estilos.base : estilos.baseSola}>{base}</p>
    </Panel>
  );
}
