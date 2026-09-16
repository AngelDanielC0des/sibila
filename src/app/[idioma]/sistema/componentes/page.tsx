import type { Metadata } from "next";
import { CatalogoDeComponentes } from "./catalogo";

/**
 * Catálogo de componentes base.
 *
 * Herramienta interna, sin indexar. La página es de servidor solo para aportar
 * los metadatos; el catálogo en sí es de cliente porque los estados de hover,
 * foco y activo hay que probarlos, no mirarlos.
 */

export const metadata: Metadata = {
  title: "Componentes · Sibila",
  robots: { index: false, follow: false },
};

export default function PaginaDeComponentes() {
  return <CatalogoDeComponentes />;
}
