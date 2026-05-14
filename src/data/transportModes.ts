export type TransportType = 'car' | 'truck' | 'van' | 'bus' | 'motorcycle' | 'bicycle' | 'pedestrian';

export interface TransportProfile {
  type: TransportType;
  icon: string;
  speedMultiplier: number;
  riskFactor: number;
  mapboxProfile: string;
}

export const TRANSPORT_PROFILES: Record<TransportType, TransportProfile> = {
  car: { type: 'car', icon: '🚗', speedMultiplier: 1.0, riskFactor: 0.1, mapboxProfile: 'driving' },
  truck: { type: 'truck', icon: '🚛', speedMultiplier: 0.7, riskFactor: 0.2, mapboxProfile: 'driving' },
  van: { type: 'van', icon: '🚐', speedMultiplier: 0.8, riskFactor: 0.15, mapboxProfile: 'driving' },
  bus: { type: 'bus', icon: '🚌', speedMultiplier: 0.6, riskFactor: 0.1, mapboxProfile: 'driving' },
  motorcycle: { type: 'motorcycle', icon: '🏍️', speedMultiplier: 1.3, riskFactor: 0.4, mapboxProfile: 'driving' },
  bicycle: { type: 'bicycle', icon: '🚲', speedMultiplier: 0.3, riskFactor: 0.5, mapboxProfile: 'cycling' },
  pedestrian: { type: 'pedestrian', icon: '🚶', speedMultiplier: 0.1, riskFactor: 0.2, mapboxProfile: 'walking' }
};
