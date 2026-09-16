import type { Page } from "@playwright/test";

/**
 * Utilidades compartidas por las pruebas de pantalla.
 *
 * Lo que vive aquí son **mediciones**, no aserciones: devuelven un número o un
 * dato y es cada prueba la que decide qué es aceptable. Mezclar medir con
 * juzgar es lo que convierte un arnés en una caja negra.
 */

/** Tamaño de letra base del navegador, en píxeles, sin ampliación. */
const TAMANO_BASE_DEL_NAVEGADOR = 16;

/**
 * Mide cuánto se desborda el documento por el eje horizontal.
 *
 * Es el criterio de reflujo de WCAG 1.4.10 traducido a un número: cero está
 * bien y cualquier cosa por encima es una barra de desplazamiento lateral que
 * el visitante no pidió.
 *
 * @param pagina Página a medir.
 * @returns Píxeles de desborde. Cero si el documento cabe.
 */
export async function medirDesbordeHorizontal(pagina: Page): Promise<number> {
  return pagina.evaluate(() => {
    const raiz = document.documentElement;
    return Math.max(0, raiz.scrollWidth - raiz.clientWidth);
  });
}

/**
 * Amplía el tamaño del texto como hace el ajuste del navegador.
 *
 * Todo el sistema de tamaños del proyecto cuelga de `rem`, así que ampliar el
 * texto es mover el tamaño de letra de la raíz. No es zoom de página: la
 * anchura del viewport no cambia, que es justo lo que hace duro el criterio.
 *
 * @param pagina Página sobre la que aplicar la ampliación.
 * @param porcentaje Ampliación deseada. 200 es el criterio de WCAG 1.4.4.
 */
export async function aplicarZoomDeTexto(
  pagina: Page,
  porcentaje: number,
): Promise<void> {
  const pixeles = (TAMANO_BASE_DEL_NAVEGADOR * porcentaje) / 100;
  await pagina.evaluate((tamano) => {
    document.documentElement.style.fontSize = `${tamano}px`;
  }, pixeles);
}

/**
 * Espera a que la página esté quieta para medirla.
 *
 * Sin esto, una medición tomada mientras las fuentes aún se están cargando da
 * un ancho que nadie ve nunca, y la prueba falla o pasa por motivos que no
 * tienen que ver con la maquetación.
 *
 * @param pagina Página a estabilizar.
 */
export async function esperarAQueSeAsiente(pagina: Page): Promise<void> {
  await pagina.waitForLoadState("networkidle");
  await pagina.evaluate(async () => {
    await document.fonts.ready;
  });
}

/**
 * Recoge los elementos que son alcanzables por teclado, en orden de tabulación.
 *
 * Se usa para comprobar que el recorrido existe y que el foco es visible, que
 * es la mitad de §8 que nadie verifica nunca porque cansa hacerlo a mano.
 *
 * @param pagina Página a recorrer.
 * @param maximo Número máximo de saltos, para no quedarse en una trampa de foco.
 * @returns La descripción de cada parada, en orden.
 */
export async function recorrerConTabulador(
  pagina: Page,
  maximo: number,
): Promise<readonly string[]> {
  const paradas: string[] = [];

  for (let salto = 0; salto < maximo; salto++) {
    await pagina.keyboard.press("Tab");
    const parada = await pagina.evaluate(() => {
      const activo = document.activeElement;
      if (activo === null || activo === document.body) {
        return null;
      } else {
        const etiqueta = (activo.textContent ?? "").trim().slice(0, 40);
        return `${activo.tagName.toLowerCase()}:${etiqueta}`;
      }
    });

    if (parada === null) {
      break;
    } else {
      paradas.push(parada);
    }
  }

  return paradas;
}
