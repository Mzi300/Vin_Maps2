import type { Map } from 'mapbox-gl';

export class GeolocationService {
  private map: Map;
  private defaultLocation: [number, number] = [28.0473, -26.2041];

  constructor(map: any) {
    this.map = map;
  }

  public initializeLocation(onLocationAcquired?: (coords: [number, number]) => void) {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser. Using default location.");
      this.flyToLocation(this.defaultLocation);
      if (onLocationAcquired) onLocationAcquired(this.defaultLocation);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        const coords: [number, number] = [longitude, latitude];
        this.flyToLocation(coords);
        if (onLocationAcquired) onLocationAcquired(coords);
      },
      (error) => {
        console.warn("Geolocation permission denied or error occurred. Using default location.", error);
        this.flyToLocation(this.defaultLocation);
        if (onLocationAcquired) onLocationAcquired(this.defaultLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  }

  private flyToLocation(coords: [number, number]) {
    this.map.flyTo({
      center: coords,
      zoom: 16.5,
      pitch: 60,
      bearing: -17.6,
      speed: 1.2,
      curve: 1.4,
      essential: true
    });
  }
}
