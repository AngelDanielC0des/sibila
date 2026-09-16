"use client";

import { useState } from "react";
import { Boton } from "@/componentes/base/boton";
import { CampoDeTexto } from "@/componentes/base/campo-de-texto";
import { Carta } from "@/componentes/base/carta";
import { buscarCartaPorId } from "@/motor-de-lectura/baraja";
import { PosicionDeTirada } from "@/componentes/base/posicion-de-tirada";
import { Panel } from "@/componentes/base/panel";
import { PanelDeSignificado } from "@/componentes/base/panel-de-significado";
import {
  BASE_MAXIMO,
  BASE_MINIMO,
  MATIZ_MAXIMO,
  MATIZ_MINIMO,
  VALENCIA_MAXIMA,
} from "./textos-de-medida";
import estilos from "./pagina.module.css";

/**
 * Catálogo interactivo de los componentes base.
 *
 * Los estados de reposo, bloqueado, cargando y error se muestran montados. Los
 * de hover, foco y activo no se pueden enseñar en una captura: hay que pasar el
 * puntero y recorrer con el tabulador, y por eso el catálogo es interactivo en
 * lugar de una hoja de ejemplos.
 */

/** Los tres pesos del botón, en reposo. */
function BotonesEnReposo() {
  return (
    <div className={estilos.grupo}>
      <h3 className={estilos.tituloDeGrupo}>Reposo · los tres pesos</h3>
      <div className={estilos.fila}>
        <Boton variante="primario">Empezar una lectura</Boton>
        <Boton variante="secundario">Ver las 78 cartas</Boton>
        <Boton variante="sutil">Ahora no</Boton>
      </div>
    </div>
  );
}

/** Cargando, bloqueado y con error. */
function BotonesEnEstadosEspeciales() {
  return (
    <>
      <div className={estilos.grupo}>
        <h3 className={estilos.tituloDeGrupo}>Cargando</h3>
        <div className={estilos.fila}>
          <Boton variante="primario" estaCargando>
            Barajando
          </Boton>
          <Boton variante="secundario" estaCargando>
            Guardando
          </Boton>
        </div>
      </div>

      <div className={estilos.grupo}>
        <h3 className={estilos.tituloDeGrupo}>Bloqueado, con su motivo</h3>
        <div className={estilos.fila}>
          <Boton
            variante="primario"
            motivoDeBloqueo="Escribe tu pregunta antes de barajar."
          >
            Barajar las cartas
          </Boton>
          <Boton
            variante="secundario"
            motivoDeBloqueo="Te faltan tres cartas por elegir."
          >
            Revelar
          </Boton>
        </div>
      </div>

      <div className={estilos.grupo}>
        <h3 className={estilos.tituloDeGrupo}>Error</h3>
        <div className={estilos.fila}>
          <Boton variante="primario" error="No se pudo conectar. Inténtalo otra vez.">
            Reintentar
          </Boton>
        </div>
      </div>
    </>
  );
}

/** Campos, incluido uno vivo con contador para poder escribir en él. */
function CamposDeTexto() {
  const [pregunta, fijarPregunta] = useState("");
  const [nombre, fijarNombre] = useState("");

  return (
    <div className={estilos.rejillaDeCampos}>
      <CampoDeTexto
        etiqueta="¿Qué quieres preguntar?"
        valor={pregunta}
        alCambiar={fijarPregunta}
        marcador="Escribe tu pregunta…"
        ayuda="Cuanto más concreta sea, más útil será la respuesta."
        maximoDeCaracteres={300}
        esAreaDeTexto
      />

      <CampoDeTexto
        etiqueta="Tu nombre"
        valor={nombre}
        alCambiar={fijarNombre}
        ayuda="Solo se usa para personalizar la lectura."
      />

      <CampoDeTexto
        etiqueta="Correo electrónico"
        valor="angel@"
        alCambiar={() => undefined}
        error="Falta el dominio. Debe tener la forma nombre@ejemplo.com."
      />

      <CampoDeTexto
        etiqueta="Segunda persona"
        valor=""
        alCambiar={() => undefined}
        motivoDeBloqueo="Disponible al desbloquear la sinastría."
      />
    </div>
  );
}

