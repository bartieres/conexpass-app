import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/problem-reports';

export const reportarProblema = async (data) => {
  console.log(data);
  const response = await axiosPrivate.post(BASE_URL, data);
  return response.data;
};
