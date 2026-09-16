import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Cormorant_Garamond, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { IDIOMAS, type Idioma } from "@/i18n/rutas";
import "@/estilos/global.css";

/**
 * Serif renacentista de alto contraste: la voz de la sibila antigua.
 * `latin-ext` es obligatorio, no opcional: cubre los diacríticos del portugués.
 */
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--fuente-cormorant",
  display: "swap",
});

/** Sans neutro y moderno: la voz de la máquina que proyecta a la sibila. */
const inter = Inter_Tight({
  subsets: ["latin", "latin-ext"],
  variable: "--fuente-inter",
  display: "swap",
});

/** Monoespaciada para datos, versalitas y el efecto de decodificación. */
const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--fuente-mono",
  display: "swap",
});

type PropiedadesDeLayout = {
  children: React.ReactNode;
  params: Promise<{ idioma: string }>;
};

/**
 * Prerrenderiza una variante estática por idioma activo.
 *
 * @returns Un parámetro de ruta por cada idioma soportado.
 */
export function generateStaticParams(): Array<{ idioma: Idioma }> {
  return IDIOMAS.map((idioma) => ({ idioma }));
}

/**
 * Construye los metadatos de la página, incluidos los enlaces alternativos por
 * idioma que los buscadores necesitan para no tratar las traducciones como
 * contenido duplicado.
 *
 * @param params Parámetros de ruta, con el idioma solicitado.
 * @returns Metadatos localizados.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ idioma: string }>;
}): Promise<Metadata> {
  const { idioma } = await params;
  const t = await getTranslations({ locale: idioma, namespace: "metadatos" });

  const alternativas: Record<string, string> = {};
  for (const disponible of IDIOMAS) {
    alternativas[disponible] = `/${disponible}`;
  }

  return {
    title: t("titulo"),
    description: t("descripcion"),
    alternates: {
      canonical: `/${idioma}`,
      languages: alternativas,
    },
  };
}

/**
 * Layout raíz de la aplicación.
 *
 * Vive dentro del segmento `[idioma]` porque todas las rutas del producto son
 * localizadas: no existe ninguna página fuera de un idioma.
 */
export default async function LayoutRaiz({ children, params }: PropiedadesDeLayout) {
  const { idioma } = await params;

  if (!(IDIOMAS as readonly string[]).includes(idioma)) {
    notFound();
  }

  const mensajes = await getMessages({ locale: idioma });
  const clases = `${cormorant.variable} ${inter.variable} ${mono.variable}`;

  return (
    <html lang={idioma} className={clases} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={idioma} messages={mensajes}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