/** La sección del botón, con sus estados y la nota sobre el bloqueo. */
function SeccionDeBoton() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Botón</h2>
      <p className={estilos.notaDeSeccion}>
        No existe una propiedad «deshabilitado»: existe el motivo, y su presencia es lo
        que bloquea. Si no se puede explicar por qué un botón no responde, no se puede
        bloquear.
      </p>

      <BotonesEnReposo />
      <BotonesEnEstadosEspeciales />

      <p className={estilos.aviso}>
        Los botones bloqueados usan <code>aria-disabled</code>, no <code>disabled</code>.
        Con el atributo nativo el botón no recibe foco, así que quien navega con teclado o
        lector de pantalla nunca llega a él y nunca se entera del motivo. Pruébalo con el
        tabulador: el botón bloqueado se enfoca y anuncia por qué lo está.
      </p>
    </section>
  );
}

/** La sección del campo, con la nota sobre el contador. */
function SeccionDeCampo() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Campo de texto</h2>
      <p className={estilos.notaDeSeccion}>
        La etiqueta es obligatoria. El marcador de posición no la sustituye: desaparece al
        escribir, y quien vuelve al campo ya no sabe qué iba ahí.
      </p>

      <CamposDeTexto />

      <p className={estilos.aviso}>
        Escribe en el primer campo hasta pasar de 280 caracteres. El contador visible está
        oculto al lector de pantalla —anunciar los restantes en cada pulsación es hostil—
        y solo se anuncia cuando quedan veinte o menos, que es cuando el dato importa.
      </p>
    </section>
  );
}

const LOS_SIETE_ESTADOS: ReadonlyArray<{ nombre: string; descripcion: string }> = [
  { nombre: "Reposo", descripcion: "Lo que se ve sin tocar nada." },
  {
    nombre: "Hover",
    descripcion:
      "Solo bajo una consulta de hover. En táctil no existe y no puede ser el único indicio de nada.",
  },
  {
    nombre: "Foco visible",
    descripcion: "Anillo holográfico. El contorno nunca se elimina, se sustituye.",
  },
  {
    nombre: "Activo",
    descripcion: "El instante de la pulsación, que es lo que da sensación de respuesta.",
  },
  {
    nombre: "Bloqueado",
    descripcion: "Con el motivo comunicado, no solo atenuado.",
  },
  {
    nombre: "Cargando",
    descripcion:
      "Con el control bloqueado para evitar el doble envío, que en nuestro caso serían cobros repetidos.",
  },
  { nombre: "Error", descripcion: "Qué ha fallado y qué hacer. Nunca una disculpa." },
];

const LA_TORRE = buscarCartaPorId("la-torre");
const EL_ERMITANO = buscarCartaPorId("el-ermitano");

/** Una carta que se voltea al pulsarla, para ver la coreografía. */
function CartaQueSeVoltea() {
  const [estaRevelada, fijarRevelada] = useState(false);

  return (
    <Carta
      carta={estaRevelada ? EL_ERMITANO : undefined}
      estaRevelada={estaRevelada}
      alPulsar={() => fijarRevelada(!estaRevelada)}
      etiquetaDeAccion={estaRevelada ? "Volver a poner boca abajo" : "Voltear la carta"}
    />
  );
}

