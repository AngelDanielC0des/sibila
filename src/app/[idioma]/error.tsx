"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Boton } from "@/componentes/base/boton";
import { Enlace } from "@/componentes/base/enlace";
import { ConoVolumetrico } from "@/componentes/ornamentos/cono-volumetrico";
import estilos from "./fallo.module.css";

/**
 * La pantalla de error de una ruta.
 *
 * Next la monta cuando algo revienta al renderizar por debajo de este segmento.
 * Es obligatoriamente un componente de cliente: tiene que poder reintentar sin
 * recargar, que es lo que distingue un fallo transitorio de uno permanente.
 *
 * **Reintentar primero, volver después.** Buena parte de estos fallos son de
 * red y se arreglan solos al segundo intento; mandar al usuario a la portada
 * como única salida le haría perder el sitio por un tropiezo de un segundo.
 *
 * El texto no se disculpa. Dice qué ha pasado, qué no se ha perdido y qué
 * puede hacer. Ver `docs/corpus/guia-de-voz.md`.
 */

type PropiedadesDeError = {
  readonly error: Error & { readonly digest?: string };
  /** Vuelve a renderizar el segmento. Lo inyecta Next. */
  readonly reset: () => void;
};

export default function ErrorDeRuta({ error, reset }: PropiedadesDeError) {
  const t = useTranslations("fallos.error");

  /*
   * Al registro del servidor no llega lo que pasó en el navegador. Sin esto, un
   * error que sólo ocurre en cliente es invisible para nosotros: el usuario ve
   * la pantalla y nosotros no nos enteramos nunca.
   *
   * Se registra el error, no la pregunta ni nada que el usuario haya escrito.
   */
  useEffect(() => {
    console.error("fallo al renderizar una ruta", error);
  }, [error]);

  return (
    <main className={estilos.pagina}>
      <ConoVolumetrico />

      <div className={estilos.contenido}>
        <span className={estilos.marca}>Error</span>
        <h1 className={estilos.titulo}>{t("titulo")}</h1>
        <p className={estilos.cuerpo}>{t("cuerpo")}</p>

        <div className={estilos.salidas}>
          <Boton alPulsar={reset}>{t("reintentar")}</Boton>
          <Enlace href="/" variante="secundario">
            {t("volver")}
          </Enlace>
        </div>

        {/*
         * El identificador que Next asigna al error en el servidor. Es lo único
         * que permite cruzar «lo que vio el usuario» con «lo que hay en el
         * registro», así que se enseña aunque no signifique nada para él.
         */}
        {error.digest === undefined ? null : (
          <p className={estilos.referencia}>Ref. {error.digest}</p>
        )}
      </div>
    </main>
  );
}
