/**
 * Comprueba los 78 núcleos antes de entregarlos.
 *
 * Un núcleo mal escrito no se equivoca solo: se propaga a las 34 piezas de esa
 * carta. Por eso se revisan a máquina antes de que nadie los lea.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BARAJA } from "../src/motor-de-lectura/baraja.ts";
import { contarPalabras, revisarTexto, type Problema } from "../src/corpus/reglas.ts";

const ESTADOS = ["bloqueo", "exceso", "interiorizacion", "retraso"];
const MAX_INVARIANTE = 25;
const MAX_VOZ = 20;

type Nucleo = {
  invariante: string;
  voz: string;
  estadoInvertido: string;
};

const nucleos = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../corpus/es/nucleos.json"), "utf8"),
) as Record<string, Nucleo>;

const fallos: string[] = [];
const avisos: string[] = [];

/* La extensión no aplica: un núcleo no es una capa del corpus. */
const sinExtension = (problemas: readonly Problema[]) =>
  problemas.filter((problema) => problema.regla !== "extension");

const idsDeBaraja = BARAJA.map((carta) => carta.id);
const idsDeNucleos = Object.keys(nucleos);

for (const id of idsDeBaraja) {
  if (!(id in nucleos)) fallos.push(`falta el núcleo de «${id}»`);
}
for (const id of idsDeNucleos) {
  if (!idsDeBaraja.includes(id)) fallos.push(`«${id}» no es una carta de la baraja`);
}

const porEstado = new Map<string, number>();
const vistos = new Map<string, string>();

for (const [id, nucleo] of Object.entries(nucleos)) {
  const palabrasInvariante = contarPalabras(nucleo.invariante);
  const palabrasVoz = contarPalabras(nucleo.voz);

  if (palabrasInvariante > MAX_INVARIANTE) {
    fallos.push(
      `${id}: invariante de ${palabrasInvariante} palabras (máx ${MAX_INVARIANTE})`,
    );
  }
  if (palabrasVoz > MAX_VOZ) {
    fallos.push(`${id}: voz de ${palabrasVoz} palabras (máx ${MAX_VOZ})`);
  }
  if (!ESTADOS.includes(nucleo.estadoInvertido)) {
    fallos.push(`${id}: estado invertido desconocido «${nucleo.estadoInvertido}»`);
  }

  porEstado.set(nucleo.estadoInvertido, (porEstado.get(nucleo.estadoInvertido) ?? 0) + 1);

  /* La voz es el espécimen de tono: tiene que pasar la guía como cualquier pieza. */
  for (const problema of sinExtension(revisarTexto(nucleo.voz, "matiz", `voz/${id}`))) {
    const linea = `${id}: ${problema.regla} — ${problema.detalle}`;
    if (problema.gravedad === "error") fallos.push(linea);
    else avisos.push(linea);
  }

  for (const [campo, texto] of [
    ["invariante", nucleo.invariante],
    ["voz", nucleo.voz],
  ] as const) {
    const anterior = vistos.get(texto);
    if (anterior !== undefined)
      fallos.push(`${id}/${campo} repite el texto de ${anterior}`);
    else vistos.set(texto, `${id}/${campo}`);
  }
}

console.log(`Núcleos: ${idsDeNucleos.length} de ${idsDeBaraja.length}`);
console.log(
  "Estados invertidos: " +
    [...porEstado.entries()].map(([estado, n]) => `${estado} ${n}`).join(" · "),
);

if (avisos.length > 0) {
  console.log(`\nAvisos (${avisos.length}):`);
  for (const aviso of avisos) console.log(`  ${aviso}`);
}

if (fallos.length > 0) {
  console.log(`\nFALLOS (${fallos.length}):`);
  for (const fallo of fallos) console.log(`  ${fallo}`);
  process.exitCode = 1;
} else {
  console.log("\nSin fallos.");
}