/** La carta en sus distintos papeles. */
function SeccionDeCarta() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Carta</h2>
      <p className={estilos.notaDeSeccion}>
        La identidad de la carta no llega al componente hasta que se revela. En un
        producto de tarot no es un detalle: si el nombre está en el DOM antes de voltear,
        cualquiera lo ve con las herramientas del navegador y la ceremonia entera es
        teatro.
      </p>

      <div className={estilos.rejillaDeCartas}>
        <figure className={estilos.muestraDeCarta}>
          <CartaQueSeVoltea />
          <figcaption className={estilos.pieDeCarta}>Púlsala para voltearla</figcaption>
        </figure>

        <figure className={estilos.muestraDeCarta}>
          <Carta
            estaRevelada={false}
            alPulsar={() => undefined}
            etiquetaDeAccion="Elegir"
          />
          <figcaption className={estilos.pieDeCarta}>Boca abajo, elegible</figcaption>
        </figure>

        <figure className={estilos.muestraDeCarta}>
          <Carta
            estaRevelada={false}
            alPulsar={() => undefined}
            etiquetaDeAccion="Elegir"
            estaElegida
          />
          <figcaption className={estilos.pieDeCarta}>Ya elegida</figcaption>
        </figure>

        <figure className={estilos.muestraDeCarta}>
          <Carta carta={LA_TORRE} estaRevelada />
          <figcaption className={estilos.pieDeCarta}>Revelada, derecha</figcaption>
        </figure>

        <figure className={estilos.muestraDeCarta}>
          <Carta carta={LA_TORRE} estaRevelada orientacion="invertida" />
          <figcaption className={estilos.pieDeCarta}>Revelada, invertida</figcaption>
        </figure>

        <figure className={estilos.muestraDeCarta}>
          <Carta
            estaRevelada={false}
            alPulsar={() => undefined}
            motivoDeBloqueo="Ya has elegido las cinco cartas."
          />
          <figcaption className={estilos.pieDeCarta}>Bloqueada</figcaption>
        </figure>
      </div>

      <p className={estilos.aviso}>
        La carta invertida se gira media vuelta, como se lee sobre la mesa, pero el giro
        no es la única señal: lleva además su rótulo. La guía prohíbe que un estado
        dependa de un solo indicio, y quien no conoce la lámina no distingue su
        orientación. La cara funciona sin ilustración —con el nombre y el número ya es
        legible—, así que se puede jugar una lectura completa antes de tener una sola
        dibujada.
      </p>
    </section>
  );
}

/*
 * Las cinco posiciones de la tirada general, tal y como las tiene Tarotoo en su
 * lectura gratuita. Aquí sirven de muestra; las definiciones reales viven en el
 * motor.
 */
const POSICIONES_DE_MUESTRA = [
  "Dónde estás ahora",
  "Qué puede frenarte",
  "Tus fortalezas",
  "Debilidades que atender",
  "Tu potencial",
];

/** Una tirada a medio cubrir, que es como se ve durante la selección. */
function SeccionDePosiciones() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Posición de tirada</h2>
      <p className={estilos.notaDeSeccion}>
        El nombre va siempre visible, nunca escondido tras un icono. La posición es lo que
        modifica el significado de la carta, así que leer una carta sin saber dónde cayó
        es leer otra cosa.
      </p>

      <div className={estilos.rejillaDePosiciones}>
        {POSICIONES_DE_MUESTRA.map((nombre, indice) => (
          <PosicionDeTirada
            key={nombre}
            nombre={nombre}
            ordinal={indice + 1}
            totalDePosiciones={POSICIONES_DE_MUESTRA.length}
          >
            {indice === 0 ? <Carta carta={LA_TORRE} estaRevelada /> : undefined}
          </PosicionDeTirada>
        ))}
      </div>

      <p className={estilos.aviso}>
        El hueco vacío late muy despacio, y eso no es adorno: es lo que indica cuál toca
        cubrir sin escribirlo en ninguna parte. Con movimiento reducido el latido
        desaparece y el hueco pendiente se distingue por contraste sostenido — la
        información se conserva, el parpadeo no.
      </p>
    </section>
  );
}

/** Las tres variantes de panel. */
function SeccionDePanel() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Panel</h2>
      <p className={estilos.notaDeSeccion}>
        No todo es un panel. Borde, relleno, radio y sombra dicen «esto es un objeto
        aparte», y gastarlos en cada bloque aplana la jerarquía en vez de construirla.
      </p>

      <div className={estilos.rejillaDePaneles}>
        <Panel titulo="Plano">
          Para agrupar sin separar del todo. Es el que más se usa.
        </Panel>

        <Panel variante="elevado" titulo="Elevado">
          Para lo que flota sobre el resto: el muro de pago, un diálogo.
        </Panel>

        <Panel variante="enmarcado" titulo="Enmarcado">
          Con filigrana en las cuatro esquinas. Para lo que merece ceremonia: el
          significado de una carta revelada.
        </Panel>
      </div>
    </section>
  );
}

