"use client";

import { useId } from "react";
import estilos from "./campo-de-texto.module.css";

/**
 * Campo de texto, de una línea o de varias.
 *
 * La etiqueta es obligatoria, no opcional: un campo sin etiqueta no se puede
 * construir con este componente. El marcador de posición no la sustituye —
 * desaparece al escribir, y quien vuelve al campo ya no sabe qué iba ahí.
 *
 * El contador merece explicación. Anunciar los caracteres restantes en cada
 * pulsación es hostil con un lector de pantalla, así que el contador visible va
 * oculto al árbol de accesibilidad y **solo se anuncia cuando queda poco**, que
 * es cuando el dato importa de verdad.
 */

/** A partir de cuántos caracteres restantes el contador empieza a avisar. */
const RESTANTES_PARA_AVISAR = 20;

type PropiedadesDeCampo = {
  /** Qué se pide. Obligatoria: sin etiqueta no hay campo. */
  readonly etiqueta: string;
  readonly valor: string;
  readonly alCambiar: (valor: string) => void;
  readonly marcador?: string;
  /** Instrucción breve. Va siempre visible, no escondida tras un icono. */
  readonly ayuda?: string;
  /** Qué ha fallado y cómo arreglarlo. */
  readonly error?: string;
  readonly maximoDeCaracteres?: number;
  /** Bloquea el campo **y** explica por qué. Sin motivo no hay bloqueo. */
  readonly motivoDeBloqueo?: string;
  readonly esAreaDeTexto?: boolean;
};

type PropiedadesDePie = {
  readonly idDeAyuda: string;
  readonly ayuda: string | undefined;
  readonly restantes: number | undefined;
  readonly estaCercaDelLimite: boolean;
};

/**
 * Pie del campo: la ayuda a la izquierda y el contador a la derecha.
 *
 * @param props Propiedades del componente.
 * @param props.idDeAyuda Identificador al que apunta `aria-describedby`.
 * @param props.ayuda Instrucción breve, si la hay.
 * @param props.restantes Caracteres que quedan, si hay tope.
 * @param props.estaCercaDelLimite Si conviene destacar el contador.
 */
function PieDelCampo({
  idDeAyuda,
  ayuda,
  restantes,
  estaCercaDelLimite,
}: PropiedadesDePie) {
  const claseDeContador = estaCercaDelLimite
    ? `${estilos.contador} ${estilos.contadorAlLimite}`
    : estilos.contador;

  return (
    <div className={estilos.pie}>
      {ayuda === undefined ? null : (
        <span id={idDeAyuda} className={estilos.ayuda}>
          {ayuda}
        </span>
      )}

      {restantes === undefined ? null : (
        <span className={claseDeContador} aria-hidden="true">
          {restantes}
        </span>
      )}
    </div>
  );
}

/**
 * Reúne los identificadores a los que debe apuntar `aria-describedby`.
 *
 * @param idDeAyuda Identificador del texto de ayuda.
 * @param idDeError Identificador del mensaje de error.
 * @param tieneAyuda Si hay texto de ayuda.
 * @param tieneError Si hay error.
 * @returns La lista separada por espacios, o `undefined` si no hay ninguno.
 */
function reunirDescriptores(
  idDeAyuda: string,
  idDeError: string,
  tieneAyuda: boolean,
  tieneError: boolean,
): string | undefined {
  const partes: string[] = [];

  if (tieneAyuda) {
    partes.push(idDeAyuda);
  }

  if (tieneError) {
    partes.push(idDeError);
  }

  return partes.length === 0 ? undefined : partes.join(" ");
}

type PropiedadesDeControl = {
  readonly identificador: string;
  readonly campo: PropiedadesDeCampo;
  readonly descriptores: string | undefined;
};

/**
 * El control en sí, de una línea o de varias.
 *
 * Recibe el objeto de propiedades entero en lugar de nueve campos reenviados uno
 * a uno: menos ruido, y ningún sitio donde un día se pierda por el camino el
 * `aria-describedby`.
 *
 * @param props Propiedades del componente.
 * @param props.identificador Identificador que enlaza con la etiqueta.
 * @param props.campo Propiedades originales del campo.
 * @param props.descriptores Identificadores de ayuda y error.
 */
function ControlDeTexto({ identificador, campo, descriptores }: PropiedadesDeControl) {
  const esArea = campo.esAreaDeTexto === true;

  const comunes = {
    id: identificador,
    className: esArea ? `${estilos.control} ${estilos.area}` : estilos.control,
    value: campo.valor,
    placeholder: campo.marcador,
    disabled: campo.motivoDeBloqueo !== undefined,
    maxLength: campo.maximoDeCaracteres,
    "aria-invalid": campo.error !== undefined,
    "aria-describedby": descriptores,
    onChange: (evento: { target: { value: string } }) => {
      campo.alCambiar(evento.target.value);
    },
  };

  if (esArea) {
    return <textarea {...comunes} />;
  } else {
    return <input type="text" {...comunes} />;
  }
}

/**
 * Campo de texto con etiqueta, ayuda, contador y error.
 *
 * @param propiedades Propiedades del campo. No se desestructuran en la firma
 *   porque el control las necesita completas.
 */
export function CampoDeTexto(propiedades: PropiedadesDeCampo) {
  const { etiqueta, valor, error, ayuda, motivoDeBloqueo, maximoDeCaracteres } =
    propiedades;

  const identificador = useId();
  const idDeAyuda = `${identificador}-ayuda`;
  const idDeError = `${identificador}-error`;

  const tieneError = error !== undefined;
  const textoDeAyuda = tieneError ? undefined : (motivoDeBloqueo ?? ayuda);
  const restantes =
    maximoDeCaracteres === undefined ? undefined : maximoDeCaracteres - valor.length;
  const estaCercaDelLimite =
    restantes !== undefined && restantes <= RESTANTES_PARA_AVISAR;

  return (
    <div className={estilos.campo}>
      <label className={estilos.etiqueta} htmlFor={identificador}>
        {etiqueta}
      </label>

      <ControlDeTexto
        identificador={identificador}
        campo={propiedades}
        descriptores={reunirDescriptores(
          idDeAyuda,
          idDeError,
          textoDeAyuda !== undefined,
          tieneError,
        )}
      />

      {tieneError ? (
        <p id={idDeError} className={estilos.error}>
          {error}
        </p>
      ) : null}

      <PieDelCampo
        idDeAyuda={idDeAyuda}
        ayuda={textoDeAyuda}
        restantes={restantes}
        estaCercaDelLimite={estaCercaDelLimite}
      />

      {/*
        El contador visible está oculto al lector; este aviso solo tiene texto
        cuando queda poco, para no hablar en cada pulsación.
      */}
      <span className={estilos.soloParaLectores} role="status">
        {estaCercaDelLimite ? `Quedan ${restantes} caracteres` : ""}
      </span>
    </div>
  );
}
