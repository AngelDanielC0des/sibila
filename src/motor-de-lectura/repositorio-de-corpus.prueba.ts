import { describe, expect, it } from "vitest";
import { buscarCartaPorId, type Carta, type Orientacion } from "./baraja";
import {
  crearRepositorioDeCorpus,
  type CapasDeCorpus,
  type ErrorDeCorpus,
  type PeticionDeSignificado,
  type Significado,
} from "./repositorio-de-corpus";
import type { Resultado } from "./resultado";

/**
 * El corpus se escribe a mano y durante meses estará incompleto. Estas pruebas
 * se centran en eso más que en el camino feliz: **ninguna pieza que falte puede
 * reventar una lectura**, y cada hueco tiene que decir exactamente cuál es, o
 * quien pinta no sabrá si enseñar un texto de reserva o un aviso.
 */

/**
 * Busca una carta de la baraja para usarla en las pruebas.
 *
 * @param id Identificador de la carta.
 * @returns La carta.
 */
function obtenerCarta(id: string): Carta {
  const carta = buscarCartaPorId(id);

  if (carta === undefined) {
    throw new Error(`La carta «${id}» tiene que existir para estas pruebas.`);
  } else {
    return carta;
  }
}

const TORRE = obtenerCarta("la-torre");
const ERMITANO = obtenerCarta("el-ermitano");

const CAPAS: CapasDeCorpus = {
  base: {
    "la-torre": {
      derecha: "La Torre no avisa.",
      invertida: "La Torre invertida es el derrumbe que se aplaza.",
    },
  },
  matices: {
    obstaculo: {
      "la-torre": {
        derecha: "Lo que te frena es sostener algo que ya cedió.",
        invertida: "Lo que te frena es apuntalar en vez de soltar.",
      },
    },
    consejo: {},
  },
  valencias: {
    "la-torre": {
      derecha: { valencia: "no", motivo: "Lo que preguntas se apoya en algo que cede." },
      invertida: {
        valencia: "quiza",
        motivo: "Aún se sostiene, pero a base de esfuerzo.",
      },
    },
  },
};

const REPOSITORIO = crearRepositorioDeCorpus(CAPAS);

/**
 * Pide un significado y afirma que salió bien, devolviéndolo.
 *
 * @param peticion Lo que se pide.
 * @returns El significado compuesto.
 */
function pedirYDarPorBueno(peticion: PeticionDeSignificado): Significado {
  const resultado = REPOSITORIO.obtenerSignificado(peticion);

  if (resultado.estaBien) {
    return resultado.valor;
  } else {
    throw new Error(`Debería haber salido bien, y falló con «${resultado.error}».`);
  }
}

/**
 * Afirma que una petición falla, y por qué motivo exacto.
 *
 * @param resultado Lo que devolvió el repositorio.
 * @param esperado El motivo que se espera.
 */
function esperarFallo(
  resultado: Resultado<Significado, ErrorDeCorpus>,
  esperado: ErrorDeCorpus,
): void {
  expect(resultado.estaBien).toBe(false);

  if (!resultado.estaBien) {
    expect(resultado.error).toBe(esperado);
  }
}

describe("composición de las capas", () => {
  it("el modo «base» devuelve sólo el significado de la carta", () => {
    const significado = pedirYDarPorBueno({
      carta: TORRE,
      orientacion: "derecha",
      modo: "base",
    });

    expect(significado.base).toBe("La Torre no avisa.");
    expect(significado.matiz).toBeNull();
    expect(significado.valencia).toBeNull();
  });

  it("el modo «matiz» añade la lente de la posición", () => {
    const significado = pedirYDarPorBueno({
      carta: TORRE,
      orientacion: "derecha",
      modo: "matiz",
      familia: "obstaculo",
    });

    expect(significado.base).toBe("La Torre no avisa.");
    expect(significado.matiz).toBe("Lo que te frena es sostener algo que ya cedió.");
    expect(significado.valencia).toBeNull();
  });

  it("el modo «valencia» añade el veredicto con su motivo", () => {
    const significado = pedirYDarPorBueno({
      carta: TORRE,
      orientacion: "derecha",
      modo: "valencia",
    });

    expect(significado.valencia?.valencia).toBe("no");
    expect(significado.matiz).toBeNull();
  });
});

