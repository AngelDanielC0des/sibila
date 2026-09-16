import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SUELO_GRANDE,
  SUELO_TEXTO,
  calcularContraste,
  extraerTokens,
  resolverColor,
} from "@/estilos/contraste";
import estilos from "./pagina.module.css";

/**
 * Catálogo de tokens de diseño.
 *
 * Herramienta interna, no producto: por eso va sin indexar. Muestra la paleta
 * con sus contrastes reales, calculados en el servidor a partir de
 * `tokens.css`, de modo que lo que se ve aquí no puede divergir de lo que
 * aplica el navegador.
 *
 * Cada token se juzga contra el suelo de **su propio rol**: 4,5 para texto, 3
 * para interfaz, y ninguno para las superficies, que son el fondo y no se miden
 * contra sí mismas. Medirlo todo con la misma vara producía avisos rojos en
 * combinaciones que nadie usaría, y un aviso que no significa nada enseña a
 * ignorar los que sí.
 */

export const metadata: Metadata = {
  title: "Tokens · Sibila",
  robots: { index: false, follow: false },
};

const CSS = readFileSync(resolve(process.cwd(), "src/estilos/tokens.css"), "utf8");
const SELECTOR_CLARO = '[data-tema="claro"]';
const OSCURO = extraerTokens(CSS, ":root");
const SOBRESCRITURA_CLARA = extraerTokens(CSS, SELECTOR_CLARO);
const CLARO = new Map([...OSCURO, ...SOBRESCRITURA_CLARA]);

/** Para qué sirve un token, que es lo que determina su suelo de contraste. */
type Rol = "superficie" | "decorativo" | "texto" | "interfaz";

type EntradaDePaleta = {
  readonly token: string;
  readonly rol: Rol;
};

type GrupoDePaleta = {
  readonly titulo: string;
  readonly entradas: readonly EntradaDePaleta[];
};

const GRUPOS: readonly GrupoDePaleta[] = [
  {
    titulo: "La cámara · fondos",
    entradas: [
      { token: "--vacio", rol: "superficie" },
      { token: "--camara", rol: "superficie" },
      { token: "--nicho", rol: "superficie" },
      { token: "--borde", rol: "decorativo" },
      { token: "--linea-control", rol: "interfaz" },
    ],
  },
  {
    titulo: "El holograma · luz emitida",
    entradas: [
      { token: "--holo-nucleo", rol: "texto" },
      { token: "--holo", rol: "texto" },
      { token: "--holo-hondo", rol: "interfaz" },
      { token: "--fisura", rol: "interfaz" },
      { token: "--fisura-rosa", rol: "interfaz" },
    ],
  },
  {
    titulo: "Lo antiguo · luz reflejada",
    entradas: [
      { token: "--oro", rol: "texto" },
      { token: "--oro-vivo", rol: "texto" },
      { token: "--oro-hondo", rol: "interfaz" },
    ],
  },
  {
    titulo: "Texto",
    entradas: [
      { token: "--pergamino", rol: "texto" },
      { token: "--bruma", rol: "texto" },
      { token: "--tenue", rol: "interfaz" },
    ],
  },
  {
    titulo: "Semánticos",
    entradas: [
      { token: "--exito", rol: "texto" },
      { token: "--aviso", rol: "texto" },
      { token: "--error", rol: "texto" },
    ],
  },
];

const SUELO_DE_ROL: Record<Rol, number> = {
  superficie: 0,
  decorativo: 0,
  texto: SUELO_TEXTO,
  interfaz: SUELO_GRANDE,
};

const ETIQUETA_DE_ROL: Record<Rol, string> = {
  superficie: "superficie",
  decorativo: "decorativo",
  texto: "texto",
  interfaz: "interfaz",
};

/** Lo que se muestra en una celda de contraste. */
type Celda =
  | { readonly clase: "superficie" }
  | { readonly clase: "hereda" }
  | { readonly clase: "ornamental"; readonly relacion: number }
  | { readonly clase: "medida"; readonly relacion: number; readonly cumple: boolean };

/**
 * Calcula qué mostrar para un token en un tema concreto.
 *
 * Un token solo se mide en el tema claro si allí resuelve a un color distinto.
 * Basta con comparar el color resuelto en vez de mirar si el bloque claro lo
 * redefine: así también se acierta con los tokens que no se redefinen pero
 * apuntan a otro que sí, como `--linea-control`, que pasa por `--texto-tenue`.
 *
 * @param entrada Token y su rol.
 * @param tokens Tabla de tokens del tema.
 * @param fondo Token de fondo del tema.
 * @param tieneIdentidadPropia Si en este tema resuelve a un color distinto.
 * @returns Qué debe mostrar la celda.
 */
