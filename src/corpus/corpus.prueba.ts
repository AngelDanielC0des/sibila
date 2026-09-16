import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BARAJA, ORIENTACIONES, existeCarta } from "@/motor-de-lectura/baraja";
import { existeFamilia } from "@/motor-de-lectura/familias";
import { interpretarCapaDeTexto, interpretarCapaDeValencias } from "./esquema";
import { buscarDuplicados, revisarTexto, type Capa, type Problema } from "./reglas";

/**
 * Valida el corpus real que hay en `corpus/<idioma>/`.
 *
 * Criterio, y es deliberado: **los fallos de calidad tumban la compilación; la
 * cobertura incompleta solo se informa.** El corpus se escribe por lentes a lo
 * largo de semanas, y bloquear cada commit por estar a medias enseñaría a la
 * gente a saltarse el validador, que es exactamente lo que no queremos.
 */

const RAIZ_DEL_CORPUS = resolve(import.meta.dirname, "../../corpus");
const IDIOMA_DE_REFERENCIA = "es";

type Pieza = {
  readonly ubicacion: string;
  readonly texto: string;
  readonly capa: Capa;
};

/**
 * Lee y parsea un fichero JSON del corpus.
 *
 * @param ruta Ruta absoluta del fichero.
 * @returns El contenido parseado.
 */
function leerJson(ruta: string): unknown {
  return JSON.parse(readFileSync(ruta, "utf8")) as unknown;
}

/**
 * Recoge las piezas de una capa de texto, sea la base o un matiz.
 *
 * @param ruta Ruta del fichero.
 * @param capa Capa a la que pertenece, que determina sus límites de extensión.
 * @param etiqueta Prefijo para localizar cada pieza en los mensajes.
 * @returns Las piezas listas para revisar.
 */
function recogerCapaDeTexto(ruta: string, capa: Capa, etiqueta: string): Pieza[] {
  const contenido = interpretarCapaDeTexto(leerJson(ruta), etiqueta);
  const piezas: Pieza[] = [];

  for (const [idCarta, porOrientacion] of Object.entries(contenido)) {
    for (const orientacion of ORIENTACIONES) {
      piezas.push({
        ubicacion: `${etiqueta}/${idCarta}/${orientacion}`,
        texto: porOrientacion[orientacion],
        capa,
      });
    }
  }

  return piezas;
}

/**
 * Recoge las piezas de la capa de valencias.
 *
 * Solo se revisa el motivo: la valencia en sí es un valor cerrado que ya valida
 * el esquema.
 *
 * @param ruta Ruta del fichero.
 * @returns Las piezas listas para revisar.
 */
function recogerValencias(ruta: string): Pieza[] {
  const contenido = interpretarCapaDeValencias(leerJson(ruta), "valencias");
  const piezas: Pieza[] = [];

  for (const [idCarta, porOrientacion] of Object.entries(contenido)) {
    for (const orientacion of ORIENTACIONES) {
      piezas.push({
        ubicacion: `valencias/${idCarta}/${orientacion}`,
        texto: porOrientacion[orientacion].motivo,
        capa: "valencia",
      });
    }
  }

  return piezas;
}

/**
 * Reúne todas las piezas escritas de un idioma, recorriendo las capas que
 * existan. Las que aún no se han empezado simplemente no están.
 *
 * @param idioma Idioma cuyo corpus se quiere reunir.
 * @returns Todas las piezas encontradas.
 */
function reunirPiezas(idioma: string): Pieza[] {
  const base = resolve(RAIZ_DEL_CORPUS, idioma);
  const piezas: Pieza[] = [];

  const ficheroBase = resolve(base, "base.json");
  if (existsSync(ficheroBase)) {
    piezas.push(...recogerCapaDeTexto(ficheroBase, "base", "base"));
  }

  const ficheroValencias = resolve(base, "valencias.json");
  if (existsSync(ficheroValencias)) {
    piezas.push(...recogerValencias(ficheroValencias));
  }

  const carpetaMatices = resolve(base, "matices");
  if (existsSync(carpetaMatices)) {
    for (const fichero of readdirSync(carpetaMatices)) {
      if (fichero.endsWith(".json")) {
        const familia = fichero.replace(/\.json$/, "");
        piezas.push(
          ...recogerCapaDeTexto(
            resolve(carpetaMatices, fichero),
            "matiz",
            `matices/${familia}`,
          ),
        );
      }
    }
  }

  return piezas;
}

/**
 * Extrae el identificador de carta de la localización de una pieza.
 *
 * @param ubicacion Localización en forma `capa/carta/orientacion`.
 * @returns El identificador de la carta.
 */
function cartaDe(ubicacion: string): string {
  const partes = ubicacion.split("/");
  return partes[partes.length - 2] ?? "";
}

const piezas = reunirPiezas(IDIOMA_DE_REFERENCIA);
const problemas: Problema[] = [
  ...piezas.flatMap((pieza) => revisarTexto(pieza.texto, pieza.capa, pieza.ubicacion)),
  ...buscarDuplicados(piezas),
];
const errores = problemas.filter((problema) => problema.gravedad === "error");
const avisos = problemas.filter((problema) => problema.gravedad === "aviso");

describe(`corpus «${IDIOMA_DE_REFERENCIA}»`, () => {
  it("todas las piezas escritas cumplen las reglas mecánicas", () => {
    const resumen = errores.map(
      (problema) => `${problema.ubicacion} · ${problema.regla}: ${problema.detalle}`,
    );

    expect(resumen).toEqual([]);
  });

  /*
   * Un identificador que no existe en la baraja es casi siempre una errata al
   * teclear el slug, y su efecto sería silencioso: la carta se quedaría sin
   * texto y nadie se enteraría hasta verla en producción.
   */
  it("no menciona cartas que no existen", () => {
    const desconocidas = [
      ...new Set(piezas.map((pieza) => cartaDe(pieza.ubicacion))),
    ].filter((id) => !existeCarta(id));

    expect(desconocidas).toEqual([]);
  });

  it("no menciona familias de lente que no existen", () => {
    const familias = [
      ...new Set(
        piezas
          .filter((pieza) => pieza.ubicacion.startsWith("matices/"))
          .map((pieza) => pieza.ubicacion.split("/")[1] ?? ""),
      ),
    ].filter((familia) => !existeFamilia(familia));

    expect(familias).toEqual([]);
  });

  it("informa del avance sin bloquear", () => {
    const esperadasPorCapa = BARAJA.length * ORIENTACIONES.length;
    const escritasBase = piezas.filter((pieza) => pieza.capa === "base").length;
    const porcentaje = Math.round((escritasBase / esperadasPorCapa) * 100);

    if (escritasBase < esperadasPorCapa) {
      console.warn(
        `\n  Corpus «${IDIOMA_DE_REFERENCIA}» · significados base: ` +
          `${escritasBase}/${esperadasPorCapa} (${porcentaje}%)` +
          `${avisos.length > 0 ? ` · ${avisos.length} aviso(s) de léxico a revisar` : ""}\n`,
      );
    }

    expect(escritasBase).toBeLessThanOrEqual(esperadasPorCapa);
  });
});
