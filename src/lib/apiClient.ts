import env from "./env";
import type { ApiRequestOptions, ApiResponseEnvelope } from "./api.types";

const DEFAULT_TIMEOUT = 10000;
const DEFAULT_RETRIES = 1;

type RequestInterceptor = (
  input: RequestInfo,
  init: RequestInit,
) => Promise<[RequestInfo, RequestInit]> | [RequestInfo, RequestInit];
type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

const requestInterceptors: RequestInterceptor[] = [];
const responseInterceptors: ResponseInterceptor[] = [];

async function timeoutPromise<T>(promise: Promise<T>, ms: number) {
  const timeout = new Promise<never>((_, reject) => {
    const id = window.setTimeout(() => {
      clearTimeout(id);
      reject(new Error("Request timed out"));
    }, ms);
  });
  return Promise.race([promise, timeout]) as Promise<T>;
}

export class ApiError extends Error {
  status: number;
  response: unknown;

  constructor(message: string, status: number, response: unknown) {
    super(message);
    this.status = status;
    this.response = response;
  }
}

export function addRequestInterceptor(interceptor: RequestInterceptor) {
  requestInterceptors.push(interceptor);
}

export function addResponseInterceptor(interceptor: ResponseInterceptor) {
  responseInterceptors.push(interceptor);
}

async function applyRequestInterceptors(input: RequestInfo, init: RequestInit) {
  let nextInput = input;
  let nextInit = init;
  for (const interceptor of requestInterceptors) {
    [nextInput, nextInit] = await interceptor(nextInput, nextInit);
  }
  return [nextInput, nextInit] as const;
}

async function applyResponseInterceptors(response: Response) {
  let nextResponse = response;
  for (const interceptor of responseInterceptors) {
    nextResponse = await interceptor(nextResponse);
  }
  return nextResponse;
}

function buildUrl(path: string) {
  if (!path || path === "undefined" || path.includes("/undefined")) {
    return "";
  }

  if (path.startsWith("http")) return path;

  const isLocalDev =
    typeof window !== "undefined"
      ? window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      : import.meta.env.DEV;

  if (isLocalDev) {
    return path;
  }

  const base = env.apiBaseUrl.replace(/\/$/, "");
  if (path.startsWith(base)) return path;
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  let url = buildUrl(path);
  if (!url) {
    return null as unknown as T;
  }
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    credentials = "include",
    headers = {},
    method,
    body,
  } = options;

  const isAdminPath = path.includes("/api/admin");
  const token =
    typeof window !== "undefined"
      ? isAdminPath
        ? localStorage.getItem("admin_token") || localStorage.getItem("token") || localStorage.getItem("accessToken")
        : localStorage.getItem("token") || localStorage.getItem("accessToken")
      : null;

  const init: RequestInit = {
    method: method ?? (body != null ? "POST" : "GET"),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body != null) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  const [finalUrl, finalInit] = await applyRequestInterceptors(url, init);
  url = finalUrl.toString ? finalUrl.toString() : String(finalUrl);

  async function attempt(remainingRetries: number): Promise<T> {
    try {
      let response = await timeoutPromise(fetch(url, finalInit), timeout);
      response = await applyResponseInterceptors(response);
      const parsed = await parseResponseBody(response);

      if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
          if (isAdminPath) {
            localStorage.removeItem("admin_token");
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("accessToken");
          }
        }
        const parsedBody = parsed as Record<string, unknown> | null;
        const errorMessage =
          (parsedBody?.message as string | undefined) ??
          (parsedBody?.error as string | undefined) ??
          (response.statusText || `Lỗi ${response.status}`);
        throw new ApiError(errorMessage, response.status, parsed);
      }

      if (parsed && typeof parsed === "object" && "success" in parsed) {
        const envelope = parsed as ApiResponseEnvelope<T>;
        if (!envelope.success) {
          throw new ApiError(envelope.error ?? "Request failed", response.status, envelope);
        }
        return envelope.data as T;
      }

      return parsed as T;
    } catch (error) {
      if (remainingRetries > 0 && error instanceof Error && error.message !== "Request timed out") {
        return attempt(remainingRetries - 1);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error instanceof Error ? error.message : "Unknown error", 0, null);
    }
  }

  return attempt(retries);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  options: ApiRequestOptions = {},
): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    method: "POST",
    body,
  });
}
