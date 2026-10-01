// src/lib/ghl/client.ts
//
// Este archivo corre SOLO en el servidor: en Vercel, dentro de la función
// serverless que Astro genera para cada página/endpoint con SSR. Nunca se
// incluye en el bundle del navegador, así que el token nunca se expone.
//
// Se llama una vez por cada request real de un usuario (no en build time),
// que es justo lo que pediste: datos siempre frescos, sin rebuild.

const BASE_URL = import.meta.env.GHL_API_BASE_URL;
const API_VERSION = import.meta.env.GHL_API_VERSION;
const TOKEN = import.meta.env.GHL_API_TOKEN;

export class GHLApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "GHLApiError";
  }
}

interface FetchOptions {
  params?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, params?: FetchOptions["params"]): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Fetcher tipado hacia la API de GoHighLevel. Único lugar con el token. */
export async function ghlFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.params);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Version: API_VERSION,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new GHLApiError(res.status, errorText);
  }

  return (await res.json()) as T;
}
