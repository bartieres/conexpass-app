import { api } from './api';

const BASE_URL = '/checkins';

export const checkinService = {
    
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
};