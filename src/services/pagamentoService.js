import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/plans';

/*export const findAllByCondition = async (params) => {
  const response = await axiosPrivate.get(BASE_URL, { params });
  return response.data;
};*/

export const getResumo = async () => {
  //const response = await axiosPrivate.get(`${BASE_URL}/user`);
  //return response.data;

  return {
    response: {
      id: 1,
      nome: 'Plano Premium',
      descricao: 'Acesso completo a todos os recursos do aplicativo.',
      preco: 29.99,
      duracao: 'Mensal',
      beneficios: [
        'Acesso ilimitado a conteúdos exclusivos',
        'Suporte prioritário',
        'Descontos em eventos parceiros'
      ]
    }
  };
};
