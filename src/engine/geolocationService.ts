// import type { Map } from 'mapbox-gl';

export class GeolocationService {
  private defaultLocation: [number, number] = [28.0473, -26.2041]; // Johannesburg CBD

  constructor(_map: any) {}

  public async getCurrentLocation(): Promise<[number, number]> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(this.defaultLocation);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.warn("GPS error:", error);
          resolve(this.defaultLocation);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
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
