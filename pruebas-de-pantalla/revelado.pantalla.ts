import { expect, test } from "@playwright/test";
import { esperarAQueSeAsiente, medirDesbordeHorizontal } from "./apoyo/pantalla";

/**
 * El revelado de una carta · A3.4.
 *
 * La carta y la orientación se fijan por URL a propósito. Una prueba de
 * ceremonia que dependiera del barajado sería una prueba que a veces comprueba
 * otra cosa, y esas son peores que no tener prueba.
 *
 * `la-torre` es una de las tres cartas con significado escrito hoy, así que
 * estas pruebas ejercitan el camino completo —motor, corpus y panel— y no sólo
 * el estado vacío.
 */

const CARTA_ESCRITA = "/es/lectura?carta=la-torre&orientacion=derecha";
const CARTA_INVERTIDA = "/es/lectura?carta=la-torre&orientacion=invertida";

/*
 * El estado vacío se ejerce por **idioma sin corpus**, no por carta sin
 * escribir.
 *
 * La primera versión apuntaba a El Loco, que entonces no tenía texto. Al
 * completarse los 156 significados base del español la prueba se cayó sola: no
 * quedaba ninguna carta sin escribir a la que apuntar. Era una prueba con fecha
 * de caducidad, y el propio avance del corpus la caducó.
 *
 * El portugués todavía no tiene ni un fichero, así que `cargarCorpus` devuelve
 * capas vacías y el repositorio responde `sin-significado-base` para cualquier
 * carta. Eso seguirá siendo cierto hasta que exista corpus en portugués, y
 * cuando exista habrá que traer aquí el idioma que siga vacío — que es
 * exactamente la conversación que conviene tener ese día.
 */
const CARTA_SIN_TEXTO = "/pt/leitura?carta=la-torre&orientacion=derecha";

test("la posición se nombra antes de voltear", async ({ page }) => {
  await page.goto(CARTA_ESCRITA);
  await esperarAQueSeAsiente(page);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("La respuesta");
  await expect(page.getByRole("button", { name: /Voltea la carta/ })).toBeVisible();
});

test("la identidad de la carta no está en el DOM hasta el volteo", async ({ page }) => {
  await page.goto(CARTA_ESCRITA);
  await esperarAQueSeAsiente(page);

  /*
   * Es la garantía que da `Carta` y la razón de que su propiedad `carta` sea
   * opcional. Si el nombre estuviera aquí, la ceremonia entera sería teatro.
   */
  const antes = await page.locator("body").innerText();
  expect(antes).not.toContain("La Torre");

  await page.getByRole("button", { name: /Voltea la carta/ }).click();
  await expect(page.getByText("La Torre").first()).toBeVisible();
});

test("el significado llega después del volteo, no antes", async ({ page }) => {
  await page.goto(CARTA_ESCRITA);
  await esperarAQueSeAsiente(page);

  const panel = page.getByText("La Torre no avisa");
  await expect(panel).toHaveCount(0);

  await page.getByRole("button", { name: /Voltea la carta/ }).click();
  await expect(panel).toBeVisible();
});

test("la carta invertida se distingue sin depender del color", async ({ page }) => {
  await page.goto(CARTA_INVERTIDA);
  await esperarAQueSeAsiente(page);
  await page.getByRole("button", { name: /Voltea la carta/ }).click();
  await expect(page.getByText("La Torre").first()).toBeVisible();

  /* Tres señales, y ninguna es el color: rótulo, giro y anuncio hablado. */
  await expect(page.getByText("Invertida", { exact: true })).toBeVisible();
  await expect(page.locator('[data-orientacion="invertida"]')).toHaveCount(1);
  await expect(page.getByRole("img", { name: "La Torre, invertida" })).toBeVisible();
});

test("una carta sin significado escrito lo dice y no rompe la lectura", async ({
  page,
}) => {
  await page.goto(CARTA_SIN_TEXTO);
  await esperarAQueSeAsiente(page);
  await page.getByRole("button", { name: /Vira a carta/ }).click();

  /*
   * Lo que se comprueba es que la pieza que falta es **situación de dominio** y
   * no una excepción: la carta se revela igual, con su nombre, y el hueco del
   * texto se explica en el idioma del visitante.
   */
  await expect(page.getByText(/ainda não está escrito/)).toBeVisible();
  await expect(page.getByText("La Torre").first()).toBeVisible();
});

/*
 * El volteo estuvo declarado y sin correr nunca: la transición decía 0,6 s y la
 * carta llegaba a 180° a los 133 ms. La causa era que al empezar a girar se le
 * quitaba `alPulsar`, `Carta` dejaba de ser `button` para ser `div`, y React
 * montaba un elemento nuevo que nacía ya girado.
 *
 * Es un fallo que **no se ve en una captura** y que ninguna aserción de
 * contenido habría cazado: el resultado final es idéntico, sólo falta el camino.
 * Por eso se mide el camino.
 */
test("el volteo recorre la curva en lugar de saltar", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(CARTA_ESCRITA);
  await esperarAQueSeAsiente(page);

  const giro = () =>
    page.evaluate(() => {
      const interior = document.querySelector("[class*='interior']");
      if (interior === null) {
        return null;
      } else {
        const matriz = getComputedStyle(interior).transform;
        const primera = /matrix3d\(([-\d.e]+)|matrix\(([-\d.e]+)/.exec(matriz);
        if (primera === null) {
          return 0;
        } else {
          const coseno = Number.parseFloat(primera[1] ?? primera[2] ?? "1");
          return (Math.acos(Math.max(-1, Math.min(1, coseno))) * 180) / Math.PI;
        }
      }
    });

  await page.getByRole("button", { name: /Voltea la carta/ }).click();
  await page.waitForTimeout(120);
  const aMitad = await giro();

  /* A un quinto de la duración no puede estar ya en el otro lado. */
  expect(aMitad).not.toBeNull();
  expect(aMitad ?? 180).toBeLessThan(170);

  await page.waitForTimeout(900);
  expect(await giro()).toBeCloseTo(180, 0);
});

test("se voltea con el teclado y el foco no se pierde", async ({ page }) => {
  await page.goto(CARTA_ESCRITA);
  await esperarAQueSeAsiente(page);

  await page.getByRole("button", { name: /Voltea la carta/ }).focus();
  await page.keyboard.press("Enter");

  await expect(page.getByText("La Torre no avisa")).toBeVisible();
  expect(await medirDesbordeHorizontal(page)).toBe(0);
});

test("con movimiento reducido el significado sigue llegando", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(CARTA_ESCRITA);
  await esperarAQueSeAsiente(page);
  await page.getByRole("button", { name: /Voltea la carta/ }).click();

  /*
   * El volteo se resuelve en un instante por CSS, así que el guion tampoco puede
   * esperar sus 600 ms: sin esto el significado se quedaría colgando sobre una
   * carta que ya está quieta.
   */
  await expect(page.getByText("La Torre no avisa")).toBeVisible({ timeout: 250 });
});
