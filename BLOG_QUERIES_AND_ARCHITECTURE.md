# Documentación Técnica: Arquitectura y Queries del Blog

Este documento detalla exhaustivamente la implementación del sistema de blogs en el proyecto **Perla Rosati**, incluyendo las capas de integración con API externa (**GoHighLevel / GHL**), funciones de consulta (queries), modelos de tipado (raw vs DTO), mapeo y transformación de datos, renderizado SSR en Astro y componentes interactivos en React.

---

## 1. Visión General de la Arquitectura

El blog está diseñado bajo una arquitectura híbrida con **Server-Side Rendering (SSR)** mediante el adaptador `@astrojs/vercel`:

```
┌───────────────────────────────────────────────────────────────┐
│                      GoHighLevel (GHL) API                    │
│    /blogs/posts/all  |  /blogs/posts/:id  |  /blogs/categories│
└───────────────────────────────┬───────────────────────────────┘
                                │ (Bearer Auth en Servidor / SSR)
                                ▼
┌───────────────────────────────────────────────────────────────┐
│              Capa de Servicios: src/lib/ghl/                  │
│  - client.ts: fetcher central con headers de API Version      │
│  - types.ts: contratos Raw vs DTOs consumidos por UI          │
│  - mapper.ts: normalización de fechas, fallback de imágenes   │
│  - blog-services.ts: funciones de query (getPostsPage, etc.)  │
└───────────────────────────────┬───────────────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│  Página Listado:              │       │  Página Detalle:              │
│  /src/pages/[lang]/blog/      │       │  /src/pages/[lang]/blog/[id]/ │
│  index.astro                  │       │  index.astro                  │
└───────────────┬───────────────┘       └───────────────┬───────────────┘
                │                                       │
                ▼                                       ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│  Componentes de Sección:      │       │  Renderizado de Contenido:    │
│  - BlogSection.tsx (React)    │       │  - set:html={post.content}    │
│  - GridBlogs.astro (Legacy)   │       │  - Metadatos dinámicos / SEO  │
└───────────────────────────────┘       └───────────────────────────────┘
```

### Principios clave:
1. **Seguridad de Token:** El token `GHL_API_TOKEN` se utiliza estrictamente en el entorno del servidor (SSR) mediante Astro serverless endpoints, previniendo su filtración al cliente.
2. **Desacoplamiento de Tipos (Raw vs DTO):** La interfaz gráfica no interactúa directamente con los objetos crudos de la API externa, sino con objetos DTO adaptados para la UI (`BlogCardDTO`, `BlogPostDetailDTO`, `CategoryDTO`).
3. **SSR Dinámico:** Ambas páginas declaran `export const prerender = false;`, asegurando contenido fresco sin necesidad de reconstruir la aplicación.

---

## 2. Variables de Entorno y Configuración del Cliente

Ubicación: `src/lib/ghl/client.ts`

### Variables requeridas (`import.meta.env`):
- `GHL_API_BASE_URL`: URL base del API de GoHighLevel (ej. `https://services.leadconnectorhq.com`).
- `GHL_API_VERSION`: Versión de API requerida por GHL (cabecera `Version`).
- `GHL_API_TOKEN`: Token Bearer de autenticación.
- `GHL_LOCATION_ID`: ID de la locación/subcuenta en GoHighLevel.
- `GHL_BLOG_ID`: ID del blog específico a consultar.

### Mecanismo de Petición HTTP (`ghlFetch`):
- **Clase de Error:** `GHLApiError` extiende de `Error`, capturando el status HTTP (`res.status`) y el cuerpo de error en formato texto.
- **Constructor de URL:** `buildUrl(path, params)` ensambla dinámicamente query params ignorando valores `undefined`.
- **Headers enviados:**
  - `Authorization: Bearer <TOKEN>`
  - `Version: <API_VERSION>`
  - `Accept: application/json`

---

## 3. Tipado de Datos (`types.ts`)

Ubicación: `src/lib/ghl/types.ts`

### 3.1. Tipos Raw (Estructura GoHighLevel)

| Interfaz | Propósito | Campos Clave |
| :--- | :--- | :--- |
| `GHLCategoryRaw` | Representación cruda de categoría en GHL | `_id: string`, `label: string`, `urlSlug: string` |
| `GHLPostListItemRaw` | Objeto post en la lista paginada | `_id`, `title`, `description`, `imageUrl?`, `categories: GHLCategoryRaw[]` (objetos resueltos), `publishedAt`, `updatedAt` |
| `GHLPostListResponseRaw` | Respuesta de `/blogs/posts/all` | `blogs: GHLPostListItemRaw[]`, `count: number` |
| `GHLPostDetailRaw` | Objeto post devuelto en detalle `/blogs/posts/:id` | `_id`, `title`, `description`, `rawHTML: string`, `categories: string[]` (**solo IDs**, no objetos), `publishedAt`, `readTimeInMinutes` |
| `GHLPostDetailResponseRaw` | Respuesta de `/blogs/posts/:id` | `blogPost: GHLPostDetailRaw` |
| `GHLCategoriesResponseRaw` | Respuesta de `/blogs/categories` | `categories: GHLCategoryRaw[]`, `count: number` |

