import { useAuth } from '../context/AuthContext';
import { api } from '../config/api';

const BASE_URL = '/users';

function onlyDigits(value = '') {
  return value.replace(/\D/g, '');
}

export const changePassword = async (data) => {
  const response = await api.patch(`${BASE_URL}/senha`, data);
  return response.data;
};

export const getProfile = async () => {
  const { user } = useAuth();
  const { data } = await api.get(`${BASE_URL}/${user.id}`);
  return data;
};

export const updateProfile = async ({ name, email, phone, birthDate }) => {
  const { data } = await api.put(BASE_URL, {
    name: name.trim(),
    email: email.trim(),
    phone: onlyDigits(phone),
    birthDate, // enviar em ISO (YYYY-MM-DD) se o backend exigir — ver observação abaixo
  });
  return data;
};
