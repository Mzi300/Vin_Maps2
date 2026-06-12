/**
 * Interface that abstracts any routing provider (TomTom, HERE, Google, etc.).
 * The implementation must accept origin/destination coordinates and optional
 * options (e.g., traffic, alternatives) and return data that conforms to the
 * `RouteResponse` contract defined in the architecture freeze.
 */
export interface IRoutingProvider {
  /**
   * Calculate a route.
   * @param origin { lat, lon }
   * @param destination { lat, lon }
   * @param options optional flags (traffic: boolean, alternatives: number)
   * @returns A promise that resolves to the standardized route response.
   */
  calculateRoute(
    origin: { lat: number; lon: number },
    destination: { lat: number; lon: number },
    options?: { traffic?: boolean; alternatives?: number }
  ): Promise<any>; // concrete type will be the RouteResponse shape
}