> **Diferencia crítica en `categories`:** En el listado (`GHLPostListItemRaw`), `categories` es un array de objetos completos `GHLCategoryRaw[]`. En cambio, en la vista detallada (`GHLPostDetailRaw`), GoHighLevel devuelve un array de strings `string[]` únicamente con los IDs.

### 3.2. Tipos DTO (Consumidos por Frontend)

| Interfaz | Propósito | Estructura |
| :--- | :--- | :--- |
| `BlogCardDTO` | Tarjetas de post en listado | `{ id, title, description, image, date, idCategory }` |
| `BlogPostDetailDTO` | Contenido de página individual | `{ id, image, date, autor, title, content }` |
| `CategoryDTO` | Filtro de categorías | `{ id, label }` |
| `PaginatedResult<T>` | Estructura de paginación devuelta por queries | `{ items: T[], total, page, pageSize, totalPages }` |

---

## 4. Transformación y Mapeo (`mapper.ts`)

Ubicación: `src/lib/ghl/mapper.ts`

Se encarga de abstraer la estructura externa y garantizar fallbacks visuales seguros:

1. **Fallback de Imagen:** `/images/blog-placeholder.jpg` cuando `imageUrl` es indefinido.
2. **Autor Predeterminado:** `"Enyermy"` (recomendado actualizar a Perla Rosati).
3. **Categoría Global:** `ALL_CATEGORY = { id: "all", label: "All" }`.
4. **`formatDate(iso)`:** Convierte timestamp ISO en formato legible `"es-ES"` (ejemplo: `"18 de agosto de 2026"`).
5. **`toTitleCase(slug)`:** Transforma slugs como `"mind-body-spirit"` a `"Mind Body Spirit"`.
6. **`mapPostListItemToCard(raw)`:**
   - Extrae el ID de la primera categoría (`raw.categories?.[0]?._id ?? ""`) para usarlo en el filtro client-side.
   - Formatea la fecha priorizando `publishedAt` con fallback a `updatedAt`.
7. **`mapPostDetailToDTO(raw)`:**
   - Asigna `raw.rawHTML` directamente a `content`.

---

## 5. Funciones de Consulta / Queries (`blog-services.ts`)

Ubicación: `src/lib/ghl/blog-services.ts`

### Query 1: `getPostsPage(page: number = 1): Promise<PaginatedResult<BlogCardDTO>>`
- **Endpoint GHL:** `GET /blogs/posts/all`
- **Parámetros enviados:**
  - `locationId`: `LOCATION_ID`
  - `blogId`: `BLOG_ID`
  - `limit`: `9` (`POSTS_PAGE_SIZE`)
  - `offset`: `(page - 1) * 9`
  - `status`: `"PUBLISHED"`
- **Retorno:** Objeto `PaginatedResult<BlogCardDTO>` con los items mapeados, conteo total y cálculo de `totalPages`.

### Query 2: `getPostById(postId: string): Promise<BlogPostDetailDTO | null>`
- **Endpoint GHL:** `GET /blogs/posts/${postId}`
- **Parámetros enviados:**
  - `locationId`: `LOCATION_ID`
- **Manejo de Errores:** Atrapa excepciones tipo `GHLApiError` retornando `null` para permitir que el controlador de Astro emita un 404 limpio.

### Query 3: `getCategories(): Promise<CategoryDTO[]>`
- **Endpoint GHL:** `GET /blogs/categories`
- **Parámetros enviados:**
  - `locationId`: `LOCATION_ID`
  - `limit`: `8`
  - `offset`: `0`
- **Retorno:** Array que antepone `{ id: "all", label: "All" }` al listado de categorías mapeadas con `toTitleCase`.

---

## 6. Página de Listado: `src/pages/[lang]/blog/index.astro`

Ubicación: `src/pages/[lang]/blog/index.astro`

### Modo de Renderizado
- `export const prerender = false;` (SSR Serverless en Vercel).
- Manejo de i18n (`es` y `en`) para etiquetas SEO y textos vacíos.

### Implementación Actual vs Modo Dinámico
Actualmente la página utiliza datos estáticos (`CATEGORIES` y `POSTS` mockeados) para pruebas de maquetación, pero cuenta con el bloque de integración listo para ser descomentado:

```typescript
// Integración en vivo con GHL (preparada en el archivo):
const [firstPage, categories] = await Promise.all([
  getPostsPage(1),
  getCategories(),
]);

let POSTS: BlogCardDTO[] = [...firstPage.items];
for (let p = 2; p <= firstPage.totalPages; p++) {
  const res = await getPostsPage(p);
  POSTS.push(...res.items);
}
let CATEGORIES = categories.map((c) => ({ id: c.id, title: c.label.toUpperCase() }));
```

