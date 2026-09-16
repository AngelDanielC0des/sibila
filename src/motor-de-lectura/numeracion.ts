/**
 * Numeración romana de los arcanos mayores.
 *
 * Es convención del tarot, no capricho tipográfico: los veintidós mayores se
 * numeran en romano —de 0 a XXI— y los menores en arábigo. Una baraja que los
 * mezcle delata que quien la hizo no conoce el dominio.
 */

const SIMBOLOS: ReadonlyArray<{ valor: number; signo: string }> = [
  { valor: 10, signo: "X" },
  { valor: 9, signo: "IX" },
  { valor: 5, signo: "V" },
  { valor: 4, signo: "IV" },
  { valor: 1, signo: "I" },
];

/**
 * Convierte un número a su forma romana.
 *
 * Solo cubre el rango de los arcanos mayores, de 0 a 21. El cero no existe en
 * numeración romana, y la tradición lo representa dejándolo tal cual: El Loco es
 * la carta sin número, y escribirla «0» es lo correcto.
 *
 * @param numero Número a convertir, de 0 a 21.
 * @returns El número en romano, o «0» para El Loco.
 * @throws Si el número queda fuera del rango de los arcanos mayores.
 */
export function aNumeroRomano(numero: number): string {
  if (!Number.isInteger(numero) || numero < 0 || numero > 21) {
    throw new Error(`${numero} está fuera del rango de los arcanos mayores`);
  } else if (numero === 0) {
    return "0";
  } else {
    let restante = numero;
    let romano = "";

    for (const { valor, signo } of SIMBOLOS) {
      while (restante >= valor) {
        romano += signo;
        restante -= valor;
      }
    }

    return romano;
  }
}
