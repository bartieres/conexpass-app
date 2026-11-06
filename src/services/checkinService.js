import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/checkins';

export const solicitar = async (data) => {
  const response = await axiosPrivate.post(`${BASE_URL}/solicitar`, data);
  return response.data;
};

export const cancelar = async (data) => {
  const response = await axiosPrivate.patch(
    `${BASE_URL}/${data.id}/cancelar`,
    data
  );
  return response.data;
};

export const getStatus = async (id) => {
  const response = await axiosPrivate.get(`${BASE_URL}/${id}/situacao`);
  return response.data;
};

export const findAllByCondition = async (params) => {
  const response = await axiosPrivate.get(BASE_URL, { params });
  return response.data;
};

export const consultarAcessoDisponivel = async (estabelecimentoId) => {
  const response = await axiosPrivate.get(
    `${BASE_URL}/resumo-consumo/${estabelecimentoId}`
  );
  return response.data;
};
