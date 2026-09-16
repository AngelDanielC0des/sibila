import estilos from "./filigrana.module.css";

/**
 * Filigrana de grabado: la capa antigua del concepto.
 *
 * Frente a los ornamentos holográficos, que emiten luz y son azules, esta la
 * refleja y es de oro. Es la mitad que aporta la tradición.
 *
 * El lenguaje es deliberadamente **geométrico y astronómico**: rectas, arcos y
 * círculos pequeños, como una lámina de astrolabio o una carta celeste grabada.
 * Nada de volutas ni motivos vegetales, que es por donde un producto de tarot se
 * desliza hacia la estética de bazar esotérico — ver el principio de «magia sin
 * cursilería» en `docs/plan-v1.md` §5.4.
 *
 * Todo decorativo: se oculta a la tecnología asistiva.
 */

/** Dónde se coloca una esquina. */
export type PosicionDeEsquina =
  "superior-izquierda" | "superior-derecha" | "inferior-izquierda" | "inferior-derecha";

const CLASE_DE_POSICION: Record<PosicionDeEsquina, string | undefined> = {
  "superior-izquierda": estilos.superiorIzquierda,
  "superior-derecha": estilos.superiorDerecha,
  "inferior-izquierda": estilos.inferiorIzquierda,
  "inferior-derecha": estilos.inferiorDerecha,
};

/**
 * Separador horizontal con un motivo central.
 *
 * Separa secciones de texto y, en una lectura, una carta de la siguiente. El
 * motivo del centro es un rombo con su punto, que es la marca más sencilla que
 * aparece en las láminas grabadas antiguas.
 */
export function SeparadorDeFiligrana() {
  return (
    <div className={estilos.separador} aria-hidden="true">
      <span className={estilos.trazo} />

      <svg
        className={estilos.motivo}
        viewBox="0 0 56 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.9"
      >
        {/* Remates verticales, como los de una escala grabada. */}
        <line x1="2" y1="4" x2="2" y2="10" />
        <line x1="54" y1="4" x2="54" y2="10" />

        {/* Los trazos cortos que llevan al motivo. */}
        <line x1="2" y1="7" x2="18" y2="7" />
        <line x1="38" y1="7" x2="54" y2="7" />

        {/* El rombo central con su punto. */}
        <path d="M28 1 L34 7 L28 13 L22 7 Z" />
        <circle cx="28" cy="7" r="1.5" fill="currentColor" stroke="none" />
      </svg>

      <span className={estilos.trazo} />
    </div>
  );
}

type PropiedadesDeEsquina = {
  readonly posicion: PosicionDeEsquina;
};

/**
 * Esquina de marco.
 *
 * Se dibuja una sola vez en la posición superior izquierda y las otras tres se
 * obtienen reflejándola. Es más barato que dibujar cuatro, y garantiza que las
 * cuatro coinciden exactamente.
 *
 * @param props Propiedades del componente.
 * @param props.posicion Esquina que ocupa.
 */
export function EsquinaDeFiligrana({ posicion }: PropiedadesDeEsquina) {
  return (
    <svg
      className={`${estilos.esquina} ${CLASE_DE_POSICION[posicion]}`}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      aria-hidden="true"
    >
      {/* La escuadra. */}
      <path d="M2 20 L2 2 L20 2" />

      {/* El arco que la suaviza, como el limbo de un astrolabio. */}
      <path d="M2 30 A28 28 0 0 1 30 2" />

      {/* Rayo corto hacia el vértice y su punto. */}
      <line x1="7" y1="7" x2="13" y2="13" />
      <circle cx="5.5" cy="5.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

const ESQUINAS: readonly PosicionDeEsquina[] = [
  "superior-izquierda",
  "superior-derecha",
  "inferior-izquierda",
  "inferior-derecha",
];

/**
 * Marco completo, con sus cuatro esquinas.
 *
 * Se apoya en el contenedor, que debe estar posicionado. Lo llevarán las fichas
 * de carta de la enciclopedia y los paneles de la lectura.
 */
export function MarcoDeFiligrana() {
  return (
    <div className={estilos.marco} aria-hidden="true">
      {ESQUINAS.map((posicion) => (
        <EsquinaDeFiligrana key={posicion} posicion={posicion} />
      ))}
    </div>
  );
}
