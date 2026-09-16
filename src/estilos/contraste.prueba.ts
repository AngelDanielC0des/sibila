import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SUELO_GRANDE,
  SUELO_TEXTO,
  calcularContraste,
  calcularLuminancia,
  clasificarContraste,
  extraerTokens,
  resolverColor,
} from "./contraste";

/**
 * Comprueba los suelos de contraste sobre la hoja de estilos real.
 *
 * Lee `tokens.css` en lugar de duplicar la paleta en TypeScript: así el CSS
 * sigue siendo la única fuente de verdad y es imposible que se desincronicen.
 * Si alguien cambia un color y rompe la accesibilidad, falla la compilación.
 */

const CSS = readFileSync(resolve(import.meta.dirname, "tokens.css"), "utf8");
const OSCURO = extraerTokens(CSS, ":root");
const SOBRESCRITURA_CLARA = extraerTokens(CSS, '[data-tema="claro"]');

/*
 * El tema claro solo redefine algunos tokens; el resto los hereda. Para juzgarlo
 * hay que mirar la tabla combinada, que es lo que ve el navegador.
 */
const CLARO = new Map([...OSCURO, ...SOBRESCRITURA_CLARA]);

const SUPERFICIES_OSCURAS = ["--vacio", "--camara", "--nicho"];
const SUPERFICIES_CLARAS = ["--fondo", "--superficie", "--superficie-alta"];

/**
 * Resuelve un token a color y falla la prueba si no existe.
 *
 * @param nombre Token a resolver.
 * @param tokens Tabla donde buscarlo.
 * @returns El color hexadecimal.
 */
function color(nombre: string, tokens: ReadonlyMap<string, string>): string {
  const resuelto = resolverColor(nombre, tokens);

  if (resuelto === undefined) {
    throw new Error(`El token «${nombre}» no resuelve a un color`);
  } else {
    return resuelto;
  }
}

/**
 * Devuelve el peor contraste de un token frente a una lista de superficies.
 *
 * @param nombre Token de primer plano.
 * @param superficies Tokens de fondo contra los que medirlo.
 * @param tokens Tabla de tokens.
 * @returns La relación más baja de todas.
 */
function peorContraste(
  nombre: string,
  superficies: readonly string[],
  tokens: ReadonlyMap<string, string>,
): number {
  const relaciones = superficies.map((superficie) =>
    calcularContraste(color(nombre, tokens), color(superficie, tokens)),
  );

  return Math.min(...relaciones);
}

describe("cálculo de contraste", () => {
  it("da 21 entre blanco y negro, que es el máximo posible", () => {
    expect(calcularContraste("#ffffff", "#000000")).toBeCloseTo(21, 1);
  });

  it("da 1 entre un color y sí mismo", () => {
    expect(calcularContraste("#3bc4f2", "#3bc4f2")).toBeCloseTo(1, 5);
  });

  it("es simétrico: el orden de los argumentos no importa", () => {
    expect(calcularContraste("#ede7da", "#050912")).toBeCloseTo(
      calcularContraste("#050912", "#ede7da"),
      10,
    );
  });

  it("sitúa la luminancia del negro en cero y la del blanco en uno", () => {
    expect(calcularLuminancia("#000000")).toBeCloseTo(0, 5);
    expect(calcularLuminancia("#ffffff")).toBeCloseTo(1, 5);
  });

  it("rechaza lo que no sea hexadecimal de seis dígitos", () => {
    expect(() => calcularLuminancia("azul")).toThrow();
    expect(() => calcularLuminancia("#fff")).toThrow();
  });

  it("clasifica según los umbrales de WCAG", () => {
    expect(clasificarContraste(21)).toBe("AAA");
    expect(clasificarContraste(5)).toBe("AA");
    expect(clasificarContraste(3.2)).toBe("AA-grande");
    expect(clasificarContraste(2.9)).toBe("insuficiente");
  });
});

describe("lectura de tokens", () => {
  it("encuentra la paleta en la hoja real", () => {
    expect(OSCURO.size).toBeGreaterThan(40);
    expect(OSCURO.get("--vacio")).toBe("#050912");
  });

  it("sigue las referencias entre tokens semánticos y de paleta", () => {
    expect(resolverColor("--fondo", OSCURO)).toBe("#050912");
    expect(resolverColor("--acento", OSCURO)).toBe("#3bc4f2");
  });

  it("devuelve indefinido para lo que no es color", () => {
    expect(resolverColor("--esp-4", OSCURO)).toBeUndefined();
    expect(resolverColor("--token-inventado", OSCURO)).toBeUndefined();
  });
});

