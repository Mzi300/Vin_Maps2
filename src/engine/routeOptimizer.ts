export interface OptimizedRoute {
  distance: number;
  duration: number;
  coordinates: [number, number][];
  safetyScore: number;
  latency?: number;
}

export class RouteOptimizer {
  private cache: Map<string, OptimizedRoute> = new Map();
  private pendingRequests: Map<string, Promise<OptimizedRoute | null>> = new Map();
  private token: string;
  private readonly MAX_RETRIES = 2;
  private readonly CACHE_LIMIT = 20;

  constructor(token: string) {
    this.token = token;
  }

  public prewarmRouting() {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/28.04,-26.20;28.05,-26.21?access_token=${this.token}&overview=simplified`;
    fetch(url, { method: 'HEAD' }).catch(() => {});
  }

  public async fetchAndOptimizeRoute(
    origin: [number, number],
    destination: [number, number],
    profile: string = 'driving',
    signal?: AbortSignal
  ): Promise<OptimizedRoute | null> {
    const startTime = performance.now();
    const cacheKey = `${origin[0].toFixed(4)},${origin[1].toFixed(4)}-${destination[0].toFixed(4)},${destination[1].toFixed(4)}-${profile}`;

    // LRU Cache Check: If exists, delete and re-insert to move to "most recently used"
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      this.cache.delete(cacheKey);
      this.cache.set(cacheKey, cached);
      console.log(`[RouteOptimizer] Cache HIT for ${cacheKey} (${(performance.now() - startTime).toFixed(2)}ms)`);
      return cached;
    }

    // Request De-duplication: If a request for this key is already in flight, return it
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`[RouteOptimizer] De-duplicating active request for ${cacheKey}`);
      return this.pendingRequests.get(cacheKey)!;
    }
    
    const requestPromise = (async () => {
      let attempt = 0;
      while (attempt <= this.MAX_RETRIES) {
        if (signal?.aborted) return null;
        
        try {
          const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${this.token}`;
          const response = await fetch(url, { signal });
          
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          
          const data = await response.json();
          if (!data.routes || data.routes.length === 0) return null;

          const route = data.routes[0];
          const rawCoords = route.geometry.coordinates as [number, number][];
          
          if (!rawCoords || rawCoords.length < 2) throw new Error("Invalid route geometry received");

          const simplifiedCoords = this.simplifyRoute(rawCoords, 0.0001);
          const result: OptimizedRoute = {
            distance: route.distance,
            duration: route.duration,
            coordinates: simplifiedCoords,
            safetyScore: Math.floor(Math.random() * 15 + 85),
            latency: performance.now() - startTime
          };

          if (this.cache.size >= this.CACHE_LIMIT) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
          }
          this.cache.set(cacheKey, result);

          console.log(`[RouteOptimizer] Cache MISS. Route fetched in ${result.latency?.toFixed(2)}ms (Attempt ${attempt + 1})`);
          return result;

        } catch (e: any) {
          if (e.name === 'AbortError') return null;
          console.warn(`[RouteOptimizer] Attempt ${attempt + 1} failed: ${e.message}`);
          attempt++;
          if (attempt > this.MAX_RETRIES) break;
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
      }
      return null;
    })();

    this.pendingRequests.set(cacheKey, requestPromise);
    
    try {
      return await requestPromise;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private simplifyRoute(coords: [number, number][], tolerance: number): [number, number][] {
    if (coords.length <= 2) return coords;
    const simplified: [number, number][] = [coords[0]];
    let lastPoint = coords[0];

    for (let i = 1; i < coords.length - 1; i++) {
      const point = coords[i];
      const dx = point[0] - lastPoint[0];
      const dy = point[1] - lastPoint[1];
      if (dx * dx + dy * dy > tolerance * tolerance) {
        simplified.push(point);
        lastPoint = point;
      }
    }
    simplified.push(coords[coords.length - 1]);
    return simplified;
  }
}

