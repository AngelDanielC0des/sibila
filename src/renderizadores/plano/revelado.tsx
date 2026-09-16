"use client";

import { useState } from "react";
import type { Carta as CartaDeBaraja, Orientacion } from "@/motor-de-lectura/baraja";
import { Carta } from "@/componentes/base/carta";
import { PanelDeSignificado } from "@/componentes/base/panel-de-significado";
import { TextoDecodificado } from "@/componentes/ornamentos/texto-decodificado";
import estilos from "./revelado.module.css";

/**
 * El revelado de una carta y su significado · A3.4.
 *
 * Es el momento en que el producto cumple su promesa, y por eso el orden en que
 * ocurren las cosas está medido y no improvisado:
 *
 * 1. **La posición se nombra antes del volteo.** El usuario tiene que saber a
 *    qué responde esta carta *antes* de verla, o la respuesta le llega sin
 *    pregunta. Es lo único del ritmo de Tarotoo que conviene copiar tal cual;
 *    ver `docs/investigacion/tarotoo-en-vivo.md` §5, donde además se documenta
 *    que ellos lo pierden justo al final.
 * 2. **El volteo bloquea la entrada mientras dura.** Sin bloqueo, dos
 *    pulsaciones seguidas atropellan la ceremonia y el significado entra antes
 *    de que la carta acabe de girar.
 * 3. **El significado llega después del volteo.**
 *
 * **Qué se decodifica y qué no.** Los rótulos ceremoniales —la posición y el
 * nombre de la carta— se condensan desde glifos, que es la firma del producto.
 * El cuerpo del significado **no**: son de 45 a 90 palabras y un párrafo que se
 * revuelve mientras intentas leerlo no es ceremonia, es un obstáculo. Entra con
 * un fundido. La decodificación adorna lo que se mira; nunca lo que se lee.
 *
 * El renderizador **sólo pinta**. Qué carta salió, en qué orientación y con qué
 * texto lo decide el servidor con el motor y el corpus; aquí no hay ni una regla
 * de tirada.
 */

/** Las cadenas de interfaz que necesita la pantalla, ya traducidas. */
export type TextosDeRevelado = {
  readonly instruccion: string;
  readonly accionDeVoltear: string;
  /** Encabezado del panel: el nombre de la carta, con su orientación si procede. */
  readonly encabezadoDelPanel: string;
  readonly sinSignificado: string;
};

type PropiedadesDeRevelado = {
  readonly carta: CartaDeBaraja;
  readonly orientacion: Orientacion;
  /** Nombre de la posición: «La respuesta», «Pasado»… Llega traducido. */
  readonly posicion: string;
  /** El significado curado, o `null` mientras esa pieza no esté escrita. */
  readonly significado: string | null;
  readonly textos: TextosDeRevelado;
};

/**
 * Cuánto dura el volteo antes de que entre el significado.
 *
 * Es el mismo valor que `--dur-volteo` en los tokens. Se repite aquí porque el
 * guion no puede depender de leer una variable CSS desde JavaScript, y una
 * prueba lo ata a su token para que no se separen en silencio.
 */
export const MILISEGUNDOS_DE_VOLTEO = 600;

/** Fases del revelado, en el orden en que ocurren. */
type FaseDeRevelado = "en-reposo" | "volteando" | "revelada";

/**
 * Cuánto hay que esperar a que la carta termine de girar.
 *
 * Con movimiento reducido el volteo se resuelve en un instante por CSS, así que
 * esperar los 600 ms dejaría el significado colgando sobre una carta que ya está
 * quieta. El guion tiene que respetar la preferencia igual que la animación.
 *
 * @returns Milisegundos de espera.
 */
function esperaDelVolteo(): number {
  const prefiereQuietud = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (prefiereQuietud.matches) {
    return 0;
  } else {
    return MILISEGUNDOS_DE_VOLTEO;
  }
}

/**
 * Revelado de una carta.
 *
 * @param props Propiedades del componente.
 * @param props.carta La carta que salió.
 * @param props.orientacion Derecha o invertida.
 * @param props.posicion Nombre de la posición que ocupa.
 * @param props.significado Su texto curado, o `null` si aún no está escrito.
 * @param props.textos Cadenas de interfaz ya traducidas.
 */
export function Revelado({
  carta,
  orientacion,
  posicion,
  significado,
  textos,
}: PropiedadesDeRevelado) {
  const [fase, fijarFase] = useState<FaseDeRevelado>("en-reposo");
  const estaRevelada = fase !== "en-reposo";

  const voltear = () => {
    fijarFase("volteando");
    window.setTimeout(() => fijarFase("revelada"), esperaDelVolteo());
  };

  return (
    <section className={estilos.revelado} data-fase={fase}>
      <header className={estilos.encabezado}>
        <h1 className={estilos.posicion}>
          <TextoDecodificado texto={posicion} />
        </h1>
        <p className={estilos.instruccion} data-oculta={estaRevelada}>
          {textos.instruccion}
        </p>
      </header>

      <div className={estilos.hueco}>
        <Carta
          carta={estaRevelada ? carta : undefined}
          orientacion={orientacion}
          estaRevelada={estaRevelada}
          alPulsar={estaRevelada ? undefined : voltear}
          etiquetaDeAccion={textos.accionDeVoltear}
        />
      </div>

      {fase === "revelada" ? (
        <div className={estilos.significado}>
          <PanelDeSignificado
            encabezado={textos.encabezadoDelPanel}
            base={significado ?? textos.sinSignificado}
          />
        </div>
      ) : null}
    </section>
  );
}
