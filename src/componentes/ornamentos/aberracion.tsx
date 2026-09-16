import type { ReactNode } from "react";
import estilos from "./aberracion.module.css";

type PropiedadesDeAberracion = {
  readonly children: ReactNode;
  /** El tratamiento de texto usa sombra tipográfica en vez de filtro. */
  readonly esTexto?: boolean;
};

/**
 * Aberración cromática: la separación espectral de los bordes.
 *
 * Un holograma real descompone la luz en sus extremos, y esa franja va del
 * violeta al azul. Es la física del concepto, y la razón por la que el violeta
 * existe en la paleta: **solo aparece aquí**, en bordes y desplazamientos, nunca
 * como relleno ni como color de texto.
 *
 * Sobre texto se resuelve con sombra tipográfica, que es mucho más barata que un
 * filtro y se lee igual.
 *
 * @param props Propiedades del componente.
 * @param props.children Sujeto al que se aplica el tratamiento.
 * @param props.esTexto Si el sujeto es texto.
 */
export function Aberracion({ children, esTexto = false }: PropiedadesDeAberracion) {
  const clase = esTexto ? estilos.aberracionTexto : estilos.aberracion;

  return <span className={clase}>{children}</span>;
}
