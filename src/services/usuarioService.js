import { useAuth } from '../context/AuthContext';
import { api } from '../config/api';

const BASE_URL = '/users';

export const changePassword = async (payload) => {
  const { data } = await api.patch(`${BASE_URL}/senha`, payload);
  return data;
};

export const getProfile = async () => {
  const { user } = useAuth();
  const { data } = await api.get(`${BASE_URL}/${user.id}`);
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put(BASE_URL, payload);
  return data;
};
