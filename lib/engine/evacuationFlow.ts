import { HazardZone } from '@/data/hazardZones';

export interface EvacuationNode {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  type: 'origin' | 'junction' | 'bridge' | 'chokepoint' | 'safe_exit';
}

export interface EvacuationEdge {
  id: string;
  fromNode: string;
  toNode: string;
  roadName: string;
  capacityPeopleHr: number; // Maximum hourly flow (people/hour)
  lanes: number;
  widthMeters: number;
  isBottleneck?: boolean;
  bottleneckReason?: string;
  pathCoordinates: [number, number][]; // Polylines for Leaflet
}

export interface EvacuationGraph {
  zoneId: string;
  sourceNodeId: string;
  sinkNodeIds: string[];
  nodes: EvacuationNode[];
  edges: EvacuationEdge[];
}

export interface EvacuationFlowResult {
  zoneId: string;
  maxFlowPeopleHr: number;     // C_evac: total safe people evacuated per hour
  settlementPopulation: number;
  safeEvacuationTimeHours: number; // Z hours = Population / C_evac
  targetThresholdHours: number;
  isDelayed: boolean;
  bottleneckEdges: {
    edgeId: string;
    roadName: string;
    capacity: number;
    reason: string;
    flowUtilizationPercent: number;
    pathCoordinates: [number, number][];
  }[];
  allEdgesWithFlow: {
    edge: EvacuationEdge;
    flow: number;
    utilizationPercent: number;
    isBottleneck: boolean;
  }[];
}

