"use client";

import { useEffect, useRef } from "react";
import {
  avanzarMotas,
  opacidadDeMota,
  posicionHorizontal,
  sembrarMotas,
  type Mota,
} from "./motas";
import estilos from "./motas.module.css";

/**
 * Motas de polvo suspendidas en el haz.
 *
 * Es el único ornamento con JavaScript, y por eso es el último en llegar: no se
 * carga hasta que el resto de la página está asentada. El cono da la forma de la
 * luz; estas motas le dan el volumen, porque una luz sin nada suspendido dentro
 * se lee como una forma pintada.
 *
 * Un solo lienzo para todas las motas. Tarotoo usa veintidós contextos de canvas
 * a la vez, uno por carta, y eso es memoria de GPU y composición desperdiciadas.
 *
 * Deja de dibujar cuando la pestaña se oculta o el ornamento sale de pantalla, y
 * con movimiento reducido pinta un fotograma quieto: el ambiente se conserva y
 * la animación desaparece.
 *
 * Decorativo: se oculta a la tecnología asistiva.
 */

/** Tope de densidad de píxeles. Por encima de 2 no se aprecia y cuesta el doble. */
const DENSIDAD_MAXIMA = 2;

/** Corte de un salto de tiempo, para que volver de otra pestaña no teletransporte. */
const SALTO_MAXIMO_EN_SEGUNDOS = 0.1;

/** El lienzo medido en píxeles CSS, más la estampa con la que se pinta. */
type Escena = {
  readonly ancho: number;
  readonly alto: number;
  readonly segundos: number;
  readonly sprite: HTMLCanvasElement;
};

/** Lado de la estampa, en píxeles. Suficiente para el degradado sin desperdicio. */
const LADO_DE_SPRITE = 16;

/**
 * Prepara la estampa de una mota una sola vez.
 *
 * Dibujar cada mota con `arc()` y `fill()` obliga a teselar una ruta por
 * partícula y por fotograma, que es trabajo de CPU. Medido a CPU 4×
 * estrangulada, esa versión costaba unos 17 fps. Estampar una imagen ya
 * rasterizada es una copia de píxeles, y además da un borde suave que se parece
 * mucho más a polvo real que un círculo de canto duro.
 *
 * @param color Color en notación `#rrggbb`, tomado de los tokens.
 * @returns Un lienzo fuera de pantalla con la mota dibujada.
 */
function crearSpriteDeMota(color: string): HTMLCanvasElement {
  const sprite = document.createElement("canvas");
  sprite.width = LADO_DE_SPRITE;
  sprite.height = LADO_DE_SPRITE;

  const contexto = sprite.getContext("2d");

  if (contexto !== null) {
    const medio = LADO_DE_SPRITE / 2;
    const entero = parseInt(color.replace("#", ""), 16);
    const canales = `${(entero >> 16) & 255} ${(entero >> 8) & 255} ${entero & 255}`;
    const degradado = contexto.createRadialGradient(medio, medio, 0, medio, medio, medio);

    /*
     * El extremo transparente conserva el mismo color. Usar «transparent» sería
     * negro con alfa cero, y al interpolar dejaría un halo oscuro alrededor.
     */
    degradado.addColorStop(0, `rgb(${canales} / 1)`);
    degradado.addColorStop(0.45, `rgb(${canales} / 0.6)`);
    degradado.addColorStop(1, `rgb(${canales} / 0)`);

    contexto.fillStyle = degradado;
    contexto.fillRect(0, 0, LADO_DE_SPRITE, LADO_DE_SPRITE);
  }

  return sprite;
}

/**
 * Ajusta el lienzo a su tamaño en pantalla y a la densidad del dispositivo.
 *
 * @param lienzo Elemento a ajustar.
 * @param contexto Contexto de dibujo.
 * @returns El tamaño en píxeles CSS, o `null` si el lienzo aún no mide nada.
 */
function ajustarLienzo(
  lienzo: HTMLCanvasElement,
  contexto: CanvasRenderingContext2D,
): { ancho: number; alto: number } | null {
  const medida = lienzo.getBoundingClientRect();

  if (medida.width === 0 || medida.height === 0) {
    return null;
  } else {
    const densidad = Math.min(window.devicePixelRatio, DENSIDAD_MAXIMA);

    lienzo.width = Math.round(medida.width * densidad);
    lienzo.height = Math.round(medida.height * densidad);
    contexto.setTransform(densidad, 0, 0, densidad, 0, 0);

    return { ancho: medida.width, alto: medida.height };
  }
}

/**
 * Pinta un fotograma.
 *
 * La altura de la simulación va de 0 en el emisor a 1 arriba, mientras que en el
 * lienzo el cero está arriba: de ahí la inversión al calcular la coordenada.
 *
 * @param contexto Contexto de dibujo.
 * @param motas Motas a pintar.
 * @param escena Medidas del lienzo, tiempo y color.
 */
