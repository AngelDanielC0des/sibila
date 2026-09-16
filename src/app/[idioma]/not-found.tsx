import { getTranslations } from "next-intl/server";
import { idioma as obtenerIdioma } from "next/root-params";
import { Enlace } from "@/componentes/base/enlace";
import { ConoVolumetrico } from "@/componentes/ornamentos/cono-volumetrico";
import estilos from "./fallo.module.css";

/**
 * La página 404.
 *
 * Es una ruta de contenido como cualquier otra: le llega tráfico real desde
 * enlaces rotos y desde buscadores con el índice desactualizado. Por eso se
 * renderiza en servidor, en el idioma de la URL, y ofrece dos salidas en lugar
 * de dejar al visitante en un callejón.
 *
 * El idioma se lee con `next/root-params` y no con `requestLocale`, que consulta
 * las cabeceras y volvería dinámica una página que debe ser estática.
 */
export default async function NoEncontrado() {
  const codigoDeIdioma = await obtenerIdioma();
  const t = await getTranslations({
    locale: codigoDeIdioma,
    namespace: "fallos.noEncontrado",
  });

  return (
    <main className={estilos.pagina}>
      <ConoVolumetrico />

      <div className={estilos.contenido}>
        <span className={estilos.marca}>Error 404</span>
        <h1 className={estilos.titulo}>{t("titulo")}</h1>
        <p className={estilos.cuerpo}>{t("cuerpo")}</p>

        <nav className={estilos.salidas}>
          <Enlace href="/">{t("volver")}</Enlace>
          <Enlace href="/tiradas" variante="secundario">
            {t("tiradas")}
          </Enlace>
        </nav>
      </div>
    </main>
  );
}