// Built-in evacuation route graphs for key monitored settlements
export const EVACUATION_GRAPHS: Record<string, EvacuationGraph> = {
  zone_001: {
    zoneId: 'zone_001',
    sourceNodeId: 'node_origin',
    sinkNodeIds: ['node_highway_north', 'node_shelter_east'],
    nodes: [
      { id: 'node_origin', name: 'Coastal Settlement Core', coordinates: [19.0760, 72.8777], type: 'origin' },
      { id: 'node_junc_1', name: 'Market Crossroad Junction', coordinates: [19.0805, 72.8745], type: 'junction' },
      { id: 'node_bridge', name: 'Mithi Nallah Single-Lane Bridge', coordinates: [19.0845, 72.8790], type: 'bridge' },
      { id: 'node_choke', name: 'Old Causeway Underpass', coordinates: [19.0720, 72.8830], type: 'chokepoint' },
      { id: 'node_highway_north', name: 'Western Express Arterial Highway', coordinates: [19.0910, 72.8720], type: 'safe_exit' },
      { id: 'node_shelter_east', name: 'High-Ground Multi-Purpose Shelter', coordinates: [19.0780, 72.8940], type: 'safe_exit' },
    ],
    edges: [
      {
        id: 'edge_1',
        fromNode: 'node_origin',
        toNode: 'node_junc_1',
        roadName: 'Main Bazaar Avenue',
        capacityPeopleHr: 3200,
        lanes: 2,
        widthMeters: 7.0,
        pathCoordinates: [[19.0760, 72.8777], [19.0785, 72.8760], [19.0805, 72.8745]],
      },
      {
        id: 'edge_2',
        fromNode: 'node_origin',
        toNode: 'node_choke',
        roadName: 'South Embankment Link',
        capacityPeopleHr: 1800,
        lanes: 1.5,
        widthMeters: 5.0,
        pathCoordinates: [[19.0760, 72.8777], [19.0740, 72.8800], [19.0720, 72.8830]],
      },
      {
        id: 'edge_3',
        fromNode: 'node_junc_1',
        toNode: 'node_bridge',
        roadName: 'Creek Crossing Approach',
        capacityPeopleHr: 1100, // CRITICAL BOTTLENECK
        lanes: 1,
        widthMeters: 3.5,
        bottleneckReason: 'Single-lane 3.5m bridge with structural load limit',
        pathCoordinates: [[19.0805, 72.8745], [19.0825, 72.8768], [19.0845, 72.8790]],
      },
      {
        id: 'edge_4',
        fromNode: 'node_bridge',
        toNode: 'node_highway_north',
        roadName: 'Highway Ramp North',
        capacityPeopleHr: 4500,
        lanes: 3,
        widthMeters: 10.5,
        pathCoordinates: [[19.0845, 72.8790], [19.0880, 72.8755], [19.0910, 72.8720]],
      },
      {
        id: 'edge_5',
        fromNode: 'node_choke',
        toNode: 'node_shelter_east',
        roadName: 'Ridge Access Road',
        capacityPeopleHr: 950, // CRITICAL BOTTLENECK
        lanes: 1,
        widthMeters: 3.2,
        bottleneckReason: 'Narrow flood-prone underpass with 3.2m clearance',
        pathCoordinates: [[19.0720, 72.8830], [19.0750, 72.8885], [19.0780, 72.8940]],
      },
    ],
  },
  zone_004: {
    zoneId: 'zone_004',
    sourceNodeId: 'node_z4_origin',
    sinkNodeIds: ['node_z4_exit_west', 'node_z4_exit_north'],
    nodes: [
      { id: 'node_z4_origin', name: 'Mangrove Delta Settlement', coordinates: [19.0900, 72.9300], type: 'origin' },
      { id: 'node_z4_culvert', name: 'Tidal Culvert Pinch Point', coordinates: [19.0940, 72.9240], type: 'chokepoint' },
      { id: 'node_z4_bund', name: 'Creek Bund Track', coordinates: [19.0850, 72.9360], type: 'bridge' },
      { id: 'node_z4_exit_west', name: 'Eastern Highway Flyover', coordinates: [19.0990, 72.9180], type: 'safe_exit' },
      { id: 'node_z4_exit_north', name: 'Port Authority Cyclone Center', coordinates: [19.1020, 72.9380], type: 'safe_exit' },
    ],
    edges: [
      {
        id: 'edge_z4_1',
        fromNode: 'node_z4_origin',
        toNode: 'node_z4_culvert',
        roadName: 'Marshland Causeway',
        capacityPeopleHr: 850, // Strict bottleneck
        lanes: 1,
        widthMeters: 3.0,
        bottleneckReason: 'Submerged at high-tide, 3.0m earthen causeway',
        pathCoordinates: [[19.0900, 72.9300], [19.0920, 72.9270], [19.0940, 72.9240]],
      },
      {
        id: 'edge_z4_2',
        fromNode: 'node_z4_origin',
        toNode: 'node_z4_bund',
        roadName: 'Fisheries Access Lane',
        capacityPeopleHr: 900, // Strict bottleneck
        lanes: 1,
        widthMeters: 3.2,
        bottleneckReason: 'Single vehicle track bordering unreinforced embankment',
        pathCoordinates: [[19.0900, 72.9300], [19.0875, 72.9330], [19.0850, 72.9360]],
      },
      {
        id: 'edge_z4_3',
        fromNode: 'node_z4_culvert',
        toNode: 'node_z4_exit_west',
        roadName: 'Arterial Link West',
        capacityPeopleHr: 4000,
        lanes: 2.5,
        widthMeters: 9.0,
        pathCoordinates: [[19.0940, 72.9240], [19.0965, 72.9210], [19.0990, 72.9180]],
      },
      {
        id: 'edge_z4_4',
        fromNode: 'node_z4_bund',
        toNode: 'node_z4_exit_north',
        roadName: 'Cyclone Evacuation Spur',
        capacityPeopleHr: 3500,
        lanes: 2,
        widthMeters: 7.0,
        pathCoordinates: [[19.0850, 72.9360], [19.0935, 72.9370], [19.1020, 72.9380]],
      },
    ],
  },
};

/**
 * Builds a fallback graph for any zone that doesn't have a custom hand-calibrated network.
 */
