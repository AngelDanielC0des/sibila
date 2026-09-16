# Sibila

Plataforma de tarot interactivo con una oráculo holográfica. Las 78 cartas, con
inversiones, y una interpretación que atiende a la tirada entera.

Web primero, multiidioma desde la arquitectura. La astrología llega en la v2.

## Puesta en marcha

```bash
npm install
npm run dev
```

La aplicación queda en `http://localhost:3000/es`. Los idiomas activos son
`es`, `pt` y `en`.

## Comandos

| Comando             | Qué hace                                            |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                              |
| `npm run build`     | Compilación de producción                           |
| `npm run verificar` | **La puerta**: tipos + eslint + stylelint + pruebas |
| `npm run typecheck` | Solo comprobación de tipos                          |
| `npm run lint`      | Solo ESLint, con información de tipos               |
| `npm run lint:css`  | Solo Stylelint                                      |
| `npm test`          | Pruebas del motor de lectura                        |
| `npm run format`    | Formatea con Prettier                               |

Si `npm run verificar` no pasa, el trabajo no está terminado. El gancho de
pre-commit ejecuta las mismas comprobaciones sobre los ficheros en preparación.

## Estructura

```
src/
  app/[idioma]/       rutas localizadas · toda página vive dentro de un idioma
  i18n/               enrutado, catálogos y resolución de idioma
  estilos/            tokens de diseño y hoja global
  motor-de-lectura/   lógica de la lectura · agnóstica de presentación
  renderizadores/     escritorio en 3D y móvil plano · solo pintan
messages/             catálogos de interfaz por idioma
docs/
  plan-v1.md          plan de construcción
  investigacion/      auditoría de campo de la competencia
```

## Convenciones

El código se escribe **en español**: nombres de clases, métodos, variables y
comentarios. El detalle completo, con el glosario de dominio y las reglas de
estilo, está en [CLAUDE.md](./CLAUDE.md).

## Aviso

Sibila es una herramienta de entretenimiento y autoconocimiento para mayores de
18 años. No predice el futuro ni sustituye consejo médico, legal, financiero ni
psicológico.
