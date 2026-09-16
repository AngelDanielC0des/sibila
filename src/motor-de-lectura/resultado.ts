/**
 * El resultado de una operación que puede fallar por una razón de dominio.
 *
 * `docs/guia-de-arquitectura.md` §5 divide los fallos en tres clases y les da
 * tratamiento distinto:
 *
 * | Clase | Tratamiento |
 * |---|---|
 * | De dominio — puede pasar y el producto sabe qué hacer | **Resultado tipado** |
 * | De programación — no debería poder pasar | Excepción, que reviente y se vea |
 * | De infraestructura — externo y transitorio | Excepción, capturada en la frontera |
 *
 * Este módulo cubre la primera fila. **El motor nunca lanza una excepción por
 * una situación de dominio:** «esa carta ya está elegida» es una respuesta
 * válida del sistema, no un accidente, y quien la recibe tiene que poder
 * distinguirla de un fallo real para convertirla en un mensaje útil en vez de
 * en una pantalla de error.
 *
 * Es una unión discriminada por `estaBien`, de modo que TypeScript estrecha el
 * tipo solo: dentro de una rama que ha comprobado `estaBien`, `valor` existe y
 * `error` no, sin aserciones ni comprobaciones redundantes.
 */

/**
 * Una operación que salió bien y trae su valor.
 *
 * @typeParam T Lo que devuelve la operación.
 */
export type Exito<T> = {
  readonly estaBien: true;
  readonly valor: T;
};

/**
 * Una operación que no se pudo completar, con la razón de dominio por la que no.
 *
 * @typeParam E La razón. En el motor es siempre una unión de literales, nunca
 *   una cadena libre: así el compilador obliga a contemplar cada caso.
 */
export type Fallo<E> = {
  readonly estaBien: false;
  readonly error: E;
};

/**
 * El resultado de una operación de dominio: o su valor, o la razón de su fallo.
 *
 * @typeParam T Lo que devuelve la operación cuando sale bien.
 * @typeParam E La razón cuando no.
 */
export type Resultado<T, E> = Exito<T> | Fallo<E>;

/**
 * Envuelve un valor en un resultado correcto.
 *
 * @param valor Lo que devuelve la operación.
 * @returns El resultado, listo para devolver.
 */
export function exito<T>(valor: T): Exito<T> {
  return { estaBien: true, valor };
}

/**
 * Envuelve una razón de dominio en un resultado fallido.
 *
 * @param error La razón por la que la operación no se pudo completar.
 * @returns El resultado, listo para devolver.
 */
export function fallo<E>(error: E): Fallo<E> {
  return { estaBien: false, error };
}