### Integración de Componentes
- **`AnimatedTitle.astro`**: Renderiza el título de cabecera animado (`t.blog.title`).
- **`BlogSection.tsx`**: Componente isla de React cargado con directiva `client:load` para permitir filtrado y paginación reactiva en el cliente sin recargar la URL.
- **`Reviews.tsx`**: Sección inferior de testimonios.

---

## 7. Componente de Sección: `src/sections/BlogSection.tsx`

Ubicación: `src/sections/BlogSection.tsx`

Componente React que gestiona la interacción completa del blog en el cliente:

### Características Principales:
1. **Filtro por Categoría:**
   - Estado `activeCategory`: Por defecto toma `category[0].id` ("TODO" / "ALL").
   - Al pulsar una categoría, resetea a la página 1 (`setPage(1)`).
2. **Artículo Destacado (Featured Post):**
   - Regla de negocio: Selecciona `items[4] ?? items[0]`.
   - Condición de visualización: `showFeatured = !isFiltering && currentPage === 1`. Oculta el banner destacado si el usuario está filtrando por una categoría o si está en la página 2+.
3. **Paginación Interna:**
   - Basada en `perPage` (default 9).
   - Divide `filteredItems` mediante `.slice((currentPage - 1) * perPage, currentPage * perPage)`.
   - Botones "Anterior" / "Siguiente" e indicador de páginas (`currentPage / totalPages`).
4. **Animaciones con IntersectionObserver:**
   - Hook personalizado `useRevealAnimations`: Re-observa elementos con clases `.fade-up-a`, `.reveal-ltr`, `.reveal-tl-br` ante cambios en `activeCategory`, `currentPage` o `showFeatured`.
   - Incluye puerto nativo de `AnimatedTitle` con CSS `@keyframes blogFadeUpWord` para animar palabra por palabra dentro del entorno de React.

---

## 8. Página de Detalle Individual: `src/pages/[lang]/blog/[id]/index.astro`

Ubicación: `src/pages/[lang]/blog/[id]/index.astro`

### Ruta y Parámetros
- Ruta dinámica: `/[lang]/blog/[id]` donde `lang` es el idioma (`es` | `en`) y `id` es el identificador del post.
- `export const prerender = false;`.

### Lógica de Carga y Manejo 404
El archivo contiene comentada la integración lista para activar:

```typescript
const { id } = Astro.params;
const post = id ? await getPostById(id) : null;

if (!post) {
  return new Response(null, { status: 404 });
}
```

### Renderizado de Contenido
- **SEO & Head:** Utiliza `Layout.astro` configurando `title={post.title}`, `image={post.image}` y `canonicalPath={/blog/${post.id}}`.
- **Imagen Principal:** Contenedor con relación de aspecto responsiva (`aspect-343/460` en móviles y `aspect-1200/820` en desktop), `loading="eager"`, clase `object-cover`.
- **Metadatos:** Línea informativa con autor y fecha (`Posted by Perla ROSATI on {post.date}`).
- **Inyección de HTML:** Utiliza la directiva nativa de Astro:
  ```astro
  <p
    set:html={post.content}
    class="paragraph font-normal text-paragraph fade-left tracking-[-0.5px] fade-up-a"
  />
  ```
  Esto permite renderizar el HTML enriquecido (`rawHTML`) entregado por el editor GoHighLevel.

---

## 9. Componente Alternativo: `GridBlogs.astro` (Legacy / No-JS)

Ubicación: `src/sections/GridBlogs.astro`

Existe una implementación en Astro puro (`GridBlogs.astro`) que utiliza manipulación directa del DOM (`<script>` vanilla con atributos `data-category-filter` y eventos personalizados `window.dispatchEvent(new CustomEvent("blog:filter"))`). Sin embargo, fue reemplazada por `BlogSection.tsx` para ofrecer una mejor reactividad de estado y paginación en el frontend.

---

## 10. Resumen de Pasos para Activación en Producción

Para pasar de los datos mock a las consultas vivas en GoHighLevel:

1. **Variables de Entorno (`.env` / Vercel Environment Variables):**
   - Configurar `GHL_API_BASE_URL`, `GHL_API_VERSION`, `GHL_API_TOKEN`, `GHL_LOCATION_ID`, `GHL_BLOG_ID`.
2. **En `src/pages/[lang]/blog/index.astro`:**
   - Descomentar los imports de `getPostsPage` y `getCategories`.
   - Descomentar el bloque `try/catch` de llamada a `getPostsPage(1)` y `getCategories()`.
   - Comentar o remover los arrays mock estáticos `CATEGORIES` y `POSTS`.
3. **En `src/pages/[lang]/blog/[id]/index.astro`:**
   - Descomentar `const { id } = Astro.params;` y la consulta `await getPostById(id)`.
   - Descomentar el guard clause `if (!post) return new Response(null, { status: 404 });`.
   - Eliminar el objeto mock constante `post`.
4. **Verificación de Autor:**
   - En `src/lib/ghl/mapper.ts`, actualizar `DEFAULT_AUTHOR` de `"Enyermy"` a `"Perla Rosati"` para mantener consistencia con la marca.
