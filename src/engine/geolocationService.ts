// import type { Map } from 'mapbox-gl';

export class GeolocationService {
  private defaultLocation: [number, number] = [28.0473, -26.2041]; // Johannesburg CBD (Generic Fallback)

  constructor(_map: any) {}

  public async getCurrentLocation(): Promise<[number, number]> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(this.defaultLocation);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[GeolocationService] Fresh tactical lock acquired:", position.coords.accuracy, "m accuracy");
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          const reasons = ["Permission Denied", "Position Unavailable", "Timeout"];
          console.error(`[GeolocationService] Critical GPS Failure: ${reasons[error.code - 1] || "Unknown"}`);
          resolve(this.defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
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
}
