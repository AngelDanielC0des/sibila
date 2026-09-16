import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Aberracion } from "@/componentes/ornamentos/aberracion";
import { Barrido } from "@/componentes/ornamentos/barrido";
import { ConoVolumetrico } from "@/componentes/ornamentos/cono-volumetrico";
import { Fresnel } from "@/componentes/ornamentos/fresnel";
import { Holograma } from "@/componentes/ornamentos/holograma";
import { Interferencia } from "@/componentes/ornamentos/interferencia";
import { AnillosDeAstrolabio } from "@/componentes/ornamentos/anillos-de-astrolabio";
import { MotasDelHaz } from "@/componentes/ornamentos/motas-del-haz";
import { RejillaEnFuga } from "@/componentes/ornamentos/rejilla-en-fuga";
import {
  EsquinaDeFiligrana,
  MarcoDeFiligrana,
  SeparadorDeFiligrana,
} from "@/componentes/ornamentos/filigrana";
import {
  GLIFOS_DE_ASPECTO,
  GLIFOS_PLANETARIOS,
  GLIFOS_ZODIACALES,
  type Glifo,
} from "@/componentes/ornamentos/glifos";
import { Simbolo } from "@/componentes/ornamentos/simbolo";
import { TextoDecodificado } from "@/componentes/ornamentos/texto-decodificado";
import estilos from "./pagina.module.css";

/**
 * Catálogo de la biblioteca ornamental.
 *
 * Herramienta interna, sin indexar. Cada ornamento aparece aislado sobre un
 * sujeto con alfa real, para que se vea lo que no se apreciaría sobre un
 * rectángulo: que la aberración sigue la silueta y que el fresnel no.
 *
 * Los cinco son CSS puro, sin una línea de JavaScript, que es lo que permite
 * usarlos en rutas de contenido sin pesar. Ver `docs/guia-de-diseno.md` §1.
 */

export const metadata: Metadata = {
  title: "Ornamentos · Sibila",
  robots: { index: false, follow: false },
};

/**
 * Silueta de muestra, provisional.
 *
 * Ocupa el sitio del retrato de Sibila hasta que exista. Lo importante es que
 * tiene canal alfa: sobre un rectángulo opaco, la aberración y el fresnel
 * mienten y parecen funcionar mejor de lo que funcionan.
 */
function SiluetaDeMuestra() {
  return (
    <svg
      className={estilos.sujetoDeMuestra}
      viewBox="0 0 100 130"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="50" cy="28" r="20" />
      <path d="M50 54c-22 0-34 18-38 50-1 8 4 12 12 12h52c8 0 13-4 12-12-4-32-16-50-38-50z" />
    </svg>
  );
}

type PropiedadesDeFicha = {
  readonly nombre: string;
  readonly tecnica: string;
  readonly coste: string;
  readonly children: ReactNode;
};

/**
 * Una ficha del catálogo: el ornamento sobre el escenario, su técnica y su coste.
 *
 * @param props Propiedades del componente.
 * @param props.nombre Nombre del ornamento.
 * @param props.tecnica Con qué está hecho.
 * @param props.coste Qué cuesta pintarlo.
 * @param props.children Lo que se monta dentro del escenario.
 */
function Ficha({ nombre, tecnica, coste, children }: PropiedadesDeFicha) {
  return (
    <article className={estilos.ficha}>
      <div className={estilos.escenario}>{children}</div>
      <h3 className={estilos.nombreDeFicha}>{nombre}</h3>
      <p className={estilos.tecnica}>{tecnica}</p>
      <p className={estilos.coste}>{coste}</p>
    </article>
  );
}

type OrnamentoAislado = {
  readonly nombre: string;
  readonly tecnica: string;
  readonly coste: string;
  /** Capa que se apila sobre el sujeto. La aberración no la usa: lo envuelve. */
  readonly Capa?: () => ReactNode;
  readonly tieneEnvoltura?: boolean;
};

