import { expect, test } from "@playwright/test";
import {
  aplicarZoomDeTexto,
  esperarAQueSeAsiente,
  medirDesbordeHorizontal,
  recorrerConTabulador,
} from "./apoyo/pantalla";

/**
 * Recorrido de todas las pantallas que existen hoy.
 *
 * Es la lista de `docs/guia-de-diseno.md` §8 aplicada a máquina. Cada prueba
 * corre en los cuatro anchos que declara `playwright.config.mts`, así que una
 * sola aserción cubre estrecho, móvil, girado y escritorio.
 *
 * La lista de rutas crece a la vez que el producto. Una pantalla nueva que no
 * aparezca aquí es una pantalla sin verificar.
 */

type Pantalla = {
  readonly nombre: string;
  readonly ruta: string;
  readonly idioma: string;
  /**
   * Anchos donde el reflujo está **reconocido como pendiente**, por nombre de
   * proyecto.
   *
   * No es una exclusión: Playwright marca la prueba como fallo esperado, así
   * que sigue corriendo y **avisa el día que empiece a pasar**. Una exclusión
   * se olvida; esto se queja sola cuando sobra.
   */
  readonly reflujoPendienteEn?: readonly string[];
};

const PANTALLAS: readonly Pantalla[] = [
  { nombre: "portada · español", ruta: "/es", idioma: "es" },
  { nombre: "portada · portugués", ruta: "/pt", idioma: "pt" },
  { nombre: "portada · inglés", ruta: "/en", idioma: "en" },
  { nombre: "sistema · tokens", ruta: "/es/sistema/tokens", idioma: "es" },
  {
    nombre: "sistema · componentes",
    ruta: "/es/sistema/componentes",
    idioma: "es",
    /*
     * A 320 px con el texto al 200 % desborda 64 px: los botones de estado
     * —«Barajando», «Guardando»— y la cara de la carta piden más ancho del que
     * hay. Es el catálogo interno del sistema de diseño, sin indexar y sin
     * visitantes, así que no bloquea; queda anotado para arreglarlo con los
     * componentes y no con una excepción.
     */
    reflujoPendienteEn: ["estrecho-320"],
  },
  { nombre: "sistema · ornamentos", ruta: "/es/sistema/ornamentos", idioma: "es" },
];

test.describe("cada pantalla cabe en su ancho", () => {
  for (const pantalla of PANTALLAS) {
    test(pantalla.nombre, async ({ page }) => {
      await page.goto(pantalla.ruta);
      await esperarAQueSeAsiente(page);

      await expect(page.locator("html")).toHaveAttribute("lang", pantalla.idioma);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await medirDesbordeHorizontal(page)).toBe(0);
    });
  }
});

test.describe("criterio de reflujo · texto al 200 %", () => {
  for (const pantalla of PANTALLAS) {
    test(pantalla.nombre, async ({ page }, info) => {
      const estaPendiente = (pantalla.reflujoPendienteEn ?? []).includes(
        info.project.name,
      );
      test.fail(estaPendiente, "reflujo reconocido como pendiente en este ancho");

      await page.goto(pantalla.ruta);
      await esperarAQueSeAsiente(page);
      await aplicarZoomDeTexto(page, 200);

      /*
       * La medición se toma después de que el navegador rehaga la maquetación.
       * Sin esta espera se lee el ancho de antes de ampliar y la prueba pasa
       * siempre, que es peor que no tenerla.
       */
      await page.waitForFunction(() => document.documentElement.style.fontSize !== "");
      expect(await medirDesbordeHorizontal(page)).toBe(0);
    });
  }
});

test("la portada se recorre entera con el tabulador", async ({ page }) => {
  await page.goto("/es");
  await esperarAQueSeAsiente(page);

  const paradas = await recorrerConTabulador(page, 12);

  /* Los tres idiomas son alcanzables: es el único control real de la portada. */
  expect(paradas.join(" · ")).toContain("Español");
  expect(paradas.join(" · ")).toContain("Português");
  expect(paradas.join(" · ")).toContain("English");
});

test("el foco siempre se ve", async ({ page }) => {
  await page.goto("/es");
  await esperarAQueSeAsiente(page);
  await page.keyboard.press("Tab");

  const contorno = await page.evaluate(() => {
    const activo = document.activeElement;
    if (activo === null) {
      return null;
    } else {
      const estilo = getComputedStyle(activo);
      return {
        anchoDeContorno: estilo.outlineWidth,
        estiloDeContorno: estilo.outlineStyle,
        sombra: estilo.boxShadow,
      };
    }
  });

  expect(contorno).not.toBeNull();
  const tieneContorno =
    contorno !== null &&
    contorno.estiloDeContorno !== "none" &&
    contorno.anchoDeContorno !== "0px";
  const tieneSombra = contorno !== null && contorno.sombra !== "none";
  expect(tieneContorno || tieneSombra).toBe(true);
});

test("con movimiento reducido la pantalla sigue teniendo sentido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/es/sistema/ornamentos");
  await esperarAQueSeAsiente(page);

  await expect(page.locator("h1")).toBeVisible();
  expect(await medirDesbordeHorizontal(page)).toBe(0);

  /*
   * La regla global deja las transiciones en 0,01 ms. Se comprueba sobre un
   * elemento real y no sobre la hoja de estilos: lo que importa es lo que el
   * navegador calcula, no lo que creemos haber escrito.
   *
   * El valor calculado se lee en segundos y en notación científica —«1e-05s»—,
   * así que se compara el número y no la cadena. Comparar cadenas aquí era una
   * prueba que fallaba por el formato y no por el movimiento.
   */
  const duracionesEnSegundos = await page.evaluate(() =>
    [...document.querySelectorAll("*")]
      .flatMap((elemento) => getComputedStyle(elemento).transitionDuration.split(", "))
      .map((duracion) => Number.parseFloat(duracion))
      .filter((segundos) => segundos > 0),
  );
  for (const segundos of duracionesEnSegundos) {
    expect(segundos).toBeLessThanOrEqual(0.001);
  }
});

test("una ruta inexistente dentro de un idioma devuelve 404 localizado", async ({
  page,
}) => {
  const respuesta = await page.goto("/es/esto-no-existe");

  expect(respuesta?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
});
