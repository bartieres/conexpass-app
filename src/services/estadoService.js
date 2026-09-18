import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/states';

export const findAll = async () => {
  const response = await axiosPrivate.get(BASE_URL, {});

  return response.data;
};
