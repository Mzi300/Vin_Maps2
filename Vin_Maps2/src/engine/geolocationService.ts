// import type { Map } from 'mapbox-gl';

export class GeolocationService {
  private defaultLocation: [number, number] = [28.0473, -26.2041]; // Johannesburg CBD (Generic Fallback)
  private watchId: number | null = null;
  private locationCallbacks: Set<(coords: [number, number]) => void> = new Set();

  constructor(_map: any) {}

  public async getCurrentLocation(): Promise<[number, number]> {
    return new Promise((resolve) => {
      // 1. Immediately try to use cached location
      const cached = localStorage.getItem('vimaps_last_location');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length === 2) {
            console.log("[GeolocationService] Using instant cached location");
            resolve(parsed as [number, number]);
            
            // Still fetch fresh location in background to update cache for next time
            this.fetchFreshLocation();
            return;
          }
        } catch (e) {
          // ignore cache parse errors
        }
      }

      // 2. No cache, must wait for fresh location
      this.fetchFreshLocation().then(resolve);
    });
  }

  private async fetchFreshLocation(): Promise<[number, number]> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(this.defaultLocation);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[GeolocationService] Fresh tactical lock acquired:", position.coords.accuracy, "m accuracy");
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          localStorage.setItem('vimaps_last_location', JSON.stringify(coords));
          resolve(coords);
        },
        (error) => {
          const reasons = ["Permission Denied", "Position Unavailable", "Timeout"];
          console.error(`[GeolocationService] Critical GPS Failure: ${reasons[error.code - 1] || "Unknown"}`);
          resolve(this.defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 100 // Force near-zero cache
        }
      );
    });
  }

  public initializeLocation(onLocationAcquired?: (coords: [number, number]) => void) {
    this.getCurrentLocation().then(coords => {
      if (onLocationAcquired) onLocationAcquired(coords);
    });
  }

  public subscribeToLocationUpdates(callback: (coords: [number, number]) => void) {
    this.locationCallbacks.add(callback);
    if (!this.watchId && navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          this.locationCallbacks.forEach(cb => cb(coords));
        },
        (err) => console.error("WatchPosition error:", err),
        { enableHighAccuracy: true }
      );
    }
  }

  public unsubscribeFromLocationUpdates(callback: (coords: [number, number]) => void) {
    this.locationCallbacks.delete(callback);
    if (this.locationCallbacks.size === 0 && this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  public async reverseGeocode(coords: [number, number]): Promise<string> {
    const [lng, lat] = coords;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&limit=1`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      if (data && data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
    } catch (e) {
      console.error('Reverse geocode failed', e);
    }
    return 'Unknown location';
  }

  // POI search (keyword + optional category) – returns raw feature list
  public async searchPOI(query: string, category?: string): Promise<any[]> {
    const encoded = encodeURIComponent(query);
    const types = 'poi';
    const catParam = category ? `&categories=${category}` : '';
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&types=${types}${catParam}&limit=10&country=${import.meta.env.VITE_MAP_REGION || 'ZA'}`;
    try {
      const resp = await fetch(url);
      const data = await resp.json();
      return data.features || [];
    } catch (e) {
      console.error('POI search failed', e);
      return [];
    }
  }
}