describe("tema oscuro · suelos de contraste", () => {
  const PARA_TEXTO_DE_CUERPO = [
    "--pergamino",
    "--bruma",
    "--holo",
    "--holo-nucleo",
    "--oro",
    "--oro-vivo",
    "--exito",
    "--aviso",
    "--error",
  ];

  for (const token of PARA_TEXTO_DE_CUERPO) {
    it(`«${token}» sirve como texto sobre las tres superficies oscuras`, () => {
      expect(peorContraste(token, SUPERFICIES_OSCURAS, OSCURO)).toBeGreaterThanOrEqual(
        SUELO_TEXTO,
      );
    });
  }

  /*
   * Estos tres pasan de 3 pero no llegan a 4,5. Sirven para bordes, iconos y
   * texto grande, y están prohibidos como texto de cuerpo en
   * `docs/guia-de-diseno.md` §4.5. La prueba fija ambos extremos: si alguno
   * subiera de 4,5 la prohibición sobraría, y si bajara de 3 no valdría ni para
   * bordes.
   */
  const SOLO_PARA_BORDES_E_ICONOS = ["--tenue", "--holo-hondo", "--oro-hondo"];

  /*
   * `--linea` es ornamental y no tiene suelo; `--linea-control` dibuja el borde
   * de campos y botones, que es lo que indica dónde está el control, y por eso
   * sí debe alcanzar 3. Confundir ambos dejaría formularios cuyos campos no se
   * distinguen del fondo.
   */
  it("«--linea-control» alcanza el suelo de interfaz", () => {
    expect(
      peorContraste("--linea-control", SUPERFICIES_OSCURAS, OSCURO),
    ).toBeGreaterThanOrEqual(SUELO_GRANDE);
  });

  for (const token of SOLO_PARA_BORDES_E_ICONOS) {
    it(`«${token}» sigue siendo apto para interfaz pero no para texto`, () => {
      const peor = peorContraste(token, SUPERFICIES_OSCURAS, OSCURO);

      expect(peor).toBeGreaterThanOrEqual(SUELO_GRANDE);
      expect(peor).toBeLessThan(SUELO_TEXTO);
    });
  }
});

describe("tema claro · suelos de contraste", () => {
  /*
   * Los semánticos entran aquí porque el tema claro nació sin ellos: heredaba
   * los valores luminosos del oscuro y daban 1,59, 1,66 y 2,43. Un mensaje de
   * error resultaba casi invisible sobre fondo claro. Lo destapó el catálogo de
   * tokens al medirlos de verdad.
   */
  const PARA_TEXTO_DE_CUERPO = [
    "--texto",
    "--texto-suave",
    "--acento",
    "--oro",
    "--oro-vivo",
    "--exito",
    "--aviso",
    "--error",
  ];

  for (const token of PARA_TEXTO_DE_CUERPO) {
    it(`«${token}» sirve como texto sobre las tres superficies claras`, () => {
      expect(peorContraste(token, SUPERFICIES_CLARAS, CLARO)).toBeGreaterThanOrEqual(
        SUELO_TEXTO,
      );
    });
  }

  it("«--linea-control» alcanza el suelo de interfaz", () => {
    expect(
      peorContraste("--linea-control", SUPERFICIES_CLARAS, CLARO),
    ).toBeGreaterThanOrEqual(SUELO_GRANDE);
  });

  it("«--texto-tenue» se queda en interfaz, como en el tema oscuro", () => {
    const peor = peorContraste("--texto-tenue", SUPERFICIES_CLARAS, CLARO);

    expect(peor).toBeGreaterThanOrEqual(SUELO_GRANDE);
    expect(peor).toBeLessThan(SUELO_TEXTO);
  });
});

describe("regresión · el énfasis tiene que enfatizar", () => {
  /*
   * `--oro-vivo` se nombró en su día por su aspecto —«oro más luminoso»— y el
   * tema claro heredaba ese valor. Sobre fondo claro, más luminoso es menos
   * legible, así que el token de énfasis acabó contrastando MENOS que el base:
   * 3,33 contra 4,64. La regla que lo evita está en `docs/guia-de-diseno.md`
   * §4.2: los tokens se nombran por rol, no por aspecto.
   */
  it("en tema claro, «--oro-vivo» contrasta más que «--oro»", () => {
    const base = peorContraste("--oro", SUPERFICIES_CLARAS, CLARO);
    const enfasis = peorContraste("--oro-vivo", SUPERFICIES_CLARAS, CLARO);

    expect(enfasis).toBeGreaterThan(base);
  });

  it("en tema oscuro, «--oro-vivo» también contrasta más que «--oro»", () => {
    const base = peorContraste("--oro", SUPERFICIES_OSCURAS, OSCURO);
    const enfasis = peorContraste("--oro-vivo", SUPERFICIES_OSCURAS, OSCURO);

    expect(enfasis).toBeGreaterThan(base);
  });

  it("el tema claro recalcula el oro en lugar de heredarlo", () => {
    expect(SOBRESCRITURA_CLARA.has("--oro")).toBe(true);
    expect(SOBRESCRITURA_CLARA.has("--oro-vivo")).toBe(true);
  });
});
