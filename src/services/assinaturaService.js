import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/subscriptions';

export const getMeuPlano = async () => {
  const response = await axiosPrivate.get(`${BASE_URL}/plan/user`);
  return response.data;
};

export const alterarPlano = async (payload) => {
  const response = await axiosPrivate.patch(`${BASE_URL}/plan`, payload);
  return response.data;
};

export const cancelarPlano = async (payload) => {
  const response = await axiosPrivate.patch(`${BASE_URL}/cancelar`, payload);
  return response.data;
};
