/**
 * Textos de medida para el panel de significado.
 *
 * **No son corpus y nunca lo serán.** Existen para una sola cosa: ocupar
 * exactamente el mínimo y el máximo de palabras que permite
 * `src/corpus/reglas.ts`, de modo que la maqueta se valide contra el caso peor
 * real y no contra un ejemplo cómodo.
 *
 * Se escriben en español de verdad, con su ritmo y sus palabras largas, porque
 * medir con relleno latino daría líneas más cortas y un veredicto falso.
 *
 * Si los límites de `reglas.ts` cambian, estos textos cambian con ellos. El
 * recuento lo comprueba `textos-de-medida.prueba.ts`: si alguien toca un límite
 * y olvida la maqueta, falla.
 */

/** Un texto de medida con la capa y el extremo que representa. */
export type TextoDeMedida = {
  readonly palabras: number;
  readonly texto: string;
};

/** Significado base en el mínimo: 45 palabras, 3 frases. */
export const BASE_MINIMO: TextoDeMedida = {
  palabras: 45,
  texto:
    "La Torre no avisa. Lo que cede aquí llevaba tiempo agrietado por dentro, y el golpe " +
    "sólo vuelve visible una fractura que ya estaba trazada. No es castigo ni azar: es una " +
    "estructura que dejó de sostenerse y tardó demasiado en admitirlo ante sí misma.",
};

/** Significado base en el máximo: 90 palabras, 5 frases. */
export const BASE_MAXIMO: TextoDeMedida = {
  palabras: 90,
  texto:
    "La Torre no avisa. Lo que cede aquí llevaba tiempo agrietado por dentro, y el golpe " +
    "sólo vuelve visible una fractura que ya estaba trazada. No es castigo ni azar: es una " +
    "estructura que dejó de sostenerse y tardó demasiado en admitirlo. La caída duele " +
    "porque llega de fuera, pero la lectura honesta apunta a otro sitio: la señal estaba, " +
    "sostenida y clara, y se leyó tarde. Lo que queda en pie después no " +
    "es menos de lo que había; es exactamente aquello que podía sostenerse sin apuntalar " +
    "cada mañana.",
};

/** Matiz de familia en el mínimo: 18 palabras, 1 frase. */
export const MATIZ_MINIMO: TextoDeMedida = {
  palabras: 18,
  texto:
    "Lo que te frena no es el derrumbe, sino el esfuerzo de sostener una estructura que " +
    "ya cedió.",
};

/** Matiz de familia en el máximo: 40 palabras, 2 frases. */
export const MATIZ_MAXIMO: TextoDeMedida = {
  palabras: 40,
  texto:
    "Lo que te frena no es el derrumbe, sino el esfuerzo sostenido de apuntalar una " +
    "estructura que cedió hace tiempo. Mientras sigas gastando todo el pulso en mantenerla " +
    "vertical, no queda sitio para levantar aquella que de verdad querrías habitar.",
};

/** Motivo de la valencia en el mínimo: 10 palabras, 1 frase. */
export const VALENCIA_MINIMA: TextoDeMedida = {
  palabras: 10,
  texto: "Lo que preguntas se apoya en algo que ya cede.",
};

/** Motivo de la valencia en el máximo: 25 palabras, 1 frase. */
export const VALENCIA_MAXIMA: TextoDeMedida = {
  palabras: 25,
  texto:
    "Lo que preguntas se apoya en una estructura que ya cede por dentro, y ninguna " +
    "respuesta afirmativa aguantaría mucho tiempo el peso de esa grieta.",
};