/** Recordatorio de los siete estados obligatorios. */
function SeccionDeEstados() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Los siete estados</h2>
      <ol className={estilos.listaDeEstados}>
        {LOS_SIETE_ESTADOS.map((estado) => (
          <li key={estado.nombre}>
            <strong>{estado.nombre}.</strong> {estado.descripcion}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Catálogo completo de componentes base. */
/**
 * El panel de significado, en el caso peor de cada composición.
 *
 * No es una muestra bonita: es la medición. El usuario nunca lee una capa
 * suelta, lee la composición, y el caso que hay que validar son las 130
 * palabras de matiz más base. Si algo desborda, lo que cambia es el límite de
 * `reglas.ts` —ahora, que cuesta una línea— y no el corpus ya escrito.
 */
function SeccionDeSignificado() {
  return (
    <section className={estilos.seccion}>
      <h2 className={estilos.tituloDeSeccion}>Panel de significado</h2>
      <p className={estilos.notaDeSeccion}>
        Las tres composiciones que existen, con los textos en el extremo exacto de{" "}
        <code>src/corpus/reglas.ts</code>. Mídelas a 320, 390 y 1440: a ancho de
        escritorio tiene que entrar el panel entero; en móvil basta con que entren la
        carta y la respuesta a la posición.
      </p>

      <div className={estilos.grupo}>
        <h3 className={estilos.tituloDeGrupo}>
          Matiz más base · el caso peor, 130 palabras
        </h3>
        <div className={estilos.parejaDeLectura}>
          <Carta carta={LA_TORRE} orientacion="invertida" estaRevelada />
          <PanelDeSignificado
            encabezado="Qué puede frenarte"
            matiz={MATIZ_MAXIMO.texto}
            base={BASE_MAXIMO.texto}
          />
        </div>
      </div>

      <div className={estilos.grupo}>
        <h3 className={estilos.tituloDeGrupo}>Matiz más base · el caso corto, 63</h3>
        <div className={estilos.parejaDeLectura}>
          <Carta carta={LA_TORRE} estaRevelada />
          <PanelDeSignificado
            encabezado="Qué puede frenarte"
            matiz={MATIZ_MINIMO.texto}
            base={BASE_MINIMO.texto}
          />
        </div>
      </div>

      <div className={estilos.grupo}>
        <h3 className={estilos.tituloDeGrupo}>Sólo base · la tirada de una carta</h3>
        <div className={estilos.parejaDeLectura}>
          <Carta carta={LA_TORRE} estaRevelada />
          <PanelDeSignificado encabezado="La Torre" base={BASE_MAXIMO.texto} />
        </div>
      </div>

      <div className={estilos.grupo}>
        <h3 className={estilos.tituloDeGrupo}>Veredicto más base · la tirada de sí/no</h3>
        <div className={estilos.parejaDeLectura}>
          <Carta carta={LA_TORRE} estaRevelada />
          <PanelDeSignificado
            encabezado="Tu pregunta"
            base={BASE_MAXIMO.texto}
            valencia={{ veredicto: "no", etiqueta: "No", motivo: VALENCIA_MAXIMA.texto }}
          />
        </div>
      </div>
    </section>
  );
}

export function CatalogoDeComponentes() {
  return (
    <main className={estilos.pagina}>
      <div className={estilos.contenedor}>
        <header className={estilos.cabecera}>
          <h1 className={estilos.titulo}>Componentes base</h1>
          <p className={estilos.entradilla}>
            Cada componente interactivo lleva los siete estados de{" "}
            <code>docs/guia-de-diseno.md</code> §6.1. Tres de ellos —hover, foco y activo—
            no se pueden enseñar en una captura: pasa el puntero y recorre la página con
            el tabulador.
          </p>
        </header>

        <SeccionDeBoton />
        <SeccionDeCampo />
        <SeccionDeCarta />
        <SeccionDePosiciones />
        <SeccionDePanel />
        <SeccionDeSignificado />
        <SeccionDeEstados />
      </div>
    </main>
  );
}
