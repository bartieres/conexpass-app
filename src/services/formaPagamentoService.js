import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/payment-methods';

/*export const findAllByCondition = async (params) => {
  const response = await axiosPrivate.get(BASE_URL, { params });
  return response.data;
};*/

export const getCartaoAtual = async () => {
  const response = await axiosPrivate.get(`${BASE_URL}/user`);
  return response.data;
};
