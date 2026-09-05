import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/subscriptions';

/*export const findAllByCondition = async (params) => {
  const response = await axiosPrivate.get(BASE_URL, { params });
  return response.data;
};*/

export const getResumo = async (params) => {
  const response = await axiosPrivate.get(`${BASE_URL}/resumo`, { params });
  return response.data;
};
