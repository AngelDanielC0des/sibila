import { defineRouting } from "next-intl/routing";

/**
 * Idiomas activos de la plataforma.
 *
 * El español es el idioma de lanzamiento. El portugués y el inglés están
 * preparados en la arquitectura; su contenido llega por fases, porque el cuello
 * de botella no es el código sino el corpus interpretativo.
 */
export const IDIOMAS = ["es", "pt", "en"] as const;

export const IDIOMA_POR_DEFECTO = "es";

export type Idioma = (typeof IDIOMAS)[number];

/**
 * Nombre legible de cada idioma, en su propia lengua.
 * Se usa en el selector de idioma: un hablante reconoce su idioma escrito como
 * él lo escribe, no traducido al idioma actual de la interfaz.
 */
export const NOMBRE_DE_IDIOMA: Record<Idioma, string> = {
  es: "Español",
  pt: "Português",
  en: "English",
};

/**
 * Configuración de enrutado.
 *
 * Usamos slug traducido y no solo prefijo de idioma: la palabra clave tiene que
 * estar en la URL de cada mercado. Es la misma estrategia que emplea Tarotoo y
 * es la correcta para captación orgánica.
 *
 * `localeDetection` va desactivada a propósito. Redirigir automáticamente según
 * la cabecera del navegador hace que una misma URL sirva contenidos distintos
 * según quién la pida, lo que confunde al rastreo de los buscadores. La
 * detección se usará para *sugerir* cambio de idioma, nunca para forzarlo.
 */
export const rutas = defineRouting({
  locales: IDIOMAS,
  defaultLocale: IDIOMA_POR_DEFECTO,
  localePrefix: "always",
  localeDetection: false,
  alternateLinks: true,
  pathnames: {
    "/": "/",
    "/tiradas": {
      es: "/tiradas",
      pt: "/tiragens",
      en: "/spreads",
    },
    "/tiradas/[tirada]": {
      es: "/tiradas/[tirada]",
      pt: "/tiragens/[tirada]",
      en: "/spreads/[tirada]",
    },
    "/cartas": {
      es: "/cartas",
      pt: "/cartas",
      en: "/cards",
    },
    "/cartas/[carta]": {
      es: "/cartas/[carta]",
      pt: "/cartas/[carta]",
      en: "/cards/[carta]",
    },
    "/glosario": {
      es: "/glosario",
      pt: "/glossario",
      en: "/glossary",
    },
  },
});
