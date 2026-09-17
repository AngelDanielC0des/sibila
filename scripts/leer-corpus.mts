/**
 * Vuelca el corpus en formato de lectura.
 *
 * Un JSON no se revisa: se consulta. Para juzgar voz hace falta leer las piezas
 * seguidas, agrupadas como se agrupa la baraja y con la carta al lado de su
 * invertida, que es donde se ve si una es «lo contrario» de la otra en lugar de
 * la misma carta en otro estado.
 *
 * Uso:
 *   npm run corpus:leer              todo el corpus
 *   npm run corpus:leer -- espadas   sólo lo que contenga «espadas»
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { BARAJA } from "../src/motor-de-lectura/baraja.ts";
import { contarFrases, contarPalabras } from "../src/corpus/reglas.ts";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IDIOMA = "es";
const FILTRO = process.argv[2];

const ruta = resolve(RAIZ, "corpus", IDIOMA, "base.json");

if (!existsSync(ruta)) {
  console.log("No hay corpus base todavía.");
  process.exit(0);
}

const base = JSON.parse(readFileSync(ruta, "utf8")) as Record<
  string,
  Record<string, string>
>;

const nucleos = JSON.parse(
  readFileSync(resolve(RAIZ, "corpus", IDIOMA, "nucleos.json"), "utf8"),
) as Record<string, { invariante: string; voz: string; estadoInvertido: string }>;

/**
 * Parte un texto en líneas de un ancho cómodo de leer.
 *
 * @param texto Texto a envolver.
 * @param ancho Caracteres por línea.
 * @param sangria Espacios al principio de cada línea.
 * @returns El texto ya envuelto.
 */
function envolver(texto: string, ancho: number, sangria: string): string {
  const palabras = texto.split(/\s+/);
  const lineas: string[] = [];
  let actual = "";

  for (const palabra of palabras) {
    if (actual.length + palabra.length + 1 > ancho) {
      lineas.push(actual);
      actual = palabra;
    } else {
      actual = actual === "" ? palabra : `${actual} ${palabra}`;
    }
  }
  lineas.push(actual);

  return lineas.map((linea) => sangria + linea).join("\n");
}

let mostradas = 0;

for (const carta of BARAJA) {
  const piezas = base[carta.id];
  const interesa = FILTRO === undefined || carta.id.includes(FILTRO);

  if (piezas !== undefined && interesa) {
    const nucleo = nucleos[carta.id];
    const numero =
      carta.arcano === "mayor" ? `${carta.numero}` : `${carta.numero} de ${carta.palo}`;

    console.log(`\n${"═".repeat(78)}`);
    console.log(
      `  ${carta.nombre.toUpperCase()}   ·   ${numero}   ·   invertida = ${nucleo?.estadoInvertido ?? "?"}`,
    );
    console.log(`${"═".repeat(78)}`);

    if (nucleo !== undefined) {
      console.log(`\n  núcleo · ${nucleo.invariante}`);
      console.log(`  voz    · ${nucleo.voz}`);
    }

    for (const orientacion of ["derecha", "invertida"] as const) {
      const texto = piezas[orientacion];
      if (texto !== undefined) {
        console.log(
          `\n  ── ${orientacion.toUpperCase()} · ${contarPalabras(texto)} palabras · ${contarFrases(texto)} frases ──\n`,
        );
        console.log(envolver(texto, 72, "  "));
      }
    }

    mostradas += 1;
  }
}

console.log(`\n\n${mostradas} cartas mostradas.`);
