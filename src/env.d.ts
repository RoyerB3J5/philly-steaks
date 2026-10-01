/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GHL_API_BASE_URL: string;
  readonly GHL_API_VERSION: string;
  readonly GHL_API_TOKEN: string;
  readonly GHL_LOCATION_ID: string;
  readonly GHL_BLOG_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
