# Soporte Desarrollo

Módulo de Gestión de Soporte construido con HTML, CSS y JavaScript puro.

## Funcionalidades

- Panel principal con indicadores.
- Creación de solicitudes.
- Categorías y prioridades.
- Campos dinámicos según categoría.
- Tickets confidenciales.
- Bandeja general.
- Mis solicitudes.
- Filtros por estado, prioridad y texto.
- Detalle completo de solicitud.
- Cambio de estado, prioridad y responsable.
- Comentarios.
- Historial de actividad.
- Archivos adjuntos a nivel demostrativo.
- Persistencia local con localStorage.
- Datos de prueba restaurables.

## Estructura

- `index.html`
- `styles.css`
- `app.js`

## Ejecución

Abra `index.html` directamente o publique el repositorio con GitHub Pages.

## GitHub Pages

En Settings > Pages:

- Source: Deploy from a branch
- Branch: main
- Folder: / (root)

La URL esperada es:

`https://sebastian1047.github.io/soporte-desarrollo/`

## Integración futura

El módulo está preparado para reemplazar localStorage por una API REST y recibir desde la aplicación principal el usuario autenticado, rol, sede y permisos.
