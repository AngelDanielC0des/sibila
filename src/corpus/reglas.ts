/**
 * Reglas de validación del corpus.
 *
 * Funciones puras: reciben texto y devuelven problemas. No leen ficheros, lo
 * que permite probarlas por sí solas y aplicarlas después al corpus real.
 *
 * Son la mitad mecánica de `docs/corpus/guia-de-voz.md`. La otra mitad —que el
 * texto tenga voz— no se puede automatizar y se revisa leyendo.
 */

/**
 * Un problema tumba la compilación; un aviso solo se señala.
 *
 * La distinción importa porque hay reglas que un ordenador puede juzgar con
 * certeza —la longitud, el léxico prohibido— y otras que solo puede sospechar.
 * «Nunca» está prohibido aplicado a la persona, pero es legítimo aplicado a la
 * carta, y ningún análisis léxico distingue ambos casos. Fallar ahí produciría
 * falsos positivos que enseñarían a silenciar el validador.
 */
export type Gravedad = "error" | "aviso";

/** Las tres capas del corpus, cada una con sus límites de extensión. */
export type Capa = "base" | "matiz" | "valencia";

/** Un incumplimiento localizado. */
export type Problema = {
  readonly gravedad: Gravedad;
  /** Dónde está, en forma `capa/carta/orientacion`. */
  readonly ubicacion: string;
  readonly regla: string;
  readonly detalle: string;
};

type LimitesDeExtension = {
  readonly frasesMin: number;
  readonly frasesMax: number;
  readonly palabrasMin: number;
  readonly palabrasMax: number;
};

/** Límites por capa, tomados de la guía de voz §5. */
const LIMITES: Readonly<Record<Capa, LimitesDeExtension>> = {
  base: { frasesMin: 3, frasesMax: 5, palabrasMin: 45, palabrasMax: 90 },
  matiz: { frasesMin: 1, frasesMax: 2, palabrasMin: 18, palabrasMax: 40 },
  valencia: { frasesMin: 1, frasesMax: 1, palabrasMin: 10, palabrasMax: 25 },
};

/**
 * Léxico que tumba la compilación.
 *
 * Los términos se guardan sin acentos porque la comparación se hace sobre texto
 * normalizado: así «sucedera» se caza igual que «sucederá».
 */
const LEXICO_PROHIBIDO: ReadonlyArray<{ termino: string; familia: string }> = [
  // Futuro determinista · guía de voz §4.1
  { termino: "predice", familia: "futuro determinista" },
  { termino: "predecira", familia: "futuro determinista" },
  { termino: "predecir", familia: "futuro determinista" },
  { termino: "sucedera", familia: "futuro determinista" },
  { termino: "sucederan", familia: "futuro determinista" },
  { termino: "ocurrira", familia: "futuro determinista" },
  { termino: "ocurriran", familia: "futuro determinista" },
  { termino: "pasara", familia: "futuro determinista" },
  { termino: "acontecera", familia: "futuro determinista" },
  { termino: "va a pasar", familia: "futuro determinista" },
  { termino: "vas a", familia: "futuro determinista" },
  { termino: "pronto tendras", familia: "futuro determinista" },
  { termino: "esta escrito", familia: "futuro determinista" },
  { termino: "el destino quiere", familia: "futuro determinista" },

  // Muletillas místicas · guía de voz §4.1
  { termino: "el universo", familia: "muletilla mistica" },
  { termino: "energias", familia: "muletilla mistica" },
  { termino: "vibracion", familia: "muletilla mistica" },
  { termino: "vibraciones", familia: "muletilla mistica" },
  { termino: "el cosmos", familia: "muletilla mistica" },
  { termino: "frecuencia", familia: "muletilla mistica" },
  { termino: "manifestar", familia: "muletilla mistica" },
  { termino: "manifestacion", familia: "muletilla mistica" },

  // Consejo profesional · guía de voz §4.1 y CLAUDE.md
  { termino: "diagnostico", familia: "consejo profesional" },
  { termino: "diagnosticar", familia: "consejo profesional" },
  { termino: "trastorno", familia: "consejo profesional" },
  { termino: "medicacion", familia: "consejo profesional" },
  { termino: "medicamento", familia: "consejo profesional" },
  { termino: "invertir en", familia: "consejo profesional" },
  { termino: "demanda judicial", familia: "consejo profesional" },
];

