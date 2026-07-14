# CX Importations

Base inicial con Astro en modo servidor y MongoDB local para desarrollo.

## Requisitos

- Node.js 22.12 o superior.
- Docker y Docker Compose para levantar MongoDB local.

## Configuracion

1. Crea o ajusta el archivo `.env` en la raiz del proyecto.
2. Usa estos valores base si quieres correr todo en local:

```env
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=cx-importations
PUBLIC_SITE_URL=http://localhost:4321
PORT=4321
JWT_SECRET=change-this-in-production
JWT_EXPIRES_IN=7d
```

## Arranque local

1. Levanta MongoDB con `npm run db:up`.
2. Inicia la app con `npm run dev`.

Si necesitas ejecutar el servidor SSR compilado despues de un build, usa `npm run server:prod`.

## Validación

- `GET /api/health` devuelve el estado de la conexión a MongoDB.
- La pagina principal muestra un resumen visual del estado local.
- `npm run build` compila el proyecto para SSR.
- `npm run server:prod` levanta el servidor sobre el build generado en `dist/`.

## Flujo de cambios

Cuando hagas cambios en el codigo:

1. Ejecuta `npm run dev` mientras desarrollas.
2. Cuando termines una tanda de cambios, corre `npm run build` para validar que compile.
3. Si quieres probar el resultado final, inicia `npm run server:prod` despues del build.

## Scripts

| Command           | Action                                     |
| :---------------- | :----------------------------------------- |
| `npm run dev`     | Dev server local                           |
| `npm run build`   | Build SSR para despliegue                  |
| `npm run preview` | Vista previa del build                     |
| `npm run check`   | Verificación de tipos y configuración Astro |
| `npm run db:up`   | Levanta MongoDB local con Docker Compose   |
| `npm run db:down` | Detiene MongoDB local                      |
