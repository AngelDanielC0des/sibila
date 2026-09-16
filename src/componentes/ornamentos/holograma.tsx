import type { ReactNode } from "react";
import { Aberracion } from "./aberracion";
import { Barrido } from "./barrido";
import { ConoVolumetrico } from "./cono-volumetrico";
import { Fresnel } from "./fresnel";
import { Interferencia } from "./interferencia";
import estilos from "./holograma.module.css";

/** Cuánto pesa el tratamiento sobre el sujeto. */
export type IntensidadDeHolograma = "plena" | "sutil" | "reposo";

type PropiedadesDeHolograma = {
  readonly children: ReactNode;
  /** Plena para el héroe; sutil para paneles; reposo para elementos de apoyo. */
  readonly intensidad?: IntensidadDeHolograma;
  /** El cono de luz sobra cuando el sujeto no es el foco de la escena. */
  readonly tieneCono?: boolean;
  /** La interferencia distrae si hay varios hologramas a la vez en pantalla. */
  readonly tieneInterferencia?: boolean;
};

/**
 * Aplica el tratamiento holográfico completo a un sujeto.
 *
 * Los cinco ornamentos no son decoraciones independientes sino **un solo
 * tratamiento**: el orden en que se apilan importa —el cono va detrás, el resto
 * delante— y sus intensidades tienen que ir acompasadas. Componerlos a mano en
 * cada uso acabaría produciendo hologramas que no se parecen entre sí.
 *
 * Los dos sitios donde se usa son el retrato de Sibila en la portada y las
 * cartas al revelarse, que es lo que justifica la abstracción: hay dos casos
 * reales, no uno imaginado.
 *
 * Todas las capas son decorativas y quedan ocultas a la tecnología asistiva. El
 * sujeto conserva su semántica intacta.
 *
 * @param props Propiedades del componente.
 * @param props.children Sujeto sobre el que se proyecta.
 * @param props.intensidad Cuánto pesa el tratamiento.
 * @param props.tieneCono Si se dibuja el cono de luz volumétrica.
 * @param props.tieneInterferencia Si la banda de interferencia cruza cada once segundos.
 */
export function Holograma({
  children,
  intensidad = "plena",
  tieneCono = true,
  tieneInterferencia = true,
}: PropiedadesDeHolograma) {
  return (
    <div className={estilos.holograma} data-intensidad={intensidad}>
      {tieneCono ? <ConoVolumetrico /> : null}

      <div className={estilos.sujeto}>
        <Aberracion>{children}</Aberracion>
      </div>

      <Barrido />
      <Fresnel />
      {tieneInterferencia ? <Interferencia /> : null}
    </div>
  );
}