function dibujarMotas(
  contexto: CanvasRenderingContext2D,
  motas: readonly Mota[],
  escena: Escena,
): void {
  contexto.clearRect(0, 0, escena.ancho, escena.alto);

  for (const mota of motas) {
    const opacidad = opacidadDeMota(mota);

    if (opacidad > 0.01) {
      const lado = mota.radio * 4;

      contexto.globalAlpha = opacidad;
      contexto.drawImage(
        escena.sprite,
        posicionHorizontal(mota, escena.segundos) * escena.ancho - lado / 2,
        (1 - mota.altura) * escena.alto - lado / 2,
        lado,
        lado,
      );
    }
  }

  contexto.globalAlpha = 1;
}

/** Mandos del bucle de animación. */
type Bucle = {
  readonly arrancar: () => void;
  readonly parar: () => void;
  readonly remedir: () => void;
  readonly pintarQuieto: () => void;
};

/**
 * Monta el bucle de animación sobre un lienzo ya preparado.
 *
 * Se separa del efecto de React para que ni el bucle ni el montaje pasen de
 * sesenta líneas, que es el umbral del proyecto.
 *
 * @param lienzo Lienzo donde pintar.
 * @param contexto Contexto de dibujo.
 * @param cantidad Número de motas.
 * @returns Los mandos del bucle.
 */
function montarBucle(
  lienzo: HTMLCanvasElement,
  contexto: CanvasRenderingContext2D,
  cantidad: number,
): Bucle {
  const color = getComputedStyle(lienzo).getPropertyValue("--holo-nucleo").trim();
  const sprite = crearSpriteDeMota(color);
  const motas = sembrarMotas(cantidad, Math.random);

  let medida = ajustarLienzo(lienzo, contexto);
  let peticion = 0;
  let anterior = 0;

  const pintar = (ahora: number) => {
    if (medida !== null) {
      const bruto = anterior === 0 ? 0 : (ahora - anterior) / 1000;
      anterior = ahora;

      avanzarMotas(motas, Math.min(bruto, SALTO_MAXIMO_EN_SEGUNDOS), Math.random);
      dibujarMotas(contexto, motas, { ...medida, segundos: ahora / 1000, sprite });
    }

    peticion = requestAnimationFrame(pintar);
  };

  return {
    arrancar: () => {
      if (peticion === 0) {
        anterior = 0;
        peticion = requestAnimationFrame(pintar);
      }
    },
    parar: () => {
      cancelAnimationFrame(peticion);
      peticion = 0;
    },
    remedir: () => {
      medida = ajustarLienzo(lienzo, contexto);
    },
    pintarQuieto: () => {
      if (medida !== null) {
        dibujarMotas(contexto, motas, { ...medida, segundos: 0, sprite });
      }
    },
  };
}

/**
 * Conecta los observadores que detienen el bucle cuando no hace falta pintar.
 *
 * Un bucle que sigue corriendo con la pestaña oculta o el ornamento fuera de
 * pantalla gasta batería sin que nadie lo vea.
 *
 * @param lienzo Elemento a observar.
 * @param bucle Mandos del bucle.
 * @returns Función que desconecta todo.
 */
function conectarObservadores(lienzo: HTMLCanvasElement, bucle: Bucle): () => void {
  let estaEnPantalla = true;

  /*
   * Las dos condiciones se evalúan juntas a propósito. Si cada observador
   * decidiera por su cuenta, volver de otra pestaña arrancaría el bucle aunque
   * el ornamento estuviera fuera de pantalla.
   */
  const reevaluar = () => {
    if (estaEnPantalla && !document.hidden) {
      bucle.arrancar();
    } else {
      bucle.parar();
    }
  };

  const observadorDePantalla = new IntersectionObserver((entradas) => {
    const entrada = entradas[0];

    if (entrada !== undefined) {
      estaEnPantalla = entrada.isIntersecting;
      reevaluar();
    }
  });

  const observadorDeTamano = new ResizeObserver(() => {
    bucle.remedir();
  });

  observadorDePantalla.observe(lienzo);
  observadorDeTamano.observe(lienzo);
  document.addEventListener("visibilitychange", reevaluar);

  return () => {
    bucle.parar();
    observadorDePantalla.disconnect();
    observadorDeTamano.disconnect();
    document.removeEventListener("visibilitychange", reevaluar);
  };
}

type PropiedadesDeMotas = {
  /** Cuántas motas. Cuarenta bastan para llenar un haz sin que se note el patrón. */
  readonly cantidad?: number;
};

/**
 * Motas de polvo dentro del cono de luz.
 *
 * @param props Propiedades del componente.
 * @param props.cantidad Número de motas en suspensión.
 */
export function MotasDelHaz({ cantidad = 40 }: PropiedadesDeMotas) {
  const referenciaDeLienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lienzo = referenciaDeLienzo.current;
    const contexto = lienzo === null ? null : lienzo.getContext("2d");

    if (lienzo === null || contexto === null) {
      return undefined;
    } else {
      const bucle = montarBucle(lienzo, contexto, cantidad);
      const prefiereQuietud = window.matchMedia("(prefers-reduced-motion: reduce)");

      if (prefiereQuietud.matches) {
        bucle.pintarQuieto();
        return undefined;
      } else {
        return conectarObservadores(lienzo, bucle);
      }
    }
  }, [cantidad]);

  return (
    <canvas ref={referenciaDeLienzo} className={estilos.lienzo} aria-hidden="true" />
  );
}
