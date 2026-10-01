// src/lib/ghl/mapper.ts
import type {
  GHLPostListItemRaw,
  GHLPostDetailRaw,
  BlogCardDTO,
  BlogPostDetailDTO,
} from "./types";

const FALLBACK_IMAGE = "/images/blog-placeholder.jpg";
const DEFAULT_AUTHOR = "PERLA ROSATI";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string | null): string {
  return iso ?? "";
}

/** Item del listado de GHL -> tarjeta que consume el frontend. */
export function mapPostListItemToCard(raw: GHLPostListItemRaw): BlogCardDTO {
  return {
    id: raw._id,
    title: raw.title,
    description: raw.description,
    image: raw.imageUrl ?? FALLBACK_IMAGE,
    date: formatDate(raw.publishedAt ?? raw.updatedAt),
  };
}

/** Detalle de un post de GHL -> DTO de página individual. */
export function mapPostDetailToDTO(raw: GHLPostDetailRaw): BlogPostDetailDTO {
  return {
    id: raw._id,
    title: raw.title,
    description: raw.description,
    image: raw.imageUrl ?? FALLBACK_IMAGE,
    date: formatDate(raw.publishedAt ?? raw.updatedAt),
    dateTime: formatDateTime(raw.publishedAt ?? raw.updatedAt),
    author: DEFAULT_AUTHOR,
    content: raw.rawHTML,
    readTimeInMinutes: raw.readTimeInMinutes,
  };
}
