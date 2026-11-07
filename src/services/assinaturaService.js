import { api as axiosPrivate } from '../config/api';
import { validarAssinaturas } from '../utils/assinaturasPlano';

const BASE_URL = '/subscriptions';

export const getMinhasAssinaturas = async () => {
  const { data } = await axiosPrivate.get(`${BASE_URL}/plan/user`);
  validarAssinaturas(data?.response);
  return data;
};

// Compatibilidade de nome; o contrato agora retorna uma lista.
export const getMeuPlano = getMinhasAssinaturas;

export const cancelarRenovacao = async (assinaturaId) => {
  const { data } = await axiosPrivate.post(
    `${BASE_URL}/plan/${assinaturaId}/cancel-renewal`
  );
  return data;
};

export const agendarProximoPlano = async (planId) => {
  const { data } = await axiosPrivate.post(`${BASE_URL}/plan/next`, { planId });
  return data;
};

export const alterarProximoPlano = async (planId) => {
  const { data } = await axiosPrivate.put(`${BASE_URL}/plan/next`, { planId });
  return data;
};

export const cancelarProximoPlano = async () => {
  const { data } = await axiosPrivate.delete(`${BASE_URL}/plan/next`);
  return data;
};

export const alterarPlano = async (payload) => {
  const response = await axiosPrivate.patch(`${BASE_URL}/plan`, payload);
  return response.data;
};

export const cancelarPlano = async (id) => {
  const response = await axiosPrivate.patch(`${BASE_URL}/${id}/cancelar`);
  return response.data;
};

export async function contratarOferta(payload) {
  const { data } = await axiosPrivate.post(`${BASE_URL}/offers`, payload);
  return data;
}

export async function consultarPagamento(assinaturaId) {
  const { data } = await axiosPrivate.get(`${BASE_URL}/${assinaturaId}`);
  return data;
}
