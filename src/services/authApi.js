import { apiFetch, handleResponse } from './apiClient';

export const login = async ({ username, password }) => {
  const response = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
    }),
  }, { auth: false });

  const payload = await handleResponse(response);
  return payload?.data ?? {};
};

export default {
  login,
};
