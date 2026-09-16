import { describe, expect, it } from "vitest";
import {
  esDecodificable,
  estaResuelto,
  pendientes,
  planificarDecodificacion,
} from "./decodificacion";

/** Azar fijo, para que el reparto de umbrales sea reproducible. */
function azarFijo(valor: number): () => number {
  return () => valor;
}

const FRASE = "La Torre no avisa";

describe("qué se decodifica", () => {
  it("las letras sí", () => {
    expect(esDecodificable("T")).toBe(true);
    expect(esDecodificable("ñ")).toBe(true);
    expect(esDecodificable("ç")).toBe(true);
    expect(esDecodificable("¿")).toBe(true);
  });

  /*
   * Sustituir los espacios desdibujaría la silueta de las palabras, y con ella
   * la sensación de que hay un texto ahí debajo esperando a resolverse.
   */
  it("los espacios y saltos de línea no", () => {
    expect(esDecodificable(" ")).toBe(false);
    expect(esDecodificable("\n")).toBe(false);
  });
});

describe("reparto de umbrales", () => {
  it("da un umbral por carácter", () => {
    const plan = planificarDecodificacion(FRASE, azarFijo(0.5));

    expect(plan.umbrales).toHaveLength([...FRASE].length);
  });

  it("deja los espacios resueltos desde el principio", () => {
    const plan = planificarDecodificacion(FRASE, azarFijo(0.9));
    const caracteres = [...FRASE];

    for (let indice = 0; indice < caracteres.length; indice += 1) {
      if (caracteres[indice] === " ") {
        expect(estaResuelto(plan, indice, 0), `índice ${indice}`).toBe(true);
      }
    }
  });

  it("ningún umbral se sale del rango", () => {
    const plan = planificarDecodificacion(FRASE, Math.random);

    for (const umbral of plan.umbrales) {
      expect(umbral).toBeGreaterThanOrEqual(0);
      expect(umbral).toBeLessThanOrEqual(1);
    }
  });

  /*
   * Es la propiedad que da el efecto: sin holgura sería un barrido recto y
   * mecánico; con ella el borde queda irregular y parece que el texto se aclara
   * solo. Con azar fijo el reparto es monótono, así que hace falta azar real
   * para comprobar que hay desorden.
   */
  it("el azar desordena el barrido de izquierda a derecha", () => {
    const plan = planificarDecodificacion("abcdefghijklmnopqrst", Math.random);
    let hayDesorden = false;

    for (let indice = 1; indice < plan.umbrales.length; indice += 1) {
      const anterior = plan.umbrales[indice - 1] ?? 0;
      const actual = plan.umbrales[indice] ?? 0;

      if (actual < anterior) {
        hayDesorden = true;
      }
    }

    expect(hayDesorden).toBe(true);
  });

  it("aun así, resuelve antes el principio que el final", () => {
    const plan = planificarDecodificacion("abcdefghijklmnopqrst", Math.random);
    const primeros = plan.umbrales.slice(0, 5);
    const ultimos = plan.umbrales.slice(-5);
    const media = (valores: readonly number[]) =>
      valores.reduce((suma, valor) => suma + valor, 0) / valores.length;

    expect(media(primeros)).toBeLessThan(media(ultimos));
  });
});

describe("avance", () => {
  it("con avance cero solo están resueltos los espacios", () => {
    const plan = planificarDecodificacion(FRASE, azarFijo(0.5));
    const sinEspacios = [...FRASE].filter((caracter) => caracter !== " ").length;

    expect(pendientes(plan, 0)).toBe(sinEspacios);
  });

  it("con avance uno no queda nada pendiente", () => {
    const plan = planificarDecodificacion(FRASE, Math.random);

    expect(pendientes(plan, 1)).toBe(0);
  });

  /*
   * Un carácter ya fijado no puede volver a ser glifo: se leería como parpadeo
   * en vez de como algo que se aclara. El reparto se calcula una sola vez, y
   * esta prueba es la que lo garantiza.
   */
  it("un carácter resuelto no vuelve atrás", () => {
    const plan = planificarDecodificacion(FRASE, Math.random);
    const yaResueltos = new Set<number>();

    for (let paso = 0; paso <= 20; paso += 1) {
      const avance = paso / 20;

      for (let indice = 0; indice < plan.umbrales.length; indice += 1) {
        if (estaResuelto(plan, indice, avance)) {
          yaResueltos.add(indice);
        } else {
          expect(yaResueltos.has(indice), `índice ${indice} en avance ${avance}`).toBe(
            false,
          );
        }
      }
    }
  });

  it("los pendientes solo disminuyen", () => {
    const plan = planificarDecodificacion(FRASE, Math.random);
    let anterior = pendientes(plan, 0);

    for (let paso = 1; paso <= 20; paso += 1) {
      const actual = pendientes(plan, paso / 20);
      expect(actual).toBeLessThanOrEqual(anterior);
      anterior = actual;
    }
  });
});

describe("textos con diacríticos", () => {
  /*
   * El corpus se escribe en español y se reescribirá en portugués. Un reparto
   * que cuente mal los caracteres acentuados dejaría letras sin decodificar.
   */
  it("cuenta bien acentos, eñes y cedillas", () => {
    const conDiacriticos = "El Ermitaño sube — ação, coração";
    const plan = planificarDecodificacion(conDiacriticos, Math.random);

    expect(plan.umbrales).toHaveLength([...conDiacriticos].length);
    expect(pendientes(plan, 1)).toBe(0);
  });
});
