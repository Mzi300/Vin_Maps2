import type { TransportProfile } from '../data/transportModes';

export interface Node {
  id: string;
  lat: number;
  lng: number;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  distance: number;
  factors: {
    traffic: number; // 0-1
    safety: number; // 0-1
    weather: number; // 0-1
    condition: number; // 0-1
  };
}

export interface RouteResult {
  path: string[];
  totalCost: number;
  reasoning: string;
}

export class RoutingEngine {
  private nodes: Map<string, Node> = new Map();
  private edges: Edge[] = [];

  constructor(nodes: Node[], edges: Edge[]) {
    nodes.forEach(n => this.nodes.set(n.id, n));
    this.edges = edges;
  }

  private calculateHeuristic(nodeA: Node, nodeB: Node): number {
    // Euclidean distance for h(n)
    return Math.sqrt(Math.pow(nodeA.lat - nodeB.lat, 2) + Math.pow(nodeA.lng - nodeB.lng, 2)) * 111320; // approx meters
  }

  private calculateEdgeCost(edge: Edge, profile: TransportProfile): number {
    // g(n) = distance_cost + traffic_weight + safety_weight + weather_weight + road_condition_weight
    
    const trafficWeight = edge.factors.traffic * (edge.distance * 2); // traffic can double time
    const safetyWeight = edge.factors.safety * (edge.distance * profile.riskFactor * 5); // high risk avoidance
    const weatherWeight = edge.factors.weather * (edge.distance * 0.5);
    const conditionWeight = edge.factors.condition * (edge.distance * 0.3);

    return edge.distance + trafficWeight + safetyWeight + weatherWeight + conditionWeight;
  }

  public findRoute(startId: string, endId: string, profile: TransportProfile): RouteResult | null {
    const openSet: string[] = [startId];
    const cameFrom: Map<string, string> = new Map();
    const gScore: Map<string, number> = new Map();
    const fScore: Map<string, number> = new Map();

    this.nodes.forEach((_, id) => {
      gScore.set(id, Infinity);
      fScore.set(id, Infinity);
    });

    gScore.set(startId, 0);
    const startNode = this.nodes.get(startId)!;
    const endNode = this.nodes.get(endId)!;
    fScore.set(startId, this.calculateHeuristic(startNode, endNode));

    while (openSet.length > 0) {
      // Get node with lowest fScore
      openSet.sort((a, b) => (fScore.get(a) || Infinity) - (fScore.get(b) || Infinity));
      const currentId = openSet.shift()!;

      if (currentId === endId) {
        return this.reconstructPath(cameFrom, currentId, gScore.get(currentId)!, profile);
      }

      const neighbors = this.edges.filter(e => e.from === currentId);

      for (const edge of neighbors) {
        const neighborId = edge.to;
        const tentativeGScore = (gScore.get(currentId) || Infinity) + this.calculateEdgeCost(edge, profile);

        if (tentativeGScore < (gScore.get(neighborId) || Infinity)) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeGScore);
          fScore.set(neighborId, tentativeGScore + this.calculateHeuristic(this.nodes.get(neighborId)!, endNode));

          if (!openSet.includes(neighborId)) {
            openSet.push(neighborId);
          }
        }
      }
    }

    return null;
  }

  private reconstructPath(cameFrom: Map<string, string>, current: string, totalCost: number, profile: TransportProfile): RouteResult {
    const path = [current];
    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      path.unshift(current);
    }

    // Generate AI reasoning
    let reasoning = `Optimized route for ${profile.type}. `;
    if (totalCost > path.length * 100) { // arbitrary threshold for "high cost"
      reasoning += "Path modified to prioritize safety zones and bypass heavy traffic congestion.";
    } else {
      reasoning += "Direct path selected based on current clear road conditions.";
    }

    return { path, totalCost, reasoning };
  }
}