const ORNAMENTOS_AISLADOS: readonly OrnamentoAislado[] = [
  {
    nombre: "Sin tratamiento",
    tecnica: "El sujeto desnudo, para comparar.",
    coste: "Coste nulo",
  },
  {
    nombre: "Barrido",
    tecnica:
      "Degradado repetido desplazado con transform, en múltiplos exactos del paso para que el bucle no tenga costura.",
    coste: "Compuesto en GPU · sin repintado",
    Capa: Barrido,
  },
  {
    nombre: "Cono volumétrico",
    tecnica:
      "Degradado recortado en trapecio y desenfocado, más un óvalo en la base. Estrecho abajo, donde está el proyector.",
    coste: "Un desenfoque estático · se pinta una vez",
    Capa: ConoVolumetrico,
  },
  {
    nombre: "Fresnel",
    tecnica:
      "Resplandor interior. Sigue el rectángulo del contenedor, no la silueta: eso lo hará el shader del nivel 1.",
    coste: "Una sombra interior · se pinta una vez",
    Capa: Fresnel,
  },
  {
    nombre: "Aberración cromática",
    tecnica:
      "Dos drop-shadow desplazados. Siguen el canal alfa, así que las franjas aparecen en la silueta real.",
    coste: "Un paso de filtro · el más caro de los cinco",
    tieneEnvoltura: true,
  },
  {
    nombre: "Interferencia",
    tecnica:
      "Banda que cruza cada once segundos y dura menos de medio. Se retira entera con movimiento reducido.",
    coste: "Compuesto en GPU · invisible el 96 % del tiempo",
    Capa: Interferencia,
  },
];

/**
 * Monta el escenario de un ornamento aislado.
 *
 * @param props Propiedades del componente.
 * @param props.ornamento Ornamento a montar.
 */
function EscenarioAislado({ ornamento }: { ornamento: OrnamentoAislado }) {
  const { Capa, tieneEnvoltura } = ornamento;

  if (tieneEnvoltura === true) {
    return (
      <Aberracion>
        <SiluetaDeMuestra />
      </Aberracion>
    );
  } else {
    return (
      <>
        <SiluetaDeMuestra />
        {Capa === undefined ? null : <Capa />}
      </>
    );
  }
}

/** Los cinco ornamentos aislados sobre el sujeto de muestra. */
function SeccionAislados() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Cada ornamento por separado</h2>
      <p className={estilos.notaDeSeccion}>
        El sujeto de muestra tiene canal alfa a propósito. Sobre un rectángulo opaco la
        aberración y el fresnel mienten: parecen funcionar mejor de lo que funcionan.
      </p>

      <div className={estilos.rejilla}>
        {ORNAMENTOS_AISLADOS.map((ornamento) => (
          <Ficha
            key={ornamento.nombre}
            nombre={ornamento.nombre}
            tecnica={ornamento.tecnica}
            coste={ornamento.coste}
          >
            <EscenarioAislado ornamento={ornamento} />
          </Ficha>
        ))}
      </div>
    </section>
  );
}

/** El tratamiento completo en sus tres intensidades. */
function SeccionCompuestos() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Compuestos, en sus tres intensidades</h2>
      <p className={estilos.notaDeSeccion}>
        Un único mando gradúa el tratamiento entero. Subir o bajar la intensidad no obliga
        a tocar cinco ornamentos por separado ni deja que queden desacompasados.
      </p>

      <div className={estilos.rejilla}>
        <Ficha
          nombre="Plena"
          tecnica="Para el héroe de la portada, donde Sibila es el único foco de la escena."
          coste="Cinco capas · una de filtro"
        >
          <Holograma intensidad="plena">
            <SiluetaDeMuestra />
          </Holograma>
        </Ficha>

        <Ficha
          nombre="Sutil"
          tecnica="Para paneles y cartas reveladas, donde el holograma acompaña pero no manda."
          coste="Cinco capas al 55 %"
        >
          <Holograma intensidad="sutil" tieneInterferencia={false}>
            <SiluetaDeMuestra />
          </Holograma>
        </Ficha>

        <Ficha
          nombre="Reposo"
          tecnica="Para elementos de apoyo. Sin cono ni interferencia: el sujeto no es el foco."
          coste="Tres capas al 25 %"
        >
          <Holograma intensidad="reposo" tieneCono={false} tieneInterferencia={false}>
            <SiluetaDeMuestra />
          </Holograma>
        </Ficha>
      </div>
    </section>
  );
}

