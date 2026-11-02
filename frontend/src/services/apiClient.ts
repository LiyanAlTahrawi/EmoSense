import { env } from '../utils/env';

export type ApiErrorCode =
'unauthorized' |
'forbidden' |
'not_found' |
'network' |
'timeout' |
'too_large' |
'unsupported' |
'validation' |
'server' |
'not_configured' |
'not_implemented';

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  endpoint?: string;

  constructor(code: ApiErrorCode, message: string, status = 0, endpoint?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.endpoint = endpoint;
  }
}

/** Used for UI that is designed but awaits a backend route. Never fakes success. */
export function notImplemented(feature: string, contract: string): ApiError {
  return new ApiError('not_implemented', `${feature} isn't supported by the EmoSense API yet.`, 0, contract);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
}

interface ClientUploadOptions {
  onProgress?: (fraction: number) => void;
  timeoutMs?: number;
}

export interface ApiClient {
  request<T>(path: string, options?: RequestOptions): Promise<T>;
  upload<T>(path: string, form: FormData, options?: ClientUploadOptions): Promise<T>;
}

export function createApiClient(
getToken: () => Promise<string | null>,
onUnauthorized: () => void)
: ApiClient {
  const base = env.apiBaseUrl;

  function ensureConfigured(path: string) {
    if (!base) {
      throw new ApiError(
        'not_configured',
        'The EmoSense API address is not configured. Set VITE_EMOSENSE_API_URL to connect.',
        0,
        path
      );
    }
  }

  async function authorization(path: string): Promise<string> {
    const token = await getToken();
    if (!token) {
      onUnauthorized();
      throw new ApiError('unauthorized', 'Your session has ended. Please sign in again.', 401, path);
    }
    return `Bearer ${token}`;
  }

  async function request<T>(path: string, { method = 'GET', body, timeoutMs = 30000 }: RequestOptions = {}) {
    ensureConfigured(path);
    const auth = await authorization(path);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(`${base}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: auth,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new ApiError('timeout', "The server didn't respond in time.", 0, path);
      }
      throw new ApiError('network', "We couldn't reach the EmoSense API.", 0, path);
    } finally {
      window.clearTimeout(timer);
    }
    const data = parseJson(await response.text());
    if (!response.ok) throw toApiError(response.status, data, path, onUnauthorized);
    return data as T;
  }

  async function upload<T>(path: string, form: FormData, { onProgress, timeoutMs = 180000 }: ClientUploadOptions = {}) {
    ensureConfigured(path);
    const auth = await authorization(path);
    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${base}${path}`);
      xhr.setRequestHeader('Authorization', auth);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.timeout = timeoutMs;
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(event.loaded / event.total);
      };
      xhr.upload.onload = () => onProgress?.(1);
      xhr.onload = () => {
        const data = parseJson(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);else
        reject(toApiError(xhr.status, data, path, onUnauthorized));
      };
      xhr.onerror = () => reject(new ApiError('network', 'The upload was interrupted.', 0, path));
      xhr.ontimeout = () => reject(new ApiError('timeout', 'Processing took too long.', 0, path));
      xhr.send(form);
    });
  }

  return { request, upload };
}

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractDetail(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const detail = (data as {detail?: unknown;message?: unknown;}).detail ?? (data as {message?: unknown;}).message;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.
    map((d) => d && typeof d === 'object' && 'msg' in d ? String((d as {msg: unknown;}).msg) : '').
    filter(Boolean).
    join(' ');
  }
  return '';
}

function toApiError(status: number, data: unknown, path: string, onUnauthorized: () => void): ApiError {
  const detail = extractDetail(data);
  if (status === 401) {
    onUnauthorized();
    return new ApiError('unauthorized', detail || 'Your session has ended.', status, path);
  }
  if (status === 403) return new ApiError('forbidden', detail || "You don't have access to this.", status, path);
  if (status === 404) return new ApiError('not_found', detail || "We couldn't find that.", status, path);
  if (status === 413) return new ApiError('too_large', detail || 'The file is larger than 20 MB.', status, path);
  if (status === 415) return new ApiError('unsupported', detail || 'This file format is not supported.', status, path);
  if (status === 400 && /format|extension|unsupported|file type/i.test(detail)) {
    return new ApiError('unsupported', detail, status, path);
  }
  if (status === 400 || status === 422) return new ApiError('validation', detail || 'The request was invalid.', status, path);
  if (status === 408 || status === 504) return new ApiError('timeout', detail || 'The server timed out.', status, path);
  return new ApiError('server', detail || 'The server ran into a problem.', status, path);
}