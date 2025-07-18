import React, { useState, useCallback } from 'react';
import { MapPin, Plus, Search, Navigation2, Building2, Truck, Store } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import EnhancedAddressInput from './EnhancedAddressInput';
import { geocodingService, GeocodingResult } from '@/services/geocoding';
import { useToast } from '@/hooks/use-toast';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string, nodeType?: string) => void;
  onQuickAdd: (locations: Array<{ lat: number; lng: number; address: string; type: string }>) => void;
}

interface QuickLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'source' | 'intermediate' | 'customer';
  icon: React.ReactNode;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onQuickAdd
}) => {
  const [selectedNodeType, setSelectedNodeType] = useState<'source' | 'intermediate' | 'customer'>('source');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Predefined quick locations for Bengaluru
  const quickLocations: QuickLocation[] = [
    // Manufacturing/Source locations
    {
      name: "Electronic City",
      address: "Electronic City, Bengaluru, Karnataka",
      lat: 12.8456,
      lng: 77.6603,
      type: 'source',
      icon: <Building2 className="h-4 w-4" />
    },
    {
      name: "Peenya Industrial Area",
      address: "Peenya Industrial Area, Bengaluru, Karnataka",
      lat: 13.0280,
      lng: 77.5264,
      type: 'source',
      icon: <Building2 className="h-4 w-4" />
    },
    {
      name: "Whitefield IT Park",
      address: "Whitefield, Bengaluru, Karnataka",
      lat: 12.9698,
      lng: 77.7500,
      type: 'source',
      icon: <Building2 className="h-4 w-4" />
    },
    
    // Distribution/Intermediate locations
    {
      name: "Hebbal Transport Hub",
      address: "Hebbal, Bengaluru, Karnataka",
      lat: 13.0350,
      lng: 77.5970,
      type: 'intermediate',
      icon: <Truck className="h-4 w-4" />
    },
    {
      name: "Bommanahalli Logistics",
      address: "Bommanahalli, Bengaluru, Karnataka",
      lat: 12.9165,
      lng: 77.6348,
      type: 'intermediate',
      icon: <Truck className="h-4 w-4" />
    },
    {
      name: "Yelahanka Distribution",
      address: "Yelahanka, Bengaluru, Karnataka",
      lat: 13.1007,
      lng: 77.5963,
      type: 'intermediate',
      icon: <Truck className="h-4 w-4" />
    },
    
    // Retail/Customer locations
    {
      name: "Brigade Road Shopping",
      address: "Brigade Road, Bengaluru, Karnataka",
      lat: 12.9719,
      lng: 77.6081,
      type: 'customer',
      icon: <Store className="h-4 w-4" />
    },
    {
      name: "Koramangala Market",
      address: "Koramangala, Bengaluru, Karnataka",
      lat: 12.9352,
      lng: 77.6245,
      type: 'customer',
      icon: <Store className="h-4 w-4" />
    },
    {
      name: "Malleshwaram Retail",
      address: "Malleshwaram, Bengaluru, Karnataka",
      lat: 12.9951,
      lng: 77.5744,
      type: 'customer',
      icon: <Store className="h-4 w-4" />
    }
  ];

  const handleLocationSelect = useCallback((lat: number, lng: number, address: string, result?: GeocodingResult) => {
    onLocationSelect(lat, lng, address, selectedNodeType);
  }, [onLocationSelect, selectedNodeType]);

  const handleQuickLocationAdd = useCallback((location: QuickLocation) => {
    onLocationSelect(location.lat, location.lng, location.address, location.type);
    
    toast({
      title: "Quick Location Added",
      description: `Added ${location.name} as ${location.type} node`,
    });
  }, [onLocationSelect, toast]);

  const handleBulkQuickAdd = useCallback(() => {
    const locations = quickLocations.map(loc => ({
      lat: loc.lat,
      lng: loc.lng,
      address: loc.address,
      type: loc.type
    }));
    
    onQuickAdd(locations);
    
    toast({
      title: "Bulk Locations Added",
      description: `Added ${locations.length} predefined locations to the map`,
    });
  }, [onQuickAdd, toast]);

  const searchSpecializedLocations = useCallback(async (type: 'industrial' | 'commercial' | 'retail' | 'warehouse' | 'fuel_station') => {
    setIsSearching(true);
    
    try {
      const results = await geocodingService.searchPlaces('Bengaluru', type);
      
      if (results.length > 0) {
        const firstResult = results[0];
        onLocationSelect(firstResult.lat, firstResult.lng, firstResult.display_name, 
          type === 'industrial' ? 'source' : 
          type === 'warehouse' ? 'intermediate' : 'customer'
        );
        
        toast({
          title: "Specialized Location Found",
          description: `Added ${type} location: ${firstResult.display_name}`,
        });
      } else {
        toast({
          title: "No Results",
          description: `No ${type} locations found in Bengaluru`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Search Error",
        description: `Failed to search for ${type} locations`,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }, [onLocationSelect, toast]);

  const nodeTypeConfig = {
    source: {
      label: 'Manufacturing/Source',
      icon: <Building2 className="h-4 w-4" />,
      color: 'bg-blue-500',
      description: 'Factories, production facilities'
    },
    intermediate: {
      label: 'Distribution/Logistics',
      icon: <Truck className="h-4 w-4" />,
      color: 'bg-amber-500',
      description: 'Warehouses, distribution centers'
    },
    customer: {
      label: 'Retail/Customer',
      icon: <Store className="h-4 w-4" />,
      color: 'bg-emerald-500',
      description: 'Stores, markets, end customers'
    }
  };

  const filteredQuickLocations = quickLocations.filter(loc => loc.type === selectedNodeType);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location Picker & Search
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Node Type Selection */}
        <div>
          <h3 className="text-sm font-medium mb-3">Select Node Type</h3>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(nodeTypeConfig).map(([type, config]) => (
              <Button
                key={type}
                variant={selectedNodeType === type ? "default" : "outline"}
                onClick={() => setSelectedNodeType(type as any)}
                className="justify-start h-auto p-3"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  {config.icon}
                  <div className="text-left">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs text-gray-500">{config.description}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Enhanced Address Search */}
        <div>
          <h3 className="text-sm font-medium mb-3">Search & Add Location</h3>
          <EnhancedAddressInput
            onLocationSelect={handleLocationSelect}
            placeholder={`Search for ${nodeTypeConfig[selectedNodeType].label.toLowerCase()} locations...`}
          />
        </div>

        <Separator />

        {/* Quick Actions */}
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Quick Add</TabsTrigger>
            <TabsTrigger value="specialized">Specialized Search</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quick" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Quick {nodeTypeConfig[selectedNodeType].label} Locations
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkQuickAdd}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add All Demo Locations
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {filteredQuickLocations.map((location, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  onClick={() => handleQuickLocationAdd(location)}
                  className="justify-start h-auto p-3 text-left"
                >
                  <div className="flex items-center space-x-3 w-full">
                    {location.icon}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-gray-500 truncate">{location.address}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {location.type}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="specialized" className="space-y-3">
            <h3 className="text-sm font-medium">Find Specialized Facilities</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => searchSpecializedLocations('industrial')}
                disabled={isSearching}
                className="justify-start text-xs"
              >
                <Building2 className="h-3 w-3 mr-1" />
                Industrial Areas
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => searchSpecializedLocations('warehouse')}
                disabled={isSearching}
                className="justify-start text-xs"
              >
                <Truck className="h-3 w-3 mr-1" />
                Warehouses
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => searchSpecializedLocations('commercial')}
                disabled={isSearching}
                className="justify-start text-xs"
              >
                <Store className="h-3 w-3 mr-1" />
                Commercial
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => searchSpecializedLocations('fuel_station')}
                disabled={isSearching}
                className="justify-start text-xs"
              >
                <Navigation2 className="h-3 w-3 mr-1" />
                Fuel Stations
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LocationPicker;