/**
 * Los ornamentos de ambiente: los que construyen la sala en lugar de tratar al
 * sujeto.
 */
function SeccionCamara() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>La cámara de proyección</h2>
      <p className={estilos.notaDeSeccion}>
        Estos tres no tratan al sujeto: construyen el sitio donde ocurre. Sin ellos Sibila
        flota en un vacío negro; con ellos hay una sala, un suelo y un aparato que
        proyecta.
      </p>

      <div className={estilos.rejilla}>
        <Ficha
          nombre="Rejilla en fuga"
          tecnica="Plano abatido en perspectiva con una máscara que lo disuelve hacia el horizonte. El avance recorre un paso exacto de la cuadrícula."
          coste="Compuesto en GPU · sin repintado"
        >
          <RejillaEnFuga />
        </Ficha>

        <Ficha
          nombre="Anillos de astrolabio"
          tecnica="Doce divisiones como el zodiaco, veintiocho como las mansiones lunares, cuatro cardinales. Periodos primos entre sí para que no se vea repetir."
          coste="Tres transformaciones · SVG y CSS, sin JavaScript"
        >
          <AnillosDeAstrolabio />
        </Ficha>

        <Ficha
          nombre="Motas del haz"
          tecnica="Divergen conforme ascienden, siguiendo la misma envolvente que el cono. Un solo lienzo, no uno por mota."
          coste="El único con JavaScript · se detiene fuera de pantalla"
        >
          <ConoVolumetrico />
          <MotasDelHaz cantidad={50} />
        </Ficha>

        <Ficha
          nombre="La cámara completa"
          tecnica="Los tres de ambiente más el tratamiento holográfico sobre el sujeto. Es la composición que llevará el héroe de la portada."
          coste="Todo lo anterior a la vez"
        >
          <RejillaEnFuga />
          <AnillosDeAstrolabio />
          <Holograma intensidad="plena">
            <SiluetaDeMuestra />
          </Holograma>
          <MotasDelHaz cantidad={50} />
        </Ficha>
      </div>
    </section>
  );
}

/** La aberración aplicada a texto, que es como la llevarán las frases de Sibila. */
function SeccionTexto() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Aberración sobre texto</h2>
      <p className={estilos.notaDeSeccion}>
        Sobre texto se resuelve con sombra tipográfica en vez de filtro: mucho más barato
        y se lee igual. Es el tratamiento que llevarán las frases que pronuncia Sibila.
      </p>

      <div className={estilos.escenarioAncho}>
        <p className={estilos.textoDeMuestra}>
          <Aberracion esTexto>Las cartas ya han hablado</Aberracion>
        </p>
      </div>
    </section>
  );
}

type Medicion = {
  readonly conjunto: string;
  readonly sinEstrangular: string;
  readonly cuatro: string;
  readonly seis: string;
};

/*
 * Medido sobre el build de producción, no sobre el de desarrollo: con recarga en
 * caliente, React sin minificar y mapas de origen, el número no significa nada.
 * Tres pasadas por escenario y mediana, porque una sola medición tiene tanta
 * varianza que llega a dar mejoras imposibles.
 *
 * Estrangular la CPU cuatro veces aproxima un Android de gama media; seis veces,
 * uno de gama baja.
 */
