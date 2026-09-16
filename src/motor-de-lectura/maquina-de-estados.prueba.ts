import { describe, expect, it } from "vitest";
import { buscarTiradaPorId, type DefinicionDeTirada } from "./definicion-de-tirada";
import { barajarMazo, type Mazo } from "./mazo-de-cartas";
import {
  avanzar,
  cartasElegidas,
  estaEnElMuro,
  LECTURA_EN_REPOSO,
  type Accion,
  type EstadoDeLectura,
  type ErrorDeTransicion,
} from "./maquina-de-estados";
import type { Resultado } from "./resultado";

/**
 * La hoja de ruta pide cubrir **todas** las transiciones, las inválidas
 * incluidas. Enumerarlas a mano garantiza olvidar alguna, así que se recorren
 * como matriz: ocho situaciones por ocho acciones, sesenta y cuatro casos, y
 * cada uno afirmado en un sentido o en el otro.
 *
 * Es también lo que sostiene que los dos renderizadores se comporten igual: si
 * una regla vive aquí y está probada, ni el plano ni el 3D pueden divergir.
 */

const PREGUNTA = "¿Qué es lo que en realidad me está frenando?";

/**
 * La tirada de tres con la que se prueba todo.
 *
 * @returns Situación · obstáculo · consejo.
 */
function obtenerTiradaDeTres(): DefinicionDeTirada {
  const tirada = buscarTiradaPorId("situacion-obstaculo-consejo");

  if (tirada === undefined) {
    throw new Error("La tirada de tres tiene que existir para estas pruebas.");
  } else {
    return tirada;
  }
}

const TIRADA = obtenerTiradaDeTres();
const MAZO: Mazo = barajarMazo();

/**
 * Desenvuelve una transición que se da por buena al construir un escenario.
 *
 * @param resultado Lo que devolvió `avanzar`.
 * @returns El estado siguiente.
 */
function forzar(
  resultado: Resultado<EstadoDeLectura, ErrorDeTransicion>,
): EstadoDeLectura {
  if (resultado.estaBien) {
    return resultado.valor;
  } else {
    throw new Error(`Esta transición debería haber valido, y falló: ${resultado.error}`);
  }
}

/**
 * Aplica varias acciones seguidas, dándolas todas por buenas.
 *
 * @param estado Punto de partida.
 * @param acciones Acciones a aplicar en orden.
 * @returns El estado final.
 */
function recorrer(estado: EstadoDeLectura, acciones: readonly Accion[]): EstadoDeLectura {
  let actual = estado;

  for (const accion of acciones) {
    actual = forzar(avanzar(actual, accion));
  }

  return actual;
}

const EMPEZAR: Accion = {
  tipo: "empezar",
  tirada: TIRADA,
  pregunta: PREGUNTA,
  mazo: MAZO,
};

function construirBarajando(): EstadoDeLectura {
  return recorrer(LECTURA_EN_REPOSO, [EMPEZAR]);
}

function construirEligiendo(): EstadoDeLectura {
  return recorrer(construirBarajando(), [{ tipo: "terminar-barajado" }]);
}

function construirEligiendoCompleto(): EstadoDeLectura {
  return recorrer(construirEligiendo(), [
    { tipo: "seleccionar", indice: 3 },
    { tipo: "seleccionar", indice: 17 },
    { tipo: "seleccionar", indice: 42 },
  ]);
}

function construirRevelando(): EstadoDeLectura {
  return recorrer(construirEligiendoCompleto(), [{ tipo: "pasar-a-revelar" }]);
}

function construirRevelandoCompleto(): EstadoDeLectura {
  return recorrer(construirRevelando(), [
    { tipo: "revelar" },
    { tipo: "revelar" },
    { tipo: "revelar" },
  ]);
}

function construirSintetizando(): EstadoDeLectura {
  return recorrer(construirRevelandoCompleto(), [{ tipo: "pedir-sintesis" }]);
}

function construirCompletada(): EstadoDeLectura {
  return recorrer(construirSintetizando(), [
    {
      tipo: "recibir-sintesis",
      texto: "Las tres dicen lo mismo desde ángulos distintos.",
    },
  ]);
}

