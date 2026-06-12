function mergeRouteData(route, trafficFlow, incidents) {
  return {
    route: {
      geometry: route.geometry,
      distance: route.summary?.lengthInMeters || 0,
      travelTime: route.summary?.travelTimeInSeconds || 0,
      congestionDelay: route.summary?.trafficDelayInSeconds || 0
    },

    traffic: {
      flow: trafficFlow || null,
      incidents: incidents?.incidents || []
    },

    analysis: {
      hasHeavyTraffic: (route.summary?.trafficDelayInSeconds || 0) > 300,
      incidentCount: incidents?.incidents?.length || 0,
      routeHealthScore: calculateRouteScore(route, incidents)
    }
  };
}

function calculateRouteScore(route, incidents) {
  let score = 100;

  const delay = route.summary?.trafficDelayInSeconds || 0;
  const incidentCount = incidents?.incidents?.length || 0;

  if (delay > 300) score -= 20;
  if (delay > 600) score -= 40;

  score -= incidentCount * 10;

  if (score < 0) score = 0;

  return score;
}

module.exports = { mergeRouteData };
