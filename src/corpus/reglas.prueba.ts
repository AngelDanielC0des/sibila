import { describe, expect, it } from "vitest";
import {
  buscarDuplicados,
  contarFrases,
  contarPalabras,
  normalizar,
  revisarTexto,
  type Problema,
} from "./reglas";

/**
 * Los ejemplos anotados de `docs/corpus/guia-de-voz.md` §8.
 *
 * Se usan como fixtures a propósito: si el validador rechazara el texto que la
 * propia guía presenta como correcto, el equivocado sería el validador.
 */
const EJEMPLOS_BUENOS = {
  torre:
    "La Torre no avisa. Lo que se derrumba aquí es lo que ya estaba agrietado " +
    "por dentro, y el golpe solo hace visible una grieta que llevaba tiempo ahí. " +
    "No es castigo ni azar: es una estructura que dejó de sostenerse y tardó en " +
    "admitirlo. Lo que queda después es suelo firme, aunque de momento no lo parezca.",
  ermitano:
    "El Ermitaño se aparta a propósito. No es soledad impuesta ni huida: es la " +
    "decisión de bajar el ruido para oír algo que con ruido no se oye. Sube con " +
    "una lámpara, y la lámpara no le sirve solo a él — alumbra el camino a quien " +
    "viene detrás. Aquí hay una respuesta, pero no está fuera.",
  cuatroDeCopas:
    "Tres copas delante y una cuarta que se ofrece, y la mirada puesta en otra " +
    "parte. El Cuatro de Copas no habla de carencia sino de hartazgo: hay algo " +
    "disponible y no lo estás viendo, precisamente porque ya tienes suficiente de " +
    "algo parecido. El desinterés aquí no es descanso, es una puerta que se cierra sola.",
};

const MATIZ_BUENO =
  "Lo que te frena es el esfuerzo de sostener algo que ya cedió. Mientras la " +
  "estructura siga en pie a base de apuntalarla, no hay sitio para levantar otra.";

/**
 * Filtra los problemas que tumban la compilación.
 *
 * @param problemas Lista completa de problemas.
 * @returns Solo los de gravedad `error`.
 */
function soloErrores(problemas: readonly Problema[]): Problema[] {
  return problemas.filter((problema) => problema.gravedad === "error");
}

describe("recuento de palabras y frases", () => {
  it("cuenta cero en un texto vacío", () => {
    expect(contarPalabras("")).toBe(0);
    expect(contarPalabras("   ")).toBe(0);
    expect(contarFrases("")).toBe(0);
  });

  it("no se confunde con espacios de más", () => {
    expect(contarPalabras("  la   torre   cae  ")).toBe(3);
  });

  it("cuenta los puntos suspensivos como un solo final de frase", () => {
    expect(contarFrases("Algo se rompe… y no vuelve.")).toBe(2);
  });

  it("no cierra frase con el guion largo, que en español abre inciso", () => {
    expect(contarFrases("La lámpara —la suya— alumbra a quien viene detrás.")).toBe(1);
  });

  it("no cuenta el punto de una abreviatura pegada a la palabra siguiente", () => {
    expect(contarFrases("Sube.Baja.")).toBe(1);
  });
});

describe("normalización", () => {
  it("quita acentos y pasa a minúsculas", () => {
    expect(normalizar("SUCEDERÁ")).toBe("sucedera");
    expect(normalizar("Ermitaño")).toBe("ermitano");
  });
});

describe("los ejemplos correctos de la guía pasan limpios", () => {
  for (const [nombre, texto] of Object.entries(EJEMPLOS_BUENOS)) {
    it(`«${nombre}» no produce ningún error`, () => {
      expect(soloErrores(revisarTexto(texto, "base", `base/${nombre}/derecha`))).toEqual(
        [],
      );
    });
  }

  it("el matiz de ejemplo no produce ningún error", () => {
    expect(soloErrores(revisarTexto(MATIZ_BUENO, "matiz", "matiz/la-torre"))).toEqual([]);
  });
});

describe("el ejemplo incorrecto de la guía se rechaza", () => {
  const malo =
    "La Torre anuncia un cambio brusco que sacudirá tu vida. Prepárate, porque " +
    "el universo tiene planes para ti y pronto llegará una transformación inesperada.";

  it("se caza la muletilla mística", () => {
    const reglas = soloErrores(revisarTexto(malo, "base", "base/la-torre/derecha")).map(
      (problema) => problema.regla,
    );

    expect(reglas).toContain("lexico prohibido");
  });

  it("se caza además que se queda corto", () => {
    const reglas = soloErrores(revisarTexto(malo, "base", "base/la-torre/derecha")).map(
      (problema) => problema.regla,
    );

    expect(reglas).toContain("extension");
  });
});