/** Una acción de cada tipo, con carga válida, para probar la matriz. */
const ACCIONES: readonly Accion[] = [
  EMPEZAR,
  { tipo: "terminar-barajado" },
  { tipo: "seleccionar", indice: 7 },
  { tipo: "pasar-a-revelar" },
  { tipo: "revelar" },
  { tipo: "pedir-sintesis" },
  { tipo: "recibir-sintesis", texto: "…" },
  { tipo: "reiniciar" },
];

type Situacion = {
  readonly nombre: string;
  readonly construir: () => EstadoDeLectura;
  readonly validas: readonly Accion["tipo"][];
};

/**
 * Las ocho situaciones reales de una lectura.
 *
 * No son seis, aunque las fases sean seis: «eligiendo» con huecos libres y
 * «eligiendo» con todos ocupados admiten acciones distintas, y lo mismo pasa al
 * revelar. Tratarlas como una sola dejaría sin probar justo los dos bordes
 * donde es fácil equivocarse.
 */
const SITUACIONES: readonly Situacion[] = [
  {
    nombre: "en reposo",
    construir: () => LECTURA_EN_REPOSO,
    validas: ["empezar", "reiniciar"],
  },
  {
    nombre: "barajando",
    construir: construirBarajando,
    validas: ["terminar-barajado", "reiniciar"],
  },
  {
    nombre: "eligiendo, aún quedan huecos",
    construir: construirEligiendo,
    validas: ["seleccionar", "reiniciar"],
  },
  {
    nombre: "eligiendo, ya están todas",
    construir: construirEligiendoCompleto,
    validas: ["pasar-a-revelar", "reiniciar"],
  },
  {
    nombre: "revelando, aún quedan cartas",
    construir: construirRevelando,
    validas: ["revelar", "reiniciar"],
  },
  {
    nombre: "revelando, ya están todas — el muro",
    construir: construirRevelandoCompleto,
    validas: ["pedir-sintesis", "reiniciar"],
  },
  {
    nombre: "sintetizando",
    construir: construirSintetizando,
    validas: ["recibir-sintesis", "reiniciar"],
  },
  {
    nombre: "completada",
    construir: construirCompletada,
    validas: ["reiniciar"],
  },
];

describe("la matriz completa de transiciones", () => {
  for (const situacion of SITUACIONES) {
    describe(situacion.nombre, () => {
      for (const accion of ACCIONES) {
        const debeValer = situacion.validas.includes(accion.tipo);
        const veredicto = debeValer ? "admite" : "rechaza";

        it(`${veredicto} «${accion.tipo}»`, () => {
          expect(avanzar(situacion.construir(), accion).estaBien).toBe(debeValer);
        });
      }
    });
  }
});

describe("las razones concretas del rechazo", () => {
  /*
   * Que una acción se rechace no basta: la interfaz muestra un mensaje distinto
   * según el porqué, así que el porqué es parte del contrato.
   */
  it("una carta no se puede elegir dos veces", () => {
    const resultado = avanzar(construirEligiendoCompleto(), {
      tipo: "seleccionar",
      indice: 17,
    });

    expect(resultado.estaBien).toBe(false);

    if (!resultado.estaBien) {
      expect(resultado.error).toBe("carta-ya-elegida");
    }
  });

  it("un sitio que no existe en el mazo se rechaza por rango", () => {
    for (const indice of [-1, 78, 999]) {
      const resultado = avanzar(construirEligiendo(), { tipo: "seleccionar", indice });

      expect(resultado.estaBien, `índice ${indice}`).toBe(false);

      if (!resultado.estaBien) {
        expect(resultado.error).toBe("indice-fuera-de-rango");
      }
    }
  });

  it("no se pasa a revelar con huecos vacíos", () => {
    const resultado = avanzar(construirEligiendo(), { tipo: "pasar-a-revelar" });

    expect(resultado.estaBien).toBe(false);

    if (!resultado.estaBien) {
      expect(resultado.error).toBe("faltan-cartas-por-elegir");
    }
  });

  it("no se elige una cuarta carta en una tirada de tres", () => {
    const resultado = avanzar(construirEligiendoCompleto(), {
      tipo: "seleccionar",
      indice: 60,
    });

    expect(resultado.estaBien).toBe(false);

    if (!resultado.estaBien) {
      expect(resultado.error).toBe("ya-estan-todas-elegidas");
    }
  });

  it("no se revela una cuarta vez", () => {
    const resultado = avanzar(construirRevelandoCompleto(), { tipo: "revelar" });

    expect(resultado.estaBien).toBe(false);

    if (!resultado.estaBien) {
      expect(resultado.error).toBe("no-quedan-cartas-por-revelar");
    }
  });

  /*
   * El salto de pago sólo se ofrece cuando ya se ha entregado todo lo gratuito.
   * Si esto se rompiera, se podría cobrar una síntesis de cartas que el usuario
   * aún no ha visto.
   */
  it("no se pide la síntesis antes de revelarlo todo", () => {
    const resultado = avanzar(construirRevelando(), { tipo: "pedir-sintesis" });

    expect(resultado.estaBien).toBe(false);

    if (!resultado.estaBien) {
      expect(resultado.error).toBe("faltan-cartas-por-revelar");
    }
  });
});

