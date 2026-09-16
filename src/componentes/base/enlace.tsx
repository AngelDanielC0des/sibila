import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navegacion";
import type { VarianteDeBoton } from "./boton";
import estilos from "./boton.module.css";

/**
 * Un enlace con el aspecto de un botón.
 *
 * **No es un botón y no debe serlo.** Un botón ejecuta una acción en la página;
 * un enlace lleva a otro sitio. Confundirlos es el error de accesibilidad más
 * común que existe: un `<button>` que navega rompe el clic central, «abrir en
 * pestaña nueva», el arrastre a marcadores y la navegación sin JavaScript, y se
 * anuncia mal a los lectores de pantalla.
 *
 * Por eso son dos componentes con la misma cara y distinta semántica. La cara
 * sale literalmente de `boton.module.css`, no de una copia: así no hay forma de
 * que un botón y un enlace se vayan pareciendo cada vez menos.
 *
 * La navegación usa el `Link` de `@/i18n/navegacion`, que conoce el mapa de
 * slugs traducidos y construye la URL correcta para cada idioma.
 */

const CLASE_DE_VARIANTE: Record<VarianteDeBoton, string | undefined> = {
  primario: estilos.primario,
  secundario: estilos.secundario,
  sutil: estilos.sutil,
};

type PropiedadesDeEnlace = {
  readonly children: ReactNode;
  /** Ruta interna, en su forma canónica. El idioma lo pone `Link`. */
  readonly href: ComponentProps<typeof Link>["href"];
  readonly variante?: VarianteDeBoton;
};

/**
 * Enlace de navegación con aspecto de botón.
 *
 * @param props Propiedades del componente.
 * @param props.children Lo que se lee dentro.
 * @param props.href Ruta interna a la que lleva.
 * @param props.variante Peso visual dentro de la jerarquía de la pantalla.
 */
export function Enlace({ children, href, variante = "primario" }: PropiedadesDeEnlace) {
  return (
    <Link className={`${estilos.boton} ${CLASE_DE_VARIANTE[variante]}`} href={href}>
      {children}
    </Link>
  );
}