function evaluar(
  entrada: EntradaDePaleta,
  tokens: ReadonlyMap<string, string>,
  fondo: string,
  tieneIdentidadPropia: boolean,
): Celda {
  const hex = resolverColor(entrada.token, tokens);
  const hexDeFondo = resolverColor(fondo, tokens);

  if (entrada.rol === "superficie") {
    return { clase: "superficie" };
  } else if (!tieneIdentidadPropia) {
    return { clase: "hereda" };
  } else if (hex === undefined || hexDeFondo === undefined) {
    return { clase: "hereda" };
  } else {
    const relacion = calcularContraste(hex, hexDeFondo);

    if (entrada.rol === "decorativo") {
      return { clase: "ornamental", relacion };
    } else {
      return { clase: "medida", relacion, cumple: relacion >= SUELO_DE_ROL[entrada.rol] };
    }
  }
}

/**
 * Celda con la relación de contraste juzgada contra el suelo de su rol.
 *
 * Un token ornamental muestra su relación pero sin veredicto: no tiene suelo
 * que cumplir, y estamparle un «falla» sería una alarma vacía.
 *
 * @param props Propiedades del componente.
 * @param props.celda Resultado de evaluar el token.
 */
function CeldaDeContraste({ celda }: { celda: Celda }) {
  if (celda.clase === "superficie") {
    return <td className={estilos.valor}>es fondo</td>;
  } else if (celda.clase === "hereda") {
    return <td className={estilos.valor}>solo oscuro</td>;
  } else if (celda.clase === "ornamental") {
    return (
      <td className={estilos.valor}>
        <span className={estilos.relacion}>{celda.relacion.toFixed(2)}</span> sin suelo
      </td>
    );
  } else {
    const claseDeVeredicto = celda.cumple
      ? estilos.veredictoAa
      : estilos.veredictoInsuficiente;

    return (
      <td>
        <span className={estilos.relacion}>{celda.relacion.toFixed(2)}</span>{" "}
        <span className={`${estilos.veredicto} ${claseDeVeredicto}`}>
          {celda.cumple ? "cumple" : "falla"}
        </span>
      </td>
    );
  }
}

/**
 * Una fila de la tabla de paleta, con el token medido en ambos temas.
 *
 * @param props Propiedades del componente.
 * @param props.entrada Token y su rol.
 */
function FilaDePaleta({ entrada }: { entrada: EntradaDePaleta }) {
  const hexOscuro = resolverColor(entrada.token, OSCURO);
  const hexClaro = resolverColor(entrada.token, CLARO);
  const tieneVersionClara = hexClaro !== undefined && hexClaro !== hexOscuro;

  return (
    <tr>
      <td>
        <div
          className={estilos.muestra}
          style={{ backgroundColor: hexOscuro ?? "transparent" }}
        />
      </td>
      <td className={estilos.nombreDeToken}>{entrada.token}</td>
      <td className={estilos.rol}>{ETIQUETA_DE_ROL[entrada.rol]}</td>
      <td className={estilos.valor}>{hexOscuro ?? "—"}</td>
      <CeldaDeContraste celda={evaluar(entrada, OSCURO, "--vacio", true)} />
      <td className={estilos.valor}>
        {tieneVersionClara ? (hexClaro ?? "—") : "hereda"}
      </td>
      <CeldaDeContraste celda={evaluar(entrada, CLARO, "--fondo", tieneVersionClara)} />
    </tr>
  );
}

/**
 * Tabla de un grupo de paleta.
 *
 * @param props Propiedades del componente.
 * @param props.grupo Grupo a renderizar.
 */
