import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/plans';

export const findAllByCondition = async (params) => {
  const response = await axiosPrivate.get(BASE_URL, params);
  return response.data;
};

export const getCondicoesAtuais = async () => {
  const response = await axiosPrivate.get(BASE_URL);
  return response.data;
};

export const getHistorico = async () => {
  const response = await axiosPrivate.get(BASE_URL);
  return response.data;
};
