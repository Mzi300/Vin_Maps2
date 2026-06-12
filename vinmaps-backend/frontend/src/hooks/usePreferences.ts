import { useState, useEffect } from 'react';
import axios from 'axios';

export interface Preference {
  avoidTolls: boolean;
  preferredSpeedKmh: number;
  vehicleType: 'car' | 'truck' | 'motorcycle';
}

/**
 * Hook to fetch and update user preferences.
 * Assumes the backend API is hosted at the same origin and requires authentication
 * (handled by axios interceptor or cookie session).
 */
export function usePreferences() {
  const [preference, setPreference] = useState<Preference | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const response = await axios.get<Preference>('/preferences');
        setPreference(response.data);
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load preferences');
      } finally {
        setLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const updatePreference = async (updates: Partial<Preference>) => {
    setLoading(true);
    try {
      const response = await axios.patch<Preference>('/preferences', updates);
      setPreference(response.data);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return { preference, loading, error, updatePreference };
}
