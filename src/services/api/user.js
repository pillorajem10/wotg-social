// utils
import * as methods from '../../utils/methods';

import { GET, POST, PUT_FORM_DATA } from '../request';

export async function loginFunc(payload) {
  return POST('/auth/login', payload);
}

export async function registerFunc(payload) {
  return POST('/auth/register', payload);
}

export async function refreshTokenFunc(payload) {
  return POST('/auth/refresh-token', payload); // ✅ Now requires { refreshToken } in payload
}

export async function logoutUser(payload) {
  return POST('/auth/logout', payload); // ✅ Now requires { refreshToken } in payload
}

export async function getAllUsers(payload) {
  const params = methods.convertQueryString(payload);
  return GET(`/users?${params}`);
}

export async function updateUser(payload) {
  const formData = new FormData();

  for (const key in payload) {
    if (payload[key] !== null && payload[key] !== undefined) {
      formData.append(key, payload[key]);
    }
  }

  return PUT_FORM_DATA(`/users/${payload.id}`, { formData });
}

export async function getUser(payload) {
  return GET(`/users/${payload.id}`);
}

export async function forgotPasswordFunc(payload) {
  return POST('/auth/forgot-password', payload); // Expects { email }
}

export async function resetPasswordFunc(payload) {
  return POST(`/auth/reset-password/${payload.token}`, payload);
}
