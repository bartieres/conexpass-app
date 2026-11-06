import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/my-access';

export const listarAtivos = async () => {
  const response = await axiosPrivate.get(`${BASE_URL}/active`);
  return response.data;
};

export const listarPendentes = async () => {
  const response = await axiosPrivate.get(`${BASE_URL}/pending`);
  return response.data;
};

export const listarHistorico = async (params = {}) => {
  const response = await axiosPrivate.get(`${BASE_URL}/history`, { params });
  return response.data;
};
