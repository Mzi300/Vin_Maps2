export interface CachedLocation {
  coords: [number, number];
  timestamp: number;
}

export interface Sector {
  id: string;
  name: string;
  coords: [number, number];
  zoom: number;
}

export interface Mission {
  id: string;
  destinationName: string;
  coords: [number, number];
  timestamp: number;
}

const STORAGE_KEY = 'vinmaps_last_location';
const SECTORS_KEY = 'vinmaps_saved_sectors';
const MISSIONS_KEY = 'vinmaps_recent_missions';

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
  },

  // SECTORS
  saveSector(sector: Omit<Sector, 'id'>) {
    const sectors = this.getSectors();
    const newSector: Sector = { ...sector, id: Date.now().toString() };
    sectors.push(newSector);
    localStorage.setItem(SECTORS_KEY, JSON.stringify(sectors.slice(-10))); // Keep last 10
  },

  getSectors(): Sector[] {
    const raw = localStorage.getItem(SECTORS_KEY);
    return raw ? JSON.parse(raw) : [
      { id: '1', name: 'Sector Alpha-1', coords: [28.0473, -26.2041], zoom: 16 },
      { id: '2', name: 'Sector Delta-9', coords: [18.4241, -33.9249], zoom: 16 }
    ];
  },

  // MISSIONS
  saveMission(name: string, coords: [number, number]) {
    const missions = this.getMissions();
    const newMission: Mission = { id: Date.now().toString(), destinationName: name, coords, timestamp: Date.now() };
    missions.unshift(newMission);
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions.slice(0, 5))); // Keep last 5
  },

  getMissions(): Mission[] {
    const raw = localStorage.getItem(MISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  }
};
