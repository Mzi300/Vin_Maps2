import { useState, useEffect } from 'react';
import axios from 'axios';
export function usePreferences() {
    const [preference, setPreference] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchPrefs = async () => {
            try {
                const response = await axios.get('/preferences');
                setPreference(response.data);
                setError(null);
            }
            catch (err) {
                setError(err?.message ?? 'Failed to load preferences');
            }
            finally {
                setLoading(false);
            }
        };
        fetchPrefs();
    }, []);
    const updatePreference = async (updates) => {
        setLoading(true);
        try {
            const response = await axios.patch('/preferences', updates);
            setPreference(response.data);
            setError(null);
        }
        catch (err) {
            setError(err?.message ?? 'Failed to update preferences');
        }
        finally {
            setLoading(false);
        }
    };
    return { preference, loading, error, updatePreference };
}
//# sourceMappingURL=usePreferences.js.map