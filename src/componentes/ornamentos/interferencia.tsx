import estilos from "./interferencia.module.css";

/**
 * Banda de interferencia.
 *
 * Cruza la proyección cada once segundos y dura menos de medio. La rareza es el
 * diseño: una interferencia continua deja de leerse como fallo de señal y pasa a
 * leerse como fondo animado, que es lo contrario de lo que se busca.
 *
 * Con `prefers-reduced-motion` no se atenúa, se retira: un destello que cruza la
 * pantalla es de los efectos que esa preferencia existe para evitar.
 *
 * Decorativo: se oculta a la tecnología asistiva.
 */
export function Interferencia() {
  return <div className={estilos.interferencia} aria-hidden="true" />;
}
