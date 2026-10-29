import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/establishments';

export async function listarPlanosEOfertas(estabelecimentoId) {
  const { data } = await axiosPrivate.get(`${BASE_URL}/${estabelecimentoId}/offers`);
  return data;
}

export async function findById(estabelecimentoId, ofertaId) {
  const { data } = await axiosPrivate.get(`${BASE_URL}/${estabelecimentoId}/offers/${ofertaId}`);
  return data;
}
 
export async function contratarOferta(estabelecimentoId, payload) {
  const { data } = await axiosPrivate.post(`${BASE_URL}/${estabelecimentoId}/offers/contratar`, payload);
  return data;
}