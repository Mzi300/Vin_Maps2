export interface Preference {
    avoidTolls: boolean;
    preferredSpeedKmh: number;
    vehicleType: 'car' | 'truck' | 'motorcycle';
}
export declare function usePreferences(): {
    preference: Preference | null;
    loading: boolean;
    error: string | null;
    updatePreference: (updates: Partial<Preference>) => Promise<void>;
};