/**
 * Términos que solo son incorrectos según el contexto.
 *
 * Se avisan para que un humano los mire, no se rechazan.
 */
const LEXICO_SOSPECHOSO: ReadonlyArray<{ termino: string; motivo: string }> = [
  {
    termino: "siempre",
    motivo: "prohibido aplicado a la persona; válido aplicado a la carta",
  },
  {
    termino: "nunca",
    motivo: "prohibido aplicado a la persona; válido aplicado a la carta",
  },
  {
    termino: "jamas",
    motivo: "prohibido aplicado a la persona; válido aplicado a la carta",
  },
  { termino: "energia", motivo: "aceptable sobre la carta, muletilla sobre la vida" },
];

/** Alternativas que incumplen el glosario de dominio de CLAUDE.md. */
const GLOSARIO_INCORRECTO: ReadonlyArray<{ termino: string; correcto: string }> = [
  { termino: "al reves", correcto: "invertida" },
  { termino: "del reves", correcto: "invertida" },
  { termino: "boca abajo", correcto: "invertida" },
  { termino: "spread", correcto: "tirada" },
];

/**
 * Pasa un texto a minúsculas y le quita los diacríticos.
 *
 * Permite comparar sin depender de que quien escribe acentúe correctamente.
 *
 * @param texto Texto de partida.
 * @returns El texto normalizado para comparación.
 */
