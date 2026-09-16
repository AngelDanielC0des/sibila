import { getRequestConfig } from "next-intl/server";
import { idioma as idiomaDeRuta } from "next/root-params";
import { IDIOMA_POR_DEFECTO, IDIOMAS, type Idioma } from "./rutas";

/**
 * Comprueba si un valor cualquiera es uno de los idiomas activos.
 *
 * El segmento `[idioma]` actúa como comodín para rutas desconocidas, así que
 * puede llegar aquí cualquier cosa. Se valida antes de usarlo.
 *
 * @param valor Valor recibido del segmento de ruta o de una llamada explícita.
 * @returns `true` si el valor es un idioma soportado.
 */
function esIdiomaSoportado(valor: string | undefined): valor is Idioma {
  if (valor === undefined) {
    return false;
  } else {
    return (IDIOMAS as readonly string[]).includes(valor);
  }
}

/**
 * Resuelve la configuración de internacionalización de cada petición.
 *
 * El idioma se lee del parámetro raíz de la ruta y no de la cabecera que
 * escribe el proxy. La diferencia importa: leer cabeceras obliga a renderizar
 * bajo demanda, y las landings por tirada y las fichas de carta tienen que
 * poder prerrenderizarse para que el rastreo orgánico funcione.
 *
 * Cuando se pide una traducción con idioma explícito —por ejemplo desde
 * `generateMetadata`— ese valor manda sobre el de la ruta.
 */
export default getRequestConfig(async ({ locale }) => {
  let solicitado: string | undefined = locale;

  if (solicitado === undefined) {
    solicitado = await idiomaDeRuta();
  }

  let idiomaResuelto: Idioma;
  if (esIdiomaSoportado(solicitado)) {
    idiomaResuelto = solicitado;
  } else {
    idiomaResuelto = IDIOMA_POR_DEFECTO;
  }

  const mensajes = (await import(`../../messages/${idiomaResuelto}.json`)) as {
    default: Record<string, unknown>;
  };

  return {
    locale: idiomaResuelto,
    messages: mensajes.default,
    timeZone: "Europe/Madrid",
  };
});
