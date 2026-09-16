import createMiddleware from "next-intl/middleware";
import { rutas } from "@/i18n/rutas";

/**
 * Resuelve el idioma de cada petición y reescribe la URL al slug interno.
 *
 * Sin esto, `/en/spreads` no encontraría la página que internamente vive en
 * `/tiradas`. Next 16 llama «proxy» a lo que antes era «middleware»; la
 * función es la misma.
 */
export default createMiddleware(rutas);

export const config = {
  /*
   * Se excluyen las rutas de API, los recursos estáticos de Next, los ficheros
   * del directorio público y cualquier ruta con extensión. El resto pasa por
   * la resolución de idioma.
   */
  matcher: ["/((?!api|_next|_vercel|.*\..*).*)"],
};
