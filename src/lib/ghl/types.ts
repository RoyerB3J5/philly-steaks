// src/lib/ghl/types.ts
// Tipos "raw" tal cual los devuelve GoHighLevel, y los DTO limpios que
// consume el frontend. Nunca uses los tipos Raw fuera de blog-services.ts / mapper.ts.

// ---------- RAW (tal cual responde GHL) ----------

export interface GHLPostListItemRaw {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageAltText?: string;
  status: string;
  urlSlug: string;
  publishedAt: string | null;
  updatedAt: string;
  updatedBy?: string;
}

export interface GHLPostListResponseRaw {
  blogs: GHLPostListItemRaw[];
  count: number; // total, para paginación
}

export interface GHLPostDetailRaw {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  imageAltText?: string;
  status: string;
  rawHTML: string;
  publishedAt: string | null;
  updatedAt: string;
  readTimeInMinutes: number;
}

export interface GHLPostDetailResponseRaw {
  blogPost: GHLPostDetailRaw;
}

// ---------- DTO (lo que recibe el frontend) ----------
// Forma consumida por las tarjetas del blog.

export interface BlogCardDTO {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string; // formateada, no ISO
}

export interface BlogPostDetailDTO {
  id: string;
  image: string;
  description: string;
  date: string;
  dateTime: string;
  author: string;
  title: string;
  content: string | TrustedHTML; // HTML completo
  readTimeInMinutes: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
