import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Configuración de ESLint para Sibila.
 *
 * Codifica las convenciones de código del proyecto descritas en CLAUDE.md.
 * Lo que puede comprobarse de forma mecánica se comprueba aquí; lo que no,
 * queda documentado en CLAUDE.md y se vigila en revisión.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    name: "sibila/convenciones",
    files: ["src/**/*.ts", "src/**/*.tsx"],

    /*
     * Linting con información de tipos. Es más lento que el análisis puramente
     * sintáctico, pero es lo que permite comprobar cosas como que un booleano
     * lleve el prefijo correcto: sin tipos, ESLint no sabe qué es un booleano.
     */
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      // ── Estilo de control de flujo ──────────────────────────────────────
      // El proyecto exige `if`/`else` explícito en lugar de retorno anticipado.
      // `no-else-return` impone justo lo contrario, así que se desactiva a
      // propósito. No reactivar: ver CLAUDE.md, apartado «Reglas de estilo».
      "no-else-return": "off",

      // El bucle se elige por su semántica. Estas dos reglas impiden los
      // usos que delatan un bucle mal escogido.
      "no-unmodified-loop-condition": "error",
      "for-direction": "error",

      // ── Legibilidad ─────────────────────────────────────────────────────
      complexity: ["warn", 10],
      "max-depth": ["warn", 3],
      "max-lines-per-function": [
        "warn",
        { max: 60, skipBlankLines: true, skipComments: true },
      ],
      "max-params": ["warn", 4],

      // ── Rigor ───────────────────────────────────────────────────────────
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // ── Nomenclatura en español ─────────────────────────────────────────
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "variable",
          modifiers: ["const", "global"],
          types: ["number", "string"],
          format: ["UPPER_CASE", "camelCase"],
        },
        {
          selector: "variable",
          types: ["boolean"],
          format: ["PascalCase"],
          /*
           * El orden importa: la regla prueba los prefijos en secuencia y se
           * queda con el primero que encaja. Si "es" fuera antes que "esta",
           * `estaActivo` se recortaría a `taActivo` y fallaría. De más largo a
           * más corto.
           */
          prefix: ["estan", "esta", "tiene", "puede", "debe", "hay", "usa", "es"],
        },
        {
          selector: "function",
          format: ["camelCase", "PascalCase"],
        },
        {
          selector: "classMethod",
          format: ["camelCase"],
        },
        {
          selector: "enumMember",
          format: ["UPPER_CASE"],
        },
        {
          selector: "objectLiteralProperty",
          format: null,
        },
        {
          selector: "import",
          format: null,
        },
      ],
    },
  },

  /*
   * La regla de dependencias, forzada.
   *
   * El dominio no conoce a quien lo pinta. `motor-de-lectura` es TypeScript
   * puro: ni React, ni Next, ni DOM, ni renderizadores. Si necesita la hora o
   * azar, se le inyectan.
   *
   * La señal de que se cumple es que sus pruebas corren en Node sin jsdom y son
   * instantáneas. Ver docs/guia-de-arquitectura.md §1.
   */
  {
    name: "sibila/dominio-aislado",
    files: ["src/motor-de-lectura/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              /*
               * Todo el proyecto salvo el propio motor. La guía dice «no importa
               * de NADIE», así que enumerar las capas conocidas no basta: una
               * carpeta nueva quedaría permitida por omisión, que es justo como
               * se cuela la primera dependencia.
               */
              group: ["@/*", "!@/motor-de-lectura/*"],
              message:
                "El motor no importa nada del proyecto: es TypeScript puro. Si necesita algo de fuera, se le pasa como parámetro, y si es quien lo pinta, que escuche el bus de eventos.",
            },
            {
              group: ["../renderizadores/*", "../app/*", "../componentes/*"],
              message:
                "El motor no puede depender de quien lo pinta. Invierte la dependencia: que el renderizador escuche el bus de eventos.",
            },
            {
              group: ["react", "react-dom", "next", "next/*", "three", "gsap", "gsap/*"],
              message:
                "El motor es TypeScript puro y se prueba sin DOM. Si necesitas esto aquí, la lógica va en un renderizador.",
            },
          ],
        },
      ],
    },
  },

  /*
   * El camino gratuito no puede alcanzar el modelo de lenguaje.
   *
   * No es una regla de disciplina sino de construcción: el módulo que sirve
   * significados curados no importa el cliente del modelo, así que la llamada
   * accidental no es posible en lugar de estar prohibida. Ver CLAUDE.md,
   * apartado «Modelo de negocio».
   */
  {
    name: "sibila/gratuito-sin-modelo",
    files: ["src/corpus/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/sintesis/*", "@/modelo/*", "openai", "@anthropic-ai/*"],
              message:
                "El corpus sirve el camino gratuito y nunca llama a un modelo. Generar es responsabilidad de la síntesis, que es de pago.",
            },
          ],
        },
      ],
    },
  },

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),
]);

export default eslintConfig;
