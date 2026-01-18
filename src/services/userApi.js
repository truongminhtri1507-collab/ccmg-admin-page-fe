import { apiFetch, handleResponse } from './apiClient';

const normalizeUserPayload = (payload) => {
  const data = {};

  if (payload.userName !== undefined) {
    data.userName = payload.userName?.trim() ?? '';
  }

  if (payload.email !== undefined) {
    data.email = payload.email?.trim().toLowerCase() ?? '';
  }

  if (payload.phoneNumber !== undefined) {
    data.phoneNumber = payload.phoneNumber?.trim() ?? '';
  }

  if (payload.gender !== undefined) {
    data.gender = payload.gender ?? '';
  }

  if (payload.occupation !== undefined) {
    data.occupation = payload.occupation?.trim() ?? '';
  }

  if (payload.nickname !== undefined) {
    data.nickname = payload.nickname?.trim() ?? '';
  }

  if (payload.bod !== undefined) {
    data.bod = payload.bod || null;
  }

  if (payload.isActive !== undefined) {
    data.isActive = Boolean(payload.isActive);
  }

  return data;
};

export const listUsers = async ({ search } = {}) => {
  const params = new URLSearchParams();
  if (search) {
    params.set('search', search);
  }

  const query = params.toString();
  const response = await apiFetch(query ? `/api/users?${query}` : '/api/users');
  const payload = await handleResponse(response);
  return Array.isArray(payload?.data) ? payload.data : [];
};

export const getUser = async (uid) => {
  const response = await apiFetch(`/api/users/${uid}`);
  const payload = await handleResponse(response);
  return payload?.data ?? null;
};

export const updateUser = async (uid, payload) => {
  const body = normalizeUserPayload(payload);
  const response = await apiFetch(`/api/users/${uid}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });

  const data = await handleResponse(response);
  return data?.data ?? null;
};

export const deleteUser = async (uid) => {
  const response = await apiFetch(`/api/users/${uid}`, {
    method: 'DELETE',
  });

  return handleResponse(response);
};

export default {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
};
