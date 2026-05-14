export interface CachedLocation {
  coords: [number, number];
  timestamp: number;
}

const STORAGE_KEY = 'vinmaps_last_location';

export const LocationCache = {
  save(coords: [number, number]) {
    const data: CachedLocation = {
      coords,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  get(): CachedLocation | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }
};