function generateFallbackGraph(zone: HazardZone): EvacuationGraph {
  const [lat, lng] = zone.coordinates;
  const originId = `origin_${zone.id}`;
  const junc1Id = `junc1_${zone.id}`;
  const bridgeId = `bridge_${zone.id}`;
  const exit1Id = `exit1_${zone.id}`;
  const exit2Id = `exit2_${zone.id}`;

  return {
    zoneId: zone.id,
    sourceNodeId: originId,
    sinkNodeIds: [exit1Id, exit2Id],
    nodes: [
      { id: originId, name: `${zone.name} Core`, coordinates: [lat, lng], type: 'origin' },
      { id: junc1Id, name: 'Main Ward Junction', coordinates: [lat + 0.005, lng - 0.004], type: 'junction' },
      { id: bridgeId, name: 'Local Relief Bridge', coordinates: [lat + 0.008, lng + 0.003], type: 'bridge' },
      { id: exit1Id, name: 'Sector Ring Road Exit', coordinates: [lat + 0.012, lng - 0.007], type: 'safe_exit' },
      { id: exit2Id, name: 'Emergency Shelter Complex', coordinates: [lat + 0.014, lng + 0.006], type: 'safe_exit' },
    ],
    edges: [
      {
        id: `e1_${zone.id}`,
        fromNode: originId,
        toNode: junc1Id,
        roadName: 'Settlement Main Corridor',
        capacityPeopleHr: 2200,
        lanes: 1.5,
        widthMeters: 5.5,
        pathCoordinates: [[lat, lng], [lat + 0.003, lng - 0.002], [lat + 0.005, lng - 0.004]],
      },
      {
        id: `e2_${zone.id}`,
        fromNode: originId,
        toNode: bridgeId,
        roadName: 'East Ridge Link',
        capacityPeopleHr: 1150, // Bottleneck
        lanes: 1,
        widthMeters: 3.5,
        bottleneckReason: 'Single-lane road over storm channel',
        pathCoordinates: [[lat, lng], [lat + 0.004, lng + 0.002], [lat + 0.008, lng + 0.003]],
      },
      {
        id: `e3_${zone.id}`,
        fromNode: junc1Id,
        toNode: exit1Id,
        roadName: 'Ring Road Spur',
        capacityPeopleHr: 3500,
        lanes: 2,
        widthMeters: 7.0,
        pathCoordinates: [[lat + 0.005, lng - 0.004], [lat + 0.009, lng - 0.005], [lat + 0.012, lng - 0.007]],
      },
      {
        id: `e4_${zone.id}`,
        fromNode: bridgeId,
        toNode: exit2Id,
        roadName: 'Shelter Access Highway',
        capacityPeopleHr: 3200,
        lanes: 2,
        widthMeters: 7.0,
        pathCoordinates: [[lat + 0.008, lng + 0.003], [lat + 0.011, lng + 0.005], [lat + 0.014, lng + 0.006]],
      },
    ],
  };
}

/**
 * Executes Edmonds-Karp algorithm (Ford-Fulkerson with BFS) to calculate maximum evacuation flow.
 */
