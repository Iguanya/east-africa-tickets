function getDefaultApiBaseUrl() {
  if (typeof window === "undefined") {
    // Fallback for non-browser contexts
    return "http://localhost:4000/api";
  }

  const { protocol, hostname } = window.location;
  // Assume API is on the same host/IP, port 4000
  const apiPort = 4000;
  return `${protocol}//${hostname}:${apiPort}/api`;
}

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || getDefaultApiBaseUrl();
const AUTH_STORAGE_KEY = "ea_auth_session";

export interface StoredAuth<TUser = unknown> {
  token: string;
  user: TUser;
}

export function getStoredAuth<TUser = unknown>(): StoredAuth<TUser> | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth<TUser>;
  } catch {
    return null;
  }
}

export function setStoredAuth(value: StoredAuth | null) {
  if (typeof window === "undefined") return;
  if (!value) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
}

type FetchOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...rest } = options;
  const stored = skipAuth ? null : getStoredAuth();

  const headers = new Headers(rest.headers);
  const hasBody = rest.body !== undefined && !(rest.body instanceof FormData);

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (stored?.token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${stored.token}`);
  }

  const url = `${API_BASE_URL}${path}`;
  // Basic client-side logging to debug API calls
  console.log("[apiFetch] Request:", { url, method: rest.method || "GET", skipAuth });

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
  });

  if (!response.ok) {
    const errorPayload = await safeJson(response);
    console.error("[apiFetch] Error response:", {
      url,
      status: response.status,
      payload: errorPayload,
    });
    throw new Error(errorPayload?.message || "Something went wrong");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await safeJson(response)) as T;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

