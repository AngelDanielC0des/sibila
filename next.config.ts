import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/**
 * El plugin necesita saber dónde vive la configuración de cada petición.
 * Apunta a nuestro fichero en español en lugar de la ruta por convención.
 */
const conIntl = createNextIntlPlugin("./src/i18n/peticion.ts");

const configuracion: NextConfig = {
  reactStrictMode: true,

  /* Formatos modernos para el arte de las cartas, que es el grueso del peso. */
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default conIntl(configuracion);