export function calculateEvacuationFlow(
  zone: HazardZone,
  targetHours: number = 4.5
): EvacuationFlowResult {
  const graph = EVACUATION_GRAPHS[zone.id] || generateFallbackGraph(zone);

  // Combine multiple sinks into a virtual super-sink 'SUPER_SINK'
  const source = graph.sourceNodeId;
  const superSink = 'SUPER_SINK';

  // Build capacity matrix and adjacency list
  const rawNodeIds = graph.nodes.map(n => n.id).concat(superSink);
  const nodes = rawNodeIds.filter((item, pos) => rawNodeIds.indexOf(item) === pos);
  const capacity: Record<string, Record<string, number>> = {};
  const flow: Record<string, Record<string, number>> = {};
  const adj: Record<string, string[]> = {};

  for (const u of nodes) {
    capacity[u] = {};
    flow[u] = {};
    adj[u] = [];
    for (const v of nodes) {
      capacity[u][v] = 0;
      flow[u][v] = 0;
    }
  }

  // Populate capacities from graph edges
  for (const edge of graph.edges) {
    capacity[edge.fromNode][edge.toNode] += edge.capacityPeopleHr;
    if (!adj[edge.fromNode].includes(edge.toNode)) adj[edge.fromNode].push(edge.toNode);
    if (!adj[edge.toNode].includes(edge.fromNode)) adj[edge.toNode].push(edge.fromNode);
  }

  // Connect designated sink nodes to virtual super-sink with infinite capacity
  for (const sinkId of graph.sinkNodeIds) {
    capacity[sinkId][superSink] = 999999;
    if (!adj[sinkId].includes(superSink)) adj[sinkId].push(superSink);
    if (!adj[superSink].includes(sinkId)) adj[superSink].push(sinkId);
  }

  // Edmonds-Karp BFS loop
  let maxFlow = 0;

  while (true) {
    const parent: Record<string, string | null> = {};
    for (const n of nodes) parent[n] = null;
    parent[source] = source;

    const queue: string[] = [source];

    while (queue.length > 0 && parent[superSink] === null) {
      const u = queue.shift()!;
      for (const v of adj[u]) {
        if (parent[v] === null && capacity[u][v] - flow[u][v] > 0) {
          parent[v] = u;
          queue.push(v);
        }
      }
    }

    if (parent[superSink] === null) break; // No more augmenting paths

    // Find bottleneck capacity along the augmenting path
    let pushFlow = Infinity;
    let curr = superSink;
    while (curr !== source) {
      const prev = parent[curr]!;
      pushFlow = Math.min(pushFlow, capacity[prev][curr] - flow[prev][curr]);
      curr = prev;
    }

    // Apply flow along path and reverse edge
    curr = superSink;
    while (curr !== source) {
      const prev = parent[curr]!;
      flow[prev][curr] += pushFlow;
      flow[curr][prev] -= pushFlow;
      curr = prev;
    }

    maxFlow += pushFlow;
  }

  // Find min-cut by BFS in the residual graph from source
  const reachableFromSource = new Set<string>();
  const cutQueue: string[] = [source];
  reachableFromSource.add(source);

  while (cutQueue.length > 0) {
    const u = cutQueue.shift()!;
    for (const v of adj[u]) {
      if (!reachableFromSource.has(v) && capacity[u][v] - flow[u][v] > 0) {
        reachableFromSource.add(v);
        cutQueue.push(v);
      }
    }
  }

  // Saturated edges crossing the min-cut are bottlenecks
  const bottleneckEdges: EvacuationFlowResult['bottleneckEdges'] = [];
  const allEdgesWithFlow: EvacuationFlowResult['allEdgesWithFlow'] = [];

  for (const edge of graph.edges) {
    const actualFlow = Math.max(0, flow[edge.fromNode][edge.toNode]);
    const utilization = Math.min(100, Math.round((actualFlow / edge.capacityPeopleHr) * 100));
    const isMinCutSaturated = reachableFromSource.has(edge.fromNode) && !reachableFromSource.has(edge.toNode);
    const isBottleneck = isMinCutSaturated || utilization >= 95 || !!edge.bottleneckReason;

    allEdgesWithFlow.push({
      edge,
      flow: actualFlow,
      utilizationPercent: utilization,
      isBottleneck,
    });

    if (isBottleneck) {
      bottleneckEdges.push({
        edgeId: edge.id,
        roadName: edge.roadName,
        capacity: edge.capacityPeopleHr,
        reason: edge.bottleneckReason || `Saturated chokepoint (${utilization}% utilization at ${edge.lanes} lanes / ${edge.widthMeters}m width)`,
        flowUtilizationPercent: utilization,
        pathCoordinates: edge.pathCoordinates,
      });
    }
  }

  const settlementPopulation = zone.population;
  const safeEvacuationTimeHours = maxFlow > 0 ? Math.round((settlementPopulation / maxFlow) * 10) / 10 : 99;
  const isDelayed = safeEvacuationTimeHours > targetHours;

  return {
    zoneId: zone.id,
    maxFlowPeopleHr: maxFlow,
    settlementPopulation,
    safeEvacuationTimeHours,
    targetThresholdHours: targetHours,
    isDelayed,
    bottleneckEdges,
    allEdgesWithFlow,
  };
}