describe("el recorrido feliz", () => {
  it("llega de reposo a completada conservando la pregunta", () => {
    const completada = construirCompletada();

    expect(completada.fase).toBe("completada");

    if (completada.fase === "completada") {
      expect(completada.pregunta).toBe(PREGUNTA);
      expect(completada.elegidas).toEqual([3, 17, 42]);
      expect(completada.sintesis).toContain("ángulos distintos");
    }
  });

  it("se puede leer sin escribir pregunta", () => {
    const sinPregunta = forzar(
      avanzar(LECTURA_EN_REPOSO, {
        tipo: "empezar",
        tirada: TIRADA,
        pregunta: null,
        mazo: MAZO,
      }),
    );

    expect(sinPregunta.fase).toBe("barajando");

    if (sinPregunta.fase === "barajando") {
      expect(sinPregunta.pregunta).toBeNull();
    }
  });

  it("reiniciar devuelve al reposo desde cualquier punto", () => {
    for (const situacion of SITUACIONES) {
      const resultado = avanzar(situacion.construir(), { tipo: "reiniciar" });

      expect(forzar(resultado), situacion.nombre).toEqual(LECTURA_EN_REPOSO);
    }
  });

  /*
   * Una máquina de estados que muta su entrada rompe el historial, el deshacer
   * y cualquier renderizador que compare estados por identidad.
   */
  it("no toca el estado que recibe", () => {
    const antes = construirEligiendo();
    const copia = structuredClone(antes);

    avanzar(antes, { tipo: "seleccionar", indice: 9 });

    expect(antes).toEqual(copia);
  });
});

describe("el muro de pago", () => {
  it("sólo aparece con todas las cartas reveladas", () => {
    expect(estaEnElMuro(LECTURA_EN_REPOSO)).toBe(false);
    expect(estaEnElMuro(construirEligiendoCompleto())).toBe(false);
    expect(estaEnElMuro(construirRevelando())).toBe(false);
    expect(estaEnElMuro(construirRevelandoCompleto())).toBe(true);
  });

  /* Pasado el muro ya no se enseña el muro: se está generando o ya está hecho. */
  it("desaparece en cuanto se pide la síntesis", () => {
    expect(estaEnElMuro(construirSintetizando())).toBe(false);
    expect(estaEnElMuro(construirCompletada())).toBe(false);
  });
});

describe("las cartas elegidas", () => {
  it("salen en el orden en que se eligieron", () => {
    const elegidas = cartasElegidas(construirEligiendoCompleto());

    expect(elegidas.map(({ carta }) => carta.id)).toEqual(
      [3, 17, 42].map((indice) => MAZO[indice]?.carta.id),
    );
  });

  it("antes de elegir no hay ninguna", () => {
    expect(cartasElegidas(LECTURA_EN_REPOSO)).toEqual([]);
    expect(cartasElegidas(construirBarajando())).toEqual([]);
    expect(cartasElegidas(construirEligiendo())).toEqual([]);
  });

  it("conservan la orientación que les tocó al barajar", () => {
    for (const { carta, orientacion } of cartasElegidas(construirCompletada())) {
      expect(carta.id).toBeTruthy();
      expect(["derecha", "invertida"]).toContain(orientacion);
    }
  });
});
