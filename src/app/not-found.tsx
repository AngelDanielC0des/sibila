import "@/estilos/global.css";
import { IDIOMAS, NOMBRE_DE_IDIOMA } from "@/i18n/rutas";
import estilos from "./fallo-sin-layout.module.css";

/**
 * El 404 de la raíz: URLs que caen fuera de todo idioma.
 *
 * Lo ve quien llega a algo como `/xx` o `/favicon-viejo`, donde no hay idioma
 * que resolver. Por eso, y a diferencia del 404 de dentro de un idioma, **no
 * elige lengua por el visitante**: ofrece las tres y decide él.
 *
 * Vive fuera de `[idioma]`, así que no la envuelve ningún layout: renderiza su
 * propio `html` e importa sus estilos, igual que `global-error`.
 *
 * **Es HTML estático de verdad**, con su contenido dentro. Eso la hace la única
 * pantalla de fallo que funciona con JavaScript desactivado, y es el motivo de
 * que exista además de la localizada.
 */
export default function NoEncontradoEnLaRaiz() {
  return (
    <html lang="es">
      <body className={estilos.pagina}>
        <main className={estilos.contenido}>
          <span className={estilos.marca}>Error 404</span>
          <h1 className={estilos.titulo}>Esta carta no está en la baraja</h1>
          <p className={estilos.cuerpo}>
            La dirección que has abierto no corresponde a ninguna página. Elige un idioma
            para empezar.
          </p>

          <nav className={estilos.idiomas}>
            {IDIOMAS.map((codigo) => (
              <a
                key={codigo}
                className={estilos.idioma}
                href={`/${codigo}`}
                lang={codigo}
                hrefLang={codigo}
              >
                {NOMBRE_DE_IDIOMA[codigo]}
              </a>
            ))}
          </nav>
        </main>
      </body>
    </html>
  );
}
