import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/support';

export const sendMessage = async (data) => {
  const response = await axiosPrivate.post(BASE_URL, data);
  return response.data;
};
