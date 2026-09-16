import { describe, expect, it, vi } from "vitest";
import { crearBusDeEventos } from "./bus-de-eventos";

describe("reparto de eventos", () => {
  it("entrega el evento a quien se suscribió", () => {
    const { emisor, escucha } = crearBusDeEventos();
    const atendido = vi.fn();

    escucha.suscribir("mazo:barajado", atendido);
    emisor.emitir("mazo:barajado", { tirada: "general-de-cinco" });

    expect(atendido).toHaveBeenCalledTimes(1);
    expect(atendido).toHaveBeenCalledWith({ tirada: "general-de-cinco" });
  });

  it("entrega a todos los suscriptores de ese evento", () => {
    const { emisor, escucha } = crearBusDeEventos();
    const primero = vi.fn();
    const segundo = vi.fn();

    escucha.suscribir("muro:alcanzado", primero);
    escucha.suscribir("muro:alcanzado", segundo);
    emisor.emitir("muro:alcanzado", { tirada: "si-no" });

    expect(primero).toHaveBeenCalledTimes(1);
    expect(segundo).toHaveBeenCalledTimes(1);
  });

  it("no molesta a quien escucha otra cosa", () => {
    const { emisor, escucha } = crearBusDeEventos();
    const ajeno = vi.fn();

    escucha.suscribir("lectura:completada", ajeno);
    emisor.emitir("mazo:barajado", { tirada: "una-carta" });

    expect(ajeno).not.toHaveBeenCalled();
  });

  it("emitir sin nadie escuchando no rompe nada", () => {
    const { emisor } = crearBusDeEventos();

    expect(() => emisor.emitir("lectura:reiniciada", { tirada: null })).not.toThrow();
  });
});

describe("cancelar la suscripción", () => {
  it("deja de recibir", () => {
    const { emisor, escucha } = crearBusDeEventos();
    const atendido = vi.fn();
    const cancelar = escucha.suscribir("mazo:barajado", atendido);

    emisor.emitir("mazo:barajado", { tirada: "si-no" });
    cancelar();
    emisor.emitir("mazo:barajado", { tirada: "si-no" });

    expect(atendido).toHaveBeenCalledTimes(1);
  });

  it("cancelar dos veces no molesta a nadie", () => {
    const { emisor, escucha } = crearBusDeEventos();
    const otro = vi.fn();
    const cancelar = escucha.suscribir("mazo:barajado", vi.fn());

    escucha.suscribir("mazo:barajado", otro);
    cancelar();
    cancelar();
    emisor.emitir("mazo:barajado", { tirada: "si-no" });

    expect(otro).toHaveBeenCalledTimes(1);
  });

  /*
   * Es lo que hace un efecto de React al desmontarse en mitad de la emisión.
   * Si se iterara el conjunto vivo en lugar de una copia, el suscriptor
   * siguiente se quedaría sin su evento y el fallo sería intermitente.
   */
  it("un suscriptor puede cancelarse a sí mismo mientras atiende", () => {
    const { emisor, escucha } = crearBusDeEventos();
    const siguiente = vi.fn();

    const cancelar = escucha.suscribir("mazo:barajado", () => {
      cancelar();
    });
    escucha.suscribir("mazo:barajado", siguiente);

    emisor.emitir("mazo:barajado", { tirada: "una-carta" });

    expect(siguiente).toHaveBeenCalledTimes(1);
  });
});

describe("un suscriptor que revienta", () => {
  /*
   * Un fallo al pintar en un renderizador no puede cortar el ritual ni dejar a
   * los demás sin enterarse. Pero tampoco se traga: se relanza fuera del bucle
   * para que llegue al manejador global.
   */
  it("no impide que los demás se enteren", () => {
    const informar = vi.fn();
    const { emisor, escucha } = crearBusDeEventos(informar);
    const posterior = vi.fn();

    escucha.suscribir("carta:seleccionada", () => {
      throw new Error("el renderizador ha fallado al pintar");
    });
    escucha.suscribir("carta:seleccionada", posterior);

    expect(() =>
      emisor.emitir("carta:seleccionada", { indice: 4, orden: 1, quedan: 2 }),
    ).not.toThrow();
    expect(posterior).toHaveBeenCalledTimes(1);
  });

  it("el error no se traga: se informa de él", () => {
    const informar = vi.fn();
    const { emisor, escucha } = crearBusDeEventos(informar);
    const reventon = new Error("reventón");

    escucha.suscribir("mazo:barajado", () => {
      throw reventon;
    });
    emisor.emitir("mazo:barajado", { tirada: "una-carta" });

    expect(informar).toHaveBeenCalledTimes(1);
    expect(informar).toHaveBeenCalledWith(reventon);
  });

  it("informa de cada suscriptor que revienta, no sólo del primero", () => {
    const informar = vi.fn();
    const { emisor, escucha } = crearBusDeEventos(informar);

    for (let cuantos = 0; cuantos < 3; cuantos += 1) {
      escucha.suscribir("mazo:barajado", () => {
        throw new Error(`reventón ${cuantos}`);
      });
    }

    emisor.emitir("mazo:barajado", { tirada: "si-no" });

    expect(informar).toHaveBeenCalledTimes(3);
  });
});

describe("aislamiento entre buses", () => {
  it("dos buses no se oyen entre sí", () => {
    const uno = crearBusDeEventos();
    const otro = crearBusDeEventos();
    const atendido = vi.fn();

    uno.escucha.suscribir("mazo:barajado", atendido);
    otro.emisor.emitir("mazo:barajado", { tirada: "si-no" });

    expect(atendido).not.toHaveBeenCalled();
  });
});
