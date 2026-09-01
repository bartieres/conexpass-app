import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export function useCurrentLocation() {
  const [coords, setCoords] = useState(null); // { latitude, longitude }
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchLocation = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      setPermissionDenied(false);
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (err) {
      setErrorMessage('Não foi possível obter sua localização.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return { coords, loading, permissionDenied, errorMessage, refetch: fetchLocation };
}
