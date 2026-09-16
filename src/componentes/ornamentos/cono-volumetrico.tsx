import estilos from "./cono-volumetrico.module.css";

/**
 * Cono de luz volumétrica.
 *
 * Es lo que convierte una imagen sobre fondo negro en algo *proyectado*. Sin el
 * cono el sujeto flota; con él hay un aparato que lo emite y una sala donde
 * ocurre.
 *
 * Va detrás del sujeto, nunca delante. Las motas de polvo suspendidas en el haz
 * son un ornamento aparte, y son las que terminan de dar volumen.
 *
 * Decorativo: se oculta a la tecnología asistiva.
 */
export function ConoVolumetrico() {
  return (
    <div className={estilos.cono} aria-hidden="true">
      <span className={estilos.base} />
    </div>
  );
}
