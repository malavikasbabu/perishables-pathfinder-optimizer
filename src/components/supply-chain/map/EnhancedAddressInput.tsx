import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { geocodingService, GeocodingResult } from '@/services/geocoding';
import { useToast } from '@/hooks/use-toast';

interface EnhancedAddressInputProps {
  onLocationSelect: (lat: number, lng: number, address: string, result?: GeocodingResult) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

const EnhancedAddressInput: React.FC<EnhancedAddressInputProps> = ({
  onLocationSelect,
  placeholder = "Search addresses, landmarks, or enter coordinates...",
  initialValue = "",
  className = ""
}) => {
  const [input, setInput] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validation, setValidation] = useState<{
    status: 'idle' | 'validating' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  // Debounced search function
  const debouncedSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setValidation({ status: 'idle' });
      return;
    }

    setIsLoading(true);
    setValidation({ status: 'validating', message: 'Searching locations...' });

    try {
      const results = await geocodingService.getSuggestions(query);
      setSuggestions(results);
      
      if (results.length === 0) {
        setValidation({ 
          status: 'invalid', 
          message: 'No locations found. Try different keywords or check spelling.' 
        });
      } else {
        setValidation({ 
          status: 'valid', 
          message: `Found ${results.length} location${results.length > 1 ? 's' : ''}` 
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      setValidation({ 
        status: 'invalid', 
        message: 'Search failed. Please try again.' 
      });
      toast({
        title: "Search Error",
        description: "Failed to search locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setSelectedIndex(-1);
    setShowSuggestions(true);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      debouncedSearch(value);
    }, 300);
  }, [debouncedSearch]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (result: GeocodingResult) => {
    setInput(result.display_name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Validate road access
    const accessValidation = await geocodingService.validateRoadAccess(result.lat, result.lng);
    
    if (!accessValidation.accessible) {
      toast({
        title: "Location Warning",
        description: accessValidation.restrictions.join(', '),
        variant: "destructive",
      });
    }

    onLocationSelect(result.lat, result.lng, result.display_name, result);
    
    toast({
      title: "Location Selected",
      description: `Selected: ${result.display_name}`,
    });
  }, [onLocationSelect, toast]);

  // Get current location
  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Error",
        description: "Geolocation is not supported by this browser.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setValidation({ status: 'validating', message: 'Getting your location...' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const reverseResult = await geocodingService.reverseGeocode(latitude, longitude);
          
          if (reverseResult) {
            setInput(reverseResult.display_name);
            setValidation({ status: 'valid', message: 'Current location found' });
            onLocationSelect(latitude, longitude, reverseResult.display_name);
            
            toast({
              title: "Location Found",
              description: "Using your current location",
            });
          } else {
            throw new Error('Could not determine address');
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setValidation({ 
            status: 'invalid', 
            message: 'Could not determine address for current location' 
          });
          
          // Still allow using coordinates
          onLocationSelect(latitude, longitude, `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoading(false);
        setValidation({ status: 'invalid', message: 'Failed to get current location' });
        
        toast({
          title: "Location Error",
          description: "Failed to get your current location. Please check permissions.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [onLocationSelect, toast]);

  // Parse and handle direct coordinate input
  const handleCoordinateSubmit = useCallback(async () => {
    const parsed = geocodingService.parseInput(input);
    
    if (parsed.type === 'coordinates') {
      const { lat, lng } = parsed.parsed;
      
      if (geocodingService.isWithinBengaluru(lat, lng)) {
        try {
          const reverseResult = await geocodingService.reverseGeocode(lat, lng);
          const address = reverseResult?.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          
          onLocationSelect(lat, lng, address);
          setValidation({ status: 'valid', message: 'Coordinates validated' });
          
          toast({
            title: "Coordinates Added",
            description: address,
          });
        } catch (error) {
          onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      } else {
        setValidation({ 
          status: 'invalid', 
          message: 'Coordinates are outside Bengaluru city limits' 
        });
        
        toast({
          title: "Invalid Location",
          description: "Please select a location within Bengaluru city limits.",
          variant: "destructive",
        });
      }
    }
  }, [input, onLocationSelect, toast]);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get input type badge
  const getInputTypeBadge = () => {
    const parsed = geocodingService.parseInput(input);
    
    switch (parsed.type) {
      case 'coordinates':
        return <Badge variant="secondary" className="text-xs">📍 Coordinates</Badge>;
      case 'pincode':
        return <Badge variant="secondary" className="text-xs">📮 Pincode</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">🏠 Address</Badge>;
    }
  };

  // Get validation icon
  const getValidationIcon = () => {
    switch (validation.status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'validating':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Input Field */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {getValidationIcon()}
        </div>
        
        <Input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          disabled={isLoading}
        />
        
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
            className="h-6 w-6 p-0"
            title="Use current location"
          >
            <Navigation className="h-3 w-3" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCoordinateSubmit}
            disabled={isLoading || geocodingService.parseInput(input).type !== 'coordinates'}
            className="h-6 w-6 p-0"
            title="Use coordinates"
          >
            <Target className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Input Type and Validation Status */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center space-x-2">
          {getInputTypeBadge()}
        </div>
        
        {validation.message && (
          <p className={`text-xs ${
            validation.status === 'valid' ? 'text-green-600' :
            validation.status === 'invalid' ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {validation.message}
          </p>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-hidden">
          <CardContent className="p-0" ref={suggestionsRef}>
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.place_id}-${index}`}
                  className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.address.road || suggestion.address.suburb || 'Unknown Road'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {suggestion.display_name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.type}
                        </Badge>
                        {suggestion.address.postcode && (
                          <Badge variant="outline" className="text-xs">
                            {suggestion.address.postcode}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Access Help */}
      <div className="mt-3 text-xs text-gray-500">
        <p>💡 <strong>Quick tips:</strong></p>
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li>Enter coordinates as: <code>12.9716, 77.5946</code></li>
          <li>Search by pincode: <code>560001</code></li>
          <li>Use landmarks: <code>Near Forum Mall</code></li>
          <li>Press ↑↓ to navigate, Enter to select</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhancedAddressInput;