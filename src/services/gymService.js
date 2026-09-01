import { api } from './api';
import { ENDPOINTS } from '../config/api';
import { distanceInKm, formatDistance } from '../utils/geo';

const BASE_URL = '/establishments';

export const gymService = {
  // GET /gyms?lat=..&lng=.. -> lista de academias.
  // Se o backend já devolver "distanceKm" pronto, ótimo. Se devolver só
  // "latitude/longitude" de cada academia, calculamos aqui no app (fallback).
  async getNearby({ latitude, longitude }) {
    const { data } = await api.get(BASE_URL, {
      params: { latitude, longitude },
    });

    return data.map((gym) => {
      const km =
        gym.distanceKm ??
        (gym.latitude && gym.longitude
          ? distanceInKm(latitude, longitude, gym.latitude, gym.longitude)
          : null);

      return {
        ...gym,
        distance: km != null ? formatDistance(km) : '—',
      };
    });
  },
};
