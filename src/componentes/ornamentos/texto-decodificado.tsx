"use client";

import { useEffect, useRef } from "react";
import {
  esDecodificable,
  estaResuelto,
  planificarDecodificacion,
  type PlanDeDecodificacion,
} from "./decodificacion";
import { glifoAlAzar } from "./glifos";
import estilos from "./texto-decodificado.module.css";

/**
 * Texto que se resuelve desde glifos.
 *
 * Es la firma del producto: el texto no aparece, se condensa. Cada carácter pasa
 * por símbolos zodiacales y planetarios antes de fijarse en su letra — signos
 * antiguos resolviéndose por medio de una máquina, que es el concepto entero en
 * una sola animación.
 *
 * **Nunca se sustituye el texto.** La letra real es un nodo de texto del DOM
 * desde el primer pintado, y el glifo va encima en un elemento absoluto y
 * oculto al lector de pantalla. Lo único que cambia durante la animación es un
 * atributo y el contenido de ese elemento decorativo. Así el texto se anuncia
 * bien, se indexa, y jamás se recoloca.
 *
 * El texto se renderiza **ya resuelto**, y es la animación la que lo desarma al
 * arrancar. Además de ser lo correcto para el primer pintado y para el LCP, el
 * efecto resultante es mejor: la frase se lee un instante, se rompe en glifos y
 * vuelve a fijarse, como una señal que sintoniza.
 */

/**
 * Cada cuánto cambia el glifo de un carácter sin resolver.
 *
 * No en cada fotograma: a sesenta cambios por segundo el efecto parpadea, cansa
 * y entra en terreno de riesgo para quien tiene fotosensibilidad. A unos once
 * por segundo se lee mucho mejor.
 */
const MILISEGUNDOS_ENTRE_GLIFOS = 90;

type PropiedadesDeTextoDecodificado = {
  readonly texto: string;
  /** Cuánto tarda en resolverse. Por defecto, el tempo de «revelación». */
  readonly duracion?: number;
  /** Espera antes de empezar, para escalonar varias frases. */
  readonly retardo?: number;
};

/**
 * Cambia el glifo decorativo de un carácter.
 *
 * Al resolverse se deja **vacío**, no solo transparente. `aria-hidden` saca el
 * glifo del árbol de accesibilidad, así que un lector de pantalla nunca lo oye,
 * pero sigue contando para el texto del DOM, que es lo que leen los buscadores.
 * Dejarlos puestos indexaría el titular como «☌L♎a T♇o♏r☋r☉e».
 *
 * @param nodo Elemento del carácter.
 * @param contenido Glifo a mostrar, o cadena vacía al quedar resuelto.
 */
function fijarGlifo(nodo: HTMLElement, contenido: string): void {
  const glifo = nodo.firstElementChild;

  if (glifo !== null && glifo.textContent !== contenido) {
    glifo.textContent = contenido;
  }
}

/**
 * Recorre los caracteres y fija cuáles muestran letra y cuáles glifo.
 *
 * Trabaja sobre el DOM directamente en lugar de a través del estado de React:
 * repintar cien nodos sesenta veces por segundo para cambiar un atributo sería
 * mucho trabajo para nada.
 *
 * @param nodos Los elementos de carácter.
 * @param plan Plan de decodificación.
 * @param avance Avance de la animación, de 0 a 1.
 * @param debeRenovarGlifos Si además hay que cambiar los glifos visibles.
 */
function pintarAvance(
  nodos: readonly HTMLElement[],
  plan: PlanDeDecodificacion,
  avance: number,
  debeRenovarGlifos: boolean,
): void {
  for (let indice = 0; indice < nodos.length; indice += 1) {
    const nodo = nodos[indice];

    if (nodo !== undefined) {
      const estaFijado = estaResuelto(plan, indice, avance);
      nodo.dataset["resuelto"] = String(estaFijado);

      if (estaFijado) {
        fijarGlifo(nodo, "");
      } else if (debeRenovarGlifos) {
        fijarGlifo(nodo, glifoAlAzar(Math.random));
      }
    }
  }
}

/**
 * Arranca la animación sobre un contenedor ya montado.
 *
 * Vive fuera del componente para que ni el efecto ni el propio componente pasen
 * de sesenta líneas, que es el umbral del proyecto.
 *
 * @param contenedor Elemento que contiene los caracteres.
 * @param texto Texto a decodificar.
 * @param duracion Cuánto tarda en resolverse.
 * @param retardo Espera antes de empezar.
 * @returns Función que detiene la animación y deja el texto resuelto.
 */
function arrancarDecodificacion(
  contenedor: HTMLElement,
  texto: string,
  duracion: number,
  retardo: number,
): () => void {
  const nodos = Array.from(contenedor.querySelectorAll<HTMLElement>("[data-resuelto]"));
  const plan = planificarDecodificacion(texto, Math.random);

  let peticion = 0;
  let inicio = 0;
  let ultimoCambio = 0;

  const paso = (ahora: number) => {
    if (inicio === 0) {
      inicio = ahora;
    }

    const transcurrido = ahora - inicio - retardo;
    const avance = transcurrido <= 0 ? 0 : Math.min(1, transcurrido / duracion);
    const debeRenovar = ahora - ultimoCambio >= MILISEGUNDOS_ENTRE_GLIFOS;

    if (debeRenovar) {
      ultimoCambio = ahora;
    }

    pintarAvance(nodos, plan, avance, debeRenovar);

    if (avance < 1) {
      peticion = requestAnimationFrame(paso);
    }
  };

  /* Se desarma antes del primer fotograma de la animación, no en el render. */
  pintarAvance(nodos, plan, 0, true);
  peticion = requestAnimationFrame(paso);

  return () => {
    cancelAnimationFrame(peticion);
    pintarAvance(nodos, plan, 1, false);
  };
}

type PropiedadesDeCaracter = {
  readonly caracter: string;
};

/**
 * Un carácter con su glifo encima.
 *
 * La letra es un nodo de texto directo, no un elemento envuelto: así el flujo
 * del texto no se rompe y ningún lector de pantalla mete pausas entre letras.
 *
 * @param props Propiedades del componente.
 * @param props.caracter La letra real.
 */
function CaracterDecodificable({ caracter }: PropiedadesDeCaracter) {
  if (!esDecodificable(caracter)) {
    return <span>{caracter}</span>;
  } else {
    return (
      <span className={estilos.caracter} data-resuelto="true">
        <span className={estilos.glifo} aria-hidden="true" />
        {caracter}
      </span>
    );
  }
}

/**
 * Texto que se decodifica al aparecer.
 *
 * @param props Propiedades del componente.
 * @param props.texto Lo que acaba leyéndose.
 * @param props.duracion Cuánto tarda en resolverse, en milisegundos.
 * @param props.retardo Espera antes de empezar, en milisegundos.
 */
export function TextoDecodificado({
  texto,
  duracion = 1800,
  retardo = 0,
}: PropiedadesDeTextoDecodificado) {
  const referencia = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const contenedor = referencia.current;
    const prefiereQuietud = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (contenedor === null || prefiereQuietud.matches) {
      return undefined;
    } else {
      return arrancarDecodificacion(contenedor, texto, duracion, retardo);
    }
  }, [texto, duracion, retardo]);

  return (
    <span ref={referencia}>
      {[...texto].map((caracter, indice) => (
        <CaracterDecodificable key={`${indice}-${caracter}`} caracter={caracter} />
      ))}
    </span>
  );
}
