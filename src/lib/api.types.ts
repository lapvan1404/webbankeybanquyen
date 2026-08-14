export type ApiResponseEnvelope<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      error: string;
      message?: string;
    };

export type ApiRequestOptions = {
  timeout?: number;
  retries?: number;
  credentials?: RequestCredentials;
  headers?: HeadersInit;
  method?: RequestInit["method"];
  body?: unknown;
};
