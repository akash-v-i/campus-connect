let currentToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentToken = token;
};

export const getAuthToken = () => currentToken;

const BASE_URL = 'http://localhost:8080/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

export async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  path: string,
  body?: any,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  
  if (currentToken) {
    headers.set('Authorization', `Bearer ${currentToken}`);
  }

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const responseText = await response.text();
  let json: ApiResponse<T>;
  
  try {
    json = JSON.parse(responseText);
  } catch (e) {
    if (response.status === 403) {
      const isDeleted = responseText.includes('deleted') || responseText.includes('DELETED');
      const isDeactivated = responseText.includes('deactivated') || responseText.includes('DEACTIVATED');
      
      throw new Error(
        isDeleted ? 'ACCOUNT_DELETED' : (isDeactivated ? 'ACCOUNT_DEACTIVATED' : 'ACCESS_DENIED')
      );
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  if (!response.ok || !json.success) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }

  return json.data;
}

export const api = {
  get: <T>(path: string, options?: RequestInit) => apiRequest<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: any, options?: RequestInit) => apiRequest<T>('POST', path, body, options),
  put: <T>(path: string, body?: any, options?: RequestInit) => apiRequest<T>('PUT', path, body, options),
  delete: <T>(path: string, options?: RequestInit) => apiRequest<T>('DELETE', path, undefined, options),
  patch: <T>(path: string, body?: any, options?: RequestInit) => apiRequest<T>('PATCH', path, body, options),
};