/*
 * Si la orientación se ignorara en cualquiera de las capas, la mitad del corpus
 * —780 piezas por idioma— dejaría de verse sin que nada fallara.
 */
describe("la orientación llega a las tres capas", () => {
  const conLente = (orientacion: Orientacion) =>
    pedirYDarPorBueno({ carta: TORRE, orientacion, modo: "matiz", familia: "obstaculo" });

  const conValencia = (orientacion: Orientacion) =>
    pedirYDarPorBueno({ carta: TORRE, orientacion, modo: "valencia" });

  it("cambia el significado base", () => {
    expect(conLente("invertida").base).not.toBe(conLente("derecha").base);
  });

  it("cambia el matiz de la familia", () => {
    expect(conLente("invertida").matiz).not.toBe(conLente("derecha").matiz);
  });

  it("cambia el veredicto de sí/no", () => {
    expect(conValencia("invertida").valencia?.valencia).not.toBe(
      conValencia("derecha").valencia?.valencia,
    );
  });
});

describe("cada hueco del corpus dice cuál es", () => {
  it("una carta sin significado base", () => {
    esperarFallo(
      REPOSITORIO.obtenerSignificado({
        carta: ERMITANO,
        orientacion: "derecha",
        modo: "base",
      }),
      "sin-significado-base",
    );
  });

  it("modo matiz sin decir de qué familia", () => {
    esperarFallo(
      REPOSITORIO.obtenerSignificado({
        carta: TORRE,
        orientacion: "derecha",
        modo: "matiz",
      }),
      "sin-familia-para-el-matiz",
    );
  });

  it("una familia cuyo fichero de matices aún no se ha escrito", () => {
    esperarFallo(
      REPOSITORIO.obtenerSignificado({
        carta: TORRE,
        orientacion: "derecha",
        modo: "matiz",
        familia: "interior",
      }),
      "sin-capa-de-matices",
    );
  });

  it("una familia empezada a la que le falta esta carta", () => {
    esperarFallo(
      REPOSITORIO.obtenerSignificado({
        carta: TORRE,
        orientacion: "derecha",
        modo: "matiz",
        familia: "consejo",
      }),
      "sin-matiz-para-la-carta",
    );
  });
});

describe("los huecos de la capa de valencias", () => {
  it("una carta sin valencia escrita", () => {
    const conBase = crearRepositorioDeCorpus({
      base: CAPAS.base,
      matices: {},
      valencias: {},
    });

    const resultado = conBase.obtenerSignificado({
      carta: TORRE,
      orientacion: "derecha",
      modo: "valencia",
    });

    esperarFallo(resultado, "sin-valencia-para-la-carta");
  });

  it("un corpus sin capa de valencias siquiera", () => {
    const sinValencias = crearRepositorioDeCorpus({ base: CAPAS.base, matices: {} });

    esperarFallo(
      sinValencias.obtenerSignificado({
        carta: TORRE,
        orientacion: "derecha",
        modo: "valencia",
      }),
      "sin-capa-de-valencias",
    );
  });

  /*
   * La propiedad que sostiene todas las demás: el corpus incompleto es el
   * estado normal del proyecto durante meses, y nunca puede tumbar una lectura.
   */
  it("nada de esto lanza nunca", () => {
    const peticiones: readonly PeticionDeSignificado[] = [
      { carta: ERMITANO, orientacion: "invertida", modo: "base" },
      { carta: ERMITANO, orientacion: "derecha", modo: "matiz", familia: "pasado" },
      { carta: ERMITANO, orientacion: "derecha", modo: "valencia" },
      {
        carta: TORRE,
        orientacion: "invertida",
        modo: "matiz",
        familia: "aporte-vinculo",
      },
    ];

    for (const peticion of peticiones) {
      expect(() => REPOSITORIO.obtenerSignificado(peticion)).not.toThrow();
    }
  });
});

describe("saber qué está escrito", () => {
  it("distingue una carta escrita de una que falta", () => {
    expect(REPOSITORIO.tieneSignificadoBase("la-torre")).toBe(true);
    expect(REPOSITORIO.tieneSignificadoBase("el-ermitano")).toBe(false);
    expect(REPOSITORIO.tieneSignificadoBase("no-es-una-carta")).toBe(false);
  });
});
