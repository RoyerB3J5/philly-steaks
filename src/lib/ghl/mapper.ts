import type {
  GHLPostListItemRaw,
  GHLPostDetailRaw,
  BlogCardDTO,
  BlogPostDetailDTO,
} from "./types";

export const DEFAULT_IMAGE = "/images/blog/food1.webp";
export const DEFAULT_AUTHOR = "Orlando's Philly Steak";

export function formatDate(iso?: string, locale: string = "en"): string {
  if (!iso) return "";
  try {
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "";

    const intlLocale = locale === "es" ? "es-ES" : "en-US";
    return new Intl.DateTimeFormat(intlLocale, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export function mapPostListItemToCard(
  raw: GHLPostListItemRaw,
  locale: string = "en"
): BlogCardDTO {
  return {
    id: raw._id,
    title: raw.title || "",
    description: raw.description || "",
    image: raw.imageUrl || DEFAULT_IMAGE,
    date: formatDate(raw.publishedAt || raw.updatedAt, locale),
  };
}

export function mapPostDetailToDTO(
  raw: GHLPostDetailRaw,
  locale: string = "en"
): BlogPostDetailDTO {
  return {
    id: raw._id,
    title: raw.title || "",
    description: raw.description || "",
    image: raw.imageUrl || DEFAULT_IMAGE,
    date: formatDate(raw.publishedAt || raw.updatedAt, locale),
    author: raw.author || DEFAULT_AUTHOR,
    content: raw.rawHTML || "",
    readTimeInMinutes: raw.readTimeInMinutes,
  };
}
