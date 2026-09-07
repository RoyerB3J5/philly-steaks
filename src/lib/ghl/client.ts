export class GHLApiError extends Error {
  status: number;
  responseBody: string;

  constructor(message: string, status: number, responseBody: string) {
    super(message);
    this.name = "GHLApiError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const GHL_CONFIG = {
  get baseUrl(): string {
    return (
      import.meta.env.GHL_API_BASE_URL ||
      process.env.GHL_API_BASE_URL ||
      "https://services.leadconnectorhq.com"
    ).replace(/\/$/, "");
  },
  get apiVersion(): string {
    return (
      import.meta.env.GHL_API_VERSION ||
      process.env.GHL_API_VERSION ||
      "2021-07-28"
    );
  },
  get token(): string {
    return (
      import.meta.env.GHL_API_TOKEN ||
      process.env.GHL_API_TOKEN ||
      ""
    );
  },
  get locationId(): string {
    return (
      import.meta.env.GHL_LOCATION_ID ||
      process.env.GHL_LOCATION_ID ||
      ""
    );
  },
  get blogId(): string {
    return (
      import.meta.env.GHL_BLOG_ID ||
      process.env.GHL_BLOG_ID ||
      ""
    );
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${GHL_CONFIG.baseUrl}${cleanPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export async function ghlFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
  init?: RequestInit
): Promise<T> {
  const token = GHL_CONFIG.token;
  if (!token) {
    throw new GHLApiError(
      "GHL_API_TOKEN is not configured in environment variables",
      401,
      '{"error": "Missing GHL_API_TOKEN"}'
    );
  }

  const url = buildUrl(path, params);

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Version: GHL_CONFIG.apiVersion,
    Accept: "application/json",
    ...(init?.headers || {}),
  };

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new GHLApiError(
      `GHL API Error: ${response.status} ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  return (await response.json()) as T;
}
