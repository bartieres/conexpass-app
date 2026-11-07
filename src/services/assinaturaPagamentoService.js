import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/subscriptions/payments';

export const findAllByCondition = async (params) => {
  const { data } = await axiosPrivate.get(BASE_URL, { params });
  const pagina = data?.response;
  if (
    !Array.isArray(pagina?.content) ||
    typeof pagina.last !== 'boolean' ||
    pagina.content.some((pagamento) => pagamento?.id == null)
  ) {
    throw new Error(
      'Não foi possível interpretar o histórico de pagamentos. Tente novamente.'
    );
  }
  return data;
};

export const findById = async (pagamentoId) => {
  const { data } = await axiosPrivate.get(
    `${BASE_URL}/${encodeURIComponent(pagamentoId)}`
  );
  if (
    data?.response?.id == null ||
    String(data.response.id) !== String(pagamentoId)
  ) {
    throw new Error(
      'Não foi possível interpretar os detalhes deste pagamento.'
    );
  }
  return data;
};