function GrupoDeColor({ grupo }: { grupo: GrupoDePaleta }) {
  return (
    <div className={estilos.grupo}>
      <h3 className={estilos.tituloDeGrupo}>{grupo.titulo}</h3>
      <div className={estilos.envoltorioTabla}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Color</th>
              <th scope="col">Token</th>
              <th scope="col">Rol</th>
              <th scope="col">Oscuro</th>
              <th scope="col">Sobre --vacio</th>
              <th scope="col">Claro</th>
              <th scope="col">Sobre --fondo</th>
            </tr>
          </thead>
          <tbody>
            {grupo.entradas.map((entrada) => (
              <FilaDePaleta key={entrada.token} entrada={entrada} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ESCALA_TIPOGRAFICA = [
  "--texto-3xl",
  "--texto-2xl",
  "--texto-xl",
  "--texto-lg",
  "--texto-md",
  "--texto-base",
  "--texto-sm",
  "--texto-xs",
];

const ESCALA_DE_ESPACIADO = [
  "--esp-1",
  "--esp-2",
  "--esp-3",
  "--esp-4",
  "--esp-5",
  "--esp-6",
  "--esp-7",
  "--esp-8",
  "--esp-9",
  "--esp-10",
];

/** Sección de tipografía: las tres familias y la escala. */
function SeccionTipografia() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Tipografía</h2>
      <p className={estilos.notaDeSeccion}>
        Serif renacentista para la voz de la sibila, sans neutro para la voz de la
        máquina, monoespaciada para datos y para la decodificación.
      </p>

      <div className={estilos.grupo}>
        <h3 className={estilos.tituloDeGrupo}>Familias</h3>
        <div className={estilos.filaTipografica}>
          <span className={estilos.etiquetaTipografica}>--fuente-display</span>
          <span style={{ fontFamily: "var(--fuente-display)", fontSize: "1.75rem" }}>
            La Torre no avisa
          </span>
        </div>
        <div className={estilos.filaTipografica}>
          <span className={estilos.etiquetaTipografica}>--fuente-texto</span>
          <span style={{ fontFamily: "var(--fuente-texto)" }}>
            Elige cinco cartas y piensa en tu pregunta mientras se baraja el mazo.
          </span>
        </div>
        <div className={estilos.filaTipografica}>
          <span className={estilos.etiquetaTipografica}>--fuente-datos</span>
          <span style={{ fontFamily: "var(--fuente-datos)" }}>
            0123456789 · quedan 3 cartas · ñ ç ã é ü
          </span>
        </div>
      </div>

      <div className={estilos.grupo}>
        <h3 className={estilos.tituloDeGrupo}>Escala</h3>
        {ESCALA_TIPOGRAFICA.map((token) => (
          <div key={token} className={estilos.filaTipografica}>
            <span className={estilos.etiquetaTipografica}>{token}</span>
            <span
              style={{
                fontSize: `var(${token})`,
                fontFamily: "var(--fuente-display)",
                lineHeight: "var(--interlineado-apretado)",
              }}
            >
              Sibila
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Catálogo completo de tokens. */
export default function CatalogoDeTokens() {
  return (
    <main className={estilos.pagina}>
      <div className={estilos.contenedor}>
        <header className={estilos.cabecera}>
          <div>
            <h1 className={estilos.titulo}>Tokens de diseño</h1>
            <p className={estilos.entradilla}>
              Calculado en el servidor desde <code>tokens.css</code>. Lo que se ve aquí es
              exactamente lo que aplica el navegador.
            </p>
          </div>
        </header>

        <section className={estilos.seccion}>
          <h2 className={estilos.tituloDeSeccion}>Paleta</h2>
          <p className={estilos.notaDeSeccion}>
            Lo holográfico es azul y emite luz; lo antiguo es oro y la refleja. El violeta
            solo aparece como aberración cromática en bordes y desplazamientos, nunca como
            relleno ni como texto.
          </p>

          {GRUPOS.map((grupo) => (
            <GrupoDeColor key={grupo.titulo} grupo={grupo} />
          ))}

          <p className={estilos.aviso}>
            Cada token se juzga contra el suelo de su rol: <strong>4,5</strong> para texto
            y <strong>3</strong> para interfaz. Las superficies son el fondo y no se
            miden. Un token que pone «solo oscuro» no lo redefine el tema claro, así que
            ahí se usa su equivalente semántico. Lo mismo lo comprueba{" "}
            <code>contraste.prueba.ts</code> en cada compilación.
          </p>
        </section>

        <SeccionTipografia />

        <section className={estilos.seccion}>
          <h2 className={estilos.tituloDeSeccion}>Espaciado</h2>
          <p className={estilos.notaDeSeccion}>
            Escala de 4 px. Un valor de espaciado que no esté aquí es un error, no una
            excepción.
          </p>
          <div className={estilos.escalaDeEspaciado}>
            {ESCALA_DE_ESPACIADO.map((token) => (
              <div key={token} className={estilos.filaDeEspaciado}>
                <span className={estilos.etiquetaTipografica}>{token}</span>
                <span
                  className={estilos.barraDeEspaciado}
                  style={{ width: `var(${token})` }}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
