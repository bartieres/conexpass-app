import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/plans';

/*export const findAllByCondition = async (params) => {
  const response = await axiosPrivate.get(BASE_URL, { params });
  return response.data;
};*/

export const getMeuPlano = async () => {
  //const response = await axiosPrivate.get(`${BASE_URL}/user`);
  //return response.data;

  return {
    id: 1,
    ativo: true,
    nome: 'Plano Premium',
    descricao: 'Acesso completo a todos os recursos do aplicativo.',
    valor: 29.99,
    dataContratacao: '2026-01-10',
    proximaCobranca: {
      data: '2026-09-10',
      valor: 29.99
    },
    beneficios: [
      'Acesso ilimitado a conteúdos exclusivos',
      'Suporte prioritário',
      'Descontos em eventos parceiros'
    ]
  }
};

export const getPlanosDisponiveis = async () => {
  //const response = await axiosPrivate.get(`${BASE_URL}/user`);
  //return response.data;

  return [{
    id: 1,
    ativo: true,
    nome: 'Plano Premium',
    descricao: 'Acesso completo a todos os recursos do aplicativo.',
    valor: 29.99,
    checkinsPorDia: 1,
    dataContratacao: '2026-01-10',
    proximaCobranca: {
      data: '2026-09-10',
      valor: 29.99
    },
    beneficios: [
      'Acesso ilimitado a conteúdos exclusivos',
      'Suporte prioritário',
      'Descontos em eventos parceiros'
    ]
  },
{
    id: 2,
    ativo: true,
    nome: 'Plano Silver',
    descricao: 'Acesso completo a todos os recursos do aplicativo.',
    valor: 40.99,
    checkinsPorDia: 1,
    dataContratacao: '2026-01-10',
    proximaCobranca: {
      data: '2026-09-10',
      valor: 40.99
    },
    beneficios: [
      'Acesso ilimitado a conteúdos exclusivos',
      'Suporte prioritário',
      'Descontos em eventos parceiros'
    ]
  }]
};
