import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  BARAJA,
  existeCarta,
  type Carta,
  type Orientacion,
} from "@/motor-de-lectura/baraja";
import { barajarMazo, type CartaDelMazo } from "@/motor-de-lectura/mazo-de-cartas";
import { crearRepositorioDeCorpus } from "@/motor-de-lectura/repositorio-de-corpus";
import { cargarCorpus } from "@/corpus/cargador";
import { Revelado } from "@/renderizadores/plano/revelado";

/**
 * Revelado de una carta · A3.4.
 *
 * **Es una rebanada vertical, no la lectura completa.** A3.1, A3.2 y A3.3 —la
 * pregunta, el barajado y la selección— todavía no existen, así que esta
 * pantalla empieza donde empezaría el revelado y se salta lo anterior. Sirve
 * para responder a la única pregunta que sostiene el negocio: **un significado
 * curado, leído en su panel después de un volteo, ¿se siente como una lectura?**
 *
 * Todo lo que se pinta aquí sale del motor y del corpus reales. No hay datos de
 * mentira: la carta la baraja `barajarMazo` y el texto lo compone el repositorio
 * leyendo `corpus/es/base.json`.
 *
 * **La carta se elige en el servidor**, no en el navegador. Así el primer
 * pintado no depende de JavaScript y la ceremonia empieza igual para todos.
 *
 * **Sobre espiar la carta antes de voltearla.** `Carta` garantiza que la
 * identidad no entra en el DOM hasta el volteo, y eso se verifica. Lo que sí
 * viaja en la carga inicial es la propiedad que recibe el componente cliente:
 * quien abra las herramientas del navegador puede ver qué le va a salir.
 *
 * No es un descuido, es el precio de la decisión que sostiene el producto: el
 * significado es un fichero estático que el CDN ya tiene cacheado, y todo lo que
 * está en el cliente se puede leer. Tarotoo no tiene esta fuga en el texto
 * porque lo genera después del volteo —y por eso le cuesta dinero cada lectura—,
 * pero sí la tiene en los clips, servidos como `8.mp4`.
 *
 * Lo que sí hay que proteger, y no es esto, es **la recolección masiva** del
 * corpus y la síntesis de pago. Eso es A5 y la nota de seguridad de `CLAUDE.md`.
 */

/** No se indexa: es una pantalla de trabajo hasta que A3 esté entero. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/*
 * Cada visita es una tirada nueva, así que no hay nada que cachear. Sin esto,
 * Next serviría la misma carta a todo el mundo, que es justo lo contrario de
 * una lectura.
 */
export const dynamic = "force-dynamic";

type PropiedadesDeLectura = {
  params: Promise<{ idioma: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Saca un parámetro de consulta como cadena simple.
 *
 * @param valor Lo que llega de la URL, que puede venir repetido.
 * @returns El primer valor, o `undefined` si no vino.
 */
function primerValor(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) {
    return valor[0];
  } else {
    return valor;
  }
}

/**
 * La carta que la URL fija a mano, si fija alguna.
 *
 * Existe para poder verificar la pantalla: sin ella, una prueba de un estado
 * concreto —una carta invertida, una carta sin texto— dependería de la suerte.
 *
 * @param idPedido Identificador que llega por la URL.
 * @returns La carta pedida, o `undefined` si no vino o no existe.
 */
function cartaPedida(idPedido: string | undefined): Carta | undefined {
  if (idPedido === undefined || !existeCarta(idPedido)) {
    return undefined;
  } else {
    return BARAJA.find((candidata) => candidata.id === idPedido);
  }
}

/**
 * La orientación que la URL fija a mano, si fija alguna.
 *
 * @param valor Lo que llega por la URL.
 * @returns La orientación pedida, o `undefined` si no vino o no es válida.
 */
function orientacionPedida(valor: string | undefined): Orientacion | undefined {
  if (valor === "invertida" || valor === "derecha") {
    return valor;
  } else {
    return undefined;
  }
}

/**
 * Reparte el mazo del que sale esta lectura.
 *
 * **Mientras el corpus está a medias, el mazo se limita a las cartas ya
 * escritas.** No es una licencia sobre el azar: con 3 de 78 escritas, un reparto
 * completo enseñaría el estado «aún sin escribir» el 96 % de las veces y la
 * pantalla no podría cumplir su función, que es juzgar el texto. El filtro
 * **desaparece con A3.3**, cuando la carta venga de la selección del usuario.
 *
 * @param tieneSignificadoBase Si una carta ya tiene texto escrito.
 * @returns La carta repartida.
 */
function repartirUna(tieneSignificadoBase: (idCarta: string) => boolean): CartaDelMazo {
  const mazo = barajarMazo();
  const escritas = mazo.filter((entrada) => tieneSignificadoBase(entrada.carta.id));
  const salida = escritas[0] ?? mazo[0];

  if (salida === undefined) {
    /* La baraja tiene setenta y ocho cartas y el barajado no las pierde. */
    throw new Error("el mazo salió vacío del barajado");
  } else {
    return salida;
  }
}

/**
 * Elige la carta que sale en esta lectura, respetando lo que fije la URL.
 *
 * @param tieneSignificadoBase Si una carta ya tiene texto escrito.
 * @param consulta Parámetros de consulta de la petición.
 * @returns La carta y su orientación.
 */
function elegirCarta(
  tieneSignificadoBase: (idCarta: string) => boolean,
  consulta: Record<string, string | string[] | undefined>,
): CartaDelMazo {
  const repartida = repartirUna(tieneSignificadoBase);

  return {
    carta: cartaPedida(primerValor(consulta["carta"])) ?? repartida.carta,
    orientacion:
      orientacionPedida(primerValor(consulta["orientacion"])) ?? repartida.orientacion,
  };
}

/**
 * Pantalla de revelado.
 *
 * @param props Propiedades de la página.
 * @param props.params Segmentos de la ruta, con el idioma.
 * @param props.searchParams Parámetros de consulta, para fijar carta y orientación.
 */
export default async function PaginaDeLectura({
  params,
  searchParams,
}: PropiedadesDeLectura) {
  const { idioma } = await params;
  const consulta = await searchParams;
  const t = await getTranslations("lectura.revelado");
  const tTiradas = await getTranslations("tiradas");

  const repositorio = crearRepositorioDeCorpus(cargarCorpus(idioma));
  const { carta, orientacion } = elegirCarta(repositorio.tieneSignificadoBase, consulta);

  const significado = repositorio.obtenerSignificado({
    carta,
    orientacion,
    modo: "base",
  });

  const encabezado =
    orientacion === "invertida"
      ? t("encabezadoInvertida", { carta: carta.nombre })
      : t("encabezadoDerecha", { carta: carta.nombre });

  return (
    <main>
      <Revelado
        carta={carta}
        orientacion={orientacion}
        posicion={tTiradas("una-carta.posiciones.1")}
        significado={significado.estaBien ? significado.valor.base : null}
        textos={{
          instruccion: t("voltear"),
          accionDeVoltear: t("voltear"),
          volteando: t("volteando"),
          encabezadoDelPanel: encabezado,
          sinSignificado: t("sinSignificado"),
        }}
      />
    </main>
  );
}
