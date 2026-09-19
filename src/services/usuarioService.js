import { api } from '../config/api';

const BASE_URL = '/users';

export const findById = async () => {
  const { data } = await api.get(`${BASE_URL}/me`);
  return data;
};

export const changePassword = async (payload) => {
  const { data } = await api.patch(`${BASE_URL}/senha`, payload);
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put(`${BASE_URL}/me`, payload);
  return data;
};
