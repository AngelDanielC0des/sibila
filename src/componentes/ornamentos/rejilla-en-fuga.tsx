import estilos from "./rejilla-en-fuga.module.css";

/**
 * Rejilla en fuga: el suelo de la cámara de proyección.
 *
 * Es el ornamento más discreto de todos y el que más cambia la lectura de la
 * escena. Sin él, Sibila flota en un vacío negro; con él, hay una sala con
 * suelo, y por tanto un sitio donde la proyección ocurre.
 *
 * Un plano abatido en perspectiva, con una máscara que lo disuelve hacia el
 * horizonte. Sin esa máscara la rejilla termina en un corte recto que delata que
 * es un plano inclinado y no una sala.
 *
 * El avance recorre exactamente el paso de la cuadrícula, de modo que al
 * reiniciarse el bucle coincide consigo misma y no se ve el salto.
 *
 * Decorativo: se oculta a la tecnología asistiva.
 */
export function RejillaEnFuga() {
  return (
    <div className={estilos.rejilla} aria-hidden="true">
      <div className={estilos.suelo} />
    </div>
  );
}
