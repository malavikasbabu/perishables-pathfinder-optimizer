import { geocodingService } from './geocoding';

export type TransportMode = 'driving-hgv' | 'driving-car' | 'cycling' | 'foot-walking';
export type RouteProfile = 'fastest' | 'shortest' | 'recommended';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteSegment {
  distance: number; // in meters
  duration: number; // in seconds
  instructions: string[];
  geometry: RoutePoint[];
}

export interface RouteResponse {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: RoutePoint[];
  segments: RouteSegment[];
  cost: number; // calculated cost in INR
}

export interface TransportModeConfig {
  name: string;
  icon: string;
  costPerKm: number; // INR per km
  maxSpeed: number; // km/h
  description: string;
  color: string;
}

export const TRANSPORT_MODES: Record<TransportMode, TransportModeConfig> = {
  'driving-hgv': {
    name: 'Heavy Goods Vehicle',
    icon: '🚚',
    costPerKm: 25,
    maxSpeed: 60,
    description: 'Large trucks for bulk transport',
    color: '#DC2626'
  },
  'driving-car': {
    name: 'Light Commercial Vehicle',
    icon: '🚐',
    costPerKm: 15,
    maxSpeed: 80,
    description: 'Vans and small trucks',
    color: '#2563EB'
  },
  'cycling': {
    name: 'Bicycle Delivery',
    icon: '🚴',
    costPerKm: 5,
    maxSpeed: 15,
    description: 'Eco-friendly last mile delivery',
    color: '#16A34A'
  },
  'foot-walking': {
    name: 'Walking Delivery',
    icon: '🚶',
    costPerKm: 2,
    maxSpeed: 5,
    description: 'Ultra-short distance delivery',
    color: '#7C3AED'
  }
};

class RoutingService {
  private baseUrl = 'https://api.openrouteservice.org/v2/directions';
  private apiKey = '5b3ce3597851110001cf6248a707b6da38554a4ba61d8103c5f3b7b3'; // Free public key

  async calculateRoute(
    start: RoutePoint,
    end: RoutePoint,
    transportMode: TransportMode = 'driving-hgv',
    profile: RouteProfile = 'recommended'
  ): Promise<RouteResponse> {
    try {
      const modeConfig = TRANSPORT_MODES[transportMode];
      
      // Map transport modes to OpenRouteService profiles
      const profileMap: Record<TransportMode, string> = {
        'driving-hgv': 'driving-hgv',
        'driving-car': 'driving-car',
        'cycling': 'cycling-regular',
        'foot-walking': 'foot-walking'
      };

      const url = `${this.baseUrl}/${profileMap[transportMode]}`;
      
      const params = new URLSearchParams({
        api_key: this.apiKey,
        start: `${start.lng},${start.lat}`,
        end: `${end.lng},${end.lat}`,
        format: 'json',
        geometry: 'true',
        instructions: 'true',
        preference: profile === 'fastest' ? 'fastest' : profile === 'shortest' ? 'shortest' : 'recommended'
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        throw new Error(`Routing API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const distanceKm = route.summary.distance / 1000;
      const durationHours = route.summary.duration / 3600;
      
      // Calculate cost based on transport mode
      const baseCost = distanceKm * modeConfig.costPerKm;
      const timeCost = durationHours * 50; // INR 50 per hour operational cost
      const totalCost = Math.round(baseCost + timeCost);

      // Convert geometry coordinates
      const geometry: RoutePoint[] = route.geometry.coordinates.map((coord: [number, number]) => ({
        lng: coord[0],
        lat: coord[1]
      }));

      // Extract segments with instructions
      const segments: RouteSegment[] = route.segments.map((segment: any) => ({
        distance: segment.distance,
        duration: segment.duration,
        instructions: segment.steps.map((step: any) => step.instruction),
        geometry: segment.steps.flatMap((step: any) => 
          step.way_points.map((wpIndex: number) => geometry[wpIndex])
        )
      }));

      return {
        distance: route.summary.distance,
        duration: route.summary.duration,
        geometry,
        segments,
        cost: totalCost
      };
    } catch (error) {
      console.error('Routing error:', error);
      
      // Fallback to straight-line calculation
      const distance = this.calculateStraightLineDistance(start, end);
      const modeConfig = TRANSPORT_MODES[transportMode];
      const duration = (distance / 1000) / modeConfig.maxSpeed * 3600; // seconds
      const cost = Math.round((distance / 1000) * modeConfig.costPerKm);

      return {
        distance,
        duration,
        geometry: [start, end],
        segments: [{
          distance,
          duration,
          instructions: [`Travel ${(distance / 1000).toFixed(1)}km from start to destination`],
          geometry: [start, end]
        }],
        cost
      };
    }
  }

  private calculateStraightLineDistance(start: RoutePoint, end: RoutePoint): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = start.lat * Math.PI / 180;
    const lat2Rad = end.lat * Math.PI / 180;
    const deltaLatRad = (end.lat - start.lat) * Math.PI / 180;
    const deltaLngRad = (end.lng - start.lng) * Math.PI / 180;

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async optimizeRoute(points: RoutePoint[], transportMode: TransportMode = 'driving-hgv'): Promise<{
    optimizedOrder: number[];
    totalDistance: number;
    totalDuration: number;
    totalCost: number;
  }> {
    try {
      // For now, implement a simple nearest neighbor optimization
      // In production, this could use OpenRouteService optimization API
      
      if (points.length <= 2) {
        return {
          optimizedOrder: points.map((_, i) => i),
          totalDistance: 0,
          totalDuration: 0,
          totalCost: 0
        };
      }

      let unvisited = [...Array(points.length).keys()].slice(1);
      let current = 0;
      let order = [0];
      let totalDistance = 0;
      let totalDuration = 0;

      while (unvisited.length > 0) {
        let nearest = unvisited[0];
        let minDistance = this.calculateStraightLineDistance(points[current], points[nearest]);

        for (let i = 1; i < unvisited.length; i++) {
          const distance = this.calculateStraightLineDistance(points[current], points[unvisited[i]]);
          if (distance < minDistance) {
            minDistance = distance;
            nearest = unvisited[i];
          }
        }

        order.push(nearest);
        totalDistance += minDistance;
        totalDuration += (minDistance / 1000) / TRANSPORT_MODES[transportMode].maxSpeed * 3600;
        current = nearest;
        unvisited = unvisited.filter(i => i !== nearest);
      }

      const totalCost = Math.round((totalDistance / 1000) * TRANSPORT_MODES[transportMode].costPerKm);

      return {
        optimizedOrder: order,
        totalDistance,
        totalDuration,
        totalCost
      };
    } catch (error) {
      console.error('Route optimization error:', error);
      return {
        optimizedOrder: points.map((_, i) => i),
        totalDistance: 0,
        totalDuration: 0,
        totalCost: 0
      };
    }
  }
}

export const routingService = new RoutingService();