import { notFound } from "next/navigation";

/**
 * Captura cualquier ruta que no exista dentro de un idioma.
 *
 * Sin esto, `/es/lo-que-sea` no casa con ningún segmento y Next lo resuelve en
 * la raíz, donde no hay layout ni proveedor de idioma: el visitante recibe la
 * pantalla inglesa por defecto de Next aunque venga de la web en español.
 *
 * Con la ruta comodín sí casa, se monta dentro de `[idioma]`, y el `notFound()`
 * activa el `not-found.tsx` de ese segmento con su idioma, sus fuentes y sus
 * textos. El código de estado sigue siendo 404, que es lo que importa para los
 * buscadores.
 *
 * Una ruta real siempre gana a un comodín, así que esto no tapa nada.
 */
export default function RutaInexistente(): never {
  notFound();
}
