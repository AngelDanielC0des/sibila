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
    "La Torre no avisa. El rayo sólo vuelve visible una grieta que ya estaba " +
    "trazada: lo que cede aquí llevaba tiempo cediendo por dentro, sin testigos. " +
    "No es castigo ni azar, es una estructura que dejó de sostenerse y tardó en " +
    "admitirlo. La señal estaba, sostenida y clara. Lo que faltó fue leerla a tiempo.",
  ermitano:
    "El Ermitaño se aparta a propósito. No es soledad impuesta ni huida: es bajar " +
    "el ruido hasta que se oye lo que con ruido no se oye. Sube con una lámpara, " +
    "y la lámpara no le sirve sólo a él — alumbra a quien viene detrás. Aquí hay " +
    "una respuesta, y no está fuera.",
  cuatroDeCopas:
    "Tres copas delante y una cuarta que se ofrece, y la mirada puesta en otra " +
    "parte. El Cuatro de Copas no habla de carencia sino de hartazgo: hay algo " +
    "disponible y no lo estás viendo, precisamente porque ya tienes suficiente de " +
    "algo parecido. El desinterés aquí no es descanso; es una puerta que se cierra sola.",
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

/*
 * El registro futurista, guía §3.1 y §4.5.
 *
 * Es la parte del validador con más riesgo de hacer daño: un falso positivo
 * aquí no cuesta una corrección, cuesta que quien escribe aprenda a ignorar los
 * avisos. Por eso se prueba con la misma insistencia lo que tiene que cazar y
 * lo que NO puede cazar.
 */
describe("léxico que envejece", () => {
  const conTermino = (termino: string) =>
    `La Torre no avisa, y el ${termino} tampoco lo habría avisado. Lo que cede ` +
    "aquí llevaba tiempo cediendo por dentro, sin testigos y sin ruido. No es " +
    "castigo ni azar, es una estructura que dejó de sostenerse y tardó demasiado " +
    "en admitirlo. Lo que queda en pie después es lo que podía sostenerse solo.";

  for (const termino of ["algoritmo", "chip", "robot", "feedback", "cuantico"]) {
    it(`«${termino}» tumba la pieza`, () => {
      const errores = soloErrores(revisarTexto(conTermino(termino), "base", "base/x"));

      expect(errores.map((problema) => problema.regla)).toContain("lexico prohibido");
    });
  }

  /*
   * Sibila es un holograma, y precisamente por eso el corpus no puede nombrarlo:
   * que el texto cuente el truco lo desactiva.
   */
  it("«holograma» se rechaza aunque Sibila sea uno", () => {
    const errores = soloErrores(revisarTexto(conTermino("holograma"), "base", "base/x"));

    expect(errores).not.toEqual([]);
  });

  /*
   * La lista se acortó a propósito después de escribirla: estas cuatro son
   * español corriente y prohibirlas daría falsos positivos en textos legítimos.
   */
  it("no caza español corriente que sólo suena a informática", () => {
    const legitimos = [
      "Una nube tapa el sol de la carta y lo que se ve pierde nitidez, aunque " +
        "el sol siga estando exactamente donde estaba.",
      "Toca descargar el peso que llevas antes de que la espalda diga basta, " +
        "porque nadie sostiene indefinidamente algo que no le corresponde.",
      "La queja se ha instalado en la casa y ya nadie la reconoce como huésped, " +
        "porque lleva tanto tiempo ahí que parece parte del mobiliario.",
      "La aplicación de la regla importa más que la regla escrita, y esta carta " +
        "señala justo esa distancia entre lo dicho y lo hecho.",
    ];

    for (const texto of legitimos) {
      const errores = soloErrores(revisarTexto(texto, "matiz", "matiz/x"));

      expect(errores, texto).toEqual([]);
    }
  });

  it("lo dudoso avisa en lugar de tumbar", () => {
    const texto =
      "Descifrar el código de esta carta pide calma y no prisa, porque lo que se " +
      "lee deprisa acaba diciendo lo que ya se quería oír.";
    const problemas = revisarTexto(texto, "matiz", "matiz/x");

    expect(soloErrores(problemas)).toEqual([]);
    expect(problemas.map((problema) => problema.regla)).toContain("lexico a revisar");
  });
});

describe("la dosis de sustantivos de instrumento", () => {
  it("uno no avisa", () => {
    const texto =
      "La señal llega entera y aun así nadie la recoge a tiempo, que es " +
      "exactamente lo que esta carta viene a poner delante.";

    expect(revisarTexto(texto, "matiz", "matiz/x")).toEqual([]);
  });

  it("dos avisan, y el aviso los nombra", () => {
    const texto =
      "La señal llega con ruido de fondo y nadie termina de recogerla a tiempo, " +
      "que es lo que esta carta viene a poner delante.";
    const problemas = revisarTexto(texto, "matiz", "matiz/x");

    expect(soloErrores(problemas)).toEqual([]);

    const aviso = problemas.find((p) => p.regla === "dosis de instrumento");
    expect(aviso?.detalle).toContain("«señal»");
    expect(aviso?.detalle).toContain("«ruido»");
  });

  /*
   * Singular y plural son la misma palabra, no dos instrumentos distintos.
   * Contarlos por separado haría saltar el aviso en piezas correctas.
   */
  it("singular y plural cuentan como una sola palabra", () => {
    const texto =
      "Los ecos de lo anterior siguen ahí y el eco de ayer manda más que lo de " +
      "hoy, aunque nadie quiera nombrarlo en voz alta.";
    const problemas = revisarTexto(texto, "matiz", "matiz/x");

    expect(problemas.map((problema) => problema.regla)).not.toContain(
      "dosis de instrumento",
    );
  });

  /*
   * Español corriente que suena a instrumento y que la guía §4.4 deja fuera de
   * la ración a propósito: racionarlo convertiría la dosis en camisa de fuerza.
   */
  it("no raciona «estructura», «tensión» ni «presión»", () => {
    const texto =
      "La estructura cede por la tensión de abajo y la presión de arriba no " +
      "afloja, que es como se derrumba algo sin que parezca súbito.";
    const problemas = revisarTexto(texto, "matiz", "matiz/x");

    expect(problemas.map((problema) => problema.regla)).not.toContain(
      "dosis de instrumento",
    );
  });
});