const MEDICIONES: readonly Medicion[] = [
  {
    conjunto: "Barrido + fresnel + aberración",
    sinEstrangular: "60 fps",
    cuatro: "60 fps",
    seis: "58 fps",
  },
  {
    conjunto: "Todo, incluidos cono, anillos, rejilla y motas",
    sinEstrangular: "60 fps",
    cuatro: "42 fps",
    seis: "25 fps",
  },
];

const GRUPOS_DE_GLIFOS: ReadonlyArray<{
  readonly titulo: string;
  readonly glifos: readonly Glifo[];
}> = [
  { titulo: "Glifos · zodiacales", glifos: GLIFOS_ZODIACALES },
  { titulo: "Glifos · planetarios", glifos: GLIFOS_PLANETARIOS },
  { titulo: "Glifos · aspectos y nodos", glifos: GLIFOS_DE_ASPECTO },
];

/**
 * Una tira de glifos con su título.
 *
 * @param props Propiedades del componente.
 * @param props.titulo Nombre del grupo.
 * @param props.glifos Glifos a mostrar.
 */
function GrupoDeGlifos({
  titulo,
  glifos,
}: {
  readonly titulo: string;
  readonly glifos: readonly Glifo[];
}) {
  return (
    <div className={estilos.grupo}>
      <h3 className={estilos.tituloDeGrupo}>{titulo}</h3>
      <p className={estilos.muestraDeGlifos}>
        {glifos.map((glifo) => (
          <Simbolo key={glifo.nombre} glifo={glifo} esDecorativo={false} />
        ))}
      </p>
    </div>
  );
}

/** La capa dorada: filigrana de grabado y glifos. */
function SeccionDorada() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>La capa antigua</h2>
      <p className={estilos.notaDeSeccion}>
        Frente a lo holográfico, que emite luz y es azul, esto la refleja y es de oro. El
        lenguaje es geométrico y astronómico —rectas, arcos y círculos—, como una lámina
        de astrolabio. Nada de volutas: es por ahí por donde un producto de tarot se
        desliza hacia la estética de bazar.
      </p>

      <div className={estilos.grupo}>
        <h3 className={estilos.tituloDeGrupo}>Separador</h3>
        <SeparadorDeFiligrana />
      </div>

      <div className={estilos.rejilla}>
        <Ficha
          nombre="Esquina"
          tecnica="Se dibuja una sola vez y las otras tres se obtienen reflejándola: más barato, y garantiza que las cuatro coinciden."
          coste="SVG estático · se pinta una vez"
        >
          <EsquinaDeFiligrana posicion="superior-izquierda" />
        </Ficha>

        <Ficha
          nombre="Marco completo"
          tecnica="Las cuatro esquinas sobre un contenedor posicionado. Lo llevarán las fichas de carta y los paneles de la lectura."
          coste="Cuatro SVG estáticos"
        >
          <MarcoDeFiligrana />
        </Ficha>
      </div>

      {GRUPOS_DE_GLIFOS.map((grupo) => (
        <GrupoDeGlifos key={grupo.titulo} titulo={grupo.titulo} glifos={grupo.glifos} />
      ))}

      <p className={estilos.aviso}>
        Todos llevan el selector de variación de texto. Sin él, varios sistemas pintan
        Venus, Marte y los signos como emoji a color, y un símbolo que llega ya coloreado
        no puede heredar el oro. Van además en caja de ancho fijo, porque sus anchos
        naturales son muy distintos y sin ella el texto daría saltos mientras se
        decodifica.
      </p>
    </section>
  );
}

