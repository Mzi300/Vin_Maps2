export type TransportType = 'car' | 'truck' | 'van' | 'bus' | 'motorcycle' | 'bicycle' | 'pedestrian' | 'train';

export interface TransportProfile {
  type: TransportType;
  icon: string;
  speedMultiplier: number;
  riskFactor: number;
}

export const TRANSPORT_PROFILES: Record<TransportType, TransportProfile> = {
  car: { type: 'car', icon: '🚗', speedMultiplier: 1.0, riskFactor: 0.1 },
  truck: { type: 'truck', icon: '🚛', speedMultiplier: 0.7, riskFactor: 0.2 },
  van: { type: 'van', icon: '🚐', speedMultiplier: 0.8, riskFactor: 0.15 },
  bus: { type: 'bus', icon: '🚌', speedMultiplier: 0.6, riskFactor: 0.1 },
  motorcycle: { type: 'motorcycle', icon: '🏍️', speedMultiplier: 1.3, riskFactor: 0.4 },
  bicycle: { type: 'bicycle', icon: '🚲', speedMultiplier: 0.3, riskFactor: 0.5 },
  pedestrian: { type: 'pedestrian', icon: '🚶', speedMultiplier: 0.1, riskFactor: 0.2 },
  train: { type: 'train', icon: '🚆', speedMultiplier: 1.5, riskFactor: 0.05 }
};
