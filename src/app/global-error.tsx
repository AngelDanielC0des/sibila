"use client";

import { useEffect } from "react";
import "@/estilos/global.css";
import estilos from "./fallo-sin-layout.module.css";

/**
 * El último recurso: falló el propio layout raíz.
 *
 * Next monta esta pantalla cuando revienta algo tan arriba que ya no hay layout
 * que envuelva nada. Eso impone tres cosas que no aplican en ninguna otra
 * página del producto:
 *
 * 1. **Renderiza su propio `html` y `body`.** Sustituye al layout, no vive
 *    dentro de él.
 * 2. **No hay proveedor de idioma.** `useTranslations` no funcionaría aquí, así
 *    que el texto va escrito en español, el idioma de lanzamiento. Un fallo
 *    catastrófico en el idioma por defecto es aceptable; una pantalla en blanco
 *    porque el traductor tampoco estaba, no.
 * 3. **Importa los estilos por su cuenta**, porque quien los importaba era el
 *    layout que ya no se monta.
 *
 * Todo lo que hay aquí es deliberadamente tonto y sin dependencias. Es la
 * pantalla que tiene que funcionar cuando no funciona nada.
 */

type PropiedadesDeErrorGlobal = {
  readonly error: Error & { readonly digest?: string };
  readonly reset: () => void;
};

export default function ErrorGlobal({ error }: PropiedadesDeErrorGlobal) {
  useEffect(() => {
    console.error("fallo por encima del layout raíz", error);
  }, [error]);

  /*
   * Se recarga la ventana en lugar de llamar al `reset` que da Next. Si lo que
   * ha fallado es el layout raíz, volver a montar el mismo árbol suele fallar
   * otra vez; una recarga limpia tiene bastantes más posibilidades.
   */
  const recargar = () => {
    window.location.reload();
  };

  return (
    <html lang="es">
      <body className={estilos.pagina}>
        <main className={estilos.contenido}>
          <span className={estilos.marca}>Error</span>
          <h1 className={estilos.titulo}>Sibila no responde</h1>
          <p className={estilos.cuerpo}>
            Ha fallado algo por debajo de la aplicación. Vuelve a cargar la página.
          </p>

          <button type="button" className={estilos.recargar} onClick={recargar}>
            Recargar
          </button>

          {error.digest === undefined ? null : (
            <p className={estilos.referencia}>Ref. {error.digest}</p>
          )}
        </main>
      </body>
    </html>
  );
}
