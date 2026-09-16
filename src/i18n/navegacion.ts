import { createNavigation } from "next-intl/navigation";
import { rutas } from "./rutas";

/**
 * Utilidades de navegación conscientes del idioma.
 *
 * Se importan estas y no las de `next/link` o `next/navigation`: estas conocen
 * el mapa de slugs traducidos y construyen la URL correcta para cada idioma.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(rutas);
