import estilos from "./barrido.module.css";

/**
 * Líneas de barrido de la proyección.
 *
 * Es el ornamento que más trabajo hace por su coste: dos o tres píxeles de
 * patrón repetido bastan para que cualquier superficie se lea como proyectada.
 *
 * El desplazamiento es un múltiplo exacto del paso del patrón, de modo que el
 * bucle no tiene costura, y se anima con `transform`, que se compone en la GPU
 * sin repintar. Animar `background-position` habría obligado a repintar en cada
 * fotograma.
 *
 * Decorativo: se oculta a la tecnología asistiva.
 */
export function Barrido() {
  return <div className={estilos.barrido} aria-hidden="true" />;
}
