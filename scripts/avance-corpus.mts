/**
 * Informe de avance del corpus.
 *
 * Responde a la única pregunta que importa mientras se escriben dos mil piezas:
 * cuánto queda. Las pruebas comprueban la calidad de lo escrito; esto cuenta lo
 * que falta, que es un trabajo distinto y no debe mezclarse con ellas.
 *
 * Uso: `npm run corpus`
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BARAJA, ORIENTACIONES } from "../src/motor-de-lectura/baraja.ts";
import { FAMILIAS } from "../src/motor-de-lectura/familias.ts";
import { familiasEnUso } from "../src/motor-de-lectura/definicion-de-tirada.ts";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IDIOMA = process.argv[2] ?? "es";
const PIEZAS_POR_CAPA = BARAJA.length * ORIENTACIONES.length;

type Avance = {
  readonly nombre: string;
  readonly escritas: number;
  readonly cartasEscritas: ReadonlySet<string>;
};

/**
 * Cuenta las piezas escritas en un fichero de capa.
 *
 * @param ruta Ruta del fichero JSON.
 * @param nombre Nombre legible de la capa.
 * @returns El avance de esa capa.
 */
function medirCapa(ruta: string, nombre: string): Avance {
  if (!existsSync(ruta)) {
    return { nombre, escritas: 0, cartasEscritas: new Set() };
  } else {
    const contenido = JSON.parse(readFileSync(ruta, "utf8")) as Record<
      string,
      Record<string, unknown>
    >;
    const cartasEscritas = new Set<string>();
    let escritas = 0;

    for (const [idCarta, porOrientacion] of Object.entries(contenido)) {
      cartasEscritas.add(idCarta);

      for (const orientacion of ORIENTACIONES) {
        const valor = porOrientacion[orientacion];

        if (valor !== undefined && valor !== null) {
          escritas += 1;
        }
      }
    }

    return { nombre, escritas, cartasEscritas };
  }
}

/**
 * Dibuja una barra de avance de ancho fijo.
 *
 * @param proporcion Valor entre cero y uno.
 * @returns La barra como texto.
 */
function barra(proporcion: number): string {
  const ancho = 24;
  const llenos = Math.round(proporcion * ancho);
  return "█".repeat(llenos) + "·".repeat(ancho - llenos);
}

/**
 * Imprime una línea del informe.
 *
 * @param avance Avance de la capa a imprimir.
 */
function imprimirLinea(avance: Avance): void {
  const proporcion = avance.escritas / PIEZAS_POR_CAPA;
  const porcentaje = Math.round(proporcion * 100);
  const cuenta = `${avance.escritas}/${PIEZAS_POR_CAPA}`;

  console.log(
    `  ${avance.nombre.padEnd(26)} ${barra(proporcion)} ` +
      `${cuenta.padStart(8)}  ${String(porcentaje).padStart(3)}%`,
  );
}

const base = resolve(RAIZ, "corpus", IDIOMA);

console.log(`\n  Corpus · ${IDIOMA}\n`);

const avanceBase = medirCapa(resolve(base, "base.json"), "Significados base");
const avanceValencias = medirCapa(resolve(base, "valencias.json"), "Valencias sí/no");

imprimirLinea(avanceBase);
imprimirLinea(avanceValencias);

console.log("\n  Matices por lente\n");

const carpetaMatices = resolve(base, "matices");
const ficherosDeMatices = existsSync(carpetaMatices)
  ? new Set(readdirSync(carpetaMatices).filter((f) => f.endsWith(".json")))
  : new Set<string>();

let maticesEscritos = 0;

/*
 * Se cuenta contra las familias EN USO, no contra todas las declaradas.
 *
 * `interior` y `entorno` están declaradas porque la Cruz Celta las necesitará,
 * pero ninguna tirada activa las usa. Contarlas mostraría un cero eterno y
 * hundiría el porcentaje midiendo trabajo que nadie ha decidido hacer.
 */
const enUso = familiasEnUso();
const familiasQueCuentan = FAMILIAS.filter((familia) => enUso.has(familia.id));
const familiasEnEspera = FAMILIAS.filter((familia) => !enUso.has(familia.id));

for (const familia of familiasQueCuentan) {
  const fichero = `${familia.id}.json`;
  const avance = ficherosDeMatices.has(fichero)
    ? medirCapa(resolve(carpetaMatices, fichero), familia.id)
    : { nombre: familia.id, escritas: 0, cartasEscritas: new Set<string>() };

  maticesEscritos += avance.escritas;
  imprimirLinea(avance);
}

if (familiasEnEspera.length > 0) {
  const nombres = familiasEnEspera.map((familia) => familia.id).join(", ");
  console.log(
    `
  Declaradas y sin escribir, porque ninguna tirada las usa: ${nombres}`,
  );
}

const totalEsperado = PIEZAS_POR_CAPA * (2 + familiasQueCuentan.length);
const totalEscrito = avanceBase.escritas + avanceValencias.escritas + maticesEscritos;
const porcentajeTotal = Math.round((totalEscrito / totalEsperado) * 100);

console.log(
  `\n  Total  ${barra(totalEscrito / totalEsperado)} ` +
    `${totalEscrito}/${totalEsperado}  ${porcentajeTotal}%\n`,
);

const sinBase = BARAJA.filter((carta) => !avanceBase.cartasEscritas.has(carta.id));

if (sinBase.length > 0) {
  const siguientes = sinBase.slice(0, 8).map((carta) => carta.id);
  console.log(`  Siguientes sin significado base (${sinBase.length} pendientes):`);
  console.log(`    ${siguientes.join(", ")}${sinBase.length > 8 ? ", …" : ""}\n`);
} else {
  console.log("  Todas las cartas tienen significado base.\n");
}
