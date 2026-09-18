import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/citys';

export const findAllByEstadoId = async (estadoId) => {
  const response = await axiosPrivate.get(`${BASE_URL}/estado/${estadoId}`, {});

  return response.data;
};
