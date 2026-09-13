import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/establishments/lead';

export const save = async (data) => {
  const response = await axiosPrivate.post(BASE_URL, data);
  return response.data;
};
