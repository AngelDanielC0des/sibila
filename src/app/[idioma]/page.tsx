import { getTranslations } from "next-intl/server";
import { IDIOMAS, NOMBRE_DE_IDIOMA, type Idioma } from "@/i18n/rutas";
import estilos from "./pagina.module.css";

type PropiedadesDePortada = {
  params: Promise<{ idioma: string }>;
};

/**
 * Portada provisional.
 *
 * Verifica de extremo a extremo que la cadena de idiomas, los tokens de diseño
 * y la carga de fuentes funcionan. El héroe definitivo con la oráculo
 * holográfica se construye en la fase 6; ver docs/plan-v1.md.
 */
export default async function Portada({ params }: PropiedadesDePortada) {
  const { idioma } = await params;
  const t = await getTranslations("portada");
  const tNav = await getTranslations("navegacion");
  const tLegal = await getTranslations("legal");

  return (
    <main className={estilos.pagina}>
      <header className={`${estilos.contenedor} ${estilos.cabecera}`}>
        <span className={estilos.marca}>Sibila</span>
        <nav className={estilos.idiomas} aria-label={tNav("idioma")}>
          {IDIOMAS.map((disponible: Idioma) => {
            const estaActivo = disponible === idioma;
            const clase = estaActivo
              ? `${estilos.idioma} ${estilos.idiomaActivo}`
              : estilos.idioma;

            return (
              <a
                key={disponible}
                href={`/${disponible}`}
                className={clase}
                lang={disponible}
                aria-current={estaActivo ? "page" : undefined}
              >
                {NOMBRE_DE_IDIOMA[disponible]}
              </a>
            );
          })}
        </nav>
      </header>

      <section className={`${estilos.contenedor} ${estilos.heroe}`}>
        <p className={estilos.marcaDeFase}>Fase 0 · Cimientos</p>
        <h1 className={estilos.titular}>{t("titular")}</h1>
        <p className={estilos.entradilla}>{t("entradilla")}</p>
        <div className={estilos.acciones}>
          <span className={estilos.accionPrimaria}>{t("llamada")}</span>
          <span className={estilos.accionSecundaria}>{t("secundaria")}</span>
        </div>
      </section>

      <footer className={`${estilos.contenedor} ${estilos.pie}`}>
        <p>{tLegal("edad")}</p>
        <p>{tLegal("encuadre")}</p>
      </footer>
    </main>
  );
}
