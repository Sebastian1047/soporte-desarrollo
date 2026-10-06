# Soporte Desarrollo

Versión del sistema de soporte convertida a **HTML, CSS y JavaScript puro** para trabajar directamente desde GitHub y publicarla con GitHub Pages.

## Tecnologías

- HTML5
- CSS3
- JavaScript
- localStorage
- GitHub Pages

## Archivos principales

- `index.html`
- `styles.css`
- `app.js`

## Funcionalidades actuales

- Panel principal
- Métricas de solicitudes
- Creación de tickets
- Categorías
- Prioridades
- Tickets confidenciales
- Campos dinámicos según categoría
- Listado de tickets
- Filtros por urgencia
- Búsqueda por ID o asunto
- Detalle de cada solicitud
- Datos de prueba
- Persistencia local con `localStorage`
- Vista de desarrollador

## Ejecutar

Puedes abrir directamente `index.html`.

## Publicar con GitHub Pages

1. Ve a **Settings > Pages**.
2. En **Build and deployment**, selecciona **Deploy from a branch**.
3. Selecciona:
   - Branch: `main`
   - Folder: `/ (root)`
4. Guarda.

La URL será similar a:

`https://sebastian1047.github.io/soporte-desarrollo/`

## Nota

Por ahora los tickets se guardan únicamente en el navegador mediante `localStorage`. Para convertirlo en un sistema multiusuario real, posteriormente se puede conectar a una API y una base de datos remota.