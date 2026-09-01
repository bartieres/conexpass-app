import { axiosPrivate } from './axios';

const BASE_URL = '/establishments';

export const save = async (data) => {
  const response = await axiosPrivate.post(BASE_URL, data);
  return response.data;
};

export const findAll = async () => {
  var params = {
    ignoreSize: true
  };
  return await findAllByCondition(params);
};

export const findAllByCondition = async (params) => {
  const response = await axiosPrivate.get(BASE_URL, { params });
  return response.data;
};

export const deletar = async (id) => {
  const response = await axiosPrivate.delete(`${BASE_URL}/${id}`);
  return response.data;
};

export const updateSituacao = async (id) => {
  const response = await axiosPrivate.patch(`${BASE_URL}/situacao/${id}`);
  return response.data;
};
