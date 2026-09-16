import estilos from "./fresnel.module.css";

/**
 * Realce de borde, o fresnel.
 *
 * En una superficie translúcida real la luz incide de forma rasante en los
 * bordes y los enciende. Aquí se aproxima con un resplandor interior.
 *
 * Limitación conocida: el resplandor sigue el rectángulo del contenedor, no la
 * silueta del sujeto. Para un panel o una carta es correcto; el fresnel que
 * sigue la silueta de Sibila lo hace el shader del nivel 1, ver
 * `docs/plan-tarot.md` §3.2.
 *
 * Decorativo: se oculta a la tecnología asistiva.
 */
export function Fresnel() {
  return <div className={estilos.fresnel} aria-hidden="true" />;
}
