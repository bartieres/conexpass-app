import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/checkins';

export const solicitar = async (data) => {
  const response = await axiosPrivate.post(`${BASE_URL}/solicitar`, data);
  return response.data;
};

export const cancelar = async (data) => {
  const response = await axiosPrivate.patch(`${BASE_URL}/${data.id}/cancelar`, data);
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

export const getTotal = async () => {
  const response = await axiosPrivate.get(`${BASE_URL}/totalizador`);
  return response.data;
};

/*export const checkinService = {
    
    findAll: async () => {
        var params = {
            ignoreSize: true
        };
        return await findAllByCondition(params);
    },

    findAllByCondition: async (params) => {
        const response = await api.get(BASE_URL, { params });
        return response.data.response;
    },
};*/