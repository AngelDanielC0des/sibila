import { defineConfig, devices } from "@playwright/test";

/**
 * Arnés de pruebas de pantalla.
 *
 * Existe porque `docs/guia-de-diseno.md` §8 y la hoja de ruta prometen desde el
 * principio un recorrido a 320, 390, 844×390 y 1440, y hasta ahora esa promesa
 * se cumplía a ojo. Lo que se mira a ojo se deja de mirar.
 *
 * Los cuatro proyectos son **los cuatro anchos de la lista**, no navegadores:
 * el riesgo de este producto no es la diferencia entre motores, es que una
 * pantalla se desborde en el móvil estrecho o al girar el dispositivo.
 *
 * Deliberadamente **fuera de `npm run verificar`**: aquello es la puerta rápida
 * —tipos, linters, pruebas de nodo y núcleos— y tiene que seguir corriendo en
 * segundos sin levantar un servidor ni un navegador. Estas pruebas tienen su
 * propio comando y su propio trabajo en integración continua.
 */

/** Los cuatro anchos de `guia-de-diseno.md` §8, con su alto real. */
const VIEWPORTS = {
  estrecho: { width: 320, height: 568 },
  movil: { width: 390, height: 844 },
  girado: { width: 844, height: 390 },
  escritorio: { width: 1440, height: 900 },
} as const;

const ES_INTEGRACION_CONTINUA = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./pruebas-de-pantalla",
  testMatch: /.*\.pantalla\.ts/,
  outputDir: "./pruebas-de-pantalla/salida",

  /*
   * Sin reintentos ni en local ni en CI. Una prueba de maquetación que pasa al
   * segundo intento no es intermitente: está mal escrita, y reintentar lo
   * esconde. Si algo depende de una animación, se espera a la animación.
   */
  retries: 0,
  fullyParallel: true,
  forbidOnly: ES_INTEGRACION_CONTINUA,
  reporter: ES_INTEGRACION_CONTINUA
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],

  use: {
    baseURL: "http://localhost:3000",
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },

  projects: [
    {
      name: "estrecho-320",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.estrecho },
    },
    {
      name: "movil-390",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.movil },
    },
    {
      name: "girado-844",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.girado },
    },
    {
      name: "escritorio-1440",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.escritorio },
    },
  ],

  /*
   * Servidor de desarrollo y no compilación de producción: `npm run build` ya
   * corre en su propio paso de integración continua, y aquí lo que se mide es
   * maquetación y accesibilidad, que no cambian entre modos. Levantar la
   * compilación aquí duplicaría minutos sin comprobar nada nuevo.
   */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000/es",
    reuseExistingServer: !ES_INTEGRACION_CONTINUA,
    timeout: 120_000,
  },
});
