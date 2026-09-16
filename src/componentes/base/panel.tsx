import type { ReactNode } from "react";
import { MarcoDeFiligrana } from "@/componentes/ornamentos/filigrana";
import estilos from "./panel.module.css";

/**
 * Superficie contenedora.
 *
 * Es el componente más sencillo del catálogo y el que más disciplina impone:
 * **no todo es un panel.** Borde, relleno, radio y sombra dicen «esto es un
 * objeto aparte», y gastarlos en cada bloque aplana la jerarquía en lugar de
 * construirla. Se usa cuando algo es de verdad una unidad separada: el
 * significado de una carta, el muro de pago, un diálogo.
 */

/** Cuánto se separa el panel de la superficie que lo rodea. */
export type VarianteDePanel = "plano" | "elevado" | "enmarcado";

const CLASE_DE_VARIANTE: Record<VarianteDePanel, string | undefined> = {
  plano: undefined,
  elevado: estilos.elevado,
  enmarcado: estilos.enmarcado,
};

type PropiedadesDePanel = {
  readonly children: ReactNode;
  readonly variante?: VarianteDePanel;
  readonly titulo?: string;
};

/**
 * Panel.
 *
 * @param props Propiedades del componente.
 * @param props.children Contenido del panel.
 * @param props.variante Plano, elevado, o enmarcado con filigrana.
 * @param props.titulo Encabezado opcional.
 */
export function Panel({ children, variante = "plano", titulo }: PropiedadesDePanel) {
  const clase = [estilos.panel, CLASE_DE_VARIANTE[variante]]
    .filter((parte) => parte !== undefined)
    .join(" ");

  return (
    <section className={clase}>
      {variante === "enmarcado" ? <MarcoDeFiligrana /> : null}
      {titulo === undefined ? null : <h3 className={estilos.titulo}>{titulo}</h3>}
      <div className={estilos.contenido}>{children}</div>
    </section>
  );
}
