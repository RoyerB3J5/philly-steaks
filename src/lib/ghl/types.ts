// Raw types from GoHighLevel API
export interface GHLCategoryRaw {
  _id: string;
  label: string;
  urlSlug: string;
}

export interface GHLPostListItemRaw {
  _id: string;
  title: string;
  description: string;
  imageUrl?: string;
  categories?: GHLCategoryRaw[];
  publishedAt?: string;
  updatedAt?: string;
}

export interface GHLPostListResponseRaw {
  blogs: GHLPostListItemRaw[];
  count: number;
}

export interface GHLPostDetailRaw {
  _id: string;
  title: string;
  description?: string;
  rawHTML: string;
  categories?: string[];
  imageUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  readTimeInMinutes?: number;
  author?: string;
}

export interface GHLPostDetailResponseRaw {
  blogPost: GHLPostDetailRaw;
}

// DTOs consumed by frontend UI
export interface BlogCardDTO {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
}

export interface BlogPostDetailDTO {
  id: string;
  title: string;
  description?: string;
  image: string;
  date: string;
  author: string;
  content: string;
  readTimeInMinutes?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
