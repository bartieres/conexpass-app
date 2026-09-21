import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/payment-methods';

/*export const findAllByCondition = async (params) => {
  const response = await axiosPrivate.get(BASE_URL, { params });
  return response.data;
};*/

export const findAllByUsuario = async () => {
  const response = await axiosPrivate.get(BASE_URL);
  return response.data;
};

export const findCreditCardPrincipalByUsuario = async () => {
  const response = await axiosPrivate.get(`${BASE_URL}/credit-card`);
  return response.data;
};

export const save = async (payload) => {
  const response = await axiosPrivate.post(BASE_URL, payload);
  return response.data;
};

export const deleteFormaPagamento = async (id) => {
  const response = await axiosPrivate.delete(`${BASE_URL}/${id}`);
  return response.data;
};

export const updatePrincipal = async (id) => {
  const response = await axiosPrivate.patch(`${BASE_URL}/${id}/principal`);
  return response.data;
};
