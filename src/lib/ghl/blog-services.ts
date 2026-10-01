// src/lib/ghl/blog-services.ts
//
// Estas 3 funciones son las 3 queries que necesitas. En Vercel con SSR,
// cada una se ejecuta en el momento en que un usuario visita la página
// correspondiente (dentro de la función serverless) — no en build time.
import { ghlFetch, GHLApiError } from "./client";
import { mapPostListItemToCard, mapPostDetailToDTO } from "./mapper";
import type {
  GHLPostListResponseRaw,
  GHLPostDetailResponseRaw,
  BlogCardDTO,
  BlogPostDetailDTO,
  PaginatedResult,
} from "./types";

const LOCATION_ID = import.meta.env.GHL_LOCATION_ID;
const BLOG_ID = import.meta.env.GHL_BLOG_ID;

const POSTS_PAGE_SIZE = 9;

/**
 * Query 1: página de posts publicados. Se llama en cada visita a /blog.
 */
export async function getPostsPage(
  page: number = 1,
): Promise<PaginatedResult<BlogCardDTO>> {
  const safePage = Math.max(1, Math.floor(page));
  const data = await ghlFetch<GHLPostListResponseRaw>("/blogs/posts/all", {
    params: {
      locationId: LOCATION_ID,
      blogId: BLOG_ID,
      limit: POSTS_PAGE_SIZE,
      offset: (safePage - 1) * POSTS_PAGE_SIZE,
      status: "PUBLISHED",
    },
  });

  return {
    items: (data.blogs ?? []).map(mapPostListItemToCard),
    total: data.count ?? data.blogs?.length ?? 0,
    page: safePage,
    pageSize: POSTS_PAGE_SIZE,
    totalPages: Math.ceil(
      (data.count ?? data.blogs?.length ?? 0) / POSTS_PAGE_SIZE,
    ),
  };
}

/** Obtiene todos los posts publicados para la paginación del componente. */
export async function getAllPosts(): Promise<BlogCardDTO[]> {
  const firstPage = await getPostsPage(1);
  if (firstPage.totalPages <= 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      getPostsPage(index + 2),
    ),
  );

  return [firstPage.items, ...remainingPages.map((page) => page.items)].flat();
}

/**
 * Query 2: post individual por su _id. Se llama en cada visita a /blog/[id].
 * Devuelve null si no existe (404 manejado en la página).
 */
export async function getPostById(
  postId: string,
): Promise<BlogPostDetailDTO | null> {
  try {
    const data = await ghlFetch<GHLPostDetailResponseRaw>(
      `/blogs/posts/${encodeURIComponent(postId)}`,
      { params: { locationId: LOCATION_ID } },
    );
    if (!data.blogPost) return null;
    return mapPostDetailToDTO(data.blogPost);
  } catch (err) {
    if (err instanceof GHLApiError && err.status === 404) return null;
    throw err;
  }
}
