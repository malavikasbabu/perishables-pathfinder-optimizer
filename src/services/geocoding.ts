// Geocoding service using OpenStreetMap Nominatim API
export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  place_id: string;
  importance: number;
  type: string;
}

export interface ReverseGeocodingResult {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const BENGALURU_BOUNDS = '12.7342,77.4272,13.1394,77.7814'; // SW lat, SW lng, NE lat, NE lng

export class GeocodingService {
  private static instance: GeocodingService;
  private cache: Map<string, GeocodingResult[]> = new Map();
  private reverseCache: Map<string, ReverseGeocodingResult> = new Map();

  static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  // Forward geocoding - address to coordinates
  async geocode(
    query: string, 
    options: {
      limit?: number;
      countrycodes?: string;
      bounded?: boolean;
      viewbox?: string;
    } = {}
  ): Promise<GeocodingResult[]> {
    const cacheKey = `${query}-${JSON.stringify(options)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: (options.limit || 5).toString(),
      countrycodes: options.countrycodes || 'in',
      bounded: options.bounded ? '1' : '0',
      viewbox: options.viewbox || BENGALURU_BOUNDS,
      'accept-language': 'en'
    });

    try {
      const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params}`, {
        headers: {
          'User-Agent': 'Supply-Chain-Optimizer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      const results: GeocodingResult[] = data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        display_name: item.display_name,
        address: item.address || {},
        place_id: item.place_id,
        importance: item.importance || 0,
        type: item.type || 'unknown'
      }));

      // Filter results to Bengaluru area
      const filteredResults = results.filter(result => 
        this.isWithinBengaluru(result.lat, result.lng)
      );

      this.cache.set(cacheKey, filteredResults);
      return filteredResults;
    } catch (error) {
      console.error('Geocoding error:', error);
      return [];
    }
  }

  // Reverse geocoding - coordinates to address
  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingResult | null> {
    const cacheKey = `${lat.toFixed(6)}-${lng.toFixed(6)}`;
    
    if (this.reverseCache.has(cacheKey)) {
      return this.reverseCache.get(cacheKey)!;
    }

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
      'accept-language': 'en'
    });

    try {
      const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params}`, {
        headers: {
          'User-Agent': 'Supply-Chain-Optimizer/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      const result: ReverseGeocodingResult = {
        display_name: data.display_name,
        address: data.address || {}
      };

      this.reverseCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  // Search for specific types of places
  async searchPlaces(
    query: string, 
    type: 'industrial' | 'commercial' | 'retail' | 'warehouse' | 'fuel_station'
  ): Promise<GeocodingResult[]> {
    const typeQueries = {
      industrial: `${query} industrial area OR manufacturing OR factory`,
      commercial: `${query} commercial complex OR business park`,
      retail: `${query} mall OR market OR shopping`,
      warehouse: `${query} warehouse OR godown OR storage`,
      fuel_station: `${query} petrol pump OR fuel station OR gas station`
    };

    return this.geocode(typeQueries[type], { limit: 10 });
  }

  // Parse different input formats
  parseInput(input: string): { type: 'coordinates' | 'pincode' | 'address', parsed: any } {
    // Coordinates pattern: lat,lng or lat lng
    const coordPattern = /^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/;
    const coordMatch = input.trim().match(coordPattern);
    
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return {
          type: 'coordinates',
          parsed: { lat, lng }
        };
      }
    }

    // Pincode pattern: 6 digits
    const pincodePattern = /^(\d{6})$/;
    const pincodeMatch = input.trim().match(pincodePattern);
    
    if (pincodeMatch) {
      return {
        type: 'pincode',
        parsed: { pincode: pincodeMatch[1] }
      };
    }

    // Default to address
    return {
      type: 'address',
      parsed: { address: input.trim() }
    };
  }

  // Validate if coordinates are within Bengaluru bounds
  isWithinBengaluru(lat: number, lng: number): boolean {
    return lat >= 12.7342 && lat <= 13.1394 && lng >= 77.4272 && lng <= 77.7814;
  }

  // Get suggestions for autocomplete
  async getSuggestions(input: string): Promise<GeocodingResult[]> {
    if (input.length < 3) return [];
    
    const parsed = this.parseInput(input);
    
    switch (parsed.type) {
      case 'coordinates':
        const reverseResult = await this.reverseGeocode(parsed.parsed.lat, parsed.parsed.lng);
        return reverseResult ? [{
          lat: parsed.parsed.lat,
          lng: parsed.parsed.lng,
          display_name: reverseResult.display_name,
          address: reverseResult.address,
          place_id: 'coordinates',
          importance: 1,
          type: 'coordinates'
        }] : [];
        
      case 'pincode':
        return this.geocode(`${parsed.parsed.pincode} Bengaluru Karnataka`, { limit: 5 });
        
      default:
        return this.geocode(input, { limit: 8 });
    }
  }

  // Validate road accessibility for vehicles
  async validateRoadAccess(lat: number, lng: number): Promise<{
    accessible: boolean;
    roadType: string;
    restrictions: string[];
  }> {
    // This would ideally use Overpass API to check road types and restrictions
    // For now, return basic validation
    const isWithinBounds = this.isWithinBengaluru(lat, lng);
    
    return {
      accessible: isWithinBounds,
      roadType: isWithinBounds ? 'accessible' : 'out_of_bounds',
      restrictions: isWithinBounds ? [] : ['Outside Bengaluru city limits']
    };
  }
}

export const geocodingService = GeocodingService.getInstance();