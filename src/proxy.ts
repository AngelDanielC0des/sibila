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
   *
   * **La doble barra no es cosmética.** Esto es una cadena, no una expresión
   * regular literal, así que `"\."` pierde la barra al interpretarse y el
   * patrón se quedaba en `.*..*`, que casa con cualquier ruta de un carácter o
   * más. Dentro de una negación, eso significa que el proxy **no se ejecutaba
   * nunca**: los slugs traducidos no se reescribían y `/pt/leitura` caía en la
   * ruta comodín con un 404, igual que habrían caído `/en/spreads` o
   * `/pt/glossario` el día que tuvieran página. Con `"\\."` la barra sobrevive
   * y vuelve a excluir sólo lo que tiene extensión.
   */
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
