import { api as axiosPrivate } from '../config/api';

const BASE_URL = '/checkins';

export const confirmar = async (data) => {
  const response = await axiosPrivate.post(`${BASE_URL}/solicitar`, data);
  return response.data;
};

export const getStatus = async (id) => {
  const response = await axiosPrivate.get(`${BASE_URL}/${id}/situacao`);
  return response.data;
};

export const listarPorEstabelecimento = async (params) => {
  return {
    response: {
      content: [
        {
          id: 100,
          autorNome: 'André Bartieres',
          texto: 'Academia muito boa para treinar, ambiente organizado e aparelhos em bom estado.',
          dataFormatada: '17/09/2026 10:15',
        },
        {
          id: 101,
          autorNome: 'Pedro Antonio',
          texto: 'Aparelhos novos e bastante variedade para quem gosta de musculação.',
          dataFormatada: '16/09/2026 18:42',
        },
        {
          id: 102,
          autorNome: 'Mariana Oliveira',
          texto: 'Gostei bastante do espaço. Os professores são atenciosos e o ambiente é tranquilo.',
          dataFormatada: '15/09/2026 09:30',
        },
        {
          id: 103,
          autorNome: 'Lucas Henrique',
          texto: 'Boa academia, mas nos horários de pico fica bastante cheia e é difícil conseguir alguns aparelhos.',
          dataFormatada: '14/09/2026 19:05',
        },
        {
          id: 104,
          autorNome: 'Camila Souza',
          texto: 'O espaço é bom e os equipamentos atendem bem, porém poderia ter mais opções de aparelhos para pernas.',
          dataFormatada: '13/09/2026 17:20',
        },
        {
          id: 105,
          autorNome: 'Rafael Martins',
          texto: 'Excelente lugar para treinar. Ambiente limpo, aparelhos bem cuidados e equipe muito receptiva.',
          dataFormatada: '12/09/2026 07:45',
        },
        {
          id: 106,
          autorNome: 'Juliana Costa',
          texto: 'Gostei da academia, mas senti falta de mais espaço entre os aparelhos.',
          dataFormatada: '10/09/2026 18:10',
        },
        {
          id: 107,
          autorNome: 'Gabriel Santos',
          texto: 'Treino aqui há algumas semanas e estou gostando bastante. O ambiente é agradável e os equipamentos são bons.',
          dataFormatada: '09/09/2026 12:25',
        },
        {
          id: 108,
          autorNome: 'Fernanda Alves',
          texto: 'Academia bem localizada e com bastante espaço. Poderia melhorar a ventilação em alguns horários.',
          dataFormatada: '07/09/2026 16:50',
        },
        {
          id: 109,
          autorNome: 'Bruno Ferreira',
          texto: 'Atendimento muito bom e professores sempre dispostos a ajudar. Voltaria novamente.',
          dataFormatada: '05/09/2026 08:35',
        },
      ]
    }
  };
};

export const getTotal = async () => {
  const response = await axiosPrivate.get(`${BASE_URL}/totalizador`);
  return response.data;
};

export const adicionar = async (data) => {
  const response = await axiosPrivate.post(`${BASE_URL}/solicitar`, data);
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
