import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Configuración de pruebas.
 *
 * El motor de lectura es agnóstico de presentación y por tanto se prueba en
 * entorno Node, sin DOM. Los renderizadores se verifican con Playwright.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.prueba.ts"],
    coverage: {
      provider: "v8",
      include: ["src/motor-de-lectura/**/*.ts"],
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
});