export function normalizar(texto: string): string {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Cuenta las palabras de un texto.
 *
 * @param texto Texto a medir.
 * @returns Número de palabras.
 */
export function contarPalabras(texto: string): number {
  const partes = texto.trim().split(/\s+/);

  if (partes.length === 1 && partes[0] === "") {
    return 0;
  } else {
    return partes.length;
  }
}

/**
 * Cuenta las frases de un texto.
 *
 * Los puntos suspensivos cuentan como un único terminador, y el guion largo no
 * cierra frase: en español introduce inciso, que es un recurso que la voz de
 * Sibila usa a menudo.
 *
 * @param texto Texto a medir.
 * @returns Número de frases.
 */
export function contarFrases(texto: string): number {
  const conElipsisUnificada = texto.replace(/…/g, ".");
  const terminadores = conElipsisUnificada.match(/[.!?]+(?=\s|$)/g);

  if (terminadores === null) {
    return 0;
  } else {
    return terminadores.length;
  }
}

/**
 * Construye la expresión que localiza un término como palabra completa.
 *
 * Sin los límites de palabra, «pasara» se encontraría dentro de «repasara» y
 * «frecuencia» dentro de cualquier palabra que la contenga.
 *
 * @param termino Término normalizado a buscar.
 * @returns Expresión regular con límites de palabra.
 */
function expresionDeTermino(termino: string): RegExp {
  const escapado = termino.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escapado}\\b`);
}

/**
 * Comprueba que un texto respete los límites de extensión de su capa.
 *
 * @param texto Texto a revisar.
 * @param capa Capa del corpus a la que pertenece.
 * @param ubicacion Localización legible del texto.
 * @returns Los problemas encontrados.
 */
function revisarExtension(texto: string, capa: Capa, ubicacion: string): Problema[] {
  const problemas: Problema[] = [];
  const limites = LIMITES[capa];
  const palabras = contarPalabras(texto);
  const frases = contarFrases(texto);

  if (palabras < limites.palabrasMin || palabras > limites.palabrasMax) {
    problemas.push({
      gravedad: "error",
      ubicacion,
      regla: "extension",
      detalle: `${palabras} palabras; se esperan entre ${limites.palabrasMin} y ${limites.palabrasMax}`,
    });
  }

  if (frases < limites.frasesMin || frases > limites.frasesMax) {
    problemas.push({
      gravedad: "error",
      ubicacion,
      regla: "extension",
      detalle: `${frases} frases; se esperan entre ${limites.frasesMin} y ${limites.frasesMax}`,
    });
  }

  return problemas;
}

/**
 * Busca léxico prohibido y léxico sospechoso.
 *
 * @param texto Texto a revisar.
 * @param ubicacion Localización legible del texto.
 * @returns Los problemas encontrados.
 */
function revisarLexico(texto: string, ubicacion: string): Problema[] {
  const problemas: Problema[] = [];
  const normalizado = normalizar(texto);

  for (const { termino, familia } of LEXICO_PROHIBIDO) {
    if (expresionDeTermino(termino).test(normalizado)) {
      problemas.push({
        gravedad: "error",
        ubicacion,
        regla: "lexico prohibido",
        detalle: `«${termino}» — ${familia}`,
      });
    }
  }

  for (const { termino, motivo } of LEXICO_SOSPECHOSO) {
    if (expresionDeTermino(termino).test(normalizado)) {
      problemas.push({
        gravedad: "aviso",
        ubicacion,
        regla: "lexico a revisar",
        detalle: `«${termino}» — ${motivo}`,
      });
    }
  }

  return problemas;
}

/**
 * Comprueba el cumplimiento del glosario de dominio y la ausencia de
 * exclamaciones, que la guía de voz descarta porque Sibila no se entusiasma.
 *
 * @param texto Texto a revisar.
 * @param ubicacion Localización legible del texto.
 * @returns Los problemas encontrados.
 */
function revisarEstilo(texto: string, ubicacion: string): Problema[] {
  const problemas: Problema[] = [];
  const normalizado = normalizar(texto);

  for (const { termino, correcto } of GLOSARIO_INCORRECTO) {
    if (expresionDeTermino(termino).test(normalizado)) {
      problemas.push({
        gravedad: "error",
        ubicacion,
        regla: "glosario",
        detalle: `«${termino}» — el término del proyecto es «${correcto}»`,
      });
    }
  }

  if (texto.includes("!") || texto.includes("¡")) {
    problemas.push({
      gravedad: "error",
      ubicacion,
      regla: "registro",
      detalle: "sin exclamaciones: Sibila no se entusiasma",
    });
  }

  return problemas;
}

/**
 * Revisa una pieza de texto del corpus contra todas las reglas mecánicas.
 *
 * @param texto Texto a revisar.
 * @param capa Capa del corpus a la que pertenece.
 * @param ubicacion Localización legible, en forma `capa/carta/orientacion`.
 * @returns Todos los problemas encontrados, errores y avisos.
 */
export function revisarTexto(texto: string, capa: Capa, ubicacion: string): Problema[] {
  if (texto.trim() === "") {
    return [
      {
        gravedad: "error",
        ubicacion,
        regla: "vacio",
        detalle: "la pieza no tiene texto",
      },
    ];
  } else {
    return [
      ...revisarExtension(texto, capa, ubicacion),
      ...revisarLexico(texto, ubicacion),
      ...revisarEstilo(texto, ubicacion),
    ];
  }
}

/**
 * Busca textos repetidos entre piezas distintas.
 *
 * Es la señal delatora de escritura cansada: cuando alguien lleva cuarenta
 * cartas seguidas, empieza a reutilizar frases sin darse cuenta. Ninguna otra
 * comprobación lo detecta.
 *
 * @param piezas Pares de localización y texto a comparar entre sí.
 * @returns Un error por cada texto que aparece en más de un sitio.
 */
export function buscarDuplicados(
  piezas: ReadonlyArray<{ ubicacion: string; texto: string }>,
): Problema[] {
  const porTexto = new Map<string, string[]>();

  for (const { ubicacion, texto } of piezas) {
    const clave = normalizar(texto).replace(/\s+/g, " ").trim();

    if (clave !== "") {
      const yaVistas = porTexto.get(clave);

      if (yaVistas === undefined) {
        porTexto.set(clave, [ubicacion]);
      } else {
        yaVistas.push(ubicacion);
      }
    }
  }

  const problemas: Problema[] = [];

  for (const ubicaciones of porTexto.values()) {
    if (ubicaciones.length > 1) {
      const [primera, ...resto] = ubicaciones;

      problemas.push({
        gravedad: "error",
        ubicacion: primera ?? "",
        regla: "duplicado",
        detalle: `texto idéntico en ${resto.join(", ")}`,
      });
    }
  }

  return problemas;
}
