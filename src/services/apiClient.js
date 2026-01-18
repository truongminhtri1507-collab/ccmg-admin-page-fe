import { getToken } from './session';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:4000';

export const buildApiUrl = (path) => {
  const baseUrl = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

export const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let payload;

  if (contentType && contentType.includes('application/json')) {
    payload = await response.json();
  } else {
    const text = await response.text();
    payload = text ? { message: text } : {};
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'Yêu cầu thất bại');
    error.status = response.status;
    error.details = payload?.details;
    throw error;
  }

  return payload;
};

export const apiFetch = (path, options = {}, config = {}) => {
  const { auth = true } = config;
  const url = buildApiUrl(path);

  const headers = new Headers(options.headers || {});

  const hasJsonBody =
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type');

  if (hasJsonBody) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export default {
  buildApiUrl,
  handleResponse,
  apiFetch,
};