describe("léxico prohibido", () => {
  const casos = [
    "Esto sucederá antes de que te des cuenta del todo, sin remedio alguno.",
    "Vas a encontrar la salida cuando dejes de buscarla con tanta prisa.",
    "Las energías se ordenan a tu favor durante los próximos días del mes.",
    "El universo tiene otros planes distintos para ti en este momento concreto.",
    "Aquí hay un trastorno que conviene mirar con calma y con ayuda externa.",
  ];

  for (const texto of casos) {
    it(`rechaza: «${texto.slice(0, 34)}…»`, () => {
      const errores = soloErrores(revisarTexto(texto, "matiz", "prueba"));
      const reglas = errores.map((problema) => problema.regla);

      expect(reglas).toContain("lexico prohibido");
    });
  }

  /*
   * Sin límites de palabra, «pasara» se encontraría dentro de «repasara» y el
   * validador rechazaría texto correcto. Es el fallo que haría que la gente
   * aprendiese a ignorarlo.
   */
  it("no salta dentro de otra palabra", () => {
    const texto =
      "Conviene que repasara lo andado antes de dar el siguiente paso con firmeza.";
    const reglas = soloErrores(revisarTexto(texto, "matiz", "prueba")).map(
      (problema) => problema.regla,
    );

    expect(reglas).not.toContain("lexico prohibido");
  });
});

describe("léxico sospechoso", () => {
  it("avisa de los absolutos, pero no tumba la compilación", () => {
    const texto =
      "El Ermitaño nunca huye del ruido, sino que se aparta de él a conciencia, y " +
      "esa distancia deliberada es lo que le permite escuchar.";
    const problemas = revisarTexto(texto, "matiz", "prueba");

    expect(soloErrores(problemas)).toEqual([]);
    expect(problemas.some((problema) => problema.gravedad === "aviso")).toBe(true);
  });
});

describe("glosario y registro", () => {
  it("exige «invertida» y rechaza sus alternativas", () => {
    const texto =
      "Cuando la carta sale al revés, el impulso queda dentro y no llega a salir.";
    const reglas = soloErrores(revisarTexto(texto, "matiz", "prueba")).map(
      (problema) => problema.regla,
    );

    expect(reglas).toContain("glosario");
  });

  it("rechaza las exclamaciones, porque Sibila no se entusiasma", () => {
    const texto = "¡Qué gran momento para empezar algo nuevo y dejar atrás lo viejo!";
    const reglas = soloErrores(revisarTexto(texto, "matiz", "prueba")).map(
      (problema) => problema.regla,
    );

    expect(reglas).toContain("registro");
  });
});

describe("piezas vacías", () => {
  it("se rechazan sin evaluar nada más", () => {
    const problemas = revisarTexto("   ", "base", "base/el-loco/derecha");

    expect(problemas).toHaveLength(1);
    expect(problemas[0]?.regla).toBe("vacio");
  });
});

describe("duplicados entre cartas", () => {
  it("detecta el mismo texto en dos sitios", () => {
    const problemas = buscarDuplicados([
      { ubicacion: "base/el-loco/derecha", texto: "Un comienzo sin garantías." },
      { ubicacion: "base/el-mago/derecha", texto: "Un comienzo sin garantías." },
      { ubicacion: "base/la-torre/derecha", texto: "Lo que cae ya estaba agrietado." },
    ]);

    expect(problemas).toHaveLength(1);
    expect(problemas[0]?.detalle).toContain("base/el-mago/derecha");
  });

  it("ignora diferencias de espaciado, acentos y mayúsculas", () => {
    const problemas = buscarDuplicados([
      { ubicacion: "a", texto: "Un comienzo sin garantías." },
      { ubicacion: "b", texto: "un  COMIENZO sin garantias." },
    ]);

    expect(problemas).toHaveLength(1);
  });

  it("no ve duplicados donde no los hay", () => {
    const problemas = buscarDuplicados([
      { ubicacion: "a", texto: "Un comienzo sin garantías." },
      { ubicacion: "b", texto: "Un final con todas ellas." },
    ]);

    expect(problemas).toEqual([]);
  });
});
