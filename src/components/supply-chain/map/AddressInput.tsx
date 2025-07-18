
import React, { useState, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Search, Loader2 } from 'lucide-react';

interface AddressResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

interface AddressInputProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  placeholder?: string;
}

const AddressInput: React.FC<AddressInputProps> = ({
  onLocationSelect,
  placeholder = "Enter address or landmark in Bengaluru..."
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search function
  const searchAddress = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Nominatim API with Bengaluru bounds
      const bounds = '12.7342,77.4272,13.1394,77.7814'; // Bengaluru bounds
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchQuery + ', Bengaluru, Karnataka, India')}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `viewbox=${bounds}&` +
        `bounded=1&` +
        `countrycodes=in`
      );
      
      const data = await response.json();
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Address search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounce search queries
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchAddress(query);
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, searchAddress]);

  const handleResultSelect = (result: AddressResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onLocationSelect(lat, lng, result.display_name);
    setQuery(result.display_name);
    setShowResults(false);
    setResults([]);
  };

  const handleCoordinateInput = () => {
    // Check if input looks like coordinates (lat,lng)
    const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    const match = query.match(coordPattern);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      // Validate coordinates are within Bengaluru bounds
      if (lat >= 12.7342 && lat <= 13.1394 && lng >= 77.4272 && lng <= 77.7814) {
        onLocationSelect(lat, lng, `${lat}, ${lng}`);
        setShowResults(false);
      } else {
        alert('Coordinates must be within Bengaluru city bounds');
      }
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCoordinateInput();
              }
            }}
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>
        <Button
          variant="outline"
          onClick={handleCoordinateInput}
          title="Use as coordinates (lat,lng)"
        >
          <MapPin className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-60 overflow-y-auto">
          <CardContent className="p-0">
            {results.map((result, index) => (
              <div
                key={result.place_id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-start gap-2"
                onClick={() => handleResultSelect(result)}
              >
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {result.display_name.split(',')[0]}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {result.display_name}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No results message */}
      {showResults && results.length === 0 && !isLoading && query.length >= 3 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50">
          <CardContent className="p-3">
            <div className="text-sm text-gray-500 text-center">
              No locations found in Bengaluru for "{query}"
            </div>
            <div className="text-xs text-gray-400 text-center mt-1">
              Try searching for landmarks, area names, or use coordinates (lat,lng)
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddressInput;
