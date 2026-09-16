import type { Glifo } from "./glifos";
import estilos from "./simbolo.module.css";

type PropiedadesDeSimbolo = {
  readonly glifo: Glifo;
  /**
   * Un glifo que solo adorna se oculta a la tecnología asistiva; uno que aporta
   * significado —el planeta de una carta, su signo— se anuncia por su nombre.
   *
   * No tiene valor por defecto a propósito: es una decisión de accesibilidad y
   * quien coloca el glifo es quien sabe cuál de las dos cosas está haciendo.
   */
  readonly esDecorativo: boolean;
};

/**
 * Muestra un glifo zodiacal, planetario o de aspecto.
 *
 * Va en una caja de ancho fijo. Los glifos tienen anchos muy distintos entre sí,
 * y sin esa caja el texto daría saltos mientras se decodifica, que es
 * exactamente el efecto contrario al buscado.
 *
 * @param props Propiedades del componente.
 * @param props.glifo Símbolo y nombre.
 * @param props.esDecorativo Si solo adorna, o si aporta significado.
 */
export function Simbolo({ glifo, esDecorativo }: PropiedadesDeSimbolo) {
  if (esDecorativo) {
    return (
      <span className={estilos.simbolo} aria-hidden="true">
        {glifo.simbolo}
      </span>
    );
  } else {
    return (
      <span className={estilos.simbolo} role="img" aria-label={glifo.nombre}>
        {glifo.simbolo}
      </span>
    );
  }
}
