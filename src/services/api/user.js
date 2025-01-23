// utils
import * as methods from '../../utils/methods';

import { GET, POST, PUT, DELETE } from '../request';


export async function loginFunc(payload) {
  return POST('/auth/login', payload);
}

export async function registerFunc(payload) {
  return POST('/auth/register', payload);
}

export async function getAllUsers(payload) {
  const params = methods.convertQueryString(payload);
  return GET(`/users?${params}`);
}
