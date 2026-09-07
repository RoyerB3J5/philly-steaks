import { ghlFetch, GHL_CONFIG, GHLApiError } from "./client";
import { mapPostListItemToCard, mapPostDetailToDTO } from "./mapper";
import type {
  BlogCardDTO,
  BlogPostDetailDTO,
  GHLPostListResponseRaw,
  GHLPostDetailResponseRaw,
  PaginatedResult,
} from "./types";

export const POSTS_PAGE_SIZE = 9;

export async function getPostsPage(
  page: number = 1,
  limit: number = POSTS_PAGE_SIZE,
  locale: string = "en"
): Promise<PaginatedResult<BlogCardDTO>> {
  if (!GHL_CONFIG.token || !GHL_CONFIG.blogId) {
    console.warn(
      "[GHL blog-services] GHL_API_TOKEN or GHL_BLOG_ID is not configured."
    );
    return {
      items: [],
      total: 0,
      page,
      pageSize: limit,
      totalPages: 1,
    };
  }

  const offset = Math.max(0, (page - 1) * limit);

  try {
    const raw = await ghlFetch<GHLPostListResponseRaw>("/blogs/posts/all", {
      locationId: GHL_CONFIG.locationId,
      blogId: GHL_CONFIG.blogId,
      limit,
      offset,
      status: "PUBLISHED",
    });

    const items = (raw.blogs || []).map((post) =>
      mapPostListItemToCard(post, locale)
    );
    const total = raw.count ?? items.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages,
    };
  } catch (error) {
    console.error("[GHL blog-services] Error in getPostsPage:", error);
    return {
      items: [],
      total: 0,
      page,
      pageSize: limit,
      totalPages: 1,
    };
  }
}

export async function getAllPosts(locale: string = "en"): Promise<BlogCardDTO[]> {
  try {
    const firstPage = await getPostsPage(1, POSTS_PAGE_SIZE, locale);
    const posts: BlogCardDTO[] = [...firstPage.items];

    if (firstPage.totalPages > 1) {
      const remainingPages = Array.from(
        { length: firstPage.totalPages - 1 },
        (_, i) => i + 2
      );

      const remainingResults = await Promise.all(
        remainingPages.map((p) => getPostsPage(p, POSTS_PAGE_SIZE, locale))
      );

      for (const res of remainingResults) {
        posts.push(...res.items);
      }
    }

    return posts;
  } catch (error) {
    console.error("[GHL blog-services] Error in getAllPosts:", error);
    return [];
  }
}

export async function getPostById(
  postId: string,
  locale: string = "en"
): Promise<BlogPostDetailDTO | null> {
  if (!postId) return null;

  if (!GHL_CONFIG.token) {
    console.warn("[GHL blog-services] GHL_API_TOKEN is not configured.");
    return null;
  }

  try {
    const raw = await ghlFetch<GHLPostDetailResponseRaw>(
      `/blogs/posts/${encodeURIComponent(postId)}`,
      {
        locationId: GHL_CONFIG.locationId,
      }
    );

    if (!raw?.blogPost) {
      return null;
    }

    return mapPostDetailToDTO(raw.blogPost, locale);
  } catch (error) {
    if (error instanceof GHLApiError && error.status === 404) {
      return null;
    }
    console.error(
      `[GHL blog-services] Error in getPostById (${postId}):`,
      error
    );
    return null;
  }
}