/** La decodificación de texto, que es la firma del producto. */
function SeccionDeDecodificacion() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Decodificación de texto</h2>
      <p className={estilos.notaDeSeccion}>
        El texto no aparece: se condensa. Cada carácter pasa por glifos zodiacales y
        planetarios antes de fijarse en su letra — símbolos antiguos resolviéndose por
        medio de una máquina, que es el concepto entero del producto en una sola
        animación. Recarga la página para verlo otra vez.
      </p>

      <div className={estilos.escenarioAncho}>
        <p className={estilos.textoDeMuestra}>
          <TextoDecodificado texto="La Torre no avisa" duracion={2100} />
        </p>
        <p className={estilos.textoDeMuestraMenor}>
          <TextoDecodificado
            texto="El Ermitaño se aparta a propósito"
            duracion={2400}
            retardo={500}
          />
        </p>
      </div>

      <p className={estilos.aviso}>
        Nunca se sustituye el texto. La letra real es un nodo del DOM desde el primer
        pintado y el glifo va encima, absoluto y oculto al lector de pantalla; lo único
        que cambia es un atributo. Así se anuncia bien, se indexa, y el texto no se
        recoloca ni una vez. Los glifos cambian once veces por segundo, no sesenta: a esa
        velocidad parpadearía y entraría en terreno de riesgo para quien tiene
        fotosensibilidad.
      </p>
    </section>
  );
}

/** Coste medido, y la línea que separa lo que va en móvil de lo que no. */
function SeccionCoste() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Coste medido</h2>
      <p className={estilos.notaDeSeccion}>
        Sobre el build de producción, con tres pasadas por escenario y mediana. El
        objetivo del proyecto son 60 fps sostenidos en un Android de gama media de tres
        años, que es aproximadamente la columna de 4×.
      </p>

      <div className={estilos.envoltorioTabla}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Conjunto</th>
              <th scope="col">Sin estrangular</th>
              <th scope="col">CPU 4×</th>
              <th scope="col">CPU 6×</th>
            </tr>
          </thead>
          <tbody>
            {MEDICIONES.map((medicion) => (
              <tr key={medicion.conjunto}>
                <td>{medicion.conjunto}</td>
                <td className={estilos.dato}>{medicion.sinEstrangular}</td>
                <td className={estilos.dato}>{medicion.cuatro}</td>
                <td className={estilos.dato}>{medicion.seis}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={estilos.aviso}>
        <strong>El tratamiento completo no cumple el objetivo en gama media.</strong> La
        medición dice exactamente dónde está la línea, así que la línea está escrita en
        los propios ornamentos: los anillos, la rejilla y las motas se retiran con puntero
        grueso, y el cono se queda pero pierde el desenfoque, que es de donde salía su
        coste. Nadie tiene que acordarse de hacerlo.
      </p>

      <p className={estilos.notaDeSeccion}>
        Dos optimizaciones salieron de medir en vez de suponer. Los anillos rotaban un{" "}
        <code>&lt;g&gt;</code> dentro del SVG, lo que obliga a re-rasterizar el vector en
        cada fotograma: ahora cada anillo es su propio SVG y la rotación se compone en la
        GPU. Las motas se dibujaban con <code>arc()</code> y <code>fill()</code>,
        teselando una ruta por partícula y por fotograma: ahora se estampa una imagen ya
        rasterizada, que además da un borde suave más parecido al polvo real.
      </p>
    </section>
  );
}

/** Catálogo de ornamentos. */
export default function CatalogoDeOrnamentos() {
  return (
    <main className={estilos.pagina}>
      <div className={estilos.contenedor}>
        <header className={estilos.cabecera}>
          <h1 className={estilos.titulo}>Biblioteca ornamental</h1>
          <p className={estilos.entradilla}>
            Los cinco ornamentos del tratamiento holográfico, aislados y compuestos. Todos
            son CSS puro: ni una línea de JavaScript, que es lo que permite usarlos en
            rutas de contenido sin pesar.
          </p>
        </header>

        <SeccionAislados />
        <SeccionCompuestos />
        <SeccionCamara />
        <SeccionTexto />
        <SeccionDorada />
        <SeccionDeDecodificacion />
        <SeccionCoste />

        <p className={estilos.aviso}>
          El violeta solo aparece aquí, en la franja de la aberración. En el momento en
          que se use para rellenar algo, el producto empieza a parecerse a los
          competidores. Es la única regla de color que no admite excepción.
        </p>
      </div>
    </main>
  );
}
