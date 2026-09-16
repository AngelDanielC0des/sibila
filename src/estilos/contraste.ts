/**
 * Cálculo de contraste según WCAG 2.
 *
 * Existe para que los suelos de contraste de `docs/guia-de-diseno.md` §4.3 se
 * comprueben solos en lugar de confiarse a la disciplina. La prueba que lo
 * acompaña lee `tokens.css` directamente, así que la hoja de estilos sigue
 * siendo la única fuente de verdad y no puede desincronizarse de nada.
 */

/** Cómo se clasifica una relación de contraste. */
export type Clasificacion = "AAA" | "AA" | "AA-grande" | "insuficiente";

/** Mínimo exigido a texto de cuerpo. */
export const SUELO_TEXTO = 4.5;

/** Mínimo exigido a texto grande y a elementos de interfaz no textuales. */
export const SUELO_GRANDE = 3;

/** Mínimo para la clasificación más alta. */
export const SUELO_AAA = 7;

/**
 * Linealiza un canal de color de 0–255 a su valor de luz.
 *
 * Es el paso que convierte el valor que se guarda en el fichero, que está
 * corregido para la percepción, en la energía luminosa real que permite
 * compararlos.
 *
 * @param valor Canal en el rango 0–255.
 * @returns El canal linealizado, entre 0 y 1.
 */
function linealizarCanal(valor: number): number {
  const proporcion = valor / 255;

  if (proporcion <= 0.03928) {
    return proporcion / 12.92;
  } else {
    return Math.pow((proporcion + 0.055) / 1.055, 2.4);
  }
}

/**
 * Calcula la luminancia relativa de un color.
 *
 * @param hex Color en notación `#rrggbb`.
 * @returns La luminancia, entre 0 (negro) y 1 (blanco).
 * @throws Si el color no está en notación hexadecimal de seis dígitos.
 */
export function calcularLuminancia(hex: string): number {
  const limpio = hex.trim().toLowerCase();

  if (!/^#[0-9a-f]{6}$/.test(limpio)) {
    throw new Error(`«${hex}» no es un color hexadecimal de seis dígitos`);
  } else {
    const entero = parseInt(limpio.slice(1), 16);
    const rojo = linealizarCanal((entero >> 16) & 255);
    const verde = linealizarCanal((entero >> 8) & 255);
    const azul = linealizarCanal(entero & 255);

    return 0.2126 * rojo + 0.7152 * verde + 0.0722 * azul;
  }
}

/**
 * Calcula la relación de contraste entre dos colores.
 *
 * El orden de los argumentos da igual: la relación es simétrica.
 *
 * @param primero Un color en notación `#rrggbb`.
 * @param segundo El otro color.
 * @returns La relación, entre 1 y 21.
 */
export function calcularContraste(primero: string, segundo: string): number {
  const luminancias = [calcularLuminancia(primero), calcularLuminancia(segundo)];
  const clara = Math.max(...luminancias);
  const oscura = Math.min(...luminancias);

  return (clara + 0.05) / (oscura + 0.05);
}

/**
 * Clasifica una relación de contraste según los niveles de WCAG.
 *
 * @param relacion Relación de contraste.
 * @returns La clasificación que le corresponde.
 */
export function clasificarContraste(relacion: number): Clasificacion {
  if (relacion >= SUELO_AAA) {
    return "AAA";
  } else if (relacion >= SUELO_TEXTO) {
    return "AA";
  } else if (relacion >= SUELO_GRANDE) {
    return "AA-grande";
  } else {
    return "insuficiente";
  }
}

/**
 * Indica si un color sirve como texto de cuerpo sobre un fondo dado.
 *
 * @param texto Color del texto.
 * @param fondo Color del fondo.
 * @returns `true` si alcanza el suelo de 4,5.
 */
export function sirveParaTextoDeCuerpo(texto: string, fondo: string): boolean {
  return calcularContraste(texto, fondo) >= SUELO_TEXTO;
}

/**
 * Extrae las propiedades personalizadas declaradas en un bloque de CSS.
 *
 * Deliberadamente simple: solo reconoce declaraciones `--nombre: valor;`, que
 * es todo lo que contiene `tokens.css`. No pretende ser un analizador de CSS.
 *
 * @param css Contenido completo de la hoja de estilos.
 * @param selector Selector cuyo bloque se quiere leer, por ejemplo `:root`.
 * @returns Las propiedades encontradas, sin resolver referencias.
 */
export function extraerTokens(css: string, selector: string): Map<string, string> {
  const inicio = css.indexOf(selector);

  if (inicio === -1) {
    throw new Error(`No se encontró el selector «${selector}»`);
  } else {
    const desdeLlave = css.indexOf("{", inicio);
    const hastaLlave = css.indexOf("}", desdeLlave);
    const bloque = css.slice(desdeLlave + 1, hastaLlave);
    const tokens = new Map<string, string>();
    const declaracion = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;

    let encontrada = declaracion.exec(bloque);

    while (encontrada !== null) {
      const nombre = encontrada[1];
      const valor = encontrada[2];

      if (nombre !== undefined && valor !== undefined) {
        tokens.set(nombre, valor.trim());
      }

      encontrada = declaracion.exec(bloque);
    }

    return tokens;
  }
}

/**
 * Resuelve un token hasta llegar a un color hexadecimal.
 *
 * Los tokens semánticos como `--fondo` apuntan a tokens de paleta mediante
 * `var()`, y pueden encadenarse. Se sigue la cadena hasta encontrar un color o
 * agotar el límite de saltos, que protege de una referencia circular.
 *
 * @param nombre Nombre del token a resolver.
 * @param tokens Tabla de tokens donde buscar.
 * @returns El color hexadecimal, o `undefined` si el token no resuelve a color.
 */
export function resolverColor(
  nombre: string,
  tokens: ReadonlyMap<string, string>,
): string | undefined {
  const SALTOS_MAXIMOS = 8;
  let actual = tokens.get(nombre);
  let saltos = 0;

  while (actual !== undefined && saltos < SALTOS_MAXIMOS) {
    if (/^#[0-9a-f]{6}$/i.test(actual)) {
      return actual;
    } else {
      const referencia = /^var\(\s*(--[a-z0-9-]+)\s*\)$/.exec(actual);

      if (referencia === null || referencia[1] === undefined) {
        return undefined;
      } else {
        actual = tokens.get(referencia[1]);
        saltos += 1;
      }
    }
  }

  return undefined;
}
