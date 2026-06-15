export declare class GeoService {
    createPoint(lat: number, lng: number): any;
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number;
    isWithinRadius(lat1: number, lng1: number, lat2: number, lng2: number, radiusMeters: number): boolean;
}
