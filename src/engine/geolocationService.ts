import { LocationCache } from './persistence';

export class GeolocationService {
  private defaultLocation: [number, number] = [28.0473, -26.2041]; // Johannesburg CBD (Generic Fallback)

  constructor(_map: any) {}

  public async getCurrentLocation(): Promise<[number, number]> {
    // 1. Try to get cached location first for instant UI response
    const cached = LocationCache.get();
    
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(cached?.coords || this.defaultLocation);
        return;
      }

      // If we have a cached location that is recent (last 30 mins), we could resolve it immediately 
      // but for tactical navigation we always want a fresh lock. 
      // However, we can use the cache as a "hint".

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
          console.log("[GeolocationService] Fresh tactical lock acquired:", position.coords.accuracy, "m accuracy");
          
          // Save to cache for next startup
          LocationCache.save(coords);
          resolve(coords);
        },
        (error) => {
          const reasons = ["Permission Denied", "Position Unavailable", "Timeout"];
          console.error(`[GeolocationService] Critical GPS Failure: ${reasons[error.code - 1] || "Unknown"}`);
          
          // Fallback to cache if GPS fails, then to default
          resolve(cached?.coords || this.defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Sync with 15s tactical window for resilience
          maximumAge: 0 
        }
      );
    });
  }

  public initializeLocation(onLocationAcquired?: (coords: [number, number]) => void) {
    this.getCurrentLocation().then(coords => {
      if (onLocationAcquired) onLocationAcquired(coords);
    });
  }
}